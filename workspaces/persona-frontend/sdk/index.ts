/**
 * PersonaPass SDK - Privacy-Preserving Identity Infrastructure
 * 
 * The easiest way to add zero-knowledge identity verification to your application.
 * Supports age verification, jurisdiction compliance, accredited investor status,
 * and anti-Sybil protection without revealing personal data.
 * 
 * @version 1.0.0
 * @author PersonaPass Team
 * @license MIT
 */

export { PersonaPassSDK } from './src/PersonaPassSDK';
export { PersonaPassWidget } from './src/PersonaPassWidget';
export { PersonaPassVerifier } from './src/PersonaPassVerifier';

export * from './src/types';
export * from './src/constants';
export * from './src/utils';

// React components
export { PersonaPassProvider } from './src/react/PersonaPassProvider';
export { usePersonaPass } from './src/react/usePersonaPass';
export { IdentityVerificationButton } from './src/react/IdentityVerificationButton';
export { ProofVerificationBadge } from './src/react/ProofVerificationBadge';

// Default export for convenience
export { PersonaPassSDK as default } from './src/PersonaPassSDK';