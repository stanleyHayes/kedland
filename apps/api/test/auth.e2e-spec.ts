import { ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { AuthService } from "../src/modules/auth/auth.service";
import { RolesService } from "../src/modules/roles/roles.service";
import { UsersService } from "../src/modules/users/users.service";

import type { Server } from "node:http";

/**
 * The authentication flow against a real MongoDB.
 *
 * Auth is the one surface where a mocked test is close to worthless: rotation,
 * reuse detection and lockout are all about persisted state, and a stubbed
 * model would happily confirm behaviour the database never implements.
 */
const PASSWORD = "correct-horse-battery-staple";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let server: Server;
  let users: UsersService;
  let auth: AuthService;
  let email: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    server = app.getHttpServer() as Server;
    users = app.get(UsersService);
    auth = app.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // A fresh account per test: lockout and rotation both mutate state that
    // would otherwise leak between cases.
    email = `staff-${String(Date.now())}-${String(Math.round(process.hrtime()[1]))}@kedland.edu.gh`;
    await app.get(RolesService).ensureSystemRoles();
    await users.create({
      email,
      password: PASSWORD,
      displayName: "Test Staff",
      roleSlug: "administrator",
      permissions: await app.get(RolesService).permissionsForSlug("administrator"),
    });
  });

  function login(password = PASSWORD): request.Test {
    // Returns the chainable Test rather than awaiting it, so callers can keep
    // using `.expect(...)`.
    return request(server).post("/api/v1/auth/login").send({ email, password });
  }

  describe("sign in", () => {
    it("returns a token pair and the account", async () => {
      const response = await login().expect(200);

      expect(response.body).toMatchObject({
        user: { email, roleSlug: "administrator", displayName: "Test Staff" },
      });
      expect(typeof response.body.accessToken).toBe("string");
      expect(typeof response.body.refreshToken).toBe("string");
    });

    it("never returns the password hash", async () => {
      const response = await login().expect(200);
      expect(JSON.stringify(response.body)).not.toMatch(/argon2|passwordHash/i);
    });

    it("rejects a wrong password", async () => {
      await login("not-the-password").expect(401);
    });

    it("gives the same answer for an unknown address as for a wrong password", async () => {
      const unknown = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "nobody@kedland.edu.gh", password: PASSWORD })
        .expect(401);
      const wrong = await login("not-the-password").expect(401);

      // Different answers here would turn the form into an account-enumeration tool.
      expect(unknown.body.detail).toBe(wrong.body.detail);
    });

    it("rejects a malformed email with field-level detail", async () => {
      const response = await request(server)
        .post("/api/v1/auth/login")
        .send({ email: "not-an-email", password: PASSWORD })
        .expect(400);

      expect(response.body.errors).toHaveProperty("email");
    });

    it("refuses a suspended account", async () => {
      const account = await users.findForAuthentication(email);
      await users.setStatus(account!.id, "suspended");

      await login().expect(401);
    });

    it("locks the account after repeated failures", async () => {
      for (let i = 0; i < 8; i++) {
        await login("wrong-password");
      }
      // Correct password, but the account is now locked.
      await login().expect(401);
    });

    it("records the sign-in time", async () => {
      await login().expect(200);

      const account = await users.findForAuthentication(email);
      expect(account?.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe("the signed-in account", () => {
    it("is refused without a token", async () => {
      await request(server).get("/api/v1/auth/me").expect(401);
    });

    it("is refused with a nonsense token", async () => {
      await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer not-a-real-token")
        .expect(401);
    });

    it("is returned with a valid token", async () => {
      const { body } = await login().expect(200);

      const response = await request(server)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${body.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({ email, roleSlug: "administrator", status: "active" });
    });
  });

  describe("refresh rotation", () => {
    it("exchanges a refresh token for a new pair", async () => {
      const { body } = await login().expect(200);

      const response = await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(200);

      expect(response.body.refreshToken).not.toBe(body.refreshToken);
      expect(typeof response.body.accessToken).toBe("string");
    });

    it("refuses the old token once it has been rotated", async () => {
      const { body } = await login().expect(200);
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(200);

      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(401);
    });

    it("revokes the whole family when a used token is replayed", async () => {
      const { body: first } = await login().expect(200);
      const { body: second } = await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: first.refreshToken })
        .expect(200);

      // Replaying the first token means it was captured. Both it and the
      // legitimate successor must stop working.
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: first.refreshToken })
        .expect(401);
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: second.refreshToken })
        .expect(401);
    });

    it("refuses an unknown refresh token", async () => {
      await request(server).post("/api/v1/auth/refresh").send({ refreshToken: "made-up" }).expect(401);
    });
  });

  describe("sign out", () => {
    it("revokes the refresh token", async () => {
      const { body } = await login().expect(200);

      await request(server).post("/api/v1/auth/logout").send({ refreshToken: body.refreshToken }).expect(204);
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(401);
    });

    it("is quiet about a token it does not know", async () => {
      // Signing out should never report whether a token was real.
      await request(server).post("/api/v1/auth/logout").send({ refreshToken: "made-up" }).expect(204);
    });
  });

  describe("password reset", () => {
    it("answers identically whether or not the address exists", async () => {
      const known = await request(server).post("/api/v1/auth/password/forgot").send({ email }).expect(202);
      const unknown = await request(server)
        .post("/api/v1/auth/password/forgot")
        .send({ email: "nobody@kedland.edu.gh" })
        .expect(202);

      expect(known.body).toEqual(unknown.body);
    });

    it("accepts a valid token and sets the new password", async () => {
      const issued = await auth.startPasswordReset(email);
      const newPassword = "a-completely-different-password";

      await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: issued!.token, password: newPassword })
        .expect(204);

      await login(newPassword).expect(200);
      await login(PASSWORD).expect(401);
    });

    it("rejects a token that was never issued", async () => {
      await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: "invented", password: "a-completely-different-password" })
        .expect(401);
    });

    it("rejects a password below the minimum length", async () => {
      const issued = await auth.startPasswordReset(email);

      const response = await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: issued!.token, password: "short" })
        .expect(400);

      expect(response.body.errors).toHaveProperty("password");
    });

    it("signs out every existing session", async () => {
      const { body } = await login().expect(200);
      const issued = await auth.startPasswordReset(email);

      await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: issued!.token, password: "a-completely-different-password" })
        .expect(204);

      // A reset is what you do after a compromise; leaving the attacker's
      // session alive would defeat the point.
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(401);
    });

    it("cannot reuse a reset token", async () => {
      const issued = await auth.startPasswordReset(email);
      const password = "a-completely-different-password";

      await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: issued!.token, password })
        .expect(204);
      await request(server)
        .post("/api/v1/auth/password/reset")
        .send({ token: issued!.token, password })
        .expect(401);
    });
  });

  describe("changing your own password", () => {
    it("requires the current one", async () => {
      const { body } = await login().expect(200);

      await request(server)
        .post("/api/v1/auth/password/change")
        .set("Authorization", `Bearer ${body.accessToken}`)
        .send({ currentPassword: "wrong", newPassword: "a-completely-different-password" })
        .expect(401);
    });

    it("changes it and signs out other sessions", async () => {
      const { body } = await login().expect(200);
      const newPassword = "a-completely-different-password";

      await request(server)
        .post("/api/v1/auth/password/change")
        .set("Authorization", `Bearer ${body.accessToken}`)
        .send({ currentPassword: PASSWORD, newPassword })
        .expect(204);

      await login(newPassword).expect(200);
      await request(server)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: body.refreshToken })
        .expect(401);
    });

    it("is refused without a token", async () => {
      await request(server)
        .post("/api/v1/auth/password/change")
        .send({ currentPassword: PASSWORD, newPassword: "a-completely-different-password" })
        .expect(401);
    });
  });

  describe("routes are private by default", () => {
    it("leaves health reachable, because Render polls it", async () => {
      await request(server).get("/api/v1/health").expect(200);
      await request(server).get("/api/v1/health/ready").expect(200);
    });

    it("rejects an unknown route with problem+json rather than a stack trace", async () => {
      const response = await request(server).get("/api/v1/nope").expect(404);
      expect(response.headers["content-type"]).toMatch(/application\/problem\+json/);
    });
  });
});
