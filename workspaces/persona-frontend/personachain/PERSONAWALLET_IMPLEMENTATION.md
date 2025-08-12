# 💎 PERSONAWALLET IMPLEMENTATION GUIDE
## Ultimate Native Wallet with WalletConnect & DID Management

---

## 🎯 ARCHITECTURE OVERVIEW

### 🏗️ Multi-Platform Architecture

```
PersonaWallet Ecosystem/
├── 🌐 personawallet-web/          # React web application
├── 📱 personawallet-mobile/       # React Native apps
├── 🔌 personawallet-extension/    # Browser extension
├── 🖥️ personawallet-desktop/     # Electron desktop app
├── 🔧 personawallet-api/          # Backend API service
├── 📚 personawallet-sdk/          # JavaScript SDK
└── 🧩 personawallet-shared/       # Shared UI components
```

### 🛠️ Technology Stack

**Frontend Technologies**:
- **React 18**: Modern React with concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **React Query**: Data fetching and caching
- **Zustand**: Lightweight state management

**Mobile Technologies**:
- **React Native**: Cross-platform mobile development
- **Expo**: Development toolchain
- **React Navigation**: Navigation library
- **React Native Biometrics**: Fingerprint/Face ID
- **React Native Keychain**: Secure storage

**Backend Technologies**:
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **Docker**: Containerization
- **AWS**: Cloud infrastructure

---

## 💼 CORE WALLET FEATURES

### 🔐 Wallet Management

```typescript
// src/core/wallet/WalletManager.ts
import { HDKey } from '@scure/bip32';
import { mnemonicToSeed } from '@scure/bip39';
import { PersonaChainClient } from './PersonaChainClient';

export class WalletManager {
  private hdKey: HDKey | null = null;
  private accounts: Account[] = [];
  
  // Create new wallet with mnemonic
  async createWallet(mnemonic: string, password?: string): Promise<Wallet> {
    const seed = await mnemonicToSeed(mnemonic);
    this.hdKey = HDKey.fromMasterSeed(seed);
    
    // Generate default account
    const account = this.deriveAccount(0);
    this.accounts.push(account);
    
    return {
      id: generateWalletId(),
      accounts: this.accounts,
      created: new Date(),
      encrypted: password ? await this.encrypt(mnemonic, password) : null
    };
  }
  
  // Derive account from HD path
  private deriveAccount(index: number): Account {
    const path = `m/44'/118'/${index}'/0/0`; // Cosmos derivation path
    const privateKey = this.hdKey!.derive(path).privateKey;
    
    return {
      index,
      privateKey: Buffer.from(privateKey!).toString('hex'),
      publicKey: getPublicKey(privateKey!),
      address: getAddress(privateKey!),
      balance: '0',
      did: null // Will be created later
    };
  }
  
  // Sign transaction
  async signTransaction(tx: Transaction, accountIndex: number): Promise<SignedTx> {
    const account = this.accounts[accountIndex];
    const signature = await sign(tx.signBytes, account.privateKey);
    
    return {
      ...tx,
      signature,
      signer: account.address
    };
  }
}

// Account interface
interface Account {
  index: number;
  privateKey: string;
  publicKey: string;
  address: string;
  balance: string;
  did: string | null;
}
```

### 🆔 DID Integration

```typescript
// src/core/identity/DIDManager.ts
import { PersonaChainClient } from '../blockchain/PersonaChainClient';

export class DIDManager {
  private client: PersonaChainClient;
  
  constructor(client: PersonaChainClient) {
    this.client = client;
  }
  
