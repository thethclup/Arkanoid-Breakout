export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'Arkanoid Breakout Orchestrator',
      status: 'active',
      version: '1.0.0',
      chain: 'Base Network'
    });
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      return res.status(200).json({
        status: 'success',
        agent: 'Arkanoid Breakout Orchestrator',
        received: body
      });
    } catch (error) {
      return res.status(400).json({ error: 'Invalid request' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
