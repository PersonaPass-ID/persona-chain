'use client'

import { motion } from 'framer-motion'
import { ChevronRight, ArrowRight, Zap, Shield, Globe, Lock, CheckCircle } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section - Clean & Modern */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-black tracking-tight"
            >
              Your Identity,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Decentralized
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
            >
              Create verifiable digital credentials with zero-knowledge proofs. 
              Own your identity on the blockchain.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/get-started-v2">
                <button className="group px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-all duration-300 flex items-center justify-center gap-2">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              <button className="px-8 py-4 border-2 border-gray-200 text-black rounded-full font-medium hover:border-gray-300 hover:bg-gray-50 transition-all duration-300">
                Learn More
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Zero-Knowledge Proofs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Privacy First</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid - Minimal Design */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black">
              Web3 Identity Infrastructure
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the decentralized future with privacy and security at its core.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Instant Verification</h3>
              <p className="text-gray-600">
                Complete identity verification in seconds, not days. No paperwork, no waiting.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Zero-Knowledge Security</h3>
              <p className="text-gray-600">
                Prove your identity without revealing personal data. Your information stays private.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Universal Compatibility</h3>
              <p className="text-gray-600">
                Use your verified identity across Web3 applications. One identity, endless possibilities.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Clean Steps */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-black">
              Simple, Secure, Sovereign
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with decentralized identity in three simple steps.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex gap-8 items-start mb-12"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                <span className="text-sm">01</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-black mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">
                  Link your Web3 wallet or create a new one. We support all major wallets including MetaMask, WalletConnect, and social logins.
                </p>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex gap-8 items-start mb-12"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                <span className="text-sm">02</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-black mb-2">Verify Your Identity</h3>
                <p className="text-gray-600">
                  Complete a quick verification process. Your data is encrypted and never leaves your device thanks to zero-knowledge technology.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex gap-8 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                <span className="text-sm">03</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-black mb-2">Get Your DID</h3>
                <p className="text-gray-600">
                  Receive your Decentralized Identifier (DID) on the blockchain. Use it to access Web3 services while maintaining complete control.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-black mb-6">
                Privacy Without Compromise
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Zero-knowledge proofs allow you to verify your identity without exposing personal information. 
                It's like showing you're over 21 without revealing your birthdate.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-black">Data Never Leaves Your Device</h4>
                    <p className="text-gray-600">Your personal information is encrypted locally</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-black">Cryptographically Secure</h4>
                    <p className="text-gray-600">Impossible to fake or tamper with credentials</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-black">You Own Your Identity</h4>
                    <p className="text-gray-600">No central authority controls your credentials</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <Lock className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Zero-Knowledge Architecture</p>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-500 rounded-full opacity-10"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500 rounded-full opacity-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Own Your Digital Identity?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join the future of identity verification. Create your DID in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started-v2">
                <button className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2">
                  Create Your DID
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              
              <button className="px-8 py-4 border-2 border-gray-700 text-white rounded-full font-medium hover:border-gray-600 hover:bg-gray-900 transition-all duration-300">
                View Documentation
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600">© 2025 Persona. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Terms</a>
              <a href="#" className="text-gray-600 hover:text-black transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}