  // Create DID for wallet account
  async createDID(account: Account): Promise<DID> {
    const didDocument = {
      id: `did:persona:${account.address}`,
      controller: account.address,
      verificationMethod: [{
        id: `did:persona:${account.address}#key1`,
        type: 'Ed25519VerificationKey2018',
        controller: `did:persona:${account.address}`,
        publicKeyBase58: account.publicKey
      }],
      service: [{
        id: `did:persona:${account.address}#persona-service`,
        type: 'PersonaChainService',
        serviceEndpoint: 'https://personachain.io/did-service'
      }]
    };
    
    // Create DID on PersonaChain
    const tx = await this.client.createDID(didDocument);
    const result = await this.client.broadcast(tx);
    
    if (result.success) {
      return {
        did: didDocument.id,
        document: didDocument,
        created: new Date(),
        status: 'active'
      };
    }
    
    throw new Error(`Failed to create DID: ${result.error}`);
  }
  
  // Get DID document
  async getDIDDocument(did: string): Promise<DIDDocument> {
    return await this.client.queryDID(did);
  }
  
  // Update DID document
  async updateDID(did: string, updates: Partial<DIDDocument>): Promise<void> {
    const tx = await this.client.updateDID(did, updates);
    await this.client.broadcast(tx);
  }
}
```

### 🔗 WalletConnect Integration

```typescript
// src/core/walletconnect/WalletConnectManager.ts
import { WalletConnect } from '@walletconnect/client';
import { formatJsonRpcRequest } from '@walletconnect/jsonrpc-utils';

export class WalletConnectManager {
  private connector: WalletConnect | null = null;
  private sessions: Map<string, WalletConnectSession> = new Map();
  
  // Initialize WalletConnect
  async initialize(): Promise<void> {
    this.connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: {
        open: this.showQRModal,
        close: this.hideQRModal
      }
    });
    
    this.connector.on('session_request', this.handleSessionRequest);
    this.connector.on('call_request', this.handleCallRequest);
    this.connector.on('disconnect', this.handleDisconnect);
  }
  
  // Handle session request
  private handleSessionRequest = async (error: any, payload: any) => {
    if (error) throw error;
    
    const { peerId, peerMeta, chainId } = payload.params[0];
    
    // Show approval modal to user
    const approved = await this.showApprovalModal({
      name: peerMeta.name,
      description: peerMeta.description,
      url: peerMeta.url,
      icons: peerMeta.icons,
      chainId
    });
    
    if (approved) {
      const accounts = await this.getConnectedAccounts();
      this.connector!.approveSession({
        accounts,
        chainId: 'personachain-1'
      });
      
      // Store session
      this.sessions.set(peerId, {
        peerId,
        peerMeta,
        accounts,
        chainId,
        connected: true
      });
    } else {
      this.connector!.rejectSession();
    }
  };
  
  // Handle call request (transaction signing)
  private handleCallRequest = async (error: any, payload: any) => {
    if (error) throw error;
    
    const { method, params } = payload;
    
    switch (method) {
      case 'persona_signTransaction':
        return this.handleSignTransaction(payload.id, params);
      case 'persona_sendTransaction':
        return this.handleSendTransaction(payload.id, params);
      case 'persona_signMessage':
        return this.handleSignMessage(payload.id, params);
      case 'persona_createDID':
        return this.handleCreateDID(payload.id, params);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  };
  
  // Handle transaction signing
  private async handleSignTransaction(id: number, params: any[]): Promise<void> {
    const [transaction] = params;
    
    // Show transaction preview to user
    const approved = await this.showTransactionModal(transaction);
    
    if (approved) {
      const signedTx = await this.walletManager.signTransaction(transaction);
      this.connector!.approveRequest({
        id,
        result: signedTx
      });
    } else {
      this.connector!.rejectRequest({
        id,
        error: { message: 'User rejected transaction' }
      });
    }
  }
  
  // Connect to dApp
  async connectToDApp(uri: string): Promise<void> {
    await this.connector!.createSession({ chainId: 'personachain-1' });
  }
}
```

### 💳 Multi-Asset Support

```typescript
// src/core/assets/AssetManager.ts
export class AssetManager {
  private supportedAssets: Map<string, Asset> = new Map();
  
  constructor() {
    this.initializeSupportedAssets();
  }
  
