'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, Globe, Lock, CheckCircle, Wallet, UserCheck, Key } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { BackgroundLines } from '@/components/ui/background-lines'
import { FocusCards } from '@/components/ui/focus-cards'
import { WobbleCard, WobbleCardContent } from '@/components/ui/wobble-card'
import { AppleCardsCarousel } from '@/components/ui/apple-cards-carousel'
import Link from 'next/link'

export default function HomePage() {
  // Enhanced feature cards data
  const focusCards = [
    {
      title: "Instant Verification",
      description: "Complete identity verification in seconds, not days. No paperwork, no waiting.",
      icon: <Zap className="w-8 h-8 text-white" />,
    },
    {
      title: "Zero-Knowledge Security", 
      description: "Prove your identity without revealing personal data. Your information stays private.",
      icon: <Shield className="w-8 h-8 text-white" />,
    },
    {
      title: "Universal Compatibility",
      description: "Use your verified identity across Web3 applications. One identity, endless possibilities.",
      icon: <Globe className="w-8 h-8 text-white" />,
    },
  ];

  // Apple Cards Carousel data for How It Works
  const howItWorksCards = [
    {
      category: "STEP ONE",
      title: "Connect Your Wallet",
      description: "Connect with Keplr for PersonaChain or Ethereum wallets like MetaMask for multi-chain identity verification.",
      icon: <Wallet className="w-8 h-8" />,
      step: "01",
    },
    {
      category: "STEP TWO", 
      title: "Verify Your Identity",
      description: "Complete a quick verification process. Your data is encrypted and never leaves your device thanks to zero-knowledge technology.",
      icon: <UserCheck className="w-8 h-8" />,
      step: "02",
    },
    {
      category: "STEP THREE",
      title: "Get Your DID",
      description: "Receive your Decentralized Identifier (DID) on the blockchain. Use it to access Web3 services while maintaining complete control.",
      icon: <Key className="w-8 h-8" />,
      step: "03",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      {/* Hero Section - Enhanced with Custom Background */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Hero Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/images/Information Overload - Germán Di Ciccio.jpeg")',
          }}
        />
        
        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Background Lines Effect */}
        <BackgroundLines className="absolute inset-0" svgOptions={{ duration: 8 }} />
        
        {/* Container for hero content */}
        <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
          {/* Main Content */}
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-lg"
            >
              Your Identity,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-blue-500 drop-shadow-lg">
                Decentralized
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-xl md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-md"
            >
              Create verifiable digital credentials with zero-knowledge proofs. 
              Own your identity on the blockchain.
            </motion.p>

            {/* Enhanced CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/get-started-v2">
                <button className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-blue-600 text-white rounded-full font-medium hover:from-orange-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              <button className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-medium hover:border-white/50 hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                Learn More
              </button>
            </motion.div>

            {/* Enhanced Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/90">Zero-Knowledge Proofs</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/90">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-white/90">Privacy First</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section with Focus Cards */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-blue-600 bg-clip-text text-transparent">
              Web3 Identity Infrastructure
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Built for the decentralized future with privacy and security at its core.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <FocusCards cards={focusCards} />
          </motion.div>
        </div>
      </section>

      {/* How It Works - Enhanced Apple Cards Carousel */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-blue-600 bg-clip-text text-transparent">
              Simple, Secure, Sovereign
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Get started with decentralized identity in three interactive steps.
            </p>
          </motion.div>

          <AppleCardsCarousel items={howItWorksCards} />
        </div>
      </section>

      {/* Enhanced Technology Section with Wobble Cards */}
      <section className="py-24 bg-gradient-to-br from-orange-50/30 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-blue-600 bg-clip-text text-transparent mb-6">
              Privacy Without Compromise
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Zero-knowledge proofs allow you to verify your identity without exposing personal information. 
              It's like showing you're over 21 without revealing your birthdate.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <WobbleCard>
                <WobbleCardContent
                  icon={<Shield className="w-6 h-6" />}
                  title="Data Never Leaves Your Device"
                  description="Your personal information is encrypted locally using advanced cryptographic techniques, ensuring complete privacy."
                />
              </WobbleCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <WobbleCard>
                <WobbleCardContent
                  icon={<Lock className="w-6 h-6" />}
                  title="Cryptographically Secure"
                  description="Impossible to fake or tamper with credentials thanks to advanced blockchain and zero-knowledge technologies."
                />
              </WobbleCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <WobbleCard>
                <WobbleCardContent
                  icon={<CheckCircle className="w-6 h-6" />}
                  title="You Own Your Identity"
                  description="No central authority controls your credentials. You have complete sovereignty over your digital identity."
                />
              </WobbleCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-r from-orange-600 via-yellow-500 to-blue-600 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
              Ready to Own Your Digital Identity?
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
              Join the future of identity verification. Create your DID in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started-v2">
                <button className="group px-8 py-4 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg">
                  Create Your DID
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              
              <button className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-medium hover:border-white/50 hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
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