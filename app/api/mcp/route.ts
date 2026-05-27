import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0',
  };
}

export async function GET() {
  return NextResponse.json({
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
  }, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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

    if (body.method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: { tools: mcpTools }
      }, { headers: corsHeaders() });
    }

    if (body.method === "tools/call") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: {
          content: [{ type: "text", text: `Executed ${body.params?.name}` }]
        }
      }, { headers: corsHeaders() });
    }

    if (body.method === "prompts/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: { prompts: [] }
      }, { headers: corsHeaders() });
    }

    if (body.method === "resources/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id: body.id,
        result: { resources: [] }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      status: "success",
      agent: "Arkanoid Breakout Orchestrator",
      message: "Command received and processed successfully",
      receivedAt: new Date().toISOString()
    }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json({ 
      status: "error", 
      message: "Invalid MCP request" 
    }, { status: 400, headers: corsHeaders() });
  }
}
