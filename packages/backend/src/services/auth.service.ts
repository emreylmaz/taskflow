import { prisma } from '../config/database.js'
import { hashPassword, comparePassword } from '../utils/hash.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js'
import { ApiError } from '../utils/ApiError.js'

interface RegisterInput {
  name: string
  email: string
  password: string
}

interface LoginInput {
  email: string
  password: string
}

export async function register(input: RegisterInput) {
  // E-posta kontrolü
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (existing) {
    throw ApiError.conflict('Bu e-posta adresi zaten kayıtlı')
  }

  // Şifreyi hashle
  const hashedPassword = await hashPassword(input.password)

  // Kullanıcı oluştur
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  })

  return user
}

export async function login(input: LoginInput) {
  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })

  if (!user) {
    throw ApiError.unauthorized('E-posta veya şifre hatalı')
  }

  // Şifre kontrolü
  const isValid = await comparePassword(input.password, user.password)

  if (!isValid) {
    throw ApiError.unauthorized('E-posta veya şifre hatalı')
  }

  // Token'ları oluştur
  const payload = { userId: user.id, email: user.email }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  }
}

export async function refresh(refreshTokenValue: string) {
  try {
    const payload = verifyRefreshToken(refreshTokenValue)

    // Kullanıcının hâlâ var olduğunu kontrol et
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw ApiError.unauthorized('Kullanıcı bulunamadı')
    }

    // Yeni token'lar oluştur
    const tokenPayload = { userId: user.id, email: user.email }
    const accessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    return { accessToken, refreshToken: newRefreshToken }
  } catch {
    throw ApiError.unauthorized('Geçersiz refresh token')
  }
}
