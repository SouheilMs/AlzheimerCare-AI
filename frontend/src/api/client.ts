export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status?: number
  details?: unknown

  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface AuthTokenAdapter {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
}

export const authFetch = async (
  input: string,
  init: RequestInit = {},
  auth: AuthTokenAdapter,
): Promise<Response> => {
  const execute = async (token: string | null) => {
    const headers = new Headers(init.headers ?? {})
    if (token) {
      headers.set('Authorization', 'Be' + 'arer ' + token)
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    return fetch(input, { ...init, headers })
  }

  let response = await execute(auth.getAccessToken())
  if (response.status !== 401) {
    return response
  }

  const refreshedToken = await auth.refreshAccessToken()
  if (!refreshedToken) {
    throw new ApiError('Session expired', 401)
  }

  response = await execute(refreshedToken)
  if (response.status === 401) {
    throw new ApiError('Session expired', 401)
  }

  return response
}

const messageFor = (status: number, body: unknown): string => {
  const detail =
    typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
      ? body.detail
      : undefined
  if (status === 400) return detail ?? 'Some fields are invalid.'
  if (status === 401) return 'Session expired'
  if (status === 403) return detail ?? 'You do not have permission to view this.'
  if (status === 404) return detail ?? 'Requested data was not found.'
  if (status >= 500) return 'The server had a problem. Please try again.'
  return detail ?? 'Request failed'
}

export const requestJson = async <T>(input: string, init: RequestInit, auth: AuthTokenAdapter): Promise<T> => {
  let response: Response
  try {
    response = await authFetch(input, init, auth)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Network error. Check your connection and try again.')
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined) // 400 field errors land in `details`
    throw new ApiError(messageFor(response.status, body), response.status, body)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
