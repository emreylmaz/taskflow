import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test component to access auth context
function TestComponent({ onRender }: { onRender?: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  onRender?.(auth)
  return (
    <div>
      <span data-testid="loading">{auth.isLoading.toString()}</span>
      <span data-testid="authenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="user">{auth.user?.name || 'none'}</span>
      <button onClick={() => auth.login('test@test.com', 'password')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state and attempts refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No token' }),
    })

    renderWithAuth(<TestComponent />)

    // İlk render'da loading true
    expect(screen.getByTestId('loading').textContent).toBe('true')

    // Refresh başarısız olunca loading false olur
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('false')
  })

  it('sets user after successful refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'new-token',
        user: { id: '1', name: 'Test User', email: 'test@test.com' },
      }),
    })

    renderWithAuth(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
    expect(screen.getByTestId('authenticated').textContent).toBe('true')
    expect(screen.getByTestId('user').textContent).toBe('Test User')
  })

  it('login updates auth state', async () => {
    const user = userEvent.setup()

    // İlk refresh başarısız
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'No token' }),
    })

    renderWithAuth(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    // Login başarılı
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'access-token',
        user: { id: '1', name: 'Logged User', email: 'test@test.com' },
      }),
    })

    await act(async () => {
      await user.click(screen.getByText('Login'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })
    expect(screen.getByTestId('user').textContent).toBe('Logged User')
  })

  it('logout clears auth state', async () => {
    const user = userEvent.setup()

    // İlk refresh başarılı
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'token',
        user: { id: '1', name: 'Test User', email: 'test@test.com' },
      }),
    })

    renderWithAuth(<TestComponent />)

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })

    // Logout
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })

    await act(async () => {
      await user.click(screen.getByText('Logout'))
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
    })
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
