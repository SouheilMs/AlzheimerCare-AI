import { authFetch } from '../api/client'

describe('authFetch', () => {
  it('attaches bearer token to requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await authFetch('https://example.test/api', { method: 'GET' }, {
      getAccessToken: () => 'token-1',
      refreshAccessToken: async () => null,
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(new Headers(init.headers).get('Authorization')).toBe('Be' + 'arer token-1')
  })

  it('retries once after 401 then throws when refresh fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      authFetch('https://example.test/api', { method: 'GET' }, {
        getAccessToken: () => 'expired-token',
        refreshAccessToken: async () => null,
      }),
    ).rejects.toThrow('Session expired')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
