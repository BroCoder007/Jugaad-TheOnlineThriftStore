import { rateLimit } from "express-rate-limit";
import { app, client, key, start, auth, fail } from "./common.js";
import { SignJWT } from "jose";
import { randomBytes, scrypt as raw, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
const scrypt = promisify(raw);
const users = client.db("jugaad_identity").collection("users");
const input = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
  alias: z.string().trim().min(2).max(32).optional(),
});
async function session(u) {
  return {
    alias: u.alias,
    id: String(u._id),
    token: await new SignJWT({ alias: u.alias })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(u._id))
      .setIssuer("jugaad")
      .setAudience("jugaad-api")
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(key),
  };
}
app.post("/api/auth/register", async (req, res) => {
  const v = input
    .extend({ alias: z.string().trim().min(2).max(32) })
    .parse(req.body);
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(v.password, salt, 64)).toString("hex");
  const u = { email: v.email, alias: v.alias, salt, hash };
  const result = await users.insertOne(u);
  res.status(201).json(await session({ ...u, _id: result.insertedId }));
});
app.post("/api/auth/login", async (req, res) => {
  const v = input.parse(req.body);
  const u = await users.findOne({ email: v.email });
  const h = await scrypt(v.password, u?.salt || "invalid", 64);
  if (!u || !timingSafeEqual(h, Buffer.from(u.hash, "hex")))
    fail(401, "Invalid email or password");
  res.json(await session(u));
});
app.get("/api/auth/me", auth, (req, res) =>
  res.json({ id: req.user.sub, alias: req.user.alias }),
);
await start(() => users.createIndex({ email: 1 }, { unique: true }));
