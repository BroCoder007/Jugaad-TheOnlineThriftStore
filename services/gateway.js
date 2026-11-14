import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "node:path";
const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "https:", "data:"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "script-src": ["'self'"],
      },
    },
  }),
);
app.get("/healthz", (req, res) => res.json({ status: "ok" }));
for (const [route, target] of [
  ["/api/auth", process.env.IDENTITY_URL],
  ["/api/messages", process.env.MESSAGING_URL],
  ["/api", process.env.MARKETPLACE_URL],
])
  app.use(
    createProxyMiddleware({
      target,
      pathFilter: (p) => p.startsWith(route),
      changeOrigin: true,
      proxyTimeout: 15000,
      timeout: 20000,
      on: {
        error: (err, req, res) => {
          if (!res.headersSent)
            res.writeHead(503, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "Service is waking up. Please try again.",
            }),
          );
        },
      },
    }),
  );
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Unknown endpoint" }),
);
app.use(express.static("dist/frontend/browser"));
app.get("/{*path}", (req, res) =>
  res.sendFile(path.resolve("dist/frontend/browser/index.html")),
);
app.listen(Number(process.env.PORT || 8080), "0.0.0.0");
