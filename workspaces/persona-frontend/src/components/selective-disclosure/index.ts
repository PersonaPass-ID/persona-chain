/**
 * SELECTIVE DISCLOSURE COMPONENTS EXPORTS
 * 
 * Central export point for all selective disclosure related components,
 * hooks, and utilities for privacy-preserving credential sharing.
 */

// Main interface component for creating requests and generating proofs
export { SelectiveDisclosureInterface } from './SelectiveDisclosureInterface'

// Proof verification panel for validating ZK proofs
export { ProofVerificationPanel } from './ProofVerificationPanel'

// React hook for selective disclosure operations
export { useSelectiveDisclosure } from '../hooks/useSelectiveDisclosure'
export type { 
  UseSelectiveDisclosureOptions,
  UseSelectiveDisclosureReturn,
  ProofGenerationState,
  VerificationState
} from '../hooks/useSelectiveDisclosure'

// Core service and types
export {
  selectiveDisclosureService,
  type SelectiveDisclosureRequest,
  type SelectiveDisclosureProof,
  type ClaimRequirement,
  type ProvenClaim,
  type VerificationResult,
  type ZKCircuit
} from '../lib/zkp/selective-disclosure-service'