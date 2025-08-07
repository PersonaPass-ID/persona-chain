/**
 * PersonaPass SDK Type Definitions
 */

export type ProofType = 
  | 'age-verification'
  | 'jurisdiction-proof'
  | 'accredited-investor'
  | 'anti-sybil'
  | 'selective-disclosure';

export type NetworkType = 'mainnet' | 'testnet' | 'development';

export interface PersonaPassConfig {
  /** Your PersonaPass API key */
  apiKey: string;
  /** PersonaPass API base URL */
  baseUrl?: string;
  /** Network environment */
  network?: NetworkType;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom styling for widgets */
  theme?: PersonaPassTheme;
}

export interface PersonaPassTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

export interface ProofRequest {
  /** Type of proof to generate */
  type: ProofType;
  /** Wallet address of the user */
  walletAddress: string;
  /** Purpose/description of the proof */
  purpose: string;
  /** Specific constraints for the proof */
  constraints?: Record<string, any>;
  /** Optional callback URL for async proof generation */
  callbackUrl?: string;
}

export interface ProofResponse {
  /** Unique proof identifier */
  proofId: string;
  /** The generated zero-knowledge proof */
  proof: ZKProof;
  /** URL to download proof */
  downloadUrl: string;
  /** URL to verify proof */
  verificationUrl: string;
  /** Expiration timestamp */
  expiresAt?: string;
}

export interface ZKProof {
  /** Type of proof */
  type: ProofType;
  /** Proof version */
  version: string;
  /** Public inputs that don't reveal private data */
  publicInputs: Record<string, any>;
  /** The actual zero-knowledge proof */
  proof: string;
  /** Verification key for the proof */
  verificationKey: string;
  /** Proof metadata */
  metadata: ProofMetadata;
}

export interface ProofMetadata {
  /** Type of credential used */
  credentialType: string;
  /** Type of proof generated */
  proofType: string;
  /** Purpose of the proof */
  purpose: string;
  /** When the proof was created */
  timestamp: string;
  /** When the proof expires */
  expiresAt?: string;
  /** How many times the proof has been used */
  usageCount: number;
}

export interface VerificationResult {
  /** Whether the proof is valid */
  valid: boolean;
  /** Type of proof that was verified */
  proofType: ProofType;
  /** When the verification was performed */
  verifiedAt: string;
  /** Any additional verification details */
  details?: Record<string, any>;
  /** Error message if verification failed */
  error?: string;
}

export interface CredentialStatus {
  /** Whether user has any verified credentials */
  hasCredentials: boolean;
  /** Available credential types */
  credentialTypes: string[];
  /** Verification status by type */
  verificationStatus: Record<string, 'pending' | 'verified' | 'failed'>;
  /** Last verification attempt */
  lastVerified?: string;
}

export interface ProofGenerationOptions {
  /** Whether to store the proof for future use */
  persistProof?: boolean;
  /** Maximum time to wait for proof generation (ms) */
  timeout?: number;
  /** Whether to use cached proofs if available */
  useCache?: boolean;
  /** Custom metadata to include with the proof */
  metadata?: Record<string, any>;
}

export interface WidgetConfig {
  /** Widget container element or selector */
  container: string | HTMLElement;
  /** Widget theme override */
  theme?: PersonaPassTheme;
  /** Callback when proof is generated */
  onProofGenerated?: (proof: ProofResponse) => void;
  /** Callback when verification completes */
  onVerificationComplete?: (result: VerificationResult) => void;
  /** Callback for errors */
  onError?: (error: PersonaPassError) => void;
}

export interface PersonaPassError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Original error if available */
  originalError?: Error;
}

export type EventType = 
  | 'proof_generated'
  | 'proof_verified'
  | 'credential_added'
  | 'verification_started'
  | 'verification_completed'
  | 'error';

export interface PersonaPassEvent<T = any> {
  /** Event type */
  type: EventType;
  /** Event payload */
  data: T;
  /** Event timestamp */
  timestamp: string;
  /** User wallet address */
  walletAddress?: string;
}

export type EventHandler<T = any> = (event: PersonaPassEvent<T>) => void;

// Age verification specific types
export interface AgeVerificationConstraints {
  /** Minimum age required */
  minAge: number;
  /** Whether to include proof of majority */
  includeProofOfMajority?: boolean;
}

// Jurisdiction proof specific types
export interface JurisdictionConstraints {
  /** List of allowed countries/jurisdictions */
  allowedRegions: string[];
  /** Whether to include proof of residency */
  includeResidencyProof?: boolean;
}

// Accredited investor specific types
export interface AccreditedInvestorConstraints {
  /** Minimum net worth requirement */
  minNetWorth?: number;
  /** Required accreditation level */
  accreditationLevel?: 'individual' | 'entity' | 'qualified_purchaser';
}

// Anti-Sybil specific types
export interface AntiSybilConstraints {
  /** Uniqueness scope */
  uniquenessSet?: 'global' | 'campaign' | 'custom';
  /** Required confidence level (0-100) */
  confidenceThreshold?: number;
  /** Custom campaign identifier */
  campaignId?: string;
}