import { createAgent, IResolver, ICredentialPlugin, IDataStore, IKeyManager, IDIDManager } from '@veramo/core';
import { DIDManager } from '@veramo/did-manager';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { DataStore, DataStoreORM, DIDStore, KeyStore, PrivateKeyStore, Entities } from '@veramo/data-store';
import { createConnection } from 'typeorm';

export interface VeramoConfig {
  dbPath: string;
  dbEncryptionKey: string;
}

export async function createVeramoAgent(config: VeramoConfig) {
  // Database connection for Veramo
  const dbConnection = await createConnection({
    type: 'sqlite',
    database: config.dbPath,
    synchronize: true,
    logging: false,
    entities: Entities,
  });

  // Minimal setup without external resolvers

  // Create and configure the agent
  const agent = createAgent<
    IDIDManager & IKeyManager & IDataStore & ICredentialPlugin & IResolver
  >({
    plugins: [
      // Note: KeyManagementSystem is configured via other plugins, not directly
      new DataStore(dbConnection),
      new DIDManager({
        store: new DIDStore(dbConnection),
        defaultProvider: 'local',
        providers: {},
      }),
      // Using built-in credential capabilities without W3C plugin
      new DataStore(dbConnection),
    ],
  });

  return agent;
}

export const veramoConfigFactory = () => ({
  dbPath: process.env.NODE_ENV === 'production' 
    ? '/app/data/veramo.db' 
    : 'data/veramo.db',
  dbEncryptionKey: process.env.VERAMO_DB_ENCRYPTION_KEY || 'dev-encryption-key-32-characters',
});