  private initializeSupportedAssets(): void {
    // PersonaChain native token
    this.supportedAssets.set('persona', {
      denom: 'persona',
      symbol: 'PERSONA',
      name: 'Persona Token',
      decimals: 6,
      icon: '/assets/persona-icon.svg',
      type: 'native',
      chainId: 'personachain-1'
    });
    
    // IBC tokens
    this.supportedAssets.set('atom', {
      denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      symbol: 'ATOM',
      name: 'Cosmos Hub',
      decimals: 6,
      icon: '/assets/atom-icon.svg',
      type: 'ibc',
      chainId: 'cosmoshub-4'
    });
    
    // Ethereum tokens via bridge
    this.supportedAssets.set('weth', {
      denom: 'weth',
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      decimals: 18,
      icon: '/assets/eth-icon.svg',
      type: 'bridged',
      chainId: 'ethereum'
    });
  }
  
  // Get asset balance
  async getBalance(address: string, denom: string): Promise<string> {
    const asset = this.supportedAssets.get(denom);
    if (!asset) throw new Error(`Unsupported asset: ${denom}`);
    
    switch (asset.type) {
      case 'native':
        return await this.getNativeBalance(address, denom);
      case 'ibc':
        return await this.getIBCBalance(address, denom);
      case 'bridged':
        return await this.getBridgedBalance(address, denom);
      default:
        throw new Error(`Unknown asset type: ${asset.type}`);
    }
  }
  
  // Send tokens
  async sendTokens(
    from: string,
    to: string,
    amount: string,
    denom: string
  ): Promise<TransactionResult> {
    const asset = this.supportedAssets.get(denom);
    if (!asset) throw new Error(`Unsupported asset: ${denom}`);
    
    const tx = {
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: from,
        to_address: to,
        amount: [{
          denom,
          amount
        }]
      }
    };
    
    return await this.client.broadcast(tx);
  }
}
```

---

## 📱 MOBILE APPLICATION

### 🔐 Biometric Authentication

```typescript
// src/mobile/security/BiometricAuth.ts
import TouchID from 'react-native-touch-id';
import { Keychain } from 'react-native-keychain';

export class BiometricAuth {
  // Check biometric availability
  static async isAvailable(): Promise<boolean> {
    try {
      const biometryType = await TouchID.isSupported();
      return biometryType !== false;
    } catch {
      return false;
    }
  }
  
  // Authenticate with biometrics
  static async authenticate(reason: string): Promise<boolean> {
    try {
      await TouchID.authenticate(reason, {
        title: 'PersonaWallet Authentication',
        subtitle: 'Use your biometric to access your wallet',
        description: reason,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel'
      });
      return true;
    } catch {
      return false;
    }
  }
  
  // Store sensitive data with biometric protection
  static async storeSecure(key: string, data: string): Promise<void> {
    await Keychain.setInternetCredentials(
      key,
      'personawallet',
      data,
      {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS
      }
    );
  }
  
  // Retrieve secure data with biometric authentication
  static async getSecure(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  }
}
```

### 📱 React Native App Structure

```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { WalletProvider } from './src/providers/WalletProvider';
import { ThemeProvider } from './src/providers/ThemeProvider';

// Screens
import OnboardingScreen from './src/screens/OnboardingScreen';
import WalletScreen from './src/screens/WalletScreen';
import SendScreen from './src/screens/SendScreen';
import ReceiveScreen from './src/screens/ReceiveScreen';
import DIDScreen from './src/screens/DIDScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Onboarding">
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Wallet" 
              component={WalletScreen}
              options={{ title: 'PersonaWallet' }}
            />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Receive" component={ReceiveScreen} />
            <Stack.Screen name="DID" component={DIDScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </ThemeProvider>
  );
}
```

---

## 🌐 WEB APPLICATION

### ⚛️ React Web App

```typescript
// src/web/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './providers/WalletProvider';

// Components
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Receive from './pages/Receive';
import Identity from './pages/Identity';
import Staking from './pages/Staking';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Header />
              <main className="flex-1 overflow-auto p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/send" element={<Send />} />
                  <Route path="/receive" element={<Receive />} />
                  <Route path="/identity" element={<Identity />} />
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}
```

### 🎨 Dashboard Component

```typescript
// src/web/pages/Dashboard.tsx
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatCurrency } from '../utils/currency';

