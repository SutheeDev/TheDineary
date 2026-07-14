import { describe, it, expect } from "vitest";
import request from "supertest";
import { authenticator } from "otplib";
import { app } from "../server.mjs";
import { registerUser } from "./helpers.mjs";

describe("POST /api/auth/register", () => {
  it("creates a user, sets a cookie, and never returns the password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.password).toBeUndefined();
    expect(res.body.totpSecret).toBeUndefined();
    expect(res.headers["set-cookie"].join(";")).toContain("token=");
  });

  it("rejects a duplicate email with 400", async () => {
    await registerUser({ email: "dupe@example.com" });
    const res = await request(app).post("/api/auth/register").send({
      name: "Bob",
      email: "dupe@example.com",
      password: "password123",
    });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/already exists/i);
  });

  it("rejects a too-short password before reaching the controller", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Carol",
      email: "carol@example.com",
      password: "123",
    });

    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/at least 6/i);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with the right password", async () => {
    await registerUser({ email: "login@example.com", password: "password123" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("login@example.com");
    expect(res.headers["set-cookie"].join(";")).toContain("token=");
  });

  it("rejects a wrong password with 401", async () => {
    await registerUser({ email: "login2@example.com", password: "password123" });
    const res = await request(app).post("/api/auth/login").send({
      email: "login2@example.com",
      password: "wrongpassword",
    });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/google", () => {
  it("rejects a missing credential with 400", async () => {
    const res = await request(app).post("/api/auth/google").send({});
    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/credential/i);
  });
});

describe("GET /api/auth/me (auth middleware)", () => {
  it("rejects a request with no cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a garbage token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "token=not-a-real-jwt");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid cookie", async () => {
    const { cookie } = await registerUser({ email: "me@example.com" });
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("me@example.com");
  });
});

// otplib is deterministic given a secret, so the whole two-factor flow can be
// exercised end to end without mocking: set it up, then require it at login.
describe("Two-factor (TOTP) flow", () => {
  it("enables 2FA and then requires a code at login", async () => {
    const { cookie } = await registerUser({
      email: "totp@example.com",
      password: "password123",
    });

    // Begin setup: the server stores a secret and returns the otpauth URL.
    const setupRes = await request(app)
      .post("/api/auth/totp/setup")
      .set("Cookie", cookie);
    expect(setupRes.status).toBe(200);
    const secret = new URL(setupRes.body.otpauthUrl).searchParams.get("secret");
    expect(secret).toBeTruthy();

    // Confirm setup with a valid code to turn 2FA on.
    const verifySetupRes = await request(app)
      .post("/api/auth/totp/verify-setup")
      .set("Cookie", cookie)
      .send({ token: authenticator.generate(secret) });
    expect(verifySetupRes.status).toBe(200);
    expect(verifySetupRes.body.totpEnabled).toBe(true);

    // Logging in now returns mfaRequired instead of a session.
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "totp@example.com",
      password: "password123",
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.mfaRequired).toBe(true);
    const pendingCookie = loginRes.headers["set-cookie"];

    // A wrong code is rejected.
    const badCode = await request(app)
      .post("/api/auth/totp/verify")
      .set("Cookie", pendingCookie)
      .send({ token: "000000" });
    expect(badCode.status).toBe(401);

    // The right code completes login and issues the real session cookie.
    const goodCode = await request(app)
      .post("/api/auth/totp/verify")
      .set("Cookie", pendingCookie)
      .send({ token: authenticator.generate(secret) });
    expect(goodCode.status).toBe(200);
    expect(goodCode.headers["set-cookie"].join(";")).toContain("token=");
  });
});
