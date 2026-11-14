import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("deployment exposes only the gateway", () => {
  const config = readFileSync("compose.yaml", "utf8");
  assert.equal((config.match(/ports:/g) || []).length, 1);
  assert.match(config, /127\.0\.0\.1:8080:8080/);
});