// Components
import AssetList from '../components/AssetList';
import TransactionHistory from '../components/TransactionHistory';
import IdentityCard from '../components/IdentityCard';
import StakingOverview from '../components/StakingOverview';

export default function Dashboard() {
  const { wallet, balance, isLoading } = useWallet();
  
  if (isLoading) {
    return <div>Loading wallet...</div>;
  }
  
  if (!wallet) {
    return <div>Please connect your wallet</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          Manage your digital identity and assets
        </p>
      </div>
      
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-persona-600">
            ${formatCurrency(balance.total)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">PERSONA Balance</h3>
          <p className="text-3xl font-bold text-persona-600">
            {balance.persona} PERSONA
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Staked</h3>
          <p className="text-3xl font-bold text-green-600">
            {balance.staked} PERSONA
          </p>
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Assets</h2>
          </div>
          <AssetList />
        </div>
        
        {/* Identity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Digital Identity</h2>
          </div>
          <div className="p-6">
            <IdentityCard />
          </div>
        </div>
      </div>
      
      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staking */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Staking Overview</h2>
          </div>
          <StakingOverview />
        </div>
        
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
          </div>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
```

---

## 🔌 BROWSER EXTENSION

### 📦 Extension Manifest

```json
{
  "manifest_version": 3,
  "name": "PersonaWallet",
  "version": "1.0.0",
  "description": "Your digital identity wallet for Web3",
  
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  
  "host_permissions": [
    "https://*/*"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "PersonaWallet"
  },
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  
  "web_accessible_resources": [{
    "resources": ["inject.js"],
    "matches": ["<all_urls>"]
  }]
}
```

### 🌐 Content Script Integration

```typescript
// src/extension/content.js
import { PersonaWalletProvider } from './providers/PersonaWalletProvider';

class PersonaWalletContentScript {
  private provider: PersonaWalletProvider;
  
  constructor() {
    this.provider = new PersonaWalletProvider();
    this.injectProvider();
    this.setupEventListeners();
  }
  
  // Inject PersonaWallet provider into page
  private injectProvider(): void {
    // Inject provider script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('inject.js');
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
    
    // Setup communication bridge
    window.addEventListener('message', this.handlePageMessage.bind(this));
  }
  
  // Handle messages from web pages
  private handlePageMessage(event: MessageEvent): void {
    if (event.source !== window || !event.data.type) return;
    
    if (event.data.type === 'PERSONA_WALLET_REQUEST') {
      this.handleWalletRequest(event.data);
    }
  }
  
  // Handle wallet requests
  private async handleWalletRequest(data: any): Promise<void> {
    const { method, params, id } = data;
    
    try {
      let result;
      
      switch (method) {
        case 'connect':
          result = await this.provider.connect();
          break;
        case 'getAccounts':
          result = await this.provider.getAccounts();
          break;
        case 'signTransaction':
          result = await this.provider.signTransaction(params);
          break;
        case 'signMessage':
          result = await this.provider.signMessage(params);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      
      // Send response back to page
      window.postMessage({
        type: 'PERSONA_WALLET_RESPONSE',
        id,
        result
      }, '*');
      
    } catch (error) {
      window.postMessage({
        type: 'PERSONA_WALLET_RESPONSE',
        id,
        error: error.message
      }, '*');
    }
  }
}

// Initialize content script
new PersonaWalletContentScript();
```

---

## 🖥️ DESKTOP APPLICATION

### ⚡ Electron Main Process

```typescript
// src/desktop/main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

class PersonaWalletDesktop {
  private mainWindow: BrowserWindow | null = null;
  
  constructor() {
    this.initializeApp();
  }
  
  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupIPC();
      this.setupAutoUpdater();
    });
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }
  
  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 600,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      icon: path.join(__dirname, 'assets/icon.png')
    });
    
    // Load app
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile('dist/index.html');
    }
  }
  
  private setupIPC(): void {
    // Handle wallet operations
    ipcMain.handle('wallet:create', async (event, mnemonic) => {
      // Create wallet logic
      return { success: true };
    });
    
    ipcMain.handle('wallet:import', async (event, mnemonic) => {
      // Import wallet logic
      return { success: true };
    });
    
    ipcMain.handle('wallet:sign', async (event, transaction) => {
      // Sign transaction
      return { signature: 'signed_tx' };
    });
    
    // Handle file operations
    ipcMain.handle('file:saveWallet', async (event, data) => {
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'PersonaWallet', extensions: ['json'] }]
      });
      
      if (!result.canceled && result.filePath) {
        // Save wallet file
        return { success: true, path: result.filePath };
      }
      
      return { success: false };
    });
  }
  
  private setupAutoUpdater(): void {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      dialog.showMessageBox(this.mainWindow!, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version of PersonaWallet is available. It will be downloaded in the background.',
        buttons: ['OK']
      });
    });
  }
}

