import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app.js'

describe('POST /api/auth/register', () => {
  it('should return 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should return 400 for invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: 'Test1234!' })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('e-posta')
  })

  it('should return 400 for weak password (no uppercase)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'test1234!' })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('büyük harf')
  })

  it('should return 400 for weak password (no special char)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'Test1234a' })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('özel karakter')
  })

  it('should return 400 for short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'Te1!' })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('8 karakter')
  })
})

describe('POST /api/auth/login', () => {
  it('should return 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({})

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('message')
  })

  it('should return 400 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid', password: 'password' })

    expect(res.status).toBe(400)
    expect(res.body.message).toContain('e-posta')
  })
})

describe('POST /api/auth/refresh', () => {
  it('should return 401 when no refresh token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({})

    expect(res.status).toBe(401)
    expect(res.body.message).toContain('Refresh token')
  })
})

describe('POST /api/auth/logout', () => {
  it('should return 200 and clear cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('message', 'Çıkış yapıldı')
  })
})
