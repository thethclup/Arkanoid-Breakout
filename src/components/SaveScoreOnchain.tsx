/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { base } from 'wagmi/chains';
import { toHex } from 'viem';

export function SaveScoreOnchain({ score }: { score: number }) {
  const { address, isConnected } = useAccount();
  const { data: hash, isPending, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!isConnected || !address) return null;

  const handleSave = () => {
    const scoreHex = toHex(`SCORE:${score}`);
    const builderCodeSuffix = "07626173656170700080218021802180218021802180218021";
    const finalData = `${scoreHex}${builderCodeSuffix}` as `0x${string}`;
    sendTransaction({ to: address, value: 0n, data: finalData, chainId: base.id });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        disabled={isPending || isConfirming || isSuccess}
        style={{
          padding: '12px 28px',
          background: isPending || isConfirming || isSuccess
            ? 'rgba(50,50,80,0.8)'
            : 'linear-gradient(135deg, #0055ff, #00ccff)',
          border: '1px solid rgba(0,200,255,0.5)',
          borderRadius: '10px',
          color: '#fff',
          fontFamily: "'Courier New', monospace",
          fontSize: '13px',
          fontWeight: '800',
          letterSpacing: '1px',
          cursor: isPending || isConfirming || isSuccess ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(0,150,255,0.4)',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          opacity: isPending || isConfirming ? 0.7 : 1,
        }}
      >
        {isPending ? '⏳ Confirm in Wallet…'
          : isConfirming ? '⛓ Recording on Base…'
          : isSuccess ? '✅ Score Saved On-Chain!'
          : '💾 Save Score On-Chain'}
      </button>

      {hash && (
        <a
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize:'11px', color:'#4488ff', textDecoration:'none', letterSpacing:'0.5px', fontFamily:'monospace' }}
        >
          ↗ View on Basescan
        </a>
      )}
    </div>
  );
}
