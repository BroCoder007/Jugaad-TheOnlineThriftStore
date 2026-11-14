import { app, client, start, auth, fail, id, ObjectId } from "./common.js";
import { z } from "zod";
const items = client.db("jugaad_marketplace").collection("items");
const amount = z.number().int().min(100).max(100000000); // paise, never floating point currency
const listing = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  price: amount,
  category: z.enum(["Wear", "Living", "Tech", "Books"]),
  condition: z.enum(["Like new", "Good", "Well loved"]),
  image: z
    .string()
    .url()
    .max(1000)
    .refine((v) => v.startsWith("https://")),
});
function publicItem(v) {
  if (!v) return null;
  const { offers, ...rest } = v;
  return rest;
}
app.get("/api/items", async (req, res) => {
  const filter = {};
  if (req.query.category)
    filter.category = z
      .enum(["Wear", "Living", "Tech", "Books"])
      .parse(req.query.category);
  const q = String(req.query.q || "")
    .slice(0, 80)
    .toLowerCase();
  const rows = await items
    .find(filter, { projection: { offers: 0 } })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  res.json(rows.filter((x) => !q || x.title.toLowerCase().includes(q)));
});
app.get("/api/items/:id", async (req, res) => {
  const item = await items.findOne({ _id: id(req.params.id) });
  if (!item) fail(404, "Listing not found");
  res.json(publicItem(item));
});
app.get("/api/items/:id/conversation", auth, async (req, res) => {
  const item = await items.findOne({ _id: id(req.params.id) });
  if (!item) fail(404, "Listing not found");
  const buyer =
    item.seller === req.user.sub ? String(id(req.query.buyer)) : req.user.sub;
  if (!item.offers.some((o) => o.buyer === buyer))
    fail(403, "Send an offer before starting a conversation");
  res.json({ seller: item.seller, buyer });
});
app.post("/api/items", auth, async (req, res) => {
  const v = listing.parse(req.body);
  const item = {
    ...v,
    seller: req.user.sub,
    alias: req.user.alias,
    status: "available",
    offers: [],
    createdAt: new Date(),
  };
  const r = await items.insertOne(item);
  res.status(201).json(publicItem({ ...item, _id: r.insertedId }));
});
app.get("/api/workspace", auth, async (req, res) => {
  const rows = await items
    .find({
      $or: [
        { seller: req.user.sub },
        { "offers.buyer": req.user.sub },
        { buyer: req.user.sub },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();
  res.json(
    rows.map((x) => ({
      ...x,
      offers: x.offers.filter(
        (o) => x.seller === req.user.sub || o.buyer === req.user.sub,
      ),
    })),
  );
});
app.post("/api/items/:id/offers", auth, async (req, res) => {
  const price = amount.parse(req.body.amount);
  const offer = {
    id: new ObjectId().toHexString(),
    buyer: req.user.sub,
    alias: req.user.alias,
    amount: price,
    createdAt: new Date(),
  };
  const r = await items.updateOne(
    {
      _id: id(req.params.id),
      seller: { $ne: req.user.sub },
      status: "available",
      "offers.buyer": { $ne: req.user.sub },
      "offers.49": { $exists: false },
    },
    { $push: { offers: offer } },
  );
  if (!r.modifiedCount)
    fail(
      409,
      "Listing unavailable, offer already sent, or offer limit reached",
    );
  res.status(201).json(offer);
});
app.post("/api/items/:id/accept/:offer", auth, async (req, res) => {
  const oid = z
    .string()
    .regex(/^[a-f\d]{24}$/)
    .parse(req.params.offer);
  const item = await items.findOne({
    _id: id(req.params.id),
    seller: req.user.sub,
  });
  const offer = item?.offers.find((x) => x.id === oid);
  if (!offer) fail(404, "Offer not found");
  const r = await items.updateOne(
    { _id: item._id, seller: req.user.sub, status: "available" },
    {
      $set: {
        status: "sold",
        buyer: offer.buyer,
        acceptedOffer: oid,
        soldPrice: offer.amount,
        soldAt: new Date(),
      },
    },
  );
  if (!r.modifiedCount) fail(409, "This item has already been sold");
  res.json({ status: "sold" });
});
await start(async () => {
  await items.createIndex({ seller: 1 });
  await items.createIndex({ "offers.buyer": 1 });
});
