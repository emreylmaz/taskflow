import crypto, { createHash } from "crypto";
import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

// Refresh token süresi (7 gün)
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Token'ı SHA-256 ile hash'ler
 * DB'de sadece hash saklanır, plain token kullanıcıya gönderilir
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Yeni bir token family ID oluşturur
 * Family, aynı oturumdan gelen token'ları gruplar
 */
function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/**
 * Opak refresh token oluşturur (JWT değil)
 * DB'de saklanacak, daha güvenli
 */
function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * DB'ye yeni refresh token kaydeder
 * Plain token kullanıcıya döner, DB'ye hash'lenmiş hali kaydedilir
 */
async function createRefreshToken(
  userId: string,
  family: string,
): Promise<string> {
  const plainToken = generateOpaqueToken();
  const hashedToken = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);

  await prisma.refreshToken.create({
    data: {
      token: hashedToken,
      userId,
      family,
      expiresAt,
    },
  });

  return plainToken;
}

/**
 * Token family'deki tüm token'ları iptal eder
 * Token reuse saldırısı tespit edildiğinde çağrılır
 */
async function revokeTokenFamily(family: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { family, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Belirli bir token'ı iptal eder
 * Gelen plain token hash'lenerek DB'de aranır
 */
async function revokeToken(plainToken: string): Promise<void> {
  const hashedToken = hashToken(plainToken);
  await prisma.refreshToken.updateMany({
    where: { token: hashedToken, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Kullanıcının tüm token'larını iptal eder (logout all)
 */
async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function register(input: RegisterInput) {
  const normalizedEmail = input.email.toLowerCase().trim();

  // E-posta kontrolü
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw ApiError.conflict("Bu e-posta adresi zaten kayıtlı");
  }

  // Şifreyi hashle
  const hashedPassword = await hashPassword(input.password);

  // Kullanıcı oluştur
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: normalizedEmail,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
}

export async function login(input: LoginInput) {
  const normalizedEmail = input.email.toLowerCase().trim();

  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw ApiError.unauthorized("E-posta veya şifre hatalı");
  }

  // Şifre kontrolü
  const isValid = await comparePassword(input.password, user.password);

  if (!isValid) {
    throw ApiError.unauthorized("E-posta veya şifre hatalı");
  }

  // Token'ları oluştur
  const payload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(payload);

  // Yeni bir token family başlat
  const family = generateTokenFamily();
  const refreshToken = await createRefreshToken(user.id, family);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function refresh(refreshTokenValue: string) {
  // Gelen plain token'ı hash'le ve DB'de ara
  const hashedToken = hashToken(refreshTokenValue);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Token bulunamadı
  if (!storedToken) {
    throw ApiError.unauthorized("Geçersiz refresh token");
  }

  // Token daha önce kullanılmış (revoked)
  // Bu bir token reuse saldırısı olabilir!
  if (storedToken.revokedAt) {
    // Tüm family'yi iptal et (güvenlik önlemi)
    await revokeTokenFamily(storedToken.family);
    throw ApiError.unauthorized(
      "Token daha önce kullanılmış, tüm oturumlar sonlandırıldı",
    );
  }

  // Token süresi dolmuş
  if (storedToken.expiresAt < new Date()) {
    await revokeToken(refreshTokenValue);
    throw ApiError.unauthorized("Refresh token süresi dolmuş");
  }

  // Eski token'ı iptal et (rotation)
  await revokeToken(refreshTokenValue);

  // Yeni token'lar oluştur (aynı family'de)
  const tokenPayload = {
    userId: storedToken.user.id,
    email: storedToken.user.email,
  };
  const accessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = await createRefreshToken(
    storedToken.user.id,
    storedToken.family,
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: storedToken.user,
  };
}

export async function logout(refreshTokenValue: string) {
  if (!refreshTokenValue) return;

  // Gelen plain token'ı hash'le ve DB'de ara
  const hashedToken = hashToken(refreshTokenValue);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
  });

  if (storedToken) {
    // Token'ın family'sini iptal et (bu cihazdan yapılan tüm oturumlar)
    await revokeTokenFamily(storedToken.family);
  }
}

export async function logoutAll(userId: string) {
  await revokeAllUserTokens(userId);
}

// Eski süresi dolmuş token'ları temizle (cron job için)
export async function cleanupExpiredTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 gün önce revoke edilmiş
      ],
    },
  });
  return result.count;
}
