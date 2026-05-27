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
      protocol: "MCP",
      version: "1.0.0",
      name: "Arkanoid Breakout MCP Server",
      status: "active",
      description: "Active MCP Endpoint for Arkanoid Breakout Orchestrator Agent",
      timestamp: new Date().toISOString(),
      mcpTools: [
        {
          name: "play_game",
          description: "Play a round in the current Arkanoid/Breakout game"
        },
        {
          name: "switch_mode",
          description: "Switch between different game modes"
        },
        {
          name: "claim_reward",
          description: "Claim daily or level completion rewards"
        },
        {
          name: "optimize_strategy",
          description: "Optimize paddle movement and brick breaking strategy"
        },
        {
          name: "get_status",
          description: "Get current game status, score and level information"
        }
      ],
      capabilities: [
        "arkanoid-breakout",
        "brick-breaking",
        "power-up-management",
        "strategic-paddle-control",
        "high-score-optimization"
      ]
    });
  });

  app.post("/api/mcp", (req, res) => {
    try {
      const body = req.body;

      const mcpTools = [
        {
          name: "play_game",
          description: "Play a round in the current Arkanoid/Breakout game",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "switch_mode",
          description: "Switch between different game modes",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "claim_reward",
          description: "Claim daily or level completion rewards",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "optimize_strategy",
          description: "Optimize paddle movement and brick breaking strategy",
          inputSchema: { type: "object", properties: {} }
        },
        {
          name: "get_status",
          description: "Get current game status, score and level information",
          inputSchema: { type: "object", properties: {} }
        }
      ];

      if (body?.method === "tools/list") {
        return res.json({
          jsonrpc: "2.0",
          id: body.id,
          result: { tools: mcpTools }
        });
      }

      if (body?.method === "tools/call") {
        return res.json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            content: [{ type: "text", text: `Executed ${body.params?.name}` }]
          }
        });
      }

      if (body?.method === "prompts/list") {
        return res.json({
          jsonrpc: "2.0",
          id: body.id,
          result: { prompts: [] }
        });
      }

      if (body?.method === "resources/list") {
        return res.json({
          jsonrpc: "2.0",
          id: body.id,
          result: { resources: [] }
        });
      }

      return res.json({
        status: "success",
        agent: "Arkanoid Breakout Orchestrator",
        message: "Command received and processed successfully",
        receivedAt: new Date().toISOString()
      });
    } catch (error) {
      return res.status(400).json({ 
        status: "error", 
        message: "Invalid MCP request" 
      });
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
      "name": "Arkanoid Breakout Orchestrator",
      "description": "Arkanoid Breakout Orchestrator is an ERC-8004 compliant AI Agent on Base Network specialized in Arkanoid and Breakout style games, brick breaking mechanics, power-up management, strategic paddle control, high-score optimization and multi-level gaming orchestration.",
      "version": "1.0.0",
      "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      "image": "https://arkanoidbreakout.vercel.app/logo.png",
      "owner": "0xe157F1F5e12adB38Ba013683E9Ce24efe21e5bA6",
      "agentWallet": "0xe157F1F5e12adB38Ba013683E9Ce24efe21e5bA6",
      "active": true,
      "skills": [
        {
          "id": "arkanoid-gameplay",
          "name": "Arkanoid Gameplay",
          "description": "Manage Arkanoid and Breakout style puzzle mechanics"
        },
        {
          "id": "brick-breaking",
          "name": "Brick Breaking",
          "description": "Optimize brick destruction and power-up collection"
        },
        {
          "id": "high-score-optimization",
          "name": "High Score Optimization",
          "description": "Maximize scoring through strategic paddle control"
        }
      ],
      "services": [
        {
          "name": "A2A",
          "version": "1.0.0",
          "endpoint": "https://arkanoidbreakout.vercel.app/.well-known/agent-card.json"
        },
        {
          "name": "MCP",
          "version": "1.0.0",
          "endpoint": "https://arkanoidbreakout.vercel.app/api/mcp"
        },
        {
          "name": "API",
          "version": "1.0.0",
          "endpoint": "https://arkanoidbreakout.vercel.app/api/agent"
        }
      ],
      "capabilities": [
        "arkanoid-breakout",
        "brick-breaking",
        "power-up-management",
        "strategic-paddle-control",
        "high-score-optimization",
        "multi-level-management"
      ],
      "supportedChains": ["eip155:8453"],
      "x402Support": false,
      "registrations": [
        {
          "agentRegistry": "eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
        }
      ],
      "supportedTrust": ["reputation"]
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
