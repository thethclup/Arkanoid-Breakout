const TOOLS = [
  { name: 'get_race_status', description: 'Get current race status' },
  { name: 'start_race', description: 'Start a new race' },
  { name: 'get_leaderboard', description: 'Get race leaderboard' },
  { name: 'optimize_speed', description: 'Optimize for speed' },
  { name: 'get_track_info', description: 'Get track information' }
];

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
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
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      const newTools = [
        {
          name: "get_wallet_balance",
          description: "Get ETH or ERC-20 token balance from the agent wallet on Base",
          inputSchema: {
            type: "object",
            properties: {
              asset: { type: "string", description: "Token symbol: ETH, USDC, WETH, etc." },
              chain: { type: "string", description: "Chain name: base or base-sepolia", default: "base" }
            },
            required: ["asset"]
          }
        },
        {
          name: "send_token",
          description: "Send ETH or ERC-20 tokens to a wallet address or ENS/basename",
          inputSchema: {
            type: "object",
            properties: {
              recipient: { type: "string", description: "Recipient address or ENS/basename" },
              asset: { type: "string", description: "Token symbol: ETH, USDC, etc." },
              amount: { type: "string", description: "Amount to send as string" },
              chain: { type: "string", default: "base" }
            },
            required: ["recipient", "asset", "amount"]
          }
        },
        {
          name: "swap_tokens",
          description: "Swap one token for another on Base via Base MCP",
          inputSchema: {
            type: "object",
            properties: {
              fromAsset: { type: "string", description: "Source token symbol: ETH, USDC, etc." },
              toAsset: { type: "string", description: "Destination token symbol" },
              amount: { type: "string", description: "Amount of fromAsset to swap" },
              chain: { type: "string", default: "base" }
            },
            required: ["fromAsset", "toAsset", "amount"]
          }
        },
        {
          name: "pay_x402",
          description: "Pay for an x402-enabled API endpoint using USDC on Base",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "The x402 API endpoint URL" },
              maxAmount: { type: "string", description: "Maximum USDC amount willing to pay" },
              asset: { type: "string", default: "USDC" },
              chain: { type: "string", default: "base" }
            },
            required: ["url", "maxAmount"]
          }
        }
      ];

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
        },
        ...newTools
      ];

      // Process tool calls
      if (body?.method === 'tools/call') {
        const { name, arguments: args } = body.params || {};

        if (name === 'get_wallet_balance') {
          const scheme = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:3000';
          const fetchRes = await fetch(`${scheme}://${host}/api/base-mcp/balance?asset=${args?.asset}&chain=${args?.chain || 'base'}`);
          const json = await fetchRes.json();
          return res.status(200).json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify(json) }] }
          });
        }
        if (name === 'send_token') {
          const scheme = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:3000';
          const fetchRes = await fetch(`${scheme}://${host}/api/base-mcp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          const json = await fetchRes.json();
          return res.status(200).json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify(json) }] }
          });
        }
        if (name === 'swap_tokens') {
          const scheme = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:3000';
          const fetchRes = await fetch(`${scheme}://${host}/api/base-mcp/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          const json = await fetchRes.json();
          return res.status(200).json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify(json) }] }
          });
        }
        if (name === 'pay_x402') {
          const scheme = req.headers['x-forwarded-proto'] || 'http';
          const host = req.headers.host || 'localhost:3000';
          const fetchRes = await fetch(`${scheme}://${host}/api/base-mcp/x402`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
          });
          const json = await fetchRes.json();
          return res.status(200).json({
            jsonrpc: "2.0",
            id: body.id,
            result: { content: [{ type: "text", text: JSON.stringify(json) }] }
          });
        }

        return res.status(200).json({
          jsonrpc: "2.0",
          id: body.id,
          result: {
            content: [{ type: "text", text: `Executed ${body.params?.name}` }]
          }
        });
      }
      
      if (body?.method === 'tools/list') {
        return res.status(200).json({
          jsonrpc: "2.0",
          id: body.id,
          result: { tools: mcpTools }
        });
      }

      if (body?.method === "prompts/list") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id: body.id,
          result: { prompts: [] }
        });
      }

      if (body?.method === "resources/list") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id: body.id,
          result: { resources: [] }
        });
      }

      return res.status(200).json({
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
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
