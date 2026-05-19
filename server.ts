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

  // Agent API Routes
  const TOOLS = [
    { name: 'get_race_status', description: 'Get current race status' },
    { name: 'start_race', description: 'Start a new race' },
    { name: 'get_leaderboard', description: 'Get race leaderboard' },
    { name: 'optimize_speed', description: 'Optimize for speed' },
    { name: 'get_track_info', description: 'Get track information' }
  ];

  app.get("/api/mcp", (req, res) => {
    res.json({
      name: 'Arkanoid Breakout Orchestrator',
      description: 'ERC-8004 compliant AI agent specialized in Arkanoid gameplay.',
      version: '1.0.0',
      tools: TOOLS
    });
  });

  app.post("/api/mcp", (req, res) => {
    try {
      const body = req.body;
      
      // Process tool calls
      if (body?.method === 'tools/call') {
        return res.json({ result: `Executed ${body.params?.name}` });
      }
      
      if (body?.method === 'tools/list') {
        return res.json({ tools: TOOLS });
      }
      
      return res.json({ status: 'success', received: body });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  });

  app.get("/api/agent", (req, res) => {
    res.json({
      name: 'Arkanoid Breakout Orchestrator',
      status: 'active',
      version: '1.0.0',
      chain: 'Base Network'
    });
  });

  app.post("/api/agent", (req, res) => {
    try {
      const body = req.body;
      return res.json({
        status: 'success',
        agent: 'Arkanoid Breakout Orchestrator',
        received: body
      });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  });

  app.get("/.well-known/agent-card.json", (req, res) => {
    res.json({
      "agentName": "Arkanoid Breakout Orchestrator",
      "description": "Arkanoid Breakout Orchestrator is an ERC-8004 compliant AI Agent on Base Network specialized in Arkanoid and Breakout style games, brick breaking mechanics, power-up management, strategic paddle control, high-score optimization and multi-level gaming orchestration.\n\nIt supports X402 payment operations, on-chain score tracking, Base Builder activity monitoring, GM Chain interactions, ERC-8004 & ERC-8021 identity management, and SIWA signing processes. The agent provides intelligent gameplay automation, optimal brick destruction strategies, power-up automation, and seamless multi-level game management.",
      "walletAddress": "eip155:8453:0xe157F1F5e12adB38Ba013683E9Ce24efe21e5bA6",
      "a2aEndpoint": "https://arkanoidbreakout.vercel.app/.well-known/agent-card.json",
      "mcpEndpoint": "https://arkanoidbreakout.vercel.app/api/mcp",
      "skills": [
        "arkanoid-gameplay",
        "breakout-mechanics",
        "brick-breaking",
        "power-up-management",
        "strategic-paddle-control",
        "high-score-optimization"
      ],
      "capabilities": [
        "arkanoid-breakout",
        "strategic-paddle-control",
        "brick-breaking-automation",
        "power-up-optimization",
        "multi-level-management",
        "competitive-gaming",
        "on-chain-tracking"
      ]
    });
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
