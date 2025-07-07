/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as additionalData from "../additionalData.js";
import type * as auth from "../auth.js";
import type * as bookings from "../bookings.js";
import type * as categories from "../categories.js";
import type * as checkIn from "../checkIn.js";
import type * as http from "../http.js";
import type * as karts from "../karts.js";
import type * as lapTimes from "../lapTimes.js";
import type * as notifications from "../notifications.js";
import type * as pilots from "../pilots.js";
import type * as raceSessions from "../raceSessions.js";
import type * as rankings from "../rankings.js";
import type * as router from "../router.js";
import type * as sampleData from "../sampleData.js";
import type * as timeSlots from "../timeSlots.js";
import type * as transactions from "../transactions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  additionalData: typeof additionalData;
  auth: typeof auth;
  bookings: typeof bookings;
  categories: typeof categories;
  checkIn: typeof checkIn;
  http: typeof http;
  karts: typeof karts;
  lapTimes: typeof lapTimes;
  notifications: typeof notifications;
  pilots: typeof pilots;
  raceSessions: typeof raceSessions;
  rankings: typeof rankings;
  router: typeof router;
  sampleData: typeof sampleData;
  timeSlots: typeof timeSlots;
  transactions: typeof transactions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
