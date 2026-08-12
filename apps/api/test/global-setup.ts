import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Boots an in-memory MongoDB and publishes the connection details before any
 * worker starts.
 *
 * This has to be `globalSetup` rather than `beforeAll`: `AppModule` validates
 * the environment at import time (deliberately — see env.validation.ts), and a
 * static import runs before any hook. Jest's globalSetup executes in the parent
 * process, so these `process.env` writes are inherited by every worker.
 *
 * Integration tests run against a real database, not a mock. A mocked driver
 * would happily accept a broken index or a violated unique constraint and let
 * it reach production green.
 */
declare global {
  var __KEDLAND_MONGO__: MongoMemoryServer | undefined;
}

export default async function globalSetup(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  globalThis.__KEDLAND_MONGO__ = mongo;

  process.env["NODE_ENV"] = "test";
  process.env["MONGODB_URI"] = mongo.getUri();
  process.env["MONGODB_DB"] = "kedland-test";
  // No PORT override: the e2e suite drives the app through `app.init()` and
  // supertest, so nothing ever binds a socket. The schema's `min(1)` is right
  // for a real server and there is no reason to loosen it for tests.
  process.env["CORS_ORIGINS"] = "http://localhost:3000";
  process.env["JWT_ACCESS_SECRET"] = "test-access-secret-long-enough-for-zod";
  process.env["JWT_REFRESH_SECRET"] = "test-refresh-secret-long-enough-for-zod";
  // Argon2 at production cost makes an auth suite crawl. The parameters are
  // asserted in the unit tests; here we only need the algorithm to round-trip.
  // Every request in this suite comes from 127.0.0.1, so a per-IP limit shaped
  // for production throttles the tests instead of an attacker. The limits
  // themselves are asserted in the config unit tests.
  /*
   * One MongoDB for every e2e suite, which is why `jest-e2e.json` pins
   * `maxWorkers: 1`.
   *
   * Run in parallel, the suites interleave writes to the same collections. It
   * surfaced as a refresh-token test failing on a 400: the login before it had
   * answered with an error rather than a token, so the request that followed sent
   * `undefined` and was rejected by validation — a failure with nothing to do
   * with refreshing, in a test that passes on its own every time. Integration
   * suites sharing mutable state are serial, or they are flaky.
   */
  process.env["THROTTLE_LIMIT"] = "100000";
  process.env["THROTTLE_LOGIN_LIMIT"] = "100000";
  process.env["SEED_ADMIN_EMAIL"] = "seed-admin@kedland.edu.gh";
  process.env["SEED_ADMIN_PASSWORD"] = "seed-password-long-enough";
}
