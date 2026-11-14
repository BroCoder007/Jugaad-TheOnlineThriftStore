import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";
const ports = {
  identity: 4311,
  marketplace: 4312,
  messaging: 4313,
  gateway: 4310,
};
test("marketplace workflows and isolation", { timeout: 180000 }, async () => {
  const mongo = await MongoMemoryServer.create({
    binary: { version: "8.0.12" },
  });
  const children = [];
  try {
    for (const [name, port] of Object.entries(ports)) {
      const proc = spawn(process.execPath, [`services/${name}.js`], {
        env: {
          ...process.env,
          JWT_SECRET: "test-only-key-with-at-least-32-characters",
          MONGO_URI: mongo.getUri(),
          SERVICE: name,
          PORT: String(port),
          IDENTITY_URL: "http://127.0.0.1:4311",
          MARKETPLACE_URL: "http://127.0.0.1:4312",
          MESSAGING_URL: "http://127.0.0.1:4313",
        },
        stdio: ["ignore", "pipe", "pipe"],
      });
      children.push(proc);
      proc.stderr.on("data", (d) => process.stderr.write(d));
      for (let i = 0; i < 150; i++) {
        try {
          if ((await fetch(`http://127.0.0.1:${port}/healthz`)).ok) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 100));
        if (i === 149) throw Error(name + " failed to start");
      }
    }
    const call = async (path, method = "GET", body, token) => {
      const r = await fetch("http://127.0.0.1:4310/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, data: await r.json() };
    };
    const reg = async (alias) => {
      const r = await call("/auth/register", "POST", {
        alias,
        email: alias + "@example.test",
        password: "test-password-12345",
      });
      assert.equal(r.status, 201);
      return r.data;
    };
    const seller = await reg("Seller"),
      buyer = await reg("Buyer"),
      other = await reg("Other");
    assert.equal(
      (
        await call("/auth/login", "POST", {
          email: "Seller@example.test",
          password: "wrong-password-12345",
        })
      ).status,
      401,
    );
    assert.equal((await call("/items", "POST", {})).status, 401);
    const listing = {
      title: "Reading chair",
      description: "A well cared for reading chair.",
      price: 250000,
      category: "Living",
      condition: "Good",
      image: "https://example.com/chair.jpg",
    };
    assert.equal(
      (await call("/items", "POST", { ...listing, price: -10 }, seller.token))
        .status,
      400,
    );
    const item = (
      await call(
        "/items",
        "POST",
        { ...listing, seller: other.id },
        seller.token,
      )
    ).data;
    assert.equal(item.seller, seller.id);
    assert.equal(
      (
        await call(
          "/items/" + item._id + "/offers",
          "POST",
          { amount: 10000 },
          seller.token,
        )
      ).status,
      409,
    );
    const a = await call(
      "/items/" + item._id + "/offers",
      "POST",
      { amount: 200000 },
      buyer.token,
    );
    assert.equal(a.status, 201);
    const b = await call(
      "/items/" + item._id + "/offers",
      "POST",
      { amount: 210000 },
      other.token,
    );
    assert.equal(b.status, 201);
    assert.equal(
      (
        await call(
          "/items/" + item._id + "/offers",
          "POST",
          { amount: 220000 },
          buyer.token,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          "/items/" + item._id + "/accept/" + a.data.id,
          "POST",
          {},
          other.token,
        )
      ).status,
      404,
    );
    const results = await Promise.all(
      [a, b].map((x) =>
        call(
          "/items/" + item._id + "/accept/" + x.data.id,
          "POST",
          {},
          seller.token,
        ),
      ),
    );
    assert.deepEqual(results.map((x) => x.status).sort(), [200, 409]);
    const pub = (await call("/items")).data[0];
    assert.equal(pub.offers, undefined);
    assert.equal(JSON.stringify(pub).includes("@example.test"), false);
    assert.equal(
      (
        await call(
          "/messages/" + item._id,
          "POST",
          { content: "Hello, is collection possible?" },
          buyer.token,
        )
      ).status,
      201,
    );
    assert.equal(
      (await call("/messages/" + item._id, "GET", undefined, other.token)).data
        .length,
      0,
    );
    assert.equal(
      (
        await call(
          "/messages/" + item._id + "?buyer=" + buyer.id,
          "GET",
          undefined,
          seller.token,
        )
      ).data.length,
      1,
    );
    assert.equal(
      (await call("/messages/not-an-id", "GET", undefined, buyer.token)).status,
      400,
    );
    const ws = (await call("/workspace", "GET", undefined, buyer.token)).data;
    assert.equal(ws[0].offers.length, 1);
  } finally {
    for (const proc of children) proc.kill();
    await Promise.all(
      children.map(
        (p) =>
          new Promise((r) => (p.exitCode !== null ? r() : p.once("exit", r))),
      ),
    );
    await mongo.stop();
  }
});
