import { app, client, start, auth, fail, id } from "./common.js";
import { z } from "zod";
const messages = client.db("jugaad_messaging").collection("messages");
async function context(req) {
  const itemId = String(id(req.params.id));
  const query = req.query.buyer ? "?buyer=" + String(id(req.query.buyer)) : "";
  const response = await fetch(
    `${process.env.MARKETPLACE_URL}/api/items/${itemId}/conversation${query}`,
    {
      headers: { Authorization: req.headers.authorization },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok) {
    if (response.status === 403)
      fail(403, "Send an offer before starting a conversation");
    fail(response.status === 404 ? 404 : 503, "Conversation unavailable");
  }
  const item = await response.json();
  return { itemId, buyer: item.buyer, seller: item.seller };
}
app.get("/api/messages/:id", auth, async (req, res) => {
  res.json(
    await messages
      .find(await context(req))
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray(),
  );
});
app.post("/api/messages/:id", auth, async (req, res) => {
  const content = z.string().trim().min(1).max(1000).parse(req.body.content);
  const c = await context(req);
  const message = {
    ...c,
    content,
    sender: req.user.sub,
    alias: req.user.alias,
    createdAt: new Date(),
  };
  const r = await messages.insertOne(message);
  res.status(201).json({ ...message, _id: r.insertedId });
});
await start(() =>
  messages.createIndex({ itemId: 1, buyer: 1, seller: 1, createdAt: -1 }),
);
