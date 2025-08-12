import { IKeyManager } from '@veramo/core';
export interface VeramoConfig {
    dbPath: string;
    dbEncryptionKey: string;
}
export declare function createVeramoAgent(config: VeramoConfig): Promise<{
    [x: string]: import("@veramo/core").RemoveContext<import("@veramo/core").IPluginMethod>;
    didManagerGetProviders: import("@veramo/core").RemoveContext<() => Promise<Array<string>>>;
    didManagerFind: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerFindArgs) => Promise<Array<import("@veramo/core").IIdentifier>>>;
    didManagerGet: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerGetArgs) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerGetByAlias: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerGetByAliasArgs) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerCreate: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerCreateArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerSetAlias: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerSetAliasArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<boolean>>;
    didManagerGetOrCreate: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerGetOrCreateArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerUpdate: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerUpdateArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerImport: import("@veramo/core").RemoveContext<(args: import("@veramo/core").MinimalImportableIdentifier, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<import("@veramo/core").IIdentifier>>;
    didManagerDelete: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerDeleteArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<boolean>>;
    didManagerAddKey: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerAddKeyArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<any>>;
    didManagerRemoveKey: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerRemoveKeyArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<any>>;
    didManagerAddService: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerAddServiceArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<any>>;
    didManagerRemoveService: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDIDManagerRemoveServiceArgs, context: import("@veramo/core").IAgentContext<IKeyManager>) => Promise<any>>;
    keyManagerGetKeyManagementSystems: import("@veramo/core").RemoveContext<() => Promise<Array<string>>>;
    keyManagerCreate: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerCreateArgs) => Promise<import("@veramo/core").ManagedKeyInfo>>;
    keyManagerGet: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerGetArgs) => Promise<import("@veramo/core").IKey>>;
    keyManagerDelete: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerDeleteArgs) => Promise<boolean>>;
    keyManagerImport: import("@veramo/core").RemoveContext<(args: import("@veramo/core").MinimalImportableKey) => Promise<import("@veramo/core").ManagedKeyInfo>>;
    keyManagerSign: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerSignArgs) => Promise<string>>;
    keyManagerSharedSecret: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerSharedSecretArgs) => Promise<string>>;
    keyManagerEncryptJWE: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerEncryptJWEArgs) => Promise<string>>;
    keyManagerDecryptJWE: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerDecryptJWEArgs) => Promise<string>>;
    keyManagerSignJWT: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerSignJWTArgs) => Promise<string>>;
    keyManagerSignEthTX: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IKeyManagerSignEthTXArgs) => Promise<string>>;
    dataStoreSaveMessage: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreSaveMessageArgs) => Promise<string>>;
    dataStoreGetMessage: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreGetMessageArgs) => Promise<import("@veramo/core").IMessage>>;
    dataStoreSaveVerifiableCredential: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreSaveVerifiableCredentialArgs) => Promise<string>>;
    dataStoreDeleteVerifiableCredential: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreDeleteVerifiableCredentialArgs) => Promise<boolean>>;
    dataStoreGetVerifiableCredential: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreGetVerifiableCredentialArgs) => Promise<import("@veramo/core").VerifiableCredential>>;
    dataStoreSaveVerifiablePresentation: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreSaveVerifiablePresentationArgs) => Promise<string>>;
    dataStoreGetVerifiablePresentation: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IDataStoreGetVerifiablePresentationArgs) => Promise<import("@veramo/core").VerifiablePresentation>>;
    createVerifiablePresentation: import("@veramo/core").RemoveContext<(args: import("@veramo/core").ICreateVerifiablePresentationArgs, context: import("@veramo/core").IssuerAgentContext) => Promise<import("@veramo/core").VerifiablePresentation>>;
    createVerifiableCredential: import("@veramo/core").RemoveContext<(args: import("@veramo/core").ICreateVerifiableCredentialArgs, context: import("@veramo/core").IssuerAgentContext) => Promise<import("@veramo/core").VerifiableCredential>>;
    verifyCredential: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IVerifyCredentialArgs, context: import("@veramo/core").VerifierAgentContext) => Promise<import("@veramo/core").IVerifyResult>>;
    verifyPresentation: import("@veramo/core").RemoveContext<(args: import("@veramo/core").IVerifyPresentationArgs, context: import("@veramo/core").VerifierAgentContext) => Promise<import("@veramo/core").IVerifyResult>>;
    resolveDid: import("@veramo/core").RemoveContext<(args: import("@veramo/core").ResolveDidArgs) => Promise<import("did-resolver").DIDResolutionResult>>;
    getDIDComponentById: import("@veramo/core").RemoveContext<(args: import("@veramo/core").GetDIDComponentArgs) => Promise<import("@veramo/core").DIDDocComponent>>;
} & import("@veramo/core").IAgent & {
    context?: Record<string, any>;
}>;
export declare const veramoConfigFactory: () => {
    dbPath: string;
    dbEncryptionKey: string;
};
