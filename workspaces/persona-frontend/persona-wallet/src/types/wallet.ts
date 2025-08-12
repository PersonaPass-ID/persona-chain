export interface Wallet {
  address: string;
  mnemonic?: string;
  privateKey?: string;
  publicKey: string;
  balance: string;
  did?: string;
}

export interface DIDDocument {
  '@context': string[];
  id: string;
  authentication: PublicKey[];
  service: Service[];
  created: string;
  updated: string;
}

export interface PublicKey {
  id: string;
  type: string;
  controller: string;
  publicKeyBase58: string;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: any;
  proof: Proof;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws: string;
}

export interface PersonaChainConfig {
  chainId: string;
  rpcEndpoint: string;
  restEndpoint?: string;
  addressPrefix: string;
  coinDenom: string;
  coinMinimalDenom: string;
  coinDecimals: number;
}