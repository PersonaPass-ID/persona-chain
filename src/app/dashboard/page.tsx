'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { 
  Shield, 
  User, 
  Key, 
  Clock, 
  CheckCircle, 
  Plus, 
  Settings, 
  LogOut,
  Copy,
  Download,
  ExternalLink,
  Zap,
  Loader2
} from 'lucide-react'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { personaApiClient, PhoneVerificationCredential, APICredential } from '@/lib/api-client'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  authMethod: string
  did: string
  createdAt: string
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [activeSection, setActiveSection] = useState<'overview' | 'credentials' | 'security'>('overview')
  const [userDID, setUserDID] = useState<string>('')
  const [storedCredential, setStoredCredential] = useState<PhoneVerificationCredential | null>(null)
  const [allCredentials, setAllCredentials] = useState<APICredential[]>([])
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)

  // Load user data from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load stored credential
      const credential = personaApiClient.getStoredCredential()
      if (credential) {
        setStoredCredential(credential)
        setUserDID(credential.credentialSubject.id)
      }

      // Load profile data
      const profile = localStorage.getItem('persona_profile')
      if (profile) {
        setProfileData(JSON.parse(profile))
      }

      // Load DID if stored separately
      const did = localStorage.getItem('persona_did')
      if (did && !userDID) {
        setUserDID(did)
      }
    }
  }, [userDID])

  // Load all credentials from API when wallet connects
  useEffect(() => {
    const loadAllCredentials = async () => {
      if (address && isConnected) {
        setIsLoadingCredentials(true)
        try {
          console.log('📊 Loading all credentials for wallet:', address)
          const result = await personaApiClient.getCredentials(address)
          if (result.success && result.credentials) {
            setAllCredentials(result.credentials || [])
            console.log('✅ Loaded', result.credentials.length, 'credentials')
            
            // Set the most recent DID as primary if no DID is set
            if (!userDID && result.credentials.length > 0) {
              const mostRecent = result.credentials.sort((a: APICredential, b: APICredential) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )[0]
              setUserDID(mostRecent.did)
              localStorage.setItem('persona_did', mostRecent.did)
            }
          }
        } catch (error) {
          console.error('Error loading credentials:', error)
        }
        setIsLoadingCredentials(false)
      }
    }

    loadAllCredentials()
  }, [address, isConnected, userDID])

  // User data with real info if available
  const userData = {
    name: profileData?.firstName && profileData?.lastName 
      ? `${profileData.firstName} ${profileData.lastName}` 
      : 'John Doe',
    email: profileData?.email || 'john.doe@example.com',
    phone: profileData?.phone || storedCredential?.credentialSubject.phoneNumber || '+1 (555) 123-4567',
    verificationMethod: storedCredential 
      ? `${storedCredential.credentialSubject.verificationMethod} Verification`
      : isConnected ? 'Wallet Connection' : 'Email Verification',
    joinDate: storedCredential 
      ? new Date(storedCredential.issuanceDate).toLocaleDateString()
      : new Date().toLocaleDateString(),
    totalCredentials: allCredentials.length > 0 ? allCredentials.length : 1,
    verifiedCredentials: allCredentials.length > 0 ? allCredentials.filter(c => c.status === 'active').length : 1,
    did: userDID
  }

  // Transform API credentials for display
  const credentials = allCredentials.length > 0 ? allCredentials.map((cred, index) => ({
    id: index + 1,
    type: cred.type === 'PersonaIdentityCredential' ? 'Identity Credential' : cred.type,
    issuer: 'Persona Identity Platform',
    status: cred.status === 'active' ? 'Verified' : cred.status,
    issuedDate: new Date(cred.createdAt).toLocaleDateString(),
    expiryDate: 'Never',
    description: `${cred.verification?.method || 'blockchain'} verified identity for ${cred.firstName} ${cred.lastName}`,
    credentialId: cred.did,
    did: cred.did,
    txHash: cred.blockchain?.txHash,
    blockHeight: cred.blockchain?.blockHeight,
    authMethod: cred.authMethod,
    firstName: cred.firstName,
    lastName: cred.lastName
  })) : storedCredential ? [
    {
      id: 1,
      type: storedCredential.type.includes('PhoneVerificationCredential') 
        ? 'Phone Verification Credential' 
        : 'Identity Verification',
      issuer: storedCredential.issuer.name,
      status: 'Verified',
      issuedDate: new Date(storedCredential.issuanceDate).toLocaleDateString(),
      expiryDate: new Date(storedCredential.expirationDate).toLocaleDateString(),
      description: `Verified ${storedCredential.credentialSubject.verificationMethod} credential`,
      credentialId: storedCredential.id,
      phoneNumber: storedCredential.credentialSubject.phoneNumber
    }
  ] : [
    {
      id: 1,
      type: 'Identity Verification',
      issuer: 'Persona Identity Platform',
      status: 'Verified',
      issuedDate: new Date().toLocaleDateString(),
      expiryDate: 'Never',
      description: 'Your primary identity credential'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <DashboardNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {userData.name}! 👋
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage your digital identity and verifiable credentials
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {isConnected && (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-800">
                      Wallet Connected
                    </span>
                  </div>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Credentials</p>
                  <p className="text-2xl font-bold text-gray-900">{userData.totalCredentials}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{userData.verifiedCredentials}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="text-lg font-semibold text-gray-900">{userData.joinDate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'credentials', label: 'Credentials', icon: Shield },
                { id: 'security', label: 'Security', icon: Key }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id as 'overview' | 'credentials' | 'security')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                    activeSection === id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content Sections */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Profile Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <p className="text-gray-900">{userData.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{userData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-gray-900">{userData.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verification Method</label>
                      <p className="text-gray-900">{userData.verificationMethod}</p>
                    </div>
                    {userData.did && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          Your Decentralized Identifier (DID)
                        </label>
                        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-gray-900 font-mono text-sm break-all flex-1">{userData.did}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(userData.did)}
                            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            title="Copy DID"
                          >
                            <Copy className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          This is your unique blockchain identity address - keep it safe!
                        </p>
                      </div>
                    )}
                    {address && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-900 font-mono text-sm break-all">{address}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(address)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Identity Credential Issued</p>
                        <p className="text-sm text-gray-600">Your first verifiable credential has been created</p>
                      </div>
                      <span className="text-sm text-gray-500">{userData.joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'credentials' && (
              <div className="space-y-6">
                {/* Credentials Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Your Credentials</h3>
                    <p className="text-gray-600">Manage your verifiable credentials</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Request New Credential
                  </motion.button>
                </div>

                {/* Credentials List */}
                {isLoadingCredentials ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Loading your credentials...</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {credentials.map((credential) => (
                    <motion.div
                      key={credential.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold">{credential.type}</h4>
                          <p className="text-blue-100 text-sm">Issued by {credential.issuer}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-300" />
                          <span className="text-sm font-medium">{credential.status}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-100">Issued:</span>
                          <span>{credential.issuedDate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-100">Expires:</span>
                          <span>{credential.expiryDate}</span>
                        </div>
                        {'txHash' in credential && credential.txHash && (
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-100">Blockchain:</span>
                            <span className="font-mono text-xs">Block #{'blockHeight' in credential ? credential.blockHeight : 'N/A'}</span>
                          </div>
                        )}
                        {'did' in credential && credential.did && (
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-100">DID:</span>
                            <span className="font-mono text-xs">{credential.did.slice(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-blue-100 text-sm mb-4">{credential.description}</p>
                      
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Verify
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                {/* Security Settings */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h3>
                  
                  <div className="space-y-6">
                    {/* Wallet Connection */}
                    {isConnected && (
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">Wallet Connected</p>
                            <p className="text-sm text-gray-600">Your wallet is securely connected</p>
                          </div>
                        </div>
                        <span className="text-green-600 font-medium">Active</span>
                      </div>
                    )}

                    {/* Two-Factor Authentication */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-600">Add an extra layer of security</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Enable
                      </button>
                    </div>

                    {/* Recovery Phrase */}
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-gray-900">Recovery Phrase</p>
                          <p className="text-sm text-gray-600">Backup your account recovery phrase</p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        View
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h3>
                  
                  <div className="space-y-4">
                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-lg transition-colors">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Account Settings</p>
                        <p className="text-sm text-gray-600">Update your profile and preferences</p>
                      </div>
                    </button>
                    
                    <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600">
                      <LogOut className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Delete Account</p>
                        <p className="text-sm text-red-500">Permanently delete your account and data</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}