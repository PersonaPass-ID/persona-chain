'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <Navigation />
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[80vh]">
        {/* Background Effects */}
        <div className="absolute inset-0 -top-32 -bottom-32 -left-32 -right-32">
          <div className="absolute top-20 left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
          <div className="absolute top-32 right-20 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center lg:pt-32">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto max-w-fit"
          >
            <div className="inline-flex items-center gap-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Introducing Persona Identity Verification</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl"
          >
            Your{' '}
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70"
                preserveAspectRatio="none"
              >
                <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative">Digital Identity</span>
            </span>{' '}
            Platform
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-700"
          >
            Create secure, verifiable digital credentials using zero-knowledge proofs. 
            Experience seamless identity verification in the first five magical minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Link href="/get-started">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
              >
                Create Persona
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-8 py-4 text-lg font-semibold text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white"
            >
              Log In
            </motion.button>
          </motion.div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose Persona?
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Built with the latest Web3 technology and zero-knowledge proofs for maximum security and privacy.
            </p>
          </motion.div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Zero-Knowledge Security</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Prove your identity without revealing personal information using cutting-edge ZK-proof technology. Your data stays private while maintaining full verification.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Instant Verification</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Complete your identity verification in minutes, not days. Our streamlined process eliminates lengthy paperwork and waiting periods.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Universal Compatibility</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Use your verified identity across thousands of platforms and services. One verification, endless possibilities.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">How It Works</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Identity Verification Made Simple
            </p>
            <p className="mt-4 max-w-3xl text-xl text-gray-600 mx-auto">
              Experience the magic of zero-knowledge proofs - prove who you are without revealing personal data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect Your Documents</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Securely upload your government ID, passport, or other verification documents. Your data is encrypted and never stored on our servers.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate ZK Proof</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Our advanced cryptography creates a mathematical proof of your identity without exposing any personal information.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 rounded-full opacity-20"></div>
                <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-r from-green-500 to-blue-600 rounded-full">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Verify Anywhere</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Use your verified digital identity across thousands of platforms. One verification, endless possibilities.
              </p>
            </motion.div>
          </div>

          {/* What is Zero-Knowledge Explanation */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-20 bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">What are Zero-Knowledge Proofs?</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Think of it like showing you&apos;re old enough to buy alcohol without revealing your exact birthdate. 
                  Zero-knowledge proofs let you prove something is true without revealing the underlying information.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-gray-600"><strong>Private:</strong> Your personal data never leaves your device</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-gray-600"><strong>Secure:</strong> Cryptographically impossible to fake or hack</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <p className="text-gray-600"><strong>Instant:</strong> Verification happens in seconds, not days</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl p-6 h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                      🛡️
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Your Data Stays Private</p>
                    <p className="text-xs text-gray-500 mt-1">Only the proof is shared</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Use Cases</h2>
            <p className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              Trusted by Industries Worldwide
            </p>
            <p className="mt-4 max-w-3xl text-xl text-gray-600 mx-auto">
              From financial services to healthcare, Persona enables secure identity verification across every industry.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Financial Services */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🏦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Services</h3>
              <p className="text-gray-600 mb-4">
                Enable instant KYC compliance for banking, lending, and crypto exchanges while protecting customer privacy.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Bank account opening</li>
                <li>• Crypto exchange onboarding</li>
                <li>• Loan applications</li>
                <li>• Investment platforms</li>
              </ul>
            </motion.div>

            {/* Healthcare */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🏥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Healthcare</h3>
              <p className="text-gray-600 mb-4">
                Secure patient verification and medical credential validation while maintaining HIPAA compliance.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Patient identity verification</li>
                <li>• Medical license validation</li>
                <li>• Insurance verification</li>
                <li>• Telemedicine platforms</li>
              </ul>
            </motion.div>

            {/* Education */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-8 border border-purple-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Education</h3>
              <p className="text-gray-600 mb-4">
                Verify academic credentials and professional certifications without exposing sensitive information.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Degree verification</li>
                <li>• Professional certifications</li>
                <li>• Student enrollment</li>
                <li>• Online course platforms</li>
              </ul>
            </motion.div>

            {/* Government */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-8 border border-red-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🏛️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Government</h3>
              <p className="text-gray-600 mb-4">
                Enable secure citizen services and voting systems with privacy-preserving identity verification.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Digital voting systems</li>
                <li>• Benefit program eligibility</li>
                <li>• License renewals</li>
                <li>• Public service access</li>
              </ul>
            </motion.div>

            {/* Real Estate */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 border border-orange-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🏠</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real Estate</h3>
              <p className="text-gray-600 mb-4">
                Streamline property transactions with verified buyer and seller identities, reducing fraud risk.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Property purchases</li>
                <li>• Rental applications</li>
                <li>• Mortgage applications</li>
                <li>• Real estate platforms</li>
              </ul>
            </motion.div>

            {/* Entertainment */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-8 border border-pink-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mb-6">
                <span className="text-white text-xl">🎮</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Entertainment</h3>
              <p className="text-gray-600 mb-4">
                Age verification for gaming, streaming, and social platforms while protecting user privacy.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Gaming platforms</li>
                <li>• Streaming services</li>
                <li>• Social media</li>
                <li>• Adult content verification</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-base font-semibold text-blue-400 tracking-wide uppercase">Security & Trust</h2>
            <p className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Built with Enterprise-Grade Security
            </p>
            <p className="mt-4 max-w-3xl text-xl text-gray-300 mx-auto">
              Your security is our top priority. Persona is built with the most advanced cryptographic technology available.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Security Features */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-8">Uncompromising Security</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Zero-Knowledge Architecture</h4>
                    <p className="text-gray-300">Your personal data never leaves your device. Only cryptographic proofs are shared.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">End-to-End Encryption</h4>
                    <p className="text-gray-300">All data is encrypted with AES-256 encryption before transmission.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Decentralized Infrastructure</h4>
                    <p className="text-gray-300">No single point of failure. Your identity credentials are distributed across a secure network.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Compliance */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-8">Global Compliance</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">GDPR & CCPA Compliant</h4>
                    <p className="text-gray-300">Full compliance with global privacy regulations including GDPR and CCPA.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">SOC 2 Type II Certified</h4>
                    <p className="text-gray-300">Independently audited for security, availability, and confidentiality.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">ISO 27001 Standards</h4>
                    <p className="text-gray-300">Meets international standards for information security management.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            <div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">99.9%</div>
              <p className="text-gray-300">Uptime Guarantee</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-2">&lt; 3s</div>
              <p className="text-gray-300">Average Verification Time</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">24/7</div>
              <p className="text-gray-300">Global Support</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Join thousands of businesses already using Persona for secure, private identity verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/get-started">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-50"
                >
                  Create Persona
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all duration-300"
              >
                Log In
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
