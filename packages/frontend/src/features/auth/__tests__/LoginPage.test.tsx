import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import LoginPage from '../LoginPage'

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/e-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/şifre/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /giriş yap/i })).toBeInTheDocument()
  })

  it('should render link to register page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/kayıt ol/i)).toBeInTheDocument()
  })

  it('should have required fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const emailInput = screen.getByLabelText(/e-posta/i)
    const passwordInput = screen.getByLabelText(/şifre/i)

    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })
})
