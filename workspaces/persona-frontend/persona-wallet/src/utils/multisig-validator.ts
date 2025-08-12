// Security validation utilities for multi-signature operations
// Comprehensive input validation and sanitization

export class MultisigValidator {
  /**
   * Validate Bech32 address format
   */
  static validateBech32Address(address: string, expectedPrefix: string = 'persona'): boolean {
    if (typeof address !== 'string') return false;
    if (address.length < 10 || address.length > 100) return false;
    
    const bech32Regex = new RegExp(`^${expectedPrefix}1[a-zA-HJ-NP-Z0-9]{38,58}$`);
    return bech32Regex.test(address);
  }

  /**
   * Validate Base64 public key
   */
  static validateBase64Pubkey(pubkey: string): boolean {
    if (typeof pubkey !== 'string') return false;
    if (pubkey.length < 40 || pubkey.length > 100) return false;
    
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(pubkey)) return false;
    
    try {
      const decoded = Buffer.from(pubkey, 'base64');
      return decoded.length >= 20 && decoded.length <= 64;
    } catch {
      return false;
    }
  }

  /**
   * Validate threshold configuration
   */
  static validateThreshold(threshold: number, memberCount: number): boolean {
    return (
      Number.isInteger(threshold) &&
      threshold > 0 &&
      threshold <= memberCount &&
      memberCount >= 2 &&
      memberCount <= 20 // Reasonable upper limit
    );
  }

  /**
   * Validate transaction amount
   */
  static validateAmount(amount: string, denom: string): boolean {
    if (typeof amount !== 'string' || typeof denom !== 'string') return false;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;
    
    // Check for reasonable upper limits
    if (numAmount > 1e18) return false;
    
    // Validate denomination
    const validDenoms = ['upersona', 'persona'];
    return validDenoms.includes(denom.toLowerCase());
  }

  /**
   * Validate memo field
   */
  static validateMemo(memo: string): boolean {
    if (typeof memo !== 'string') return false;
    if (memo.length > 512) return false; // Cosmos SDK limit
    
    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(memo));
  }

  /**
   * Validate member name
   */
  static validateMemberName(name: string): boolean {
    if (typeof name !== 'string') return false;
    if (name.length > 50) return false;
    
    // Only allow alphanumeric, spaces, and basic punctuation
    const nameRegex = /^[a-zA-Z0-9\s\-_.]{0,50}$/;
    return nameRegex.test(name);
  }

  /**
   * Validate proposal title and description
   */
  static validateProposalText(text: string, maxLength: number = 500): boolean {
    if (typeof text !== 'string') return false;
    if (text.trim().length === 0 || text.length > maxLength) return false;
    
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /javascript:/i,
      /on\w+\s*=/i,
    ];
    
    return !xssPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string, maxLength: number = 100): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>'"&]/g, (match) => {
        const escapes: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapes[match] || match;
      });
  }

  /**
   * Validate transaction ID format
   */
  static validateTransactionId(id: string): boolean {
    if (typeof id !== 'string') return false;
    
    // Expected format: tx_timestamp or similar
    const idRegex = /^[a-zA-Z0-9_-]{10,50}$/;
    return idRegex.test(id);
  }

  /**
   * Validate account ID format
   */
  static validateAccountId(id: string): boolean {
    if (typeof id !== 'string') return false;
    
    // Expected format: multisig_timestamp or similar
    const idRegex = /^multisig_[0-9]{13}$/;
    return idRegex.test(id);
  }

  /**
   * Rate limiting check (simple implementation)
   */
  static checkRateLimit(key: string, windowMs: number = 60000, maxRequests: number = 10): boolean {
    const now = Date.now();
    const storageKey = `multisig_rate_${key}`;
    
    try {
      const data = localStorage.getItem(storageKey);
      const requests = data ? JSON.parse(data) : [];
      
      // Clean old requests
      const validRequests = requests.filter((timestamp: number) => now - timestamp < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      // Add current request
      validRequests.push(now);
      localStorage.setItem(storageKey, JSON.stringify(validRequests));
      
      return true;
    } catch {
      return true; // Allow if storage fails
    }
  }

  /**
   * Comprehensive member validation
   */
  static validateMember(member: {
    address: string;
    pubkey: string;
    name?: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateBech32Address(member.address)) {
      errors.push('Invalid address format');
    }

    if (!this.validateBase64Pubkey(member.pubkey)) {
      errors.push('Invalid public key format');
    }

    if (member.name && !this.validateMemberName(member.name)) {
      errors.push('Invalid member name');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate complete multisig creation request
   */
  static validateMultisigCreation(
    threshold: number,
    members: { address: string; pubkey: string; name?: string }[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate threshold
    if (!this.validateThreshold(threshold, members.length)) {
      errors.push(`Invalid threshold: must be between 1 and ${members.length}`);
    }

    // Validate each member
    const addressSet = new Set<string>();
    const pubkeySet = new Set<string>();

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const memberValidation = this.validateMember(member);
      
      if (!memberValidation.valid) {
        errors.push(`Member ${i + 1}: ${memberValidation.errors.join(', ')}`);
      }

      // Check for duplicates
      if (addressSet.has(member.address)) {
        errors.push(`Duplicate address: ${member.address}`);
      }
      if (pubkeySet.has(member.pubkey)) {
        errors.push(`Duplicate public key for ${member.address}`);
      }

      addressSet.add(member.address);
      pubkeySet.add(member.pubkey);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export individual validators for convenience
export const {
  validateBech32Address,
  validateBase64Pubkey,
  validateThreshold,
  validateAmount,
  validateMemo,
  validateMemberName,
  validateProposalText,
  sanitizeString,
  validateTransactionId,
  validateAccountId,
  checkRateLimit,
  validateMember,
  validateMultisigCreation
} = MultisigValidator;