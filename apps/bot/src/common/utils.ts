import { ApiResponse } from '@teddy/shared';

export function handleError(error: unknown): ApiResponse {
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  };
}

export function handleSuccess<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}
