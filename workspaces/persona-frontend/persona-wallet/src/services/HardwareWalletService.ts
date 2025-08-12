// Real Hardware Wallet Integration for PersonaWallet
// Supports Ledger and Trezor devices with real libraries

import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import CosmosApp from '@ledgerhq/hw-app-cosmos';
import Transport from '@ledgerhq/hw-transport';
import { TransportError } from '@ledgerhq/errors';
import TrezorConnect, { DEVICE_EVENT, DEVICE, UI_EVENT } from 'trezor-connect';
import * as secp256k1 from '@noble/secp256k1';

// Trezor manifest configuration
const TREZOR_MANIFEST = {
  email: 'support@personapass.xyz',
  appUrl: 'https://wallet.personapass.xyz'
};

export interface HardwareWalletInfo {
  id: string;
  type: 'ledger' | 'trezor';
  model: string;
  version: string;
  connected: boolean;
  appInstalled?: boolean;
}

export interface SignedTransaction {
  signature: Uint8Array;
  publicKey: Uint8Array;
  signed: any;
}

export interface CosmosAddress {
  address: string;
  publicKey: Uint8Array;
  path: string;
}

export class HardwareWalletService {
  private connectedDevices: Map<string, any> = new Map();
  private trezorInitialized = false;

  constructor() {
    this.initializeTrezor();
  }

  /**
   * Initialize Trezor Connect
   */
  private async initializeTrezor(): Promise<void> {
    try {
      if (this.trezorInitialized) return;

      await TrezorConnect.init({
        lazyLoad: true,
        manifest: TREZOR_MANIFEST,
        popup: false, // Use popup for better UX
        webusb: true,
        debug: false
      });

      // Set up device event listeners
      TrezorConnect.on(DEVICE_EVENT, (event) => {
        console.log('Trezor device event:', event);
        this.handleTrezorDeviceEvent(event);
      });

      TrezorConnect.on(UI_EVENT, (event) => {
        console.log('Trezor UI event:', event);
      });

      this.trezorInitialized = true;
      console.log('Trezor Connect initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Trezor Connect:', error);
      throw new Error(`Trezor initialization failed: ${error}`);
    }
  }

  /**
   * Handle Trezor device events
   */
  private handleTrezorDeviceEvent(event: any): void {
    const { type, payload } = event;
    
    switch (type) {
      case 'device-connect':
        console.log('Trezor device connected:', payload);
        break;
      case 'device-disconnect':
        console.log('Trezor device disconnected:', payload);
        this.handleTrezorDisconnect(payload);
        break;
      default:
        break;
    }
  }

  /**
   * Handle Trezor disconnect
   */
  private handleTrezorDisconnect(payload: any): void {
    Array.from(this.connectedDevices.entries()).forEach(([deviceId, device]) => {
      if (device.type === 'trezor' && device.features?.device_id === payload.device_id) {
        this.connectedDevices.delete(deviceId);
        console.log(`Trezor device ${deviceId} removed from connected devices`);
      }
    });
  }

  /**
   * Detect connected hardware wallets
   */
  async detectHardwareWallets(): Promise<HardwareWalletInfo[]> {
    const devices: HardwareWalletInfo[] = [];

    try {
      // Detect Ledger devices
      const ledgerDevices = await this.detectLedger();
      devices.push(...ledgerDevices);

      // Detect Trezor devices  
      const trezorDevices = await this.detectTrezor();
      devices.push(...trezorDevices);

    } catch (error) {
      console.error('Error detecting hardware wallets:', error);
    }

    return devices;
  }

