'use client'

import { motion } from 'framer-motion'
import { DashboardNavigation } from '@/components/DashboardNavigation'
import { QrCode, Download, Share2 } from 'lucide-react'

export default function QRCodesPage() {
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
              QR Codes 📱
            </h1>
            <p className="text-lg text-gray-600">
              Generate and manage QR codes for easy credential sharing
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate QR Code</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Credential to Share
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Identity Verification</option>
                      <option>Phone Verification</option>
                      <option>Email Verification</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Privacy Level
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Zero-Knowledge Proof Only</option>
                      <option>Limited Data Share</option>
                      <option>Full Credential</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>1 Hour</option>
                      <option>24 Hours</option>
                      <option>7 Days</option>
                      <option>Never</option>
                    </select>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
                    <QrCode className="w-5 h-5" />
                    <span>Generate QR Code</span>
                  </button>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Preview</h3>
                
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    QR Code will appear here after generation
                  </p>
                  
                  <div className="flex space-x-3 justify-center">
                    <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent QR Codes</h3>
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No QR codes generated yet</p>
                  <p className="text-sm text-gray-500 mt-2">Generated codes will appear here</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}