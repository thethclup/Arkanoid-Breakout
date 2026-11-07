/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useSwitchChain, useChainId } from 'wagmi';
import { base } from 'wagmi/chains';

export function ConnectWallet({ onNameChange }: { onNameChange: (name: string) => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const onNameChangeRef = useRef(onNameChange);
  useEffect(() => {
    onNameChangeRef.current = onNameChange;
  });

  const { data: basename } = useEnsName({
    address,
    chainId: base.id,
  });

  // Otomatik ağ geçişi
  useEffect(() => {
    if (isConnected && chainId !== base.id && switchChain) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chainId, switchChain]);

  useEffect(() => {
    if (isConnected && address && chainId === base.id) {
      onNameChangeRef.current(basename || `${address.slice(0, 6)}…${address.slice(-4)}`);
    } else if (!isConnected) {
      onNameChangeRef.current('Anonymous');
    }
  }, [isConnected, address, basename, chainId]);

  const handleConnect = async (connector: any) => {
    try {
      await connectAsync({ connector, chainId: base.id });
    } catch (err: any) {
      // User cancelled or extension closed
      console.warn("Wallet connect ended:", err?.message || err);
    }
  };

  if (isConnected) {
    const displayName = basename || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected');
    const isBaseDenim = chainId === base.id;
    return (
      <div className="wallet-connected">
        <span className="wallet-indicator" />
        <span className="wallet-name">{displayName}</span>
        <span className={`wallet-badge ${isBaseDenim ? 'denim-badge' : 'wrong-network'}`}>
          {isBaseDenim ? 'DENIM 200ms' : 'Wrong Network'}
        </span>
        <button onClick={() => disconnect()} className="wallet-disconnect" title="Disconnect">✕</button>
        <style>{`
          .wallet-connected { display:flex; align-items:center; gap:8px; padding:6px 14px; background:rgba(0,255,136,0.08); border:1px solid rgba(0,255,136,0.3); border-radius:20px; font-family:'Courier New',monospace; }
          .wallet-indicator { width:7px; height:7px; border-radius:50%; background:#00ff88; box-shadow:0 0 8px #00ff88; animation:pulse-dot 2s infinite; }
          @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
          .wallet-name { font-size:12px; color:#00ff88; font-weight:700; letter-spacing:0.5px; }
          .wallet-badge { font-size:9px; padding:2px 6px; border-radius:10px; font-weight:700; letter-spacing:0.5px; }
          .denim-badge { background:rgba(0,200,255,0.18); color:#00ffff; border:1px solid rgba(0,200,255,0.4); text-shadow:0 0 6px rgba(0,255,255,0.5); }
          .wrong-network { background:rgba(255,68,68,0.2); color:#ff6666; border:1px solid rgba(255,68,68,0.4); }
          .wallet-disconnect { background:none; border:none; color:rgba(255,255,255,0.4); font-size:11px; cursor:pointer; padding:0 3px; transition:color 0.2s; }
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
          onClick={() => handleConnect(connector)}
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

