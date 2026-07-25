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
}
