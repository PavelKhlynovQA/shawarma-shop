// Единый формат ошибок API: { error: { code, message, details } }
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || null;
  }

  static badRequest(message, details) {
    return new ApiError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message) {
    return new ApiError(401, 'UNAUTHORIZED', message || 'Требуется авторизация');
  }

  static forbidden(message) {
    return new ApiError(403, 'FORBIDDEN', message || 'Недостаточно прав');
  }

  static notFound(message) {
    return new ApiError(404, 'NOT_FOUND', message || 'Ресурс не найден');
  }

  static conflict(code, message) {
    return new ApiError(409, code || 'CONFLICT', message);
  }
}
