/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, PowerUpType } from './game/types';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { audio } from './game/audio';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import { ConnectWallet } from './components/ConnectWallet';

const queryClient = new QueryClient();

const POWER_UP_NAMES: Record<string, string> = {
  [PowerUpType.MULTI_BALL]: 'Multi-Ball',
  [PowerUpType.LASER]: 'Laser',
  [PowerUpType.EXPAND]: 'Expand',
  [PowerUpType.SHRINK]: 'Shrink',
  [PowerUpType.CATCH]: 'Catch',
  [PowerUpType.SLOW]: 'Slow Ball',
  [PowerUpType.SPEED]: 'Fast Ball',
  [PowerUpType.BOMB]: 'Bomb',
  [PowerUpType.SHIELD]: 'Shield',
  [PowerUpType.EXTRA_LIFE]: '1-Up'
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [muted, setMuted] = useState(false);
  const [highScores, setHighScores] = useState<{name: string, score: number}[]>([]);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
      engineRef.current.onStateChange = setGameState;
      engineRef.current.start();
      
      const scores = JSON.parse(localStorage.getItem('arkanoid_highscores') || '[]');
      // Map old number scores to objects if any exist
      const mappedScores = scores.map((s: any) => typeof s === 'number' ? { name: 'Anonymous', score: s } : s);
      setHighScores(mappedScores);
    }
  }, []);

  useEffect(() => {
    if (gameState?.status === 'gameOver') {
      const scores = JSON.parse(localStorage.getItem('arkanoid_highscores') || '[]');
      const mappedScores = scores.map((s: any) => typeof s === 'number' ? { name: 'Anonymous', score: s } : s);
      setHighScores(mappedScores);
    }
  }, [gameState?.status]);

  const toggleMute = () => {
    audio.muted = !audio.muted;
    setMuted(audio.muted);
    if (!audio.muted) audio.init();
  };

  const togglePause = () => {
    if (engineRef.current) {
      if (engineRef.current.state.status === 'playing') {
        engineRef.current.state.status = 'paused';
      } else if (engineRef.current.state.status === 'paused') {
        engineRef.current.state.status = 'playing';
      }
      engineRef.current.notifyState();
    }
  };

  useEffect(() => {
    const initAudio = () => {
      audio.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center font-mono text-white select-none">
          <div className="w-full max-w-[800px] mb-4 flex justify-between items-end px-4">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 tracking-widest mb-1" style={{ textShadow: '0 0 10px #00ffff' }}>NEON BREAKER</h1>
              <div className="flex gap-6 text-lg">
                <p>SCORE: <span className="text-yellow-400">{gameState?.score || 0}</span></p>
                <p>LIVES: <span className="text-red-400">{'♥'.repeat(gameState?.lives || 0)}</span></p>
                <p>LEVEL: <span className="text-green-400">{gameState?.level || 1}</span></p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-4 items-center">
                <ConnectWallet onNameChange={(name) => {
                  if (engineRef.current) engineRef.current.playerName = name;
                }} />
                <div className="flex gap-2">
                  <button onClick={togglePause} className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                    {gameState?.status === 'paused' ? <Play size={20} /> : <Pause size={20} />}
                  </button>
                  <button onClick={toggleMute} className="p-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors">
                    {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
              
              <div className="h-6 flex gap-2">
                {gameState?.activePowerUps.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-gray-800 rounded border border-gray-600">
                    {POWER_UP_NAMES[p.type]} ({Math.ceil(p.timer / 1000)}s)
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={800} 
              height={600} 
              className="bg-[#0a0a1a] shadow-[0_0_30px_rgba(0,255,255,0.2)] rounded-lg border border-gray-800 cursor-none"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {gameState?.bossMaxHp && gameState.bossHp !== undefined && gameState.status === 'playing' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${(gameState.bossHp / gameState.bossMaxHp) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-12 text-gray-400 text-sm">
            <div>
              <h3 className="text-white mb-2 uppercase tracking-wider">Controls</h3>
              <ul className="space-y-1">
                <li>Mouse / ◄ ► : Move Paddle</li>
                <li>Click / Space : Launch / Fire / Release</li>
                <li>P : Pause</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white mb-2 uppercase tracking-wider">High Scores</h3>
              <ol className="list-decimal list-inside space-y-1">
                {highScores.length > 0 ? highScores.map((scoreObj, i) => (
                  <li key={i}>
                    <span className="text-green-400">{scoreObj.name}</span> - <span className="text-yellow-400">{scoreObj.score}</span>
                  </li>
                )) : <li>No scores yet</li>}
              </ol>
            </div>
          </div>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
