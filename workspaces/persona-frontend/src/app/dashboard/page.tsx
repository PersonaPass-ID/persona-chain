'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
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
  ExternalLink
} from 'lucide-react'
import { Navigation } from '@/components/Navigation'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [activeSection, setActiveSection] = useState<'overview' | 'credentials' | 'security'>('overview')

  // Mock user data - in production this would come from your backend/blockchain
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    verificationMethod: isConnected ? 'Wallet Connection' : 'Email Verification',
    joinDate: new Date().toLocaleDateString(),
    totalCredentials: 1,
    verifiedCredentials: 1
  }

  const credentials = [
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
      <Navigation />
      
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