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
    // Skoru hex formatına çeviriyoruz (Örn: "SCORE:1500")
    const scoreHex = toHex(`SCORE:${score}`);
    
    // ERC-8021 Builder Code Suffix (Base dokümanlarındaki örnek suffix)
    // Bu suffix sayesinde işlem Base.dev üzerinde uygulamanıza atfedilir.
    const builderCodeSuffix = "07626173656170700080218021802180218021802180218021";
    
    // Calldata'yı birleştiriyoruz
    const finalData = `${scoreHex}${builderCodeSuffix}` as `0x${string}`;

    sendTransaction({
      to: address, // İşlemi kullanıcının kendi adresine gönderiyoruz (Self-transfer)
      value: 0n,   // 0 ETH
      data: finalData,
      chainId: base.id,
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <button
        onClick={(e) => {
          e.stopPropagation(); // Canvas'ın tıklamayı algılayıp oyunu yeniden başlatmasını engelle
          handleSave();
        }}
        disabled={isPending || isConfirming || isSuccess}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(0,100,255,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
      >
        {isPending ? 'Cüzdanda Onaylayın...' : 
         isConfirming ? 'Ağa Kaydediliyor...' : 
         isSuccess ? 'Skor Zincire Kaydedildi!' : 
         'Skoru Zincire Kaydet (ERC-8021)'}
      </button>
      
      {hash && (
        <a 
          href={`https://basescan.org/tx/${hash}`} 
          target="_blank" 
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-blue-400 hover:text-blue-300 underline z-10"
        >
          Basescan'de Görüntüle
        </a>
      )}
    </div>
  );
}
