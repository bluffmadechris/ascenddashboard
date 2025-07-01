"use client"

import { useState } from 'react'
import { api } from '@/lib/api-client'

export default function DebugPage() {
    const [results, setResults] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const addResult = (message: string) => {
        setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    }

    const testApiConnection = async () => {
        setLoading(true)
        setResults([])

        try {
            addResult('Testing API connection...')
            const health = await api.healthCheck()
            addResult(`Health check: ${JSON.stringify(health)}`)

            if (health.success) {
                addResult('✅ API server is reachable')

                // Test login
                addResult('Testing login...')
                const loginResult = await api.login('admin@ascendmedia.com', 'admin123')
                addResult(`Login result: ${JSON.stringify(loginResult)}`)

                if (loginResult.success) {
                    addResult('✅ Login successful!')

                    // Test authenticated endpoint
                    addResult('Testing authenticated endpoint...')
                    const userResult = await api.getCurrentUser()
                    addResult(`Current user: ${JSON.stringify(userResult)}`)
                } else {
                    addResult('❌ Login failed')
                }
            } else {
                addResult('❌ API server not reachable')
            }
        } catch (error) {
            addResult(`❌ Error: ${error}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>

            <div className="mb-4">
                <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'https://web-production-a530d.up.railway.app/api'}</p>
            </div>

            <button
                onClick={testApiConnection}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {loading ? 'Testing...' : 'Test API Connection'}
            </button>

            <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Results:</h2>
                <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
                    {results.length === 0 ? (
                        <p className="text-gray-500">No results yet. Click the button to test.</p>
                    ) : (
                        results.map((result, index) => (
                            <div key={index} className="mb-1 font-mono text-sm">
                                {result}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
} 