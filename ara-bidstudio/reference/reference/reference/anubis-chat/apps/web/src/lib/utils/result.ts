/**
 * Result<T, E> pattern for error handling
 * Provides type-safe error handling without exceptions
 */

export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

/**
 * Creates a successful result
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates an error result
 */
export function failure<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Wraps a function that might throw into a Result
 */
export async function safeAsync<T, E = Error>(
  fn: () => Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return success(data);
  } catch (error) {
    return failure(error as E);
  }
}

/**
 * Wraps a synchronous function that might throw into a Result
 */
export function safe<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn();
    return success(data);
  } catch (error) {
    return failure(error as E);
  }
}

/**
 * Maps a Result's data if successful
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return success(fn(result.data));
  }
  return result;
}

/**
 * Maps a Result's error if failed
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return failure(fn(result.error));
  }
  return result;
}

/**
 * Chains Results together
 */
export function chain<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

/**
 * Unwraps a Result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwraps a Result with a default value if error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Converts a Result to a boolean indicating success
 */
export function isSuccess<T, E>(
  result: Result<T, E>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * Converts a Result to a boolean indicating failure
 */
export function isFailure<T, E>(
  result: Result<T, E>
): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Combines multiple Results into a single Result containing an array
 */
export function all<T extends readonly unknown[], E>(
  results: { [K in keyof T]: Result<T[K], E> }
): Result<T, E> {
  const values: unknown[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.data);
  }

  return success(values as unknown as T);
}
