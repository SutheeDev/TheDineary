import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { authenticator } from "otplib";
import { app } from "../server.mjs";
import User from "../models/User.mjs";
import { registerUser } from "./helpers.mjs";
import { sendPasswordResetEmail } from "../utils/sendEmail.mjs";

// The raw reset token only ever exists inside the emailed link, so the tests
// read it back out of the mocked send call.
vi.mock("../utils/sendEmail.mjs", () => ({
  sendEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

const requestReset = async (email) => {
  const res = await request(app)
    .post("/api/auth/forgot-password")
    .send({ email });
  const call = sendPasswordResetEmail.mock.calls.at(-1);
  const token = call ? call[0].resetUrl.split("/").pop() : null;
  return { res, token };
};

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

// Hashing lives in the User model's pre("save") hook. The risks are hashing
// twice (login breaks immediately) and re-hashing an existing hash on an
// unrelated save (login breaks later, which is harder to spot).
describe("Password hashing (pre-save hook)", () => {
  it("stores a hash, not the raw password", async () => {
    const { payload } = await registerUser({ email: "hash@example.com" });

    const stored = await User.findOne({ email: payload.email }).select(
      "+password"
    );
    expect(stored.password).not.toBe(payload.password);
    expect(stored.password.startsWith("$2")).toBe(true);
  });

  it("hashes once, so the registered password still logs in", async () => {
    const { payload } = await registerUser({ email: "once@example.com" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
  });

  it("does not re-hash when the user is saved for an unrelated reason", async () => {
    const { cookie, payload } = await registerUser({
      email: "rehash@example.com",
    });

    const before = await User.findOne({ email: payload.email }).select(
      "+password"
    );

    // Enabling 2FA saves the user twice without touching the password.
    const setupRes = await request(app)
      .post("/api/auth/totp/setup")
      .set("Cookie", cookie);
    const secret = new URL(setupRes.body.otpauthUrl).searchParams.get("secret");
    await request(app)
      .post("/api/auth/totp/verify-setup")
      .set("Cookie", cookie)
      .send({ token: authenticator.generate(secret) });

    const after = await User.findOne({ email: payload.email }).select(
      "+password"
    );
    expect(after.password).toBe(before.password);
  });
});

describe("POST /api/auth/login (Google-only account)", () => {
  it("returns 401 rather than 500 when the account has no password", async () => {
    await User.create({
      name: "Google User",
      email: "googleonly@example.com",
      googleId: "google-sub-123",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "googleonly@example.com", password: "anything123" });
    expect(res.status).toBe(401);
  });
});

// PATCH /api/user writes an explicit field whitelist, so sensitive fields sent
// alongside the legitimate ones must be ignored rather than saved.
describe("PATCH /api/user (field whitelist)", () => {
  it("ignores a password sent in the body", async () => {
    const { cookie, payload } = await registerUser({
      email: "whitelist@example.com",
    });

    const res = await request(app)
      .patch("/api/user")
      .set("Cookie", cookie)
      .send({
        name: "Renamed",
        email: payload.email,
        password: "attacker-chosen",
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");

    // The original password still works, so the injected one was not written.
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.status).toBe(200);
  });

  it("ignores totpEnabled sent in the body", async () => {
    const { cookie, payload } = await registerUser({
      email: "whitelist-totp@example.com",
    });

    // Turn 2FA on properly first.
    const setupRes = await request(app)
      .post("/api/auth/totp/setup")
      .set("Cookie", cookie);
    const secret = new URL(setupRes.body.otpauthUrl).searchParams.get("secret");
    await request(app)
      .post("/api/auth/totp/verify-setup")
      .set("Cookie", cookie)
      .send({ token: authenticator.generate(secret) });

    const res = await request(app)
      .patch("/api/user")
      .set("Cookie", cookie)
      .send({ name: "Still On", email: payload.email, totpEnabled: false });
    expect(res.status).toBe(200);

    // Login still demands the second factor.
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: payload.email, password: payload.password });
    expect(loginRes.body.mfaRequired).toBe(true);
  });

  it("rejects an invalid email with 400, not 500", async () => {
    const { cookie } = await registerUser({ email: "validation@example.com" });
    const res = await request(app)
      .patch("/api/user")
      .set("Cookie", cookie)
      .send({ name: "Fine", email: "not-an-email" });
    expect(res.status).toBe(400);
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

describe("password reset", () => {
  beforeEach(() => {
    sendPasswordResetEmail.mockClear();
  });

  it("emails a link and stores only the hashed token", async () => {
    await registerUser({ email: "reset@example.com" });

    const { res, token } = await requestReset("reset@example.com");

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(token).toBeTruthy();

    const user = await User.findOne({ email: "reset@example.com" }).select(
      "+resetPasswordToken +resetPasswordExpires"
    );
    expect(user.resetPasswordToken).not.toBe(token);
    expect(user.resetPasswordExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns the same response for an unknown email and sends nothing", async () => {
    const { res } = await requestReset("nobody@example.com");

    expect(res.status).toBe(200);
    expect(res.body.msg).toMatch(/if that email is registered/i);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("does not issue a token for a Google-only account", async () => {
    await User.create({
      name: "Gina",
      email: "google@example.com",
      googleId: "google-123",
    });

    const { res } = await requestReset("google@example.com");

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("sets the new password, and the old one stops working", async () => {
    await registerUser({ email: "swap@example.com", password: "oldpassword" });
    const { token } = await requestReset("swap@example.com");

    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "newpassword" });
    expect(resetRes.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "swap@example.com", password: "oldpassword" });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "swap@example.com", password: "newpassword" });
    expect(newLogin.status).toBe(200);
    expect(newLogin.headers["set-cookie"].join(";")).toContain("token=");
  });

  it("rejects a token that has already been used", async () => {
    await registerUser({ email: "once@example.com" });
    const { token } = await requestReset("once@example.com");

    const first = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "newpassword" });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "anotherpassword" });
    expect(second.status).toBe(400);
    expect(second.body.msg).toMatch(/invalid or has expired/i);
  });

  it("rejects an expired token", async () => {
    await registerUser({ email: "expired@example.com" });
    const { token } = await requestReset("expired@example.com");

    await User.updateOne(
      { email: "expired@example.com" },
      { resetPasswordExpires: Date.now() - 1000 }
    );

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "newpassword" });
    expect(res.status).toBe(400);
    expect(res.body.msg).toMatch(/invalid or has expired/i);
  });

  it("rejects a made-up token", async () => {
    await registerUser({ email: "fake@example.com" });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token", password: "newpassword" });
    expect(res.status).toBe(400);
  });
});
