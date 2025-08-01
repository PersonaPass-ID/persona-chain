'use client'

import { personaApiClient } from '@/lib/api-client'
import PersonaBlockchain from '@/lib/blockchain'

export default function DebugPage() {
  const blockchain = new PersonaBlockchain()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Environment Variables</h2>
          <p><strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'undefined'}</p>
          <p><strong>NEXT_PUBLIC_ENVIRONMENT:</strong> {process.env.NEXT_PUBLIC_ENVIRONMENT || 'undefined'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">API Client Configuration</h2>
          <p><strong>API Client Base URL:</strong> {(personaApiClient as unknown as { baseUrl: string }).baseUrl}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Blockchain Client Configuration</h2>
          <p><strong>Blockchain Base URL:</strong> {(blockchain as unknown as { baseUrl: string }).baseUrl}</p>
        </div>
      </div>
    </div>
  )
}