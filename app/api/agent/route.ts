import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Arkanoid Breakout Orchestrator',
    status: 'active',
    version: '1.0.0',
    chain: 'Base Network'
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
    return NextResponse.json({
      status: 'success',
      agent: 'Arkanoid Breakout Orchestrator',
      received: body
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
