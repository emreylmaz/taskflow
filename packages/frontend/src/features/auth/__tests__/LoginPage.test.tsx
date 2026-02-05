import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../../../contexts/AuthContext'
import LoginPage from '../LoginPage'

// Mock fetch for AuthProvider's initial refresh call
const mockFetch = vi.fn()
global.fetch = mockFetch

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    // Mock the initial refresh call (will fail, user not logged in)
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'No token' }),
    })
  })

  it('should render login form', async () => {
    renderLoginPage()

    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument()
  })

  it('should render link to register page', () => {
    renderLoginPage()

    expect(screen.getByText(/kayıt ol/i)).toBeInTheDocument()
  })

  it('should have required fields', () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/e-posta/i)
    const passwordInput = screen.getByLabelText(/şifre/i)

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })
})
