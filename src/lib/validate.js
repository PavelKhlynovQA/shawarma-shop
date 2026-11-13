// Ручная валидация входных данных. Возвращает массив ошибок в едином формате.
import { ApiError } from './errors.js';

export function fail(errors) {
  if (errors.length) {
    throw ApiError.badRequest('Некорректные данные запроса', errors);
  }
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isPhone(value) {
  if (typeof value !== 'string') return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

export function requireFields(body, fields) {
  const errors = [];
  for (const field of fields) {
    if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push({ field: field, message: 'Поле обязательно' });
    }
  }
  return errors;
}

export function oneOf(value, allowed) {
  return allowed.includes(value);
}
