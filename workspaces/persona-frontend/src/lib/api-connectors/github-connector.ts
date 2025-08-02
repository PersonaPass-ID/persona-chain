// PersonaPass GitHub API Connector - Developer Credential Generation
// Creates verifiable credentials from GitHub activity and contributions

import { Octokit } from '@octokit/rest';

export interface GitHubCredentialRequest {
  userId: string;
  githubUsername: string;
  accessToken?: string; // Optional for public data
  credentialTypes: ('contributions' | 'repositories' | 'languages' | 'organizations')[];
}

export interface DeveloperCredential {
  type: 'DeveloperCredential';
  issuer: 'api://github.com';
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string; // DID
    githubUsername: string;
    // Private data for ZK proofs
    totalCommits?: number;
    totalRepositories?: number;
    totalStars?: number;
    accountAgeMonths?: number;
    topLanguages?: { [language: string]: number }; // Lines of code per language
    contributions365Days?: number;
    organizations?: string[];
    hasVerifiedEmail?: boolean;
  };
  proof: {
    type: 'GitHubAPISignature';
    requestId: string;
    timestamp: string;
    signature: string;
  };
}

export class GitHubConnector {
  private octokit: Octokit;

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken,
      userAgent: 'PersonaPass/1.0',
    });
  }

  /**
   * Fetch verified developer data from GitHub and create a VC
   */
  async createDeveloperCredential(request: GitHubCredentialRequest): Promise<DeveloperCredential> {
    console.log('💻 Fetching verified developer data from GitHub...');

    const credentialData: any = {
      id: `did:personapass:${request.userId}`,
      githubUsername: request.githubUsername,
    };

    // Fetch user profile
    const { data: userProfile } = await this.octokit.users.getByUsername({
      username: request.githubUsername,
    });

    // Calculate account age
    const accountCreated = new Date(userProfile.created_at);
    const accountAgeMonths = Math.floor(
      (Date.now() - accountCreated.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    credentialData.accountAgeMonths = accountAgeMonths;

    // Fetch contributions if requested
    if (request.credentialTypes.includes('contributions')) {
      const contributions = await this.getContributions(request.githubUsername);
      credentialData.totalCommits = contributions.totalCommits;
      credentialData.contributions365Days = contributions.contributions365Days;
    }

    // Fetch repositories if requested
    if (request.credentialTypes.includes('repositories')) {
      const { data: repos } = await this.octokit.repos.listForUser({
        username: request.githubUsername,
        type: 'owner',
        per_page: 100,
      });

      credentialData.totalRepositories = repos.length;
      credentialData.totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
    }

    // Fetch language statistics if requested
    if (request.credentialTypes.includes('languages')) {
      const languages = await this.getLanguageStats(request.githubUsername);
      credentialData.topLanguages = languages;
    }

    // Fetch organizations if requested
    if (request.credentialTypes.includes('organizations')) {
      const { data: orgs } = await this.octokit.orgs.listForUser({
        username: request.githubUsername,
      });
      
      credentialData.organizations = orgs.map(org => org.login);
    }

    // Create the verifiable credential
    const credential: DeveloperCredential = {
      type: 'DeveloperCredential',
      issuer: 'api://github.com',
      issuanceDate: new Date().toISOString(),
      expirationDate: this.getDateMonthsFromNow(3), // Valid for 3 months
      credentialSubject: credentialData,
      proof: {
        type: 'GitHubAPISignature',
        requestId: 'gh_' + Date.now(),
        timestamp: new Date().toISOString(),
        signature: this.generateGitHubSignature(credentialData),
      },
    };

    console.log('✅ Developer credential created successfully');
    return credential;
  }

  /**
   * Generate ZK proofs for developer attributes
   */
  async generateDeveloperProofs(credential: DeveloperCredential) {
    const proofs = {
      // Prove minimum commits without revealing exact count
      hasMinimumCommits: async (minimum: number) => {
        if (!credential.credentialSubject.totalCommits) return null;
        
        return {
          type: 'CommitProof',
          publicSignals: [credential.credentialSubject.totalCommits >= minimum ? '1' : '0'],
          threshold: minimum,
          proof: await this.generateZKProof('commits', credential.credentialSubject.totalCommits, minimum),
        };
      },

      // Prove experience with specific language
      hasLanguageExperience: async (language: string, minLines: number = 1000) => {
        const languages = credential.credentialSubject.topLanguages;
        if (!languages) return null;
        
        const linesOfCode = languages[language] || 0;
        
        return {
          type: 'LanguageProof',
          language: language,
          publicSignals: [linesOfCode >= minLines ? '1' : '0'],
          proof: await this.generateZKProof('language', linesOfCode, minLines),
        };
      },

      // Prove repository ownership
      ownsPopularRepo: async (minStars: number) => {
        if (!credential.credentialSubject.totalStars) return null;
        
        return {
          type: 'PopularityProof',
          publicSignals: [credential.credentialSubject.totalStars >= minStars ? '1' : '0'],
          proof: await this.generateZKProof('stars', credential.credentialSubject.totalStars, minStars),
        };
      },

      // Prove active contributor
      isActiveContributor: async (minContributions: number = 100) => {
        if (!credential.credentialSubject.contributions365Days) return null;
        
        return {
          type: 'ActivityProof',
          publicSignals: [credential.credentialSubject.contributions365Days >= minContributions ? '1' : '0'],
          proof: await this.generateZKProof('activity', credential.credentialSubject.contributions365Days, minContributions),
        };
      },

      // Prove organization membership without revealing which ones
      isMemberOfOrganization: async () => {
        const orgs = credential.credentialSubject.organizations;
        if (!orgs) return null;
        
        return {
          type: 'OrganizationProof',
          publicSignals: [orgs.length > 0 ? '1' : '0'],
          proof: await this.generateZKProof('organization', orgs.length, 1),
        };
      },
    };

    return proofs;
  }

  // Helper methods
  private async getContributions(username: string) {
    // GitHub doesn't have a direct API for contribution graphs
    // In production, we'd scrape or use GraphQL API
    // For now, using mock data based on public repos
    
    const { data: events } = await this.octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });

    const pushEvents = events.filter(event => event.type === 'PushEvent');
    const totalCommits = pushEvents.reduce((sum, event) => {
      return sum + (event.payload?.commits?.length || 0);
    }, 0);

    return {
      totalCommits: totalCommits * 10, // Estimate based on public activity
      contributions365Days: totalCommits * 5, // Rough estimate
    };
  }

  private async getLanguageStats(username: string) {
    const { data: repos } = await this.octokit.repos.listForUser({
      username,
      type: 'owner',
      per_page: 30,
    });

    const languageStats: { [key: string]: number } = {};

    // Aggregate language statistics from top repos
    for (const repo of repos.slice(0, 10)) { // Top 10 repos
      try {
        const { data: languages } = await this.octokit.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });

        Object.entries(languages).forEach(([lang, bytes]) => {
          languageStats[lang] = (languageStats[lang] || 0) + (bytes as number);
        });
      } catch (e) {
        // Ignore private repos or errors
      }
    }

    return languageStats;
  }

  private getDateMonthsFromNow(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString();
  }

  private generateGitHubSignature(data: any): string {
    // In production, this would use GitHub's webhook signature
    return 'gh_sig_' + Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 20);
  }

  private async generateZKProof(type: string, value: number, threshold: number): Promise<any> {
    // This would call our ZK circuit
    return {
      pi_a: ['0x1234...', '0x5678...'],
      pi_b: [['0x9abc...', '0xdef0...'], ['0x1111...', '0x2222...']],
      pi_c: ['0x3333...', '0x4444...'],
      protocol: 'groth16',
    };
  }
}

// Export factory function
export const createGitHubConnector = (accessToken?: string) => new GitHubConnector(accessToken);