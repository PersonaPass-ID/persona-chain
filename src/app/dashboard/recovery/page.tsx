'use client'

import { motion } from 'framer-motion'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { Key, Download, Copy, Shield, AlertTriangle } from 'lucide-react'

export default function RecoveryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <DashboardNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Recovery & Backup 🔐
            </h1>
            <p className="text-lg text-gray-600">
              Manage your account recovery options and backup your credentials
            </p>
          </motion.div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Key className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Recovery Phrase</h3>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important Security Notice</p>
                    <p>Your recovery phrase is the master key to your account. Keep it safe and never share it with anyone.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-3 text-center">
                      <span className="text-xs text-gray-400 block">{i + 1}</span>
                      <span className="text-white font-mono text-sm">word{i + 1}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download Backup</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors">
                    <Copy className="w-4 h-4" />
                    <span>Copy to Clipboard</span>
                  </button>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Recovery Phrase Security Guidelines</h4>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Store in a secure, offline location</li>
                  <li>• Never share with anyone, including Persona support</li>
                  <li>• Consider using a hardware wallet for maximum security</li>
                  <li>• Make multiple physical copies stored in different locations</li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Additional Recovery Options</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-gray-900">Email Recovery</p>
                    <p className="text-sm text-gray-600">Receive recovery instructions via email</p>
                  </div>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Configure
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Enable
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div>
                    <p className="font-medium text-gray-900">Trusted Devices</p>
                    <p className="text-sm text-gray-600">Manage devices authorized for recovery</p>
                  </div>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Backup Your Data</h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export All Credentials</p>
                    <p className="text-sm text-gray-600">Download all your verifiable credentials</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-600" />
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Export Identity Data</p>
                    <p className="text-sm text-gray-600">Download your complete identity profile</p>
                  </div>
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}