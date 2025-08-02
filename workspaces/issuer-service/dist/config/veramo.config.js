"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.veramoConfigFactory = void 0;
exports.createVeramoAgent = createVeramoAgent;
const core_1 = require("@veramo/core");
const did_manager_1 = require("@veramo/did-manager");
const data_store_1 = require("@veramo/data-store");
const typeorm_1 = require("typeorm");
async function createVeramoAgent(config) {
    const dbConnection = await (0, typeorm_1.createConnection)({
        type: 'sqlite',
        database: config.dbPath,
        synchronize: true,
        logging: false,
        entities: data_store_1.Entities,
    });
    const agent = (0, core_1.createAgent)({
        plugins: [
            new data_store_1.DataStore(dbConnection),
            new did_manager_1.DIDManager({
                store: new data_store_1.DIDStore(dbConnection),
                defaultProvider: 'local',
                providers: {},
            }),
            new data_store_1.DataStore(dbConnection),
        ],
    });
    return agent;
}
const veramoConfigFactory = () => ({
    dbPath: process.env.NODE_ENV === 'production'
        ? '/app/data/veramo.db'
        : 'data/veramo.db',
    dbEncryptionKey: process.env.VERAMO_DB_ENCRYPTION_KEY || 'dev-encryption-key-32-characters',
});
exports.veramoConfigFactory = veramoConfigFactory;
//# sourceMappingURL=veramo.config.js.map