// Initialize desktop app
new PersonaWalletDesktop();
```

---

## 🔄 BACKEND API SERVICE

### 🌐 Express API Server

```typescript
// src/api/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

// Routes
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import identityRoutes from './routes/identity';
import transactionRoutes from './routes/transactions';
import stakingRoutes from './routes/staking';

class PersonaWalletAPI {
  private app: express.Application;
  private server: any;
  private io: SocketServer;
  
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketServer(this.server, {
      cors: { origin: process.env.CORS_ORIGIN || '*' }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }
  
  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  private setupRoutes(): void {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/wallet', walletRoutes);
    this.app.use('/api/identity', identityRoutes);
    this.app.use('/api/transactions', transactionRoutes);
    this.app.use('/api/staking', stakingRoutes);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }
  
  private setupSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Join wallet room for real-time updates
      socket.on('join-wallet', (walletAddress) => {
        socket.join(`wallet:${walletAddress}`);
      });
      
      // Handle transaction updates
      socket.on('transaction-status', (txHash) => {
        this.subscribeToTransaction(socket, txHash);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  public start(port: number = 3001): void {
    this.server.listen(port, () => {
      console.log(`PersonaWallet API running on port ${port}`);
    });
  }
  
  // Emit real-time updates
  public emitWalletUpdate(walletAddress: string, data: any): void {
    this.io.to(`wallet:${walletAddress}`).emit('wallet-update', data);
  }
  
  public emitTransactionUpdate(txHash: string, status: any): void {
    this.io.emit('transaction-update', { txHash, status });
  }
}

// Start server
const api = new PersonaWalletAPI();
api.start();

export default api;
```

---

## 🏁 IMPLEMENTATION ROADMAP

### 📅 Development Timeline

**Week 1-2: Core Infrastructure**
- [ ] Set up monorepo structure
- [ ] Implement wallet management core
- [ ] Create DID integration layer
- [ ] Set up blockchain clients

**Week 3-4: Web Application** 
- [ ] Build React web app
- [ ] Implement dashboard and navigation
- [ ] Add send/receive functionality
- [ ] Create identity management UI

**Week 5-6: Mobile Applications**
- [ ] Build React Native apps
- [ ] Implement biometric authentication
- [ ] Add mobile-specific features
- [ ] Test on iOS and Android

**Week 7-8: Browser Extension**
- [ ] Create Chrome/Firefox extensions
- [ ] Implement content script injection
- [ ] Add dApp communication layer
- [ ] Test WalletConnect integration

**Week 9-10: Desktop & API**
- [ ] Build Electron desktop app
- [ ] Create backend API service
- [ ] Implement real-time updates
- [ ] Add enterprise features

### 🎯 Success Metrics

- **10K+** wallet downloads in first month
- **95%+** uptime for all services
- **<500ms** average response time
- **100+** dApp integrations
- **5-star** app store ratings

**Ready to build the ultimate PersonaWallet! 🚀💎**