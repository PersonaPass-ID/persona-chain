'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { WalletConnectService } from '@/lib/wallet-connect-service'
import { Navigation } from '@/components/Navigation'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkWalletConnection()
  }, [])

  useEffect(() => {
    // Don't auto-redirect - let user see the landing page first
    // They can click "Continue to Dashboard" button when ready
  }, [walletConnected, session, router])

  const checkWalletConnection = async () => {
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.getConnectedWallet()
      if (wallet) {
        setWalletConnected(true)
        setWalletAddress(wallet.address)
      }
    } catch (error) {
      console.log('No wallet connected')
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)
    
    try {
      const walletService = new WalletConnectService()
      const wallet = await walletService.connectWallet()
      
      if (wallet) {
        setWalletConnected(true)
        setWalletAddress(wallet.address)
      }
    } catch (err) {
      setError('Failed to connect wallet. Please install Keplr, Cosmostation, or Leap.')
      console.error('Wallet connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-8">
              ⭐ Zero-Knowledge Identity Verification Platform
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6">
            Create Your<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Digital Persona
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl leading-relaxed text-gray-600 mb-12 max-w-4xl mx-auto">
            Build your verified digital identity with GitHub, LinkedIn, and professional credentials. 
            Own your data on PersonaChain and share ZK proofs privately.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="/get-started"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-xl font-bold rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Create Your Persona →
            </a>
            <a 
              href="/login"
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:shadow-lg"
            >
              Access →
            </a>
          </div>

          {error && (
            <div className="max-w-md mx-auto mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="mt-12 text-sm text-gray-500">
            Trusted by developers building the next generation of Web3 applications
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Digital Identity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A complete ecosystem of privacy-preserving tools built for the modern web
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verifiable Credentials</h3>
              <p className="text-gray-600">
                Create tamper-proof credentials for GitHub, LinkedIn, and professional achievements using blockchain technology
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Zero-Knowledge Proofs</h3>
              <p className="text-gray-600">
                Verify identity without revealing personal information using cutting-edge ZK technology
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Decentralized Storage</h3>
              <p className="text-gray-600">
                Own your identity data on PersonaChain blockchain with automatic renewals and complete control
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How PersonaPass Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Connect Wallet</h4>
                <p className="text-sm text-gray-600">Connect your Cosmos wallet to create your PersonaPass DID</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Choose Credentials</h4>
                <p className="text-sm text-gray-600">Select platforms to verify: GitHub, LinkedIn, certificates</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Verify & Store</h4>
                <p className="text-sm text-gray-600">Authenticate and store verifiable credentials on blockchain</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-orange-600">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Share Proofs</h4>
                <p className="text-sm text-gray-600">Generate ZK proofs and share with employers or clients</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Build the Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers already building with PersonaPass
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="/get-started"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              Get Started Today
            </a>
            <a 
              href="/developers/docs"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg transition-colors inline-block"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}