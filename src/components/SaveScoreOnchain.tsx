/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { toHex } from 'viem';

export function SaveScoreOnchain({ score }: { score: number }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: hash, isPending, sendTransaction, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const notifiedHash = useRef<string | null>(null);

  useEffect(() => {
    if (isSuccess && hash && address && notifiedHash.current !== hash) {
      notifiedHash.current = hash;
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          title: "Score Saved! 🏆",
          message: `Your high score of ${score} has been saved on Base!`
        })
      }).catch(err => console.error("Notification error:", err));
    }
  }, [isSuccess, hash, address, score]);

  if (!isConnected || !address) return null;

  const isSupportedChain = chainId === base.id || chainId === baseSepolia.id;

  const handleSave = () => {
    if (!isSupportedChain && switchChain) {
      switchChain({ chainId: base.id });
      return;
    }

    const scoreHex = toHex(`SCORE:${score}`);
    const builderCodeSuffix = "07626173656170700080218021802180218021802180218021";
    const finalData = `${scoreHex}${builderCodeSuffix}` as `0x${string}`;
    
    sendTransaction({ 
      to: '0x000000000000000000000000000000000000dEaD', // Smart wallet'ların revert etmesini engellemek için Burn Adresine gönderiyoruz
      value: 0n, 
      data: finalData, 
      chainId: chainId 
    });
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        disabled={isPending || isConfirming || isSuccess || isSwitching}
        style={{
          padding: '12px 28px',
          background: isPending || isConfirming || isSuccess || isSwitching
            ? 'rgba(50,50,80,0.8)'
            : 'linear-gradient(135deg, #0055ff, #00ccff)',
          border: '1px solid rgba(0,200,255,0.5)',
          borderRadius: '10px',
          color: '#fff',
          fontFamily: "'Courier New', monospace",
          fontSize: '13px',
          fontWeight: '800',
          letterSpacing: '1px',
          cursor: isPending || isConfirming || isSuccess || isSwitching ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(0,150,255,0.4)',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          opacity: isPending || isConfirming || isSwitching ? 0.7 : 1,
        }}
      >
        {!isSupportedChain ? (isSwitching ? 'Ağ Değiştiriliyor...' : 'Base Ağına Geç (Switch Network)') 
          : isPending ? '⏳ Confirm in Wallet…'
          : isConfirming ? '⛓ Recording on Base…'
          : isSuccess ? '✅ Score Saved On-Chain!'
          : '💾 Save Score On-Chain'}
      </button>

      {error && (
        <div style={{ fontSize: '11px', color: '#ff4444', textTransform: 'uppercase', fontFamily: "monospace" }}>
          {error.message.includes('chain') ? 'Ağ hatası (Chain mismatch).' : 'İşlem Başarısız (Tx Failed)'}
        </div>
      )}

      {hash && (
        <a
          href={`https://${chainId === baseSepolia.id ? 'sepolia.' : ''}basescan.org/tx/${hash}`}
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
