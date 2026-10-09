import { ApiError, requestJson } from '../api/client'

const auth = { getAccessToken: () => 't', refreshAccessToken: async () => null }

describe('requestJson error parsing', () => {
  it('exposes DRF field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ email: ['Enter a valid email address.'] }), { status: 400 })),
    )
    const error = await requestJson('https://x.test', { method: 'POST' }, auth).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).fieldErrors.email).toEqual(['Enter a valid email address.'])
  })

  it('uses detail for 403', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: 'Forbidden' }), { status: 403 })),
    )
    await expect(requestJson('https://x.test', { method: 'GET' }, auth)).rejects.toMatchObject({
      status: 403,
      message: 'Forbidden',
    })
  })
})