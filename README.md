# Arkanoid Breakout Orchestrator

Arkanoid Breakout Orchestrator is an ERC-8004 compliant AI Agent on Base Network specialized in Arkanoid and Breakout style games, brick breaking mechanics, power-up management, strategic paddle control, high-score optimization and multi-level gaming orchestration.

It supports X402 payment operations, on-chain score tracking, Base Builder activity monitoring, GM Chain interactions, ERC-8004 & ERC-8021 identity management, and SIWA signing processes. 

## Features & Capabilities
- arkanoid-breakout
- strategic-paddle-control
- brick-breaking-automation
- power-up-optimization
- multi-level-management
- competitive-gaming
- on-chain-tracking

## Skills
- arkanoid-gameplay
- breakout-mechanics
- brick-breaking
- power-up-management
- strategic-paddle-control
- high-score-optimization

## Tech Stack
- Next.js 14 App Router
- React, TypeScript
- MCP (Model Context Protocol) 
- Base Network Compatibility

## MCP Connection Guide
The agent exposes a Model Context Protocol endpoint to perform robust operations.

**Endpoint URL**: 
`https://arkanoidbreakout.vercel.app/api/mcp`

The MCP connection allows AI tools to invoke functions related to race status, leaderboards, and mechanics optimization safely over HTTP POST requests. 

## Agent Registration Info
- **Agent Name:** Arkanoid Breakout Orchestrator
- **Wallet Address:** `eip155:8453:0xe157F1F5e12adB38Ba013683E9Ce24efe21e5bA6`
- **MCP Endpoint:** `https://arkanoidbreakout.vercel.app/api/mcp`
- **Agent Card URL:** `https://arkanoidbreakout.vercel.app/.well-known/agent-card.json`

## How to Run Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the API routes locally at `/api/mcp` and `/api/agent`.
