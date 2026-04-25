import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const BASE_API_KEY = process.env.BASE_NOTIFICATIONS_API_KEY || "bdev_ulykmTUhLl316G13SBR2o8Z3sYwFVdGQCFNM6Dpy0EI";
const APP_URL = "https://ais-dev-3sklzmrcmud7wmnlgrwt3s-564665804356.europe-west2.run.app";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending notification
  app.post("/api/notify", async (req, res) => {
    try {
      const { wallet_address, title, message } = req.body;
      const originUrl = req.headers.origin || APP_URL;

      if (!wallet_address) {
        return res.status(400).json({ error: "wallet_address is required" });
      }

      const response = await fetch("https://dashboard.base.org/api/v1/notifications/send", {
        method: "POST",
        headers: {
          "x-api-key": BASE_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          app_url: originUrl,
          wallet_addresses: [wallet_address],
          title: title || "Neon Breaker",
          message: message || "You have a new notification! 🏆",
          target_path: "/"
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