  /**
   * Connect to Ledger device
   */
  async connectLedger(): Promise<HardwareWalletInfo> {
    try {
      // Check if Web USB is supported
      if (!TransportWebUSB.isSupported()) {
        throw new Error('Web USB not supported. Please use Chrome/Edge browser with HTTPS.');
      }

      // Request USB device permission and create transport
      const transport = await TransportWebUSB.create();
      
      // Initialize Cosmos app
      const cosmosApp = new CosmosApp(transport);
      
      // Get device info
      const appInfo = await cosmosApp.getAppConfiguration();
      
      // Test connection by getting app info
      console.log('Ledger Cosmos app info:', appInfo);

      // Store connected device
      const deviceId = `ledger_${Date.now()}`;
      this.connectedDevices.set(deviceId, {
        id: deviceId,
        type: 'ledger',
        transport,
        app: cosmosApp,
        appInfo
      });

      return {
        id: deviceId,
        type: 'ledger',
        model: 'Ledger Device',
        version: appInfo.version || '1.0.0',
        connected: true,
        appInstalled: true
      };

    } catch (error) {
      console.error('Error connecting to Ledger:', error);
      
      if (error instanceof TransportError) {
        if (error.message.includes('0x6e00')) {
          throw new Error('Cosmos app not installed on Ledger device. Please install the Cosmos app using Ledger Live.');
        } else if (error.message.includes('0x6985')) {
          throw new Error('Transaction rejected by user on Ledger device.');
        }
      }
      
      throw new Error(`Failed to connect to Ledger: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Connect to Trezor device
   */
  async connectTrezor(): Promise<HardwareWalletInfo> {
    try {
      if (!this.trezorInitialized) {
        await this.initializeTrezor();
      }

      // Get device features
      const result = await TrezorConnect.getFeatures();
      
      if (!result.success) {
        throw new Error(`Trezor connection failed: ${result.payload.error}`);
      }

      const features = result.payload;
      const deviceId = `trezor_${features.device_id}`;
      
      this.connectedDevices.set(deviceId, {
        id: deviceId,
        type: 'trezor',
        features,
        connect: TrezorConnect
      });

      return {
        id: deviceId,
        type: 'trezor', 
        model: features.model || 'Trezor Device',
        version: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
        connected: true,
        appInstalled: true // Trezor supports Cosmos natively
      };

    } catch (error) {
      console.error('Error connecting to Trezor:', error);
      throw new Error(`Failed to connect to Trezor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get wallet address from hardware device
   */
  async getAddress(deviceId: string, path: string = "m/44'/118'/0'/0/0"): Promise<CosmosAddress> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error('Hardware device not connected');
    }

    try {
      if (device.type === 'ledger') {
        return await this.getLedgerAddress(device, path);
      } else if (device.type === 'trezor') {
        return await this.getTrezorAddress(device, path);
      }
      
      throw new Error('Unsupported device type');
    } catch (error) {
      console.error('Error getting address from hardware wallet:', error);
      throw error;
    }
  }

  /**
   * Sign transaction with hardware wallet
   */
  async signTransaction(
    deviceId: string, 
    transaction: any,
    path: string = "m/44'/118'/0'/0/0"
  ): Promise<SignedTransaction> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error('Hardware device not connected');
    }

