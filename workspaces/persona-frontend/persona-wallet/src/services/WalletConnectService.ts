import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { WALLET_CONNECT_CONFIG } from '../config/personachain';

export class WalletConnectService {
  private connector?: WalletConnect;

  async initializeWalletConnect(): Promise<WalletConnect> {
    this.connector = new WalletConnect({
      bridge: WALLET_CONNECT_CONFIG.bridge,
      qrcodeModal: QRCodeModal,
    });

    if (!this.connector.connected) {
      await this.connector.createSession();
    }

    this.connector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }

      const { accounts, chainId } = payload.params[0];
      console.log('🔗 WalletConnect connected:', { accounts, chainId });
    });

    this.connector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      const { accounts, chainId } = payload.params[0];
      console.log('🔗 WalletConnect session updated:', { accounts, chainId });
    });

    this.connector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      console.log('🔗 WalletConnect disconnected');
    });

    return this.connector;
  }

  async connectWallet(): Promise<string[]> {
    if (!this.connector) {
      await this.initializeWalletConnect();
    }

    if (!this.connector!.connected) {
      await this.connector!.createSession();
    }

    return this.connector!.accounts;
  }

  async disconnectWallet(): Promise<void> {
    if (this.connector && this.connector.connected) {
      await this.connector.killSession();
    }
  }

  isConnected(): boolean {
    return this.connector?.connected || false;
  }

  getAccounts(): string[] {
    return this.connector?.accounts || [];
  }

  getChainId(): number {
    return this.connector?.chainId || 0;
  }
}

export const walletConnectService = new WalletConnectService();