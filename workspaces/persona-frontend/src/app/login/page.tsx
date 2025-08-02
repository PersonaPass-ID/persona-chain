'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, User, Shield } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import { personaApiClient, AuthResponse } from '@/lib/api-client'

type LoginFormData = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)
  
  const { 
    register, 
    handleSubmit,
    formState: { errors, isValid },
    // getValues // commented out to fix linting
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Check if already logged in
  useEffect(() => {
    const checkExistingAuth = async () => {
      const token = personaApiClient.getStoredToken()
      if (token) {
        const verification = await personaApiClient.verifyToken()
        if (verification.valid) {
          // Already logged in, redirect to dashboard
          router.push('/dashboard')
        }
      }
    }
    
    checkExistingAuth()
  }, [router])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoggingIn(true)
    setLoginError('')
    
    try {
      const result: AuthResponse = await personaApiClient.login(data)
      
      if (result.success && result.user) {
        setLoginSuccess(true)
        
        // Brief success state before redirecting
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        setLoginError(result.message || 'Login failed. Please check your credentials.')
      }
    } catch {
      setLoginError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleForgotPassword = () => {
    // TODO: Implement password reset flow
    alert('Password reset feature coming soon!')
  }

  const handleCreateAccount = () => {
    router.push('/get-started-v2')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-black mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your PersonaPass account
            </p>
          </div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-8 space-y-6"
          >
            {loginError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <p className="text-sm text-red-600">{loginError}</p>
              </motion.div>
            )}

            {loginSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4"
              >
                <p className="text-sm text-green-600">
                  ✓ Login successful! Redirecting to dashboard...
                </p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter your email"
                    disabled={isLoggingIn || loginSuccess}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 1,
                        message: 'Password is required'
                      }
                    })}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Enter your password"
                    disabled={isLoggingIn || loginSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoggingIn || loginSuccess}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  disabled={isLoggingIn || loginSuccess}
                >
                  Forgot your password?
                </button>
              </div>

              {/* Login Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: isLoggingIn || loginSuccess ? 1 : 1.02 }}
                whileTap={{ scale: isLoggingIn || loginSuccess ? 1 : 0.98 }}
                disabled={!isValid || isLoggingIn || loginSuccess}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <User className="w-5 h-5" />
                    <span>Success!</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Create Account Link */}
            <div className="text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-3">
                Don&apos;t have an account?
              </p>
              <button
                onClick={handleCreateAccount}
                disabled={isLoggingIn || loginSuccess}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50"
              >
                Create your PersonaPass account
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}