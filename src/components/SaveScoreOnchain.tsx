/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const ARKANOID_GM_ADDRESS = "0xdcF8ce99ce60f7db96f0cdDc4DC329e13D6D6694" as const;

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

export function SaveScoreOnchain({ score }: { score: number }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Mevcut GM limitini oku
  const { data: todayCountData, refetch } = useReadContract({
    address: ARKANOID_GM_ADDRESS,
    abi: arkanoidGMABI,
    functionName: 'getTodayGMCount',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    }
  });

  const todayCount = todayCountData ? Number(todayCountData) : 0;
  const isLimitReached = todayCount >= 5;

  useEffect(() => {
    if (isSuccess) {
      refetch(); // Başarılı olunca sayaç güncellensin
    }
  }, [isSuccess, refetch]);

  if (!isConnected || !address) return null;

  const isSupportedChain = chainId === base.id || chainId === baseSepolia.id;

  const handleSave = () => {
    if (!isSupportedChain && switchChain) {
      switchChain({ chainId: base.id });
      return;
    }

    if (isLimitReached) return;

    writeContract({
      address: ARKANOID_GM_ADDRESS,
      abi: arkanoidGMABI,
      functionName: 'sendGM',
      chainId: base.id,
    });
  };

  // Custom error parse
  const errorMessage = writeError?.message || '';
  const isCustomLimitError = errorMessage.includes('DailyLimitReached') || errorMessage.includes('UserRejectedRequestError');

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
      <button
        onClick={(e) => { e.stopPropagation(); handleSave(); }}
        disabled={isPending || isConfirming || isSuccess || isSwitching || (isSupportedChain && isLimitReached)}
        style={{
          padding: '12px 28px',
          background: isPending || isConfirming || isSuccess || isSwitching || isLimitReached
            ? 'rgba(50,50,80,0.8)'
            : 'linear-gradient(135deg, #0055ff, #00ccff)',
          border: '1px solid rgba(0,200,255,0.5)',
          borderRadius: '10px',
          color: '#fff',
          fontFamily: "'Courier New', monospace",
          fontSize: '13px',
          fontWeight: '800',
          letterSpacing: '1px',
          cursor: isPending || isConfirming || isSuccess || isSwitching || isLimitReached ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(0,150,255,0.4)',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          opacity: isPending || isConfirming || isSwitching || isLimitReached ? 0.7 : 1,
        }}
      >
        {!isSupportedChain ? (isSwitching ? 'Ağ Değiştiriliyor...' : 'Base Ağına Geç (Switch Network)') 
          : isLimitReached && !isSuccess ? '❌ Daily Limit Reached (5/5)'
          : isPending ? '⏳ Confirm in Wallet…'
          : isConfirming ? '⛓ Recording GM…'
          : isSuccess ? '✅ GM Recorded On-Chain!'
          : `🕹️ Send GM (${todayCount}/5)`}
      </button>

      {writeError && (
        <div style={{ fontSize: '11px', color: '#ff4444', textTransform: 'uppercase', fontFamily: "monospace", maxWidth: '300px', textAlign: 'center' }}>
          {errorMessage.includes('DailyLimitReached') ? 'Bugünlük 5 adet GM limitinizi doldurdunuz!' : 
           errorMessage.includes('UserRejectedRequestError') || errorMessage.includes('rejected') ? 'İşlemi reddettiniz.' :
           'İşlem Başarısız (Tx Failed)'}
        </div>
      )}

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
