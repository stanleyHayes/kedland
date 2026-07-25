import { ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";

import type { HealthStatus } from "@kedland/types";
import type { Server } from "node:http";

/**
 * The Phase 0 smoke test: the whole application boots against a real MongoDB,
 * routing and versioning are wired, the error shape is problem+json, and the
 * health endpoints Render polls actually answer.
 *
 * If this passes, the foundation is real rather than merely compiled.
 */
describe("Health (e2e)", () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it("answers liveness on the versioned prefix", async () => {
    const response = await request(server).get("/api/v1/health").expect(200);
    const body = response.body as HealthStatus;

    expect(body).toMatchObject({ status: "ok" });
    expect(typeof body.uptimeSeconds).toBe("number");
  });

  it("reports the database as up on readiness", async () => {
    const response = await request(server).get("/api/v1/health/ready").expect(200);

    expect(response.body).toMatchObject({ status: "ok", checks: { database: "up" } });
  });

  it("returns problem+json for an unknown route", async () => {
    const response = await request(server).get("/api/v1/not-a-route").expect(404);

    expect(response.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({
      status: 404,
      title: "Not Found",
      instance: "/api/v1/not-a-route",
    });
  });

  it("serves the health check at the path render.yaml polls", async () => {
    // render.yaml sets healthCheckPath: /api/v1/health. If this test and that
    // file ever disagree, Render restarts a working service in a loop.
    const response = await request(server).get("/api/v1/health");

    expect(response.status).toBe(200);
  });
});
