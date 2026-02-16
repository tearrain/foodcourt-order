/**
 * 统一响应工具
 */

interface ResponseMeta {
  request_id?: string;
  timestamp: string;
}

interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T | null;
  details?: any;
  meta: ResponseMeta;
}

export function response<T>(
  data: T | null = null,
  code: number = 0,
  message: string = 'success',
  details?: any
): ResponseData<T> {
  return {
    code,
    message,
    data,
    details,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

export function success<T>(data: T): ResponseData<T> {
  return response(data);
}

export function error(
  code: number,
  message: string,
  details?: any
): ResponseData<null> {
  return response(null, code, message, details);
}

interface PaginatedData<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): ResponseData<PaginatedData<T>> {
  const totalPages = Math.ceil(total / limit);

  return response({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
