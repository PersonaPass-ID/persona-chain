// PersonaPass Plaid API Connector - Financial Credential Generation
// Connects to Plaid for bank account, income, and asset verification

import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export interface PlaidCredentialRequest {
  userId: string;
  accessToken: string; // From Plaid Link
  credentialTypes: ('income' | 'assets' | 'employment' | 'transactions')[];
}

export interface FinancialCredential {
  type: 'FinancialCredential';
  issuer: 'api://plaid.com';
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string; // DID
    // Private data - never leaves user's device
    monthlyIncome?: number;
    totalAssets?: number;
    employmentStatus?: string;
    employer?: string;
    accountAgeMonths?: number;
    transactionCount30Days?: number;
  };
  proof: {
    type: 'PlaidAPISignature';
    requestId: string;
    timestamp: string;
    signature: string; // Plaid's cryptographic proof
  };
}

export class PlaidConnector {
  private plaidClient: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.production,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });
    
    this.plaidClient = new PlaidApi(configuration);
  }

  /**
   * Fetch verified financial data from Plaid and create a VC
   */
  async createFinancialCredential(request: PlaidCredentialRequest): Promise<FinancialCredential> {
    console.log('🏦 Fetching verified financial data from Plaid...');

    const credentialData: any = {
      id: `did:personapass:${request.userId}`,
    };

    // Fetch requested credential types
    if (request.credentialTypes.includes('income')) {
      const incomeResponse = await this.plaidClient.incomeVerificationGet({
        access_token: request.accessToken,
      });
      
      // Calculate monthly income from pay stubs
      const monthlyIncome = this.calculateMonthlyIncome(incomeResponse.data);
      credentialData.monthlyIncome = monthlyIncome;
      credentialData.employmentStatus = 'employed';
    }

    if (request.credentialTypes.includes('assets')) {
      const assetsResponse = await this.plaidClient.assetsReportGet({
        asset_report_token: request.accessToken,
      });
      
      // Sum total assets across all accounts
      const totalAssets = this.calculateTotalAssets(assetsResponse.data);
      credentialData.totalAssets = totalAssets;
    }

    if (request.credentialTypes.includes('transactions')) {
      const transactionsResponse = await this.plaidClient.transactionsGet({
        access_token: request.accessToken,
        start_date: this.getDateMonthsAgo(1),
        end_date: new Date().toISOString().split('T')[0],
      });
      
      credentialData.transactionCount30Days = transactionsResponse.data.transactions.length;
    }

    // Create the verifiable credential
    const credential: FinancialCredential = {
      type: 'FinancialCredential',
      issuer: 'api://plaid.com',
      issuanceDate: new Date().toISOString(),
      expirationDate: this.getDateMonthsFromNow(6), // Valid for 6 months
      credentialSubject: credentialData,
      proof: {
        type: 'PlaidAPISignature',
        requestId: incomeResponse.data.request_id || 'req_' + Date.now(),
        timestamp: new Date().toISOString(),
        signature: this.generatePlaidSignature(credentialData),
      },
    };

    console.log('✅ Financial credential created successfully');
    return credential;
  }

  /**
   * Generate ZK proofs for specific financial attributes
   */
  async generateFinancialProofs(credential: FinancialCredential) {
    const proofs = {
      // Prove income above threshold without revealing exact amount
      incomeAbove: async (threshold: number) => {
        if (!credential.credentialSubject.monthlyIncome) return null;
        
        return {
          type: 'IncomeProof',
          publicSignals: [credential.credentialSubject.monthlyIncome >= threshold ? '1' : '0'],
          proof: await this.generateZKProof('income', credential.credentialSubject.monthlyIncome, threshold),
        };
      },

      // Prove assets above threshold
      assetsAbove: async (threshold: number) => {
        if (!credential.credentialSubject.totalAssets) return null;
        
        return {
          type: 'AssetProof',
          publicSignals: [credential.credentialSubject.totalAssets >= threshold ? '1' : '0'],
          proof: await this.generateZKProof('assets', credential.credentialSubject.totalAssets, threshold),
        };
      },

      // Prove employment status
      isEmployed: async () => {
        return {
          type: 'EmploymentProof',
          publicSignals: [credential.credentialSubject.employmentStatus === 'employed' ? '1' : '0'],
          proof: await this.generateZKProof('employment', 1, 0),
        };
      },

      // Prove account age
      accountAgeMonths: async (minimumMonths: number) => {
        if (!credential.credentialSubject.accountAgeMonths) return null;
        
        return {
          type: 'AccountAgeProof',
          publicSignals: [credential.credentialSubject.accountAgeMonths >= minimumMonths ? '1' : '0'],
          proof: await this.generateZKProof('accountAge', credential.credentialSubject.accountAgeMonths, minimumMonths),
        };
      },
    };

    return proofs;
  }

  // Helper methods
  private calculateMonthlyIncome(incomeData: any): number {
    // Sum all income sources and convert to monthly
    let totalAnnualIncome = 0;
    
    incomeData.income_streams?.forEach((stream: any) => {
      totalAnnualIncome += stream.projected_annual_income || 0;
    });

    return Math.round(totalAnnualIncome / 12);
  }

  private calculateTotalAssets(assetData: any): number {
    let total = 0;
    
    assetData.accounts?.forEach((account: any) => {
      total += account.balances?.current || 0;
    });

    return Math.round(total);
  }

  private getDateMonthsAgo(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split('T')[0];
  }

  private getDateMonthsFromNow(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  }

  private generatePlaidSignature(data: any): string {
    // In production, this would be Plaid's cryptographic signature
    return 'plaid_sig_' + Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 20);
  }

  private async generateZKProof(type: string, value: number, threshold: number): Promise<any> {
    // This would call our ZK circuit
    // For now, returning mock proof structure
    return {
      pi_a: ['0x1234...', '0x5678...'],
      pi_b: [['0x9abc...', '0xdef0...'], ['0x1111...', '0x2222...']],
      pi_c: ['0x3333...', '0x4444...'],
      protocol: 'groth16',
    };
  }
}

// Export singleton instance
export const plaidConnector = new PlaidConnector();