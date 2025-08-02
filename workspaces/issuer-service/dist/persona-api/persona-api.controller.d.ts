declare class CreateDIDDto {
    walletAddress: string;
    firstName: string;
    lastName: string;
    authMethod: string;
    identifier: string;
}
export declare class PersonaApiController {
    private readonly logger;
    constructor();
    getHealth(): Promise<{
        status: string;
        timestamp: string;
        service: string;
        version: string;
    }>;
    getCredentials(address: string): Promise<{
        success: boolean;
        credentials: {
            id: string;
            did: string;
            type: string;
            status: string;
            walletAddress: string;
            authMethod: string;
            createdAt: string;
            blockchain: {
                txHash: string;
                blockHeight: number;
                network: string;
            };
            verification: {
                method: string;
                walletType: string;
            };
        }[];
        blockchain: {
            network: string;
            nodeUrl: string;
            totalCredentials: number;
            activeCredentials: number;
            latestBlockHeight: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        credentials?: undefined;
        blockchain?: undefined;
    }>;
    createDID(dto: CreateDIDDto): Promise<{
        success: boolean;
        did: string;
        txHash: string;
        message: string;
        credential: {
            id: string;
            type: string;
            issuer: string;
            issuanceDate: string;
            credentialSubject: {
                id: string;
                walletAddress: string;
                firstName: string;
                lastName: string;
                walletType: string;
                verificationMethod: string;
            };
            proof: {
                type: string;
                created: string;
                proofPurpose: string;
                verificationMethod: string;
                blockchainTxHash: string;
                walletAddress: string;
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: string;
        did?: undefined;
        txHash?: undefined;
        credential?: undefined;
    }>;
    testSystemArchitecture(): Promise<{
        success: boolean;
        results: {
            mainApi: boolean;
            computeEngine: boolean;
            blockchainStorage: boolean;
        };
        message: string;
    }>;
}
export {};
