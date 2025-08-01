'use client'

import { motion } from 'framer-motion'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { Plus, Download, ExternalLink, CheckCircle } from 'lucide-react'

export default function CredentialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <DashboardNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Credentials 📋
            </h1>
            <p className="text-lg text-gray-600">
              Manage your verifiable credentials and certificates
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold">Identity Verification</h4>
                  <p className="text-blue-100 text-sm">Issued by Persona Platform</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-300" />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Status:</span>
                  <span>✅ Verified</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-100">Issued:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Verify
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Add New Credential</h4>
              <p className="text-gray-600 text-sm">Request verification for additional credentials</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}