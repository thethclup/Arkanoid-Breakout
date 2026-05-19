import { NextResponse } from 'next/server';

const TOOLS = [
  { name: 'get_race_status', description: 'Get current race status' },
  { name: 'start_race', description: 'Start a new race' },
  { name: 'get_leaderboard', description: 'Get race leaderboard' },
  { name: 'optimize_speed', description: 'Optimize for speed' },
  { name: 'get_track_info', description: 'Get track information' }
];

export async function GET() {
  return NextResponse.json({
    name: 'Arkanoid Breakout Orchestrator',
    description: 'ERC-8004 compliant AI agent specialized in Arkanoid gameplay.',
    version: '1.0.0',
    tools: TOOLS
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Process tool calls
    if (body.method === 'tools/call') {
      // Keep existing tool call logic
      return NextResponse.json({ result: `Executed ${body.params.name}` }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (body.method === 'tools/list') {
      return NextResponse.json({ tools: TOOLS }, {
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return NextResponse.json({ status: 'success', received: body }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
