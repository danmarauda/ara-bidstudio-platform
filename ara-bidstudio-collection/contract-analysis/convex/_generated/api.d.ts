/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as annotations_mutations from "../annotations/mutations.js";
import type * as annotations_queries from "../annotations/queries.js";
import type * as auth_mutations from "../auth/mutations.js";
import type * as auth_queries from "../auth/queries.js";
import type * as corpuses_mutations from "../corpuses/mutations.js";
import type * as corpuses_queries from "../corpuses/queries.js";
import type * as documents_mutations from "../documents/mutations.js";
import type * as documents_queries from "../documents/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "annotations/mutations": typeof annotations_mutations;
  "annotations/queries": typeof annotations_queries;
  "auth/mutations": typeof auth_mutations;
  "auth/queries": typeof auth_queries;
  "corpuses/mutations": typeof corpuses_mutations;
  "corpuses/queries": typeof corpuses_queries;
  "documents/mutations": typeof documents_mutations;
  "documents/queries": typeof documents_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
