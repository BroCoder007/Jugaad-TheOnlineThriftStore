import { randomBytes } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
if (existsSync(".env")) {
  console.log(".env already exists; kept unchanged");
} else {
  writeFileSync(
    ".env",
    `JWT_SECRET=${randomBytes(48).toString("hex")}\nMONGO_PASSWORD=${randomBytes(24).toString("hex")}\n`,
    { mode: 0o600 },
  );
  console.log("Created local .env. Keep it private.");
}
