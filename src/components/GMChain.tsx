/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { encodeFunctionData, parseAbi } from 'viem';

// ── Contract address – deploy via Remix first, then paste here ──────────────
const GM_CONTRACT_ADDRESS = '0x1900dcC773fAc61Ef92170B1d46F70a36ed70a4b' as `0x${string}`;
// ─────────────────────────────────────────────────────────────────────────────

const GM_ABI = parseAbi([
  'function gm() external',
]);

const DAILY_LIMIT = 5;
const STORAGE_KEY = 'gm_chain_daily';

interface DailyData {
  date: string;
  count: number;
  txHashes: string[];
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getDailyData(): DailyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayStr(), count: 0, txHashes: [] };
    const parsed = JSON.parse(raw);
    if (parsed.date !== getTodayStr()) return { date: getTodayStr(), count: 0, txHashes: [] };
    return parsed;
  } catch {
    return { date: getTodayStr(), count: 0, txHashes: [] };
  }
}

function saveDailyData(data: DailyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function GMChain() {
  const { address, isConnected } = useAccount();
  const [dailyData, setDailyData] = useState<DailyData>(getDailyData());
  const [showTxList, setShowTxList] = useState(false);

  const { data: hash, isPending, sendTransaction, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Refresh daily data when success
  useEffect(() => {
    if (isSuccess && hash) {
      const fresh = getDailyData();
      const updated: DailyData = {
        date: getTodayStr(),
        count: fresh.count + 1,
        txHashes: [...fresh.txHashes, hash],
      };
      saveDailyData(updated);
      setDailyData(updated);
    }
  }, [isSuccess, hash]);

  // Also refresh on mount
  useEffect(() => {
    setDailyData(getDailyData());
  }, []);

  if (!isConnected || !address) return null;

  const remaining = DAILY_LIMIT - dailyData.count;
  const exhausted = remaining <= 0;

  const handleGM = () => {
    if (exhausted || isPending || isConfirming) return;

    const calldata = encodeFunctionData({ abi: GM_ABI, functionName: 'gm' });

    sendTransaction({
      to: GM_CONTRACT_ADDRESS,
      data: calldata,
      value: 0n,
      chainId: base.id,
    });
  };

  // Pill colours per remaining count
  const pillColors = ['#ff4444', '#ff8800', '#ffcc00', '#88ff00', '#00ff88', '#00ffcc'];
  const pillColor = pillColors[Math.min(remaining, pillColors.length - 1)];

  return (
    <div className="gm-chain-wrapper">
      <div className="gm-header">
        <span className="gm-label">☀️ GM CHAIN</span>
        <span className="gm-counter" style={{ color: pillColor }}>
          {dailyData.count}/{DAILY_LIMIT} today
        </span>
      </div>

      {/* Progress dots */}
      <div className="gm-dots">
        {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
          <span
            key={i}
            className="gm-dot"
            style={{
              background: i < dailyData.count ? '#00ffcc' : 'rgba(255,255,255,0.15)',
              boxShadow: i < dailyData.count ? '0 0 6px #00ffcc' : 'none',
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
          : isSuccess && remaining === DAILY_LIMIT - dailyData.count
          ? '✅ GM sent!'
          : exhausted
          ? '🌙 Come back tomorrow'
          : `👋 Send GM (${remaining} left)`}
      </button>

      {error && (
        <p className="gm-error">
          ❌ {(error as any)?.shortMessage || error.message}
        </p>
      )}

      {dailyData.txHashes.length > 0 && (
        <button className="gm-history-toggle" onClick={() => setShowTxList(v => !v)}>
          {showTxList ? '▲ Hide' : '▼ Show'} tx history ({dailyData.txHashes.length})
        </button>
      )}

      {showTxList && (
        <div className="gm-tx-list">
          {dailyData.txHashes.map((h, i) => (
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
        .gm-error {
          font-size: 10px;
          color: #ff4444;
          margin: 0;
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
