'use client'

import { motion } from 'framer-motion'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { Shield, Eye, Lock } from 'lucide-react'

export default function ZKProofsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <DashboardNavigation />
      
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Zero-Knowledge Proofs 🔐
            </h1>
            <p className="text-lg text-gray-600">
              Prove facts about yourself without revealing personal data
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Proofs</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Age Verification</p>
                        <p className="text-sm text-gray-600">Prove you&apos;re over 18 without revealing age</p>
                      </div>
                    </div>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                      Generate
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Identity Proof</p>
                        <p className="text-sm text-gray-600">Prove identity without revealing details</p>
                      </div>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                      Generate
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <Eye className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Location Proof</p>
                        <p className="text-sm text-gray-600">Prove location without exact address</p>
                      </div>
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors">
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">How Zero-Knowledge Proofs Work</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                    <p>Prove you know something without revealing what you know</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                    <p>Mathematically guarantee proof validity</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                    <p>Protect your privacy while building trust</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Proofs</h3>
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No proofs generated yet</p>
                  <p className="text-sm text-gray-500 mt-2">Generate your first proof above</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}