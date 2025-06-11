"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function ApiTest() {
    const [result, setResult] = useState<string>('')
    const [loading, setLoading] = useState(false)

    const testBasicFetch = async () => {
        setLoading(true)
        setResult('Testing...')

        try {
            // Test 1: Basic fetch to root
            console.log('Testing basic fetch to API root...')
            const response1 = await fetch('https://web-production-b7778.up.railway.app/', {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
            })

            if (response1.ok) {
                const data1 = await response1.json()
                setResult(prev => prev + '\n✅ Basic fetch successful: ' + JSON.stringify(data1))
            } else {
                setResult(prev => prev + '\n❌ Basic fetch failed: ' + response1.status)
            }

            // Test 2: Health endpoint
            console.log('Testing health endpoint...')
            const response2 = await fetch('https://web-production-b7778.up.railway.app/health', {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
            })

            if (response2.ok) {
                const data2 = await response2.json()
                setResult(prev => prev + '\n✅ Health endpoint successful: ' + JSON.stringify(data2))
            } else {
                setResult(prev => prev + '\n❌ Health endpoint failed: ' + response2.status)
            }

        } catch (error) {
            console.error('Test error:', error)
            setResult(prev => prev + '\n❌ Error: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    const testDirectUrl = async () => {
        setLoading(true)
        setResult('Testing direct URL...')

        try {
            // Try opening the URL directly
            window.open('https://web-production-b7778.up.railway.app/health', '_blank')
            setResult(prev => prev + '\n🌐 Opened URL in new tab - check if it loads')
        } catch (error) {
            setResult(prev => prev + '\n❌ Error opening URL: ' + (error instanceof Error ? error.message : 'Unknown error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-bold mb-4">API Connection Test</h3>

            <div className="space-y-2 mb-4">
                <Button onClick={testBasicFetch} disabled={loading}>
                    {loading ? 'Testing...' : 'Test API Connection'}
                </Button>

                <Button onClick={testDirectUrl} variant="outline" disabled={loading}>
                    Open API URL in Browser
                </Button>
            </div>

            <div className="bg-muted p-3 rounded text-sm font-mono whitespace-pre-wrap min-h-[100px]">
                {result || 'Click "Test API Connection" to start...'}
            </div>
        </div>
    )
} 