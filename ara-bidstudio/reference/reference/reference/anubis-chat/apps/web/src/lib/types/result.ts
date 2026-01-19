/**
 * Result Type Pattern for Robust Error Handling
 * Based on Rust's Result type and functional programming patterns
 * Ensures explicit error handling without exceptions
 */

/**
 * Discriminated union representing the outcome of an operation
 * that can either succeed with a value T or fail with an error E
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Represents a successful outcome
 */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
  readonly error?: never;
}

/**
 * Represents a failed outcome
 */
export interface Err<E> {
  readonly ok: false;
  readonly value?: never;
  readonly error: E;
}

/**
 * Type guard to check if a Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

/**
 * Type guard to check if a Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.ok === false;
}

/**
 * Creates a successful Result
 */
export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

/**
 * Creates a failed Result
 */
export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

/**
 * Maps a Result<T, E> to Result<U, E> by applying a function to a successful value
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/**
 * Maps a Result<T, E> to Result<T, F> by applying a function to an error value
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/**
 * Chains Result operations
 */
export function chain<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/**
 * Unwraps a Result, returning the value or a default
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/**
 * Unwraps a Result, returning the value or throwing the error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Combines multiple Results into a single Result containing an array of values
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (isErr(result)) {
      return result;
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Async version of Result for promise-based operations
 */
export type AsyncResult<T, E> = Promise<Result<T, E>>;

/**
 * Wraps a promise to return an AsyncResult
 */
export async function tryCatch<T, E>(
  promise: Promise<T>,
  onError: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(onError(error));
  }
}

/**
 * Pattern matching for Result types
 */
export function match<T, E, R>(
  result: Result<T, E>,
  patterns: {
    ok: (value: T) => R;
    err: (error: E) => R;
  }
): R {
  return isOk(result) ? patterns.ok(result.value) : patterns.err(result.error);
}

/**
 * Converts a Result to a tuple [value, error]
 */
export function toTuple<T, E>(
  result: Result<T, E>
): [T | undefined, E | undefined] {
  return isOk(result) ? [result.value, undefined] : [undefined, result.error];
}

/**
 * Validates a value and returns a Result
 */
export function validate<T, E>(
  inputValue: T,
  validator: (candidate: T) => E | null
): Result<T, E> {
  const error = validator(inputValue);
  return error ? err(error) : ok(inputValue);
}

/**
 * Type-safe exhaustive pattern matching helper
 */
export function assertUnreachable(value: never): never {
  throw new Error(`Unreachable code reached with value: ${value}`);
}
