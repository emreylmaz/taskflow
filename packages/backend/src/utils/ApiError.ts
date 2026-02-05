export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message = "Yetkisiz erişim") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Erişim engellendi") {
    return new ApiError(403, message);
  }

  static notFound(message = "Bulunamadı") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static tooManyRequests(
    message = "Çok fazla istek, lütfen daha sonra tekrar deneyin",
  ) {
    return new ApiError(429, message);
  }

  static internalError(message = "Sunucu hatası") {
    return new ApiError(500, message);
  }

  static serviceUnavailable(message = "Servis şu anda kullanılamıyor") {
    return new ApiError(503, message);
  }
}
