import { PersonaChainConfig } from '../types/wallet';

export const PERSONACHAIN_CONFIG: PersonaChainConfig = {
  chainId: 'personachain-1',
  rpcEndpoint: 'http://personachain-rpc-lb-463662045.us-east-1.elb.amazonaws.com',
  restEndpoint: 'http://personachain-rpc-lb-463662045.us-east-1.elb.amazonaws.com',
  addressPrefix: 'persona',
  coinDenom: 'PERSONA',
  coinMinimalDenom: 'persona',
  coinDecimals: 6,
};

export const PERSONAPASS_CONFIG = {
  domain: 'personapass.xyz',
  walletUrl: 'https://wallet.personapass.xyz',
  apiUrl: 'https://api.personapass.xyz',
  explorerUrl: 'https://explorer.personapass.xyz',
  validatorPortal: 'https://validators.personapass.xyz',
  stakingUrl: 'https://stake.personapass.xyz',
};

export const WALLET_CONNECT_CONFIG = {
  bridge: 'https://bridge.walletconnect.org',
  qrcodeModal: true,
  metadata: {
    name: 'PersonaPass Wallet',
    description: 'Ultimate Digital Sovereignty Wallet',
    url: 'https://wallet.personapass.xyz',
    icons: ['https://wallet.personapass.xyz/logo.png'],
  },
};