import { NextApiRequest, NextApiResponse } from 'next'
import { testIdentityFlow, E2ETestResults } from '../../../lib/test-identity-flow'

interface TestIdentityFlowResponse {
  success: boolean
  testResults?: E2ETestResults
  message?: string
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TestIdentityFlowResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST to run identity flow tests.'
    })
  }

  try {
    console.log('🧪 Starting Web3 Identity E2E Test API endpoint')

    // Run the complete end-to-end test flow
    const testResults = await testIdentityFlow.runCompleteTest()

    const response: TestIdentityFlowResponse = {
      success: testResults.success,
      testResults,
      message: testResults.success 
        ? `All ${testResults.totalTests} tests passed successfully! Web3 identity system is working correctly.`
        : `${testResults.failedTests}/${testResults.totalTests} tests failed. Check individual test results for details.`
    }

    console.log(`✅ Identity flow test completed: ${testResults.passedTests}/${testResults.totalTests} passed`)
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Identity flow test failed:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Test execution failed'
    })
  }
}