    try {
      if (device.type === 'ledger') {
        return await this.signWithLedger(device, transaction, path);
      } else if (device.type === 'trezor') {
        return await this.signWithTrezor(device, transaction, path);
      }
      
      throw new Error('Unsupported device type');
    } catch (error) {
      console.error('Error signing with hardware wallet:', error);
      throw error;
    }
  }

  /**
   * Verify hardware wallet signature
   */
  async verifySignature(
    publicKey: Uint8Array,
    signature: Uint8Array, 
    message: Uint8Array
  ): Promise<boolean> {
    try {
      // Use proper secp256k1 verification (Cosmos uses secp256k1)
      const messageBuffer = new ArrayBuffer(message.length);
      const messageView = new Uint8Array(messageBuffer);
      messageView.set(message);
      
      const messageHash = await crypto.subtle.digest('SHA-256', messageBuffer);
      const hashArray = new Uint8Array(messageHash);
      
      // Verify signature using secp256k1
      return secp256k1.verify(signature, hashArray, publicKey);
    } catch (error) {
      console.error('Error verifying secp256k1 signature:', error);
      return false;
    }
  }

  /**
   * Disconnect hardware wallet
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    
    if (device) {
      try {
        if (device.type === 'ledger' && device.transport) {
          await device.transport.close();
        } else if (device.type === 'trezor') {
          // Trezor Connect manages connections automatically
          console.log('Trezor device connection managed automatically');
        }
      } catch (error) {
        console.error('Error disconnecting device:', error);
      }
      
      this.connectedDevices.delete(deviceId);
    }
  }

  // Private helper methods for real hardware wallet integration

  private async detectLedger(): Promise<HardwareWalletInfo[]> {
    try {
      if (!TransportWebUSB.isSupported()) {
        return [];
      }
      
      // Check if any Ledger devices are available
      const devices = await TransportWebUSB.list();
      
      return devices.map((_, index) => ({
        id: `ledger_detected_${index}`,
        type: 'ledger' as const,
        model: 'Ledger Device',
        version: 'Unknown',
        connected: false // Not connected yet, just detected
      }));
    } catch (error) {
      console.error('Error detecting Ledger devices:', error);
      return [];
    }
  }

  private async detectTrezor(): Promise<HardwareWalletInfo[]> {
    try {
      if (!this.trezorInitialized) {
        await this.initializeTrezor();
      }

      // Try to enumerate devices
      const result = await TrezorConnect.getFeatures();
      
      if (result.success) {
        const features = result.payload;
        return [{
          id: `trezor_detected_${features.device_id}`,
          type: 'trezor' as const,
          model: features.model || 'Trezor Device',
          version: `${features.major_version}.${features.minor_version}.${features.patch_version}`,
          connected: false // Not connected yet, just detected
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error detecting Trezor devices:', error);
      return [];
    }
  }

  private async getLedgerAddress(device: any, path: string): Promise<CosmosAddress> {
    try {
      const response = await device.app.getAddress(path, 'persona');
      
      return {
        address: response.bech32_address,
        publicKey: response.compressed_pk,
        path
      };
    } catch (error) {
      console.error('Error getting Ledger address:', error);
      
      if (error instanceof Error && error.message.includes('0x6e00')) {
        throw new Error('Cosmos app not open on Ledger device. Please open the Cosmos app.');
      }
      
      throw error;
    }
  }

  private async getTrezorAddress(device: any, path: string): Promise<CosmosAddress> {
    try {
      const response = await TrezorConnect.getAddress({
        path,
        coin: 'cosmos'
      });
      
      if (!response.success) {
        throw new Error(`Trezor error: ${response.payload.error}`);
      }
      
      return {
        address: response.payload.address,
        publicKey: new Uint8Array(), // Trezor provides public key separately
        path
      };
    } catch (error) {
      console.error('Error getting Trezor address:', error);
      throw error;
    }
  }

  private async signWithLedger(
    device: any, 
    transaction: any, 
    path: string
  ): Promise<SignedTransaction> {
    try {
      // Prepare transaction for Ledger (convert to proper Cosmos format)
      const txData = this.prepareLedgerTransaction(transaction);
      
      // Sign with Ledger Cosmos app
      const response = await device.app.sign(path, JSON.stringify(txData));
      
      return {
        signature: response.signature,
        publicKey: response.compressed_pk,
        signed: transaction
      };
    } catch (error) {
      console.error('Error signing with Ledger:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('0x6985')) {
          throw new Error('Transaction rejected by user on Ledger device.');
        } else if (error.message.includes('0x6e00')) {
          throw new Error('Cosmos app not open on Ledger device. Please open the Cosmos app.');
        }
      }
      
      throw error;
    }
  }

  private async signWithTrezor(
    device: any, 
    transaction: any, 
    path: string
  ): Promise<SignedTransaction> {
    try {
      // For now, use a generic signing approach since cosmosSignTransaction might not be available
      // In production, check the Trezor Connect API documentation for the correct Cosmos signing method
      
      throw new Error('Trezor Cosmos signing not yet implemented - awaiting proper Trezor Connect Cosmos integration');
      
      // TODO: Implement proper Trezor Cosmos signing when available
      // const response = await TrezorConnect.someCosmosMethod({
      //   path,
      //   message: this.prepareTrezorTransaction(transaction)
      // });
      
    } catch (error) {
      console.error('Error signing with Trezor:', error);
      throw error;
    }
  }

  private prepareLedgerTransaction(transaction: any): any {
    // Convert PersonaWallet transaction to Ledger Cosmos format
    return {
      account_number: transaction.account_number || '0',
      chain_id: transaction.chain_id || 'personachain-1',
      fee: transaction.fee || { amount: [], gas: '200000' },
      memo: transaction.memo || '',
      msgs: transaction.msgs || [],
      sequence: transaction.sequence || '0'
    };
  }

  private prepareTrezorTransaction(transaction: any): any {
    // Convert PersonaWallet transaction to Trezor format
    return {
      account_number: transaction.account_number || 0,
      chain_id: transaction.chain_id || 'personachain-1',
      fee: transaction.fee || { amount: [], gas: 200000 },
      memo: transaction.memo || '',
      msgs: transaction.msgs || [],
      sequence: transaction.sequence || 0
    };
  }

  /**
   * Get list of connected devices
   */
  getConnectedDevices(): HardwareWalletInfo[] {
    return Array.from(this.connectedDevices.entries()).map(([id, device]) => ({
      id,
      type: device.type,
      model: device.features?.model || device.appInfo?.name || 'Hardware Wallet',
      version: device.features ? 
        `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}` :
        device.appInfo?.version || '1.0.0',
      connected: true,
      appInstalled: true
    }));
  }

  /**
   * Check if device supports PersonaChain
   */
  async isPersonaChainSupported(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) return false;

    try {
      if (device.type === 'ledger') {
        // Check if Cosmos app is installed and can handle PersonaChain
        try {
          await device.app.getAppConfiguration();
          return true;
        } catch {
          return false;
        }
      } else if (device.type === 'trezor') {
        // Trezor supports Cosmos through firmware
        return device.features?.major_version >= 2; // Trezor Model T and newer
      }
    } catch (error) {
      console.error('Error checking PersonaChain support:', error);
    }

    return false;
  }

  /**
   * Get app version information
   */
  async getAppVersion(deviceId: string): Promise<string | null> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) return null;

    try {
      if (device.type === 'ledger') {
        const appConfig = await device.app.getAppConfiguration();
        return appConfig.version || '1.0.0';
      } else if (device.type === 'trezor') {
        return `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`;
      }
    } catch (error) {
      console.error('Error getting app version:', error);
    }

    return null;
  }

  /**
   * Test device connection
   */
  async testConnection(deviceId: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) return false;

    try {
      if (device.type === 'ledger') {
        await device.app.getAppConfiguration();
        return true;
      } else if (device.type === 'trezor') {
        const result = await TrezorConnect.getFeatures();
        return result.success;
      }
    } catch (error) {
      console.error('Error testing device connection:', error);
    }

    return false;
  }
}

// Export singleton instance
export const hardwareWalletService = new HardwareWalletService();