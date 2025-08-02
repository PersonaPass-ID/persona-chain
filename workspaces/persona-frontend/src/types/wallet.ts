// Wallet TypeScript definitions for PersonaPass

declare global {
  interface Window {
    keplr?: KeplrWallet;
    leap?: LeapWallet;
    cosmostation?: CosmostationWallet;
    station?: TerraStationWallet;
  }
}

interface KeplrWallet {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{
    bech32Address: string;
    pubKey: Uint8Array;
    isNanoLedger: boolean;
  }>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<{
    signature: string;
    pub_key: {
      type: string;
      value: string;
    };
  }>;
}

interface LeapWallet {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{
    bech32Address: string;
    pubKey: Uint8Array;
    isNanoLedger: boolean;
  }>;
  signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<{
    signature: string;
    pub_key: {
      type: string;
      value: string;
    };
  }>;
}

interface CosmostationWallet {
  cosmos: {
    request(params: { method: string; params: any }): Promise<any>;
  };
}

interface TerraStationWallet {
  connect(): Promise<{
    address: string;
    network: string;
  }>;
  sign(params: {
    msgs: any[];
    fee?: any;
    memo?: string;
  }): Promise<{
    result: {
      signature: string;
      pub_key: string;
    };
  }>;
}

export {};