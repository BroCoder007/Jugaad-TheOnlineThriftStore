import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { MongoClient, ObjectId } from "mongodb";
import { jwtVerify } from "jose";
export { ObjectId };
export const key = new TextEncoder().encode(process.env.JWT_SECRET || "");
if (key.length < 32) throw Error("JWT_SECRET must contain at least 32 bytes");
export const client = new MongoClient(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
});
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(
  rateLimit({
    windowMs: 60000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.get("/healthz", (req, res) =>
  res.json({ status: "ok", service: process.env.SERVICE }),
);
app.get("/readyz", async (req, res) => {
  try {
    await client.db("admin").command({ ping: 1 });
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});
export function fail(status, message) {
  const e = Error(message);
  e.status = status;
  throw e;
}
export function id(value) {
  if (!/^[a-f\d]{24}$/i.test(value || "")) fail(400, "Invalid identifier");
  return new ObjectId(value);
}
export async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    if (!token) fail(401, "Sign in to continue");
    const { payload } = await jwtVerify(token, key, {
      issuer: "jugaad",
      audience: "jugaad-api",
      algorithms: ["HS256"],
    });
    id(payload.sub);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Please sign in again" });
  }
}
export async function start(setup) {
  await client.connect();
  await setup();
  app.use((err, req, res, next) => {
    const status =
      err.status ||
      (err.name === "ZodError" ? 400 : err.code === 11000 ? 409 : 500);
    res
      .status(status)
      .json({
        error:
          status === 500
            ? "Service unavailable"
            : status === 409
              ? "That record already exists"
              : err.name === "ZodError"
                ? "Check the fields and try again"
                : err.message,
      });
  });
  const server = app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
    console.log(
      JSON.stringify({ event: "listening", service: process.env.SERVICE }),
    ),
  );
  process.on("SIGTERM", () =>
    server.close(async () => {
      await client.close();
      process.exit(0);
    }),
  );
}
