import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Balance {
  asset: string;
  amount: string;
}

export function BaseMCPPanel() {
  const { address } = useAccount();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address]);

  const fetchBalances = async () => {
    try {
      const [ethRes, usdcRes] = await Promise.all([
        fetch('/api/base-mcp/balance?asset=ETH&chain=base'),
        fetch('/api/base-mcp/balance?asset=USDC&chain=base')
      ]);
      const ethData = await ethRes.json();
      const usdcData = await usdcRes.json();
      
      const newBalances = [];
      if (ethData?.balance) newBalances.push({ asset: 'ETH', amount: ethData.balance });
      if (usdcData?.balance) newBalances.push({ asset: 'USDC', amount: usdcData.balance });
      
      setBalances(newBalances);
    } catch (e) {
      console.error(e);
    }
  };

  const pollStatus = async (requestId: string) => {
    try {
      const res = await fetch(`/api/base-mcp/status/${requestId}`);
      const data = await res.json();
      if (data.status === 'success' || data.success) {
        setStatus('Swap Confirmed!');
        setApprovalUrl(null);
        await fetchBalances();
      } else if (data.status === 'failed') {
        setStatus('Swap Failed.');
        setApprovalUrl(null);
      } else {
        setTimeout(() => pollStatus(requestId), 3000);
      }
    } catch (e) {
      console.error(e);
      setTimeout(() => pollStatus(requestId), 3000);
    }
  };

  const handleSwap = async () => {
    setLoading(true);
    setStatus('Requesting swap...');
    try {
      const res = await fetch('/api/base-mcp/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAsset: 'ETH',
          toAsset: 'USDC',
          amount: '0.001',
          chain: 'base'
        })
      });
      const data = await res.json();
      if (data.approvalUrl && data.requestId) {
        setApprovalUrl(data.approvalUrl);
        setStatus('Waiting for approval...');
        pollStatus(data.requestId);
      } else if (data.success && data.txHash) {
        setStatus(`Swap Confirmed! Tx: ${data.txHash}`);
        fetchBalances();
      } else {
        setStatus(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!address) return null;

  return (
    <div style={{
      backgroundColor: '#0a0a0a',
      color: '#00ffcc',
      fontFamily: '"Courier New", Courier, monospace',
      border: '1px solid rgba(0,255,204,0.25)',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '16px',
      width: '100%'
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Base MCP Agent Wallet
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        {balances.length > 0 ? (
          balances.map(b => (
            <div key={b.asset} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{b.asset}:</span>
              <strong>{b.amount}</strong>
            </div>
          ))
        ) : (
          <div style={{ opacity: 0.7 }}>Loading balances...</div>
        )}
      </div>

      <button 
        onClick={handleSwap}
        disabled={loading || !!approvalUrl}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          color: '#00ffcc',
          border: '1px solid #00ffcc',
          padding: '8px',
          borderRadius: '4px',
          cursor: (loading || !!approvalUrl) ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          textTransform: 'uppercase',
          fontWeight: 'bold',
          opacity: (loading || !!approvalUrl) ? 0.5 : 1,
          transition: 'all 0.2s ease'
        }}
        onMouseOver={e => {
          if (!loading && !approvalUrl) {
            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 204, 0.1)';
          }
        }}
        onMouseOut={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {loading ? 'Processing...' : 'Swap Reward → USDC'}
      </button>

      {approvalUrl && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <a 
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#fff',
              textDecoration: 'none',
              backgroundColor: '#0052FF',
              padding: '6px 12px',
              borderRadius: '4px',
              display: 'inline-block',
              fontSize: '0.9rem',
              fontWeight: 600
            }}
          >
            Approve in Base Account →
          </a>
        </div>
      )}

      {status && (
        <div style={{ 
          marginTop: '12px', 
          fontSize: '0.85rem', 
          opacity: 0.8,
          textAlign: 'center' 
        }}>
          {status}
        </div>
      )}
    </div>
  );
}
