import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, setAuthToken, clearAuthToken, getAuthToken, onUnauthorized } from '../api'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    clearAuthToken()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Management', () => {
    it('stores and retrieves auth token', () => {
      expect(getAuthToken()).toBeNull()
      setAuthToken('test-token')
      expect(getAuthToken()).toBe('test-token')
      clearAuthToken()
      expect(getAuthToken()).toBeNull()
    })
  })

  describe('HTTP Methods', () => {
    it('makes GET request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      })

      const result = await api.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      )
      expect(result).toEqual({ data: 'test' })
    })

    it('makes POST request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      })

      await api.post('/test', { name: 'test' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
    })

    it('makes PUT request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ updated: true }),
      })

      await api.put('/test/1', { name: 'updated' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('makes DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ deleted: true }),
      })

      await api.delete('/test/1')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('Authorization', () => {
    it('includes auth header when token is set', async () => {
      setAuthToken('my-token')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      await api.get('/protected')

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      )
    })

    it('skips auth header when skipAuth is true', async () => {
      setAuthToken('my-token')
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      await api.get('/public', { skipAuth: true })

      const callHeaders = mockFetch.mock.calls[0][1].headers
      expect(callHeaders.Authorization).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('throws error with message from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      })

      await expect(api.get('/test')).rejects.toThrow('Bad request')
    })

    it('throws generic error when no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      await expect(api.get('/test')).rejects.toThrow('Bir hata oluştu')
    })
  })

  describe('401 Auto Refresh', () => {
    it('retries request after successful token refresh', async () => {
      setAuthToken('old-token')

      // İlk istek 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })

      // Refresh başarılı
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-token' }),
      })

      // Retry başarılı
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      })

      const result = await api.get('/protected')

      expect(result).toEqual({ data: 'success' })
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(getAuthToken()).toBe('new-token')
    })

    it('notifies unauthorized listeners on failed refresh', async () => {
      const unauthorizedCallback = vi.fn()
      const unsubscribe = onUnauthorized(unauthorizedCallback)

      // İstek 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      })

      // Refresh başarısız
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid refresh token' }),
      })

      await expect(api.get('/protected')).rejects.toThrow('Oturum süresi doldu')
      expect(unauthorizedCallback).toHaveBeenCalled()

      unsubscribe()
    })

    it('unsubscribe removes callback', async () => {
      const callback = vi.fn()
      const unsubscribe = onUnauthorized(callback)
      unsubscribe()

      // İstek 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })

      // Refresh başarısız
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      })

      await expect(api.get('/test')).rejects.toThrow()
      expect(callback).not.toHaveBeenCalled()
    })
  })
})
