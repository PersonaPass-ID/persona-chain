'use client'

import { useState } from 'react'
import { personaApiClient } from '@/lib/api-client'

export default function TestAPIPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testHealthCheck = async () => {
    setLoading(true)
    try {
      const result = await personaApiClient.checkHealth()
      setTestResult(`✅ Health Check: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Health Check Failed: ${error}`)
    }
    setLoading(false)
  }

  const testComputation = async () => {
    setLoading(true)
    try {
      const result = await personaApiClient.runComputation(
        'test-user-123',
        'age_verification',
        { birthYear: 1990 }
      )
      setTestResult(`✅ Computation Engine: ${JSON.stringify(result, null, 2)}`)
    } catch (error) {
      setTestResult(`❌ Computation Failed: ${error}`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">API Integration Test</h1>
          
          <div className="space-y-4 mb-8">
            <button
              onClick={testHealthCheck}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mr-4"
            >
              {loading ? 'Testing...' : 'Test Health Check'}
            </button>
            
            <button
              onClick={testComputation}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Computation Engine'}
            </button>
          </div>

          {testResult && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="whitespace-pre-wrap text-sm font-mono">{testResult}</pre>
            </div>
          )}

          <div className="mt-8 text-sm text-gray-600">
            <p><strong>API Endpoint:</strong> https://cabf8jj5t4.execute-api.us-east-1.amazonaws.com/prod</p>
            <p><strong>PersonaChain RPC:</strong> http://3.95.230.14:26657</p>
          </div>
        </div>
      </div>
    </div>
  )
}