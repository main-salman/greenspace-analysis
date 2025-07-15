import React, { useState, useEffect } from 'react'
import axios from 'axios'
import CitySearch from './components/CitySearch'
import AnalysisResults from './components/AnalysisResults'
import LoadingSpinner from './components/LoadingSpinner'
import ProgressAnalysis from './components/ProgressAnalysis'
import ErrorBoundary from './components/ErrorBoundary'
import { TreePine, Leaf, Globe } from 'lucide-react'

function App() {
  const [selectedCity, setSelectedCity] = useState(null)
  const [analysisData, setAnalysisData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [eventSource, setEventSource] = useState(null)
  const [yearRange, setYearRange] = useState(null)
  const [analysisLogs, setAnalysisLogs] = useState([])

  const handleCitySelect = async (cityData) => {
    // Handle both old format (direct city) and new format ({ city, yearRange })
    const city = cityData?.city || cityData
    const selectedYearRange = cityData?.yearRange || {
      startYear: new Date().getFullYear() - 2, // Minimal range for fastest processing
      endYear: new Date().getFullYear()
    }
    
    setSelectedCity(city)
    setYearRange(selectedYearRange)
    setLoading(true)
    setError(null)
    setAnalysisData(null)
    setProgressData(null)
    setAnalysisLogs([])

    // PERFORMANCE OPTIMIZATION: Clear console periodically to prevent memory overflow
    if (console.clear) {
      console.clear()
    }

    try {
      console.log('Starting analysis for:', city, 'with year range:', selectedYearRange)
      
      // Start the analysis and get session ID
      const response = await axios.post('/api/analyze-greenspace', {
        city: city,
        yearRange: selectedYearRange
      })
      
      const { sessionId } = response.data
      console.log('Analysis started with session ID:', sessionId)

      // Connect to SSE for real-time progress updates
      const source = new EventSource(`/api/analysis-progress/${sessionId}`)
      setEventSource(source)

      // PERFORMANCE OPTIMIZATION: Add periodic console clearing
      let consoleCleanupInterval = null
      
      source.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        // Reduce console output for performance
        if (data.type === 'connected') {
          console.log('Connected to progress stream')
          // Set up periodic console clearing every 30 seconds
          consoleCleanupInterval = setInterval(() => {
            if (console.clear) {
              console.clear()
            }
          }, 30000)
        } else if (data.type === 'analysis-completed') {
          console.log('Analysis completed!')
          setAnalysisData(data.data)
          setLoading(false)
          source.close()
          setEventSource(null)
          // Clear cleanup interval
          if (consoleCleanupInterval) {
            clearInterval(consoleCleanupInterval)
          }
        } else if (data.type === 'analysis-error') {
          console.error('Analysis error:', data.data)
          setError(data.data.error || 'Analysis failed')
          setLoading(false)
          source.close()
          setEventSource(null)
          // Clear cleanup interval
          if (consoleCleanupInterval) {
            clearInterval(consoleCleanupInterval)
          }
        } else {
          // Update progress data
          setProgressData(data)
          
          // PERFORMANCE OPTIMIZATION: Minimal log storage for speed
          if (data.data?.message && data.data.message.includes('complete')) {
            const timestamp = new Date().toLocaleTimeString()
            setAnalysisLogs(prev => {
              const newLogs = [...prev, {
                id: Date.now() + Math.random(),
                timestamp,
                message: data.data.message,
                type: data.type
              }]
              // Keep only last 20 logs to prevent memory overflow - only important messages
              return newLogs.slice(-20)
            })
          }
        }
      }

      source.onerror = (error) => {
        console.error('SSE error:', error)
        setError('Connection to analysis server lost')
        setLoading(false)
        source.close()
        setEventSource(null)
      }

    } catch (err) {
      console.error('Failed to start analysis:', err)
      setError(err.response?.data?.error || 'Failed to start analysis')
      setLoading(false)
    }
  }

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [eventSource])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TreePine className="h-8 w-8 text-green-600" />
                <Leaf className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Greenspace Analyzer</h1>
                <p className="text-sm text-gray-600 mt-1">Measure urban greenspace worldwide with satellite imagery</p>
              </div>
            </div>
            <Globe className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analyze City Greenspace</h2>
            <p className="text-gray-600">
              Search for any city worldwide to analyze its greenspace coverage and historical trends
            </p>
          </div>
          <CitySearch onCitySelect={handleCitySelect} />
        </div>

        {/* Loading State with Real-time Progress */}
        {loading && (
          <ProgressAnalysis 
            city={selectedCity?.city || selectedCity} 
            progressData={progressData}
          />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Analysis Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {analysisData && !loading && (
          <>
            <ErrorBoundary>
              <AnalysisResults data={analysisData} city={selectedCity} />
            </ErrorBoundary>
            
            {/* Analysis Logs */}
            {analysisLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Logs</h3>
                  <span className="text-sm text-gray-500">({analysisLogs.length} entries)</span>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto">
                  <div className="font-mono text-sm space-y-1">
                    {analysisLogs.map((log) => (
                      <div key={log.id} className="flex space-x-3">
                        <span className="text-green-400 flex-shrink-0">[{log.timestamp}]</span>
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!selectedCity && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">How It Works</h3>
              <div className="max-w-2xl mx-auto text-gray-600 space-y-3">
                <p>• <strong>Search:</strong> Enter any city name or select from our pre-defined list</p>
                <p>• <strong>Analysis:</strong> We analyze satellite imagery using NDVI to detect vegetation</p>
                <p>• <strong>Scoring:</strong> Cities receive a 1-100 score based on total greenspace percentage</p>
                <p>• <strong>Trends:</strong> View historical changes in greenspace over the past 10-20 years</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App 