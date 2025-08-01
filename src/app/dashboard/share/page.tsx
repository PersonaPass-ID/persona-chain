'use client'

import { motion } from 'framer-motion'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { Share2, QrCode, Link, Send } from 'lucide-react'

export default function SharePage() {
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
              Share & Verify 📤
            </h1>
            <p className="text-lg text-gray-600">
              Share your credentials and verify others securely
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Your Credentials</h3>
                
                <div className="space-y-4">
                  <button className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                    <QrCode className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Generate QR Code</p>
                      <p className="text-sm text-gray-600">Create a QR code for easy sharing</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                    <Link className="w-6 h-6 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Share Link</p>
                      <p className="text-sm text-gray-600">Generate a secure sharing link</p>
                    </div>
                  </button>

                  <button className="w-full flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                    <Send className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Direct Share</p>
                      <p className="text-sm text-gray-600">Send directly to another user</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Allow zero-knowledge proofs only</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Require recipient verification</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" defaultChecked />
                    <span className="text-sm text-gray-700">Enable time-limited shares</span>
                  </label>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Verify Credentials</h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Scan QR Code to Verify</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      Open Camera
                    </button>
                  </div>

                  <div className="text-center text-gray-500">or</div>

                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Paste verification link here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                      Verify Credential
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-center py-8">
                  <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No sharing activity yet</p>
                  <p className="text-sm text-gray-500 mt-2">Your shares and verifications will appear here</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}