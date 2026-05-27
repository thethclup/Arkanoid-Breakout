import { NextResponse } from 'next/server';

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
    name: 'Arkanoid Breakout Orchestrator',
    status: 'active',
    version: '1.0.0',
    chain: 'Base Network'
  }, { headers: corsHeaders() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      status: 'success',
      agent: 'Arkanoid Breakout Orchestrator',
      received: body
    }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders() });
  }
}
