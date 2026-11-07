import { http, createConfig, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    baseAccount({
      appName: 'Neon Breaker',
    }),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  ssr: true, // Prevents wagmi Hydrate from running onMount during React render phase
  transports: {
    [base.id]: http('https://mainnet.base.org', {
      batch: true,
    }),
    [baseSepolia.id]: http('https://sepolia.base.org', {
      batch: true,
    }),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
