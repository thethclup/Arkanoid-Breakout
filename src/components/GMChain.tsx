/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';

const GM_CONTRACT_ADDRESS = '0xdcF8ce99ce60f7db96f0cdDc4DC329e13D6D6694' as const;

const arkanoidGMABI = [
  {
    "inputs": [],
    "name": "DailyLimitReached",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "dailyCount", "type": "uint256" }
    ],
    "name": "GMRecorded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "DAILY_LIMIT",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_user", "type": "address" }
    ],
    "name": "getTodayGMCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sendGM",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const DAILY_LIMIT = 5;

export function GMChain() {
  const { address, isConnected } = useAccount();
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [showTxList, setShowTxList] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Mevcut GM limitini oku
  const { data: todayCountData, refetch } = useReadContract({
    address: GM_CONTRACT_ADDRESS,
    abi: arkanoidGMABI,
    functionName: 'getTodayGMCount',
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address,
    }
  });

  const todayCount = todayCountData ? Number(todayCountData) : 0;
  const remaining = Math.max(0, DAILY_LIMIT - todayCount);
  const exhausted = remaining <= 0;

  // Refresh daily data when success
  useEffect(() => {
    if (isSuccess && hash) {
      if (!txHashes.includes(hash)) {
        setTxHashes(prev => [...prev, hash]);
      }
      refetch();
    }
  }, [isSuccess, hash, refetch, txHashes]);

  if (!isConnected || !address) return null;

  const handleGM = () => {
    if (exhausted || isPending || isConfirming) return;

    writeContract({
      address: GM_CONTRACT_ADDRESS,
      abi: arkanoidGMABI,
      functionName: 'sendGM',
      chainId: base.id,
    });
  };

  // Pill colours per remaining count
  const pillColors = ['#ff4444', '#ff8800', '#ffcc00', '#88ff00', '#00ff88', '#00ffcc'];
  const pillColor = pillColors[Math.min(remaining, pillColors.length - 1)];

  // Custom error parse
  const errorMessage = writeError?.message || '';

  return (
    <div className="gm-chain-wrapper">
      <div className="gm-header">
        <span className="gm-label">☀️ GM CHAIN</span>
        <span className="gm-counter" style={{ color: pillColor }}>
          {todayCount}/{DAILY_LIMIT} today
        </span>
      </div>

      {/* Progress dots */}
      <div className="gm-dots">
        {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
          <span
            key={i}
            className="gm-dot"
            style={{
              background: i < todayCount ? '#00ffcc' : 'rgba(255,255,255,0.15)',
              boxShadow: i < todayCount ? '0 0 6px #00ffcc' : 'none',
            }}
          />
        ))}
      </div>

      <button
        className={`gm-button ${exhausted ? 'gm-exhausted' : ''} ${isPending || isConfirming ? 'gm-loading' : ''}`}
        onClick={handleGM}
        disabled={exhausted || isPending || isConfirming}
      >
        {isPending
          ? '⏳ Waiting wallet…'
          : isConfirming
          ? '⛓ Confirming…'
          : isSuccess && !exhausted
          ? '✅ GM sent!'
          : exhausted && !isSuccess
          ? '🌙 Come back tomorrow'
          : `👋 Send GM (${remaining} left)`}
      </button>

      {writeError && (
        <div style={{ fontSize: '10px', color: '#ff4444', marginTop: '4px' }}>
          {errorMessage.includes('DailyLimitReached') ? 'Bugünlük 5 adet GM limitinizi doldurdunuz!' : 
           errorMessage.includes('UserRejectedRequestError') || errorMessage.includes('rejected') ? '❌ İşlemi reddettiniz.' :
           '❌ İşlem Başarısız (Tx Failed)'}
        </div>
      )}

      {txHashes.length > 0 && (
        <button className="gm-history-toggle" onClick={() => setShowTxList(v => !v)}>
          {showTxList ? '▲ Hide' : '▼ Show'} tx history ({txHashes.length})
        </button>
      )}

      {showTxList && (
        <div className="gm-tx-list">
          {txHashes.map((h, i) => (
            <a
              key={i}
              href={`https://basescan.org/tx/${h}`}
              target="_blank"
              rel="noreferrer"
              className="gm-tx-link"
            >
              #{i + 1} {h.slice(0, 10)}…{h.slice(-6)}
            </a>
          ))}
        </div>
      )}

      <style>{`
        .gm-chain-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px 18px;
          background: linear-gradient(135deg, rgba(0,255,204,0.06) 0%, rgba(0,100,255,0.06) 100%);
          border: 1px solid rgba(0,255,204,0.25);
          border-radius: 12px;
          font-family: 'Courier New', monospace;
          min-width: 220px;
        }
        .gm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gm-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #00ffcc;
          text-transform: uppercase;
        }
        .gm-counter {
          font-size: 11px;
          font-weight: 700;
        }
        .gm-dots {
          display: flex;
          gap: 6px;
          margin: 2px 0;
        }
        .gm-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          transition: all 0.3s;
        }
        .gm-button {
          padding: 8px 16px;
          background: linear-gradient(135deg, #00ffcc, #0088ff);
          color: #000;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
        }
        .gm-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(0,255,204,0.5);
        }
        .gm-button.gm-exhausted {
          background: linear-gradient(135deg, #333, #222);
          color: #666;
          cursor: not-allowed;
        }
        .gm-button.gm-loading {
          opacity: 0.7;
          cursor: wait;
        }
        .gm-history-toggle {
          background: none;
          border: none;
          color: rgba(0,255,204,0.5);
          font-size: 10px;
          cursor: pointer;
          font-family: monospace;
          padding: 0;
          text-align: left;
          margin-top: 4px;
        }
        .gm-history-toggle:hover { color: #00ffcc; }
        .gm-tx-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .gm-tx-link {
          font-size: 10px;
          color: #4488ff;
          text-decoration: none;
        }
        .gm-tx-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
