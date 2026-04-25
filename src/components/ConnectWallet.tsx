/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { base } from 'wagmi/chains';

export function ConnectWallet({ onNameChange }: { onNameChange: (name: string) => void }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: basename } = useEnsName({
    address,
    chainId: base.id,
  });

  useEffect(() => {
    if (isConnected && address) {
      onNameChange(basename || `${address.slice(0, 6)}…${address.slice(-4)}`);
    } else {
      onNameChange('Anonymous');
    }
  }, [isConnected, address, basename, onNameChange]);

  if (isConnected) {
    const displayName = basename || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected');
    return (
      <div className="wallet-connected">
        <span className="wallet-indicator" />
        <span className="wallet-name">{displayName}</span>
        <button onClick={() => disconnect()} className="wallet-disconnect">✕</button>
        <style>{`
          .wallet-connected { display:flex; align-items:center; gap:8px; padding:6px 14px; background:rgba(0,255,136,0.08); border:1px solid rgba(0,255,136,0.3); border-radius:20px; font-family:'Courier New',monospace; }
          .wallet-indicator { width:7px; height:7px; border-radius:50%; background:#00ff88; box-shadow:0 0 8px #00ff88; animation:pulse-dot 2s infinite; }
          @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
          .wallet-name { font-size:12px; color:#00ff88; font-weight:700; letter-spacing:0.5px; }
          .wallet-disconnect { background:none; border:none; color:rgba(255,255,255,0.3); font-size:10px; cursor:pointer; padding:0 2px; transition:color 0.2s; }
          .wallet-disconnect:hover { color:#ff4444; }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isConnecting}
          style={{
            padding: '6px 14px',
            background: 'linear-gradient(135deg, rgba(0,180,255,0.15), rgba(0,100,255,0.15))',
            border: '1px solid rgba(0,180,255,0.4)',
            borderRadius: '20px',
            color: '#88ccff',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.2s',
          }}
        >
          {isConnecting ? '⏳ Connecting…' : `⚡ ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
