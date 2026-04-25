/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, PowerUpType } from './game/types';
import { Volume2, VolumeX, Pause, Play, Trophy, Zap, Shield, Star } from 'lucide-react';
import { audio } from './game/audio';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import { ConnectWallet } from './components/ConnectWallet';
import { SaveScoreOnchain } from './components/SaveScoreOnchain';
import { GMChain } from './components/GMChain';

const queryClient = new QueryClient();

const POWER_UP_NAMES: Record<string, string> = {
  [PowerUpType.MULTI_BALL]: 'Multi-Ball',
  [PowerUpType.LASER]: 'Laser',
  [PowerUpType.EXPAND]: 'Expand',
  [PowerUpType.SHRINK]: 'Shrink',
  [PowerUpType.CATCH]: 'Catch',
  [PowerUpType.SLOW]: 'Slow',
  [PowerUpType.SPEED]: 'Speed',
  [PowerUpType.BOMB]: 'Bomb',
  [PowerUpType.SHIELD]: 'Shield',
  [PowerUpType.EXTRA_LIFE]: '1-UP',
};

const POWER_UP_ICONS: Record<string, string> = {
  [PowerUpType.MULTI_BALL]: '⚫',
  [PowerUpType.LASER]: '🔴',
  [PowerUpType.EXPAND]: '⬛',
  [PowerUpType.SHRINK]: '▪',
  [PowerUpType.CATCH]: '🟡',
  [PowerUpType.SLOW]: '🔵',
  [PowerUpType.SPEED]: '🟠',
  [PowerUpType.BOMB]: '💣',
  [PowerUpType.SHIELD]: '🛡',
  [PowerUpType.EXTRA_LIFE]: '❤️',
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [muted, setMuted] = useState(false);
  const [highScores, setHighScores] = useState<{ name: string; score: number }[]>([]);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      engineRef.current.onStateChange = setGameState;
      engineRef.current.start();
      const scores = JSON.parse(localStorage.getItem('arkanoid_highscores') || '[]');
      const mapped = scores.map((s: any) => (typeof s === 'number' ? { name: 'Anonymous', score: s } : s));
      setHighScores(mapped);
    }
  }, []);

  useEffect(() => {
    if (gameState?.status === 'gameOver') {
      const scores = JSON.parse(localStorage.getItem('arkanoid_highscores') || '[]');
      const mapped = scores.map((s: any) => (typeof s === 'number' ? { name: 'Anonymous', score: s } : s));
      setHighScores(mapped);
      // Glitch effect on death
      setGlitch(true);
      setTimeout(() => setGlitch(false), 600);
    }
  }, [gameState?.status]);

  const toggleMute = () => {
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted) audio.init();
  };

  const togglePause = () => {
    if (engineRef.current) {
      if (engineRef.current.state.status === 'playing') engineRef.current.state.status = 'paused';
      else if (engineRef.current.state.status === 'paused') engineRef.current.state.status = 'playing';
      engineRef.current.notifyState();
    }
  };

  useEffect(() => {
    const initAudio = () => { audio.init(); window.removeEventListener('click', initAudio); window.removeEventListener('keydown', initAudio); };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => { window.removeEventListener('click', initAudio); window.removeEventListener('keydown', initAudio); };
  }, []);

  const score = gameState?.score || 0;
  const lives = gameState?.lives || 0;
  const level = gameState?.level || 1;
  const status = gameState?.status;

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className={`root-shell ${glitch ? 'glitch-active' : ''}`}>

          {/* ── Scanline overlay ── */}
          <div className="scanlines" aria-hidden />

          {/* ── Header bar ── */}
          <header className="top-bar">
            <div className="logo-group">
              <div className="logo-text">NEON<span className="logo-accent">BREAKER</span></div>
              <div className="logo-sub">BASE MAINNET ARCADE</div>
            </div>

            <div className="stat-row">
              <StatCard label="SCORE" value={score.toLocaleString()} color="#ffd700" icon={<Star size={12} />} />
              <StatCard label="LEVEL" value={String(level)} color="#00ff88" icon={<Zap size={12} />} />
              <StatCard label="LIVES" value={'♥'.repeat(Math.max(0, lives))} color="#ff4466" icon={<Shield size={12} />} />
            </div>

            <div className="controls-group">
              <ConnectWallet onNameChange={(name) => { if (engineRef.current) engineRef.current.playerName = name; }} />
              <div className="icon-btns">
                <button onClick={togglePause} className="icon-btn" title="Pause / Play">
                  {status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <button onClick={toggleMute} className="icon-btn" title="Toggle sound">
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
            </div>
          </header>

          {/* ── Active power-ups strip ── */}
          {(gameState?.activePowerUps?.length ?? 0) > 0 && (
            <div className="powerup-strip">
              {gameState!.activePowerUps.map((p, i) => (
                <div key={i} className="powerup-pill">
                  <span>{POWER_UP_ICONS[p.type]}</span>
                  <span className="powerup-name">{POWER_UP_NAMES[p.type]}</span>
                  <span className="powerup-timer">{Math.ceil(p.timer / 1000)}s</span>
                  <div className="powerup-bar" style={{ width: `${(p.timer / 15000) * 100}%` }} />
                </div>
              ))}
            </div>
          )}

          {/* ── Boss HP bar ── */}
          {gameState?.bossMaxHp && gameState.bossHp !== undefined && status === 'playing' && (
            <div className="boss-bar-wrap">
              <span className="boss-label">⚡ BOSS</span>
              <div className="boss-bar-track">
                <div
                  className="boss-bar-fill"
                  style={{ width: `${(gameState.bossHp / gameState.bossMaxHp) * 100}%` }}
                />
              </div>
              <span className="boss-hp">{gameState.bossHp}/{gameState.bossMaxHp}</span>
            </div>
          )}

          {/* ── Main stage ── */}
          <main className="stage">
            <div className="canvas-frame">
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="game-canvas"
              />
              {/* Corner decorations */}
              <div className="corner corner-tl" />
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="corner corner-br" />

              {/* Game-over overlay CTA */}
              {status === 'gameOver' && (
                <div className="overlay-cta">
                  <SaveScoreOnchain score={score} />
                </div>
              )}
            </div>

            {/* ── Side panel ── */}
            <aside className="side-panel">
              {/* GM Chain */}
              <GMChain />

              {/* High Scores */}
              <div className="panel-card">
                <div className="panel-title"><Trophy size={13} /> HIGH SCORES</div>
                <ol className="score-list">
                  {highScores.length > 0
                    ? highScores.slice(0, 5).map((s, i) => (
                        <li key={i} className="score-row">
                          <span className="score-rank">#{i + 1}</span>
                          <span className="score-player">{s.name}</span>
                          <span className="score-val">{s.score.toLocaleString()}</span>
                        </li>
                      ))
                    : <li className="score-empty">No scores yet</li>}
                </ol>
              </div>

              {/* Controls */}
              <div className="panel-card">
                <div className="panel-title">CONTROLS</div>
                <div className="control-grid">
                  <span className="ctrl-key">Mouse / ◄►</span><span className="ctrl-desc">Move paddle</span>
                  <span className="ctrl-key">Click / Space</span><span className="ctrl-desc">Launch / Fire</span>
                  <span className="ctrl-key">P</span><span className="ctrl-desc">Pause</span>
                </div>
              </div>
            </aside>
          </main>

          {/* ── Footer ── */}
          <footer className="bottom-bar">
            <span>NEON BREAKER · POWERED BY BASE MAINNET</span>
            <span>ERC-8021 ON-CHAIN SCORES</span>
          </footer>

          {/* ── Global styles ── */}
          <style>{`
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');

            :root {
              --neon-cyan: #00ffff;
              --neon-green: #00ff88;
              --neon-pink: #ff0088;
              --neon-gold: #ffd700;
              --neon-blue: #0088ff;
              --bg-deep: #020209;
              --bg-panel: rgba(4,8,24,0.92);
              --border: rgba(0,200,255,0.18);
              --text-dim: rgba(180,200,255,0.5);
              --font-mono: 'Share Tech Mono', 'Courier New', monospace;
              --font-display: 'Orbitron', 'Courier New', monospace;
            }

            body { background: var(--bg-deep); color: #fff; }

            .root-shell {
              min-height: 100vh;
              background: var(--bg-deep);
              display: flex;
              flex-direction: column;
              align-items: center;
              font-family: var(--font-mono);
              position: relative;
              overflow-x: hidden;
              padding: 0 16px 16px;
              gap: 10px;
            }

            /* Animated grid background */
            .root-shell::before {
              content: '';
              position: fixed;
              inset: 0;
              background-image:
                linear-gradient(rgba(0,200,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,200,255,0.03) 1px, transparent 1px);
              background-size: 40px 40px;
              pointer-events: none;
              z-index: 0;
            }

            /* Vignette */
            .root-shell::after {
              content: '';
              position: fixed;
              inset: 0;
              background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,8,0.7) 100%);
              pointer-events: none;
              z-index: 0;
            }

            .scanlines {
              position: fixed;
              inset: 0;
              background: repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 3px,
                rgba(0,0,0,0.07) 3px,
                rgba(0,0,0,0.07) 4px
              );
              pointer-events: none;
              z-index: 100;
            }

            /* Glitch on game over */
            .glitch-active { animation: glitch-shake 0.15s steps(2) 4; }
            @keyframes glitch-shake {
              0%   { transform: translate(3px, 0) skewX(-2deg); filter: hue-rotate(90deg); }
              25%  { transform: translate(-3px, 2px) skewX(2deg); }
              50%  { transform: translate(2px, -2px); filter: hue-rotate(0deg); }
              100% { transform: none; }
            }

            /* ── Top bar ── */
            .top-bar {
              width: 100%;
              max-width: 1060px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 12px;
              padding: 14px 0 8px;
              position: relative;
              z-index: 10;
              border-bottom: 1px solid var(--border);
            }

            .logo-group { display: flex; flex-direction: column; gap: 2px; }
            .logo-text {
              font-family: var(--font-display);
              font-size: 26px;
              font-weight: 900;
              letter-spacing: 4px;
              color: #fff;
              text-shadow: 0 0 12px var(--neon-cyan), 0 0 30px rgba(0,255,255,0.3);
              line-height: 1;
            }
            .logo-accent { color: var(--neon-cyan); }
            .logo-sub {
              font-size: 9px;
              letter-spacing: 3px;
              color: var(--text-dim);
              text-transform: uppercase;
            }

            .stat-row { display: flex; gap: 10px; align-items: center; }

            .stat-card {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 6px 14px;
              background: rgba(0,0,0,0.4);
              border: 1px solid var(--border);
              border-radius: 8px;
              min-width: 72px;
              gap: 2px;
            }
            .stat-label {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 8px;
              letter-spacing: 2px;
              color: var(--text-dim);
              text-transform: uppercase;
            }
            .stat-value {
              font-family: var(--font-display);
              font-size: 16px;
              font-weight: 700;
              letter-spacing: 1px;
            }

            .controls-group { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }

            .icon-btns { display: flex; gap: 6px; }
            .icon-btn {
              width: 34px;
              height: 34px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(0,0,0,0.5);
              border: 1px solid var(--border);
              border-radius: 8px;
              color: rgba(200,230,255,0.7);
              cursor: pointer;
              transition: all 0.2s;
            }
            .icon-btn:hover {
              border-color: var(--neon-cyan);
              color: var(--neon-cyan);
              box-shadow: 0 0 10px rgba(0,255,255,0.3);
            }

            /* ── Power-up strip ── */
            .powerup-strip {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              width: 100%;
              max-width: 1060px;
              position: relative;
              z-index: 10;
            }
            .powerup-pill {
              position: relative;
              display: flex;
              align-items: center;
              gap: 5px;
              padding: 4px 10px;
              background: rgba(0,0,0,0.6);
              border: 1px solid rgba(255,255,255,0.15);
              border-radius: 20px;
              font-size: 11px;
              overflow: hidden;
            }
            .powerup-name { color: #fff; font-weight: 600; }
            .powerup-timer { color: var(--neon-gold); font-size: 10px; }
            .powerup-bar {
              position: absolute;
              bottom: 0;
              left: 0;
              height: 2px;
              background: var(--neon-cyan);
              transition: width 0.5s linear;
              box-shadow: 0 0 6px var(--neon-cyan);
            }

            /* ── Boss HP ── */
            .boss-bar-wrap {
              display: flex;
              align-items: center;
              gap: 10px;
              width: 100%;
              max-width: 1060px;
              position: relative;
              z-index: 10;
            }
            .boss-label { font-size: 11px; color: #ff4444; letter-spacing: 2px; font-weight: 700; white-space: nowrap; }
            .boss-bar-track { flex: 1; height: 8px; background: rgba(255,0,0,0.15); border: 1px solid rgba(255,0,0,0.3); border-radius: 4px; overflow: hidden; }
            .boss-bar-fill { height: 100%; background: linear-gradient(90deg, #ff0000, #ff6600); border-radius: 4px; transition: width 0.3s; box-shadow: 0 0 8px rgba(255,0,0,0.6); }
            .boss-hp { font-size: 11px; color: #ff8888; white-space: nowrap; }

            /* ── Stage ── */
            .stage {
              display: flex;
              gap: 16px;
              align-items: flex-start;
              width: 100%;
              max-width: 1060px;
              position: relative;
              z-index: 10;
            }

            .canvas-frame {
              position: relative;
              flex-shrink: 0;
              width: 100%;
              max-width: 800px;
            }

            .game-canvas {
              display: block;
              width: 100%;
              height: auto;
              border-radius: 6px;
              border: 1px solid rgba(0,200,255,0.25);
              box-shadow:
                0 0 0 1px rgba(0,0,0,0.8),
                0 0 40px rgba(0,180,255,0.12),
                inset 0 0 60px rgba(0,0,0,0.3);
              cursor: none;
              touch-action: none;
            }

            /* Corner decorations */
            .corner {
              position: absolute;
              width: 16px;
              height: 16px;
              border-color: var(--neon-cyan);
              border-style: solid;
              opacity: 0.7;
            }
            .corner-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
            .corner-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
            .corner-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
            .corner-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

            .overlay-cta {
              position: absolute;
              bottom: 80px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 20;
            }

            /* ── Side panel ── */
            .side-panel {
              display: flex;
              flex-direction: column;
              gap: 12px;
              width: 240px;
              flex-shrink: 0;
            }

            .panel-card {
              background: var(--bg-panel);
              border: 1px solid var(--border);
              border-radius: 10px;
              padding: 14px;
              display: flex;
              flex-direction: column;
              gap: 10px;
            }

            .panel-title {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 10px;
              letter-spacing: 3px;
              color: var(--neon-cyan);
              text-transform: uppercase;
              font-weight: 700;
              border-bottom: 1px solid var(--border);
              padding-bottom: 8px;
            }

            .score-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
            .score-row { display: flex; align-items: center; gap: 6px; font-size: 12px; }
            .score-rank { width: 22px; color: var(--text-dim); font-size: 10px; }
            .score-player { flex: 1; color: var(--neon-green); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }
            .score-val { color: var(--neon-gold); font-weight: 700; font-family: var(--font-display); font-size: 11px; }
            .score-empty { font-size: 11px; color: var(--text-dim); }

            .control-grid {
              display: grid;
              grid-template-columns: auto 1fr;
              gap: 4px 10px;
              align-items: center;
            }
            .ctrl-key {
              font-size: 10px;
              padding: 2px 6px;
              background: rgba(255,255,255,0.07);
              border: 1px solid rgba(255,255,255,0.12);
              border-radius: 4px;
              color: var(--neon-cyan);
              white-space: nowrap;
            }
            .ctrl-desc { font-size: 10px; color: var(--text-dim); }

            /* ── Footer ── */
            .bottom-bar {
              width: 100%;
              max-width: 1060px;
              display: flex;
              justify-content: space-between;
              font-size: 9px;
              letter-spacing: 2px;
              color: var(--text-dim);
              border-top: 1px solid var(--border);
              padding-top: 10px;
              position: relative;
              z-index: 10;
            }

            /* ── Responsive ── */
            @media (max-width: 880px) {
              .stage { flex-direction: column; align-items: center; }
              .side-panel { width: 100%; max-width: 800px; flex-direction: column; gap: 16px; }
              .panel-card { flex: unset; width: 100%; }
            }

            @media (max-width: 600px) {
              .top-bar { flex-direction: column; align-items: stretch; gap: 10px; }
              .logo-group { align-items: center; text-align: center; }
              .logo-text { font-size: 22px; }
              .stat-row { justify-content: center; flex-wrap: wrap; }
              .controls-group { justify-content: center; }
              .stat-card { min-width: 60px; padding: 4px 10px; }
              .stat-value { font-size: 14px; }
              .overlay-cta { width: 90%; text-align: center; }
              .bottom-bar { flex-direction: column; text-align: center; gap: 4px; }
            }
          `}</style>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

/* ── Stat card sub-component ── */
function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{icon}{label}</span>
      <span className="stat-value" style={{ color }}>{value}</span>
    </div>
  );
}
