import React, { useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName } from 'wagmi';
import { base } from 'wagmi/chains';

export function ConnectWallet({ onNameChange }: { onNameChange: (name: string) => void }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Fetch Basename using the base chain ID
  const { data: basename } = useEnsName({ 
    address, 
    chainId: base.id 
  });

  useEffect(() => {
    if (isConnected && address) {
      if (basename) {
        onNameChange(basename);
      } else {
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        onNameChange(shortAddress);
      }
    } else {
      onNameChange('Anonymous');
    }
  }, [isConnected, address, basename, onNameChange]);

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-green-400">
          {basename || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected')}
        </span>
        <button 
          onClick={() => disconnect()}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs rounded transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isConnecting}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-xs rounded transition-colors"
        >
          Connect {connector.name}
        </button>
      ))}
    </div>
  );
}
