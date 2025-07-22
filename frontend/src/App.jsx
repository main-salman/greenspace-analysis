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
      startYear: new Date().getFullYear() - 1, // Simplified range for faster processing
      endYear: new Date().getFullYear()
    }
    
    setSelectedCity(city)
    setYearRange(selectedYearRange)
    setLoading(true)
    setError(null)
    setAnalysisData(null)
    setProgressData(null)
    setAnalysisLogs([])

    // Clear console periodically to prevent memory overflow
    if (console.clear) {
      console.clear()
    }

    try {
      console.log('🔄 Starting simplified pipeline analysis for:', city, 'with year range:', selectedYearRange)
      
      // Start the analysis and get session ID
      const response = await axios.post('/api/analyze-greenspace', {
        city: city,
        yearRange: selectedYearRange
      })
      
      const { sessionId } = response.data
      console.log('🔄 Simplified pipeline started with session ID:', sessionId)

      // Connect to SSE for real-time progress updates
      const source = new EventSource(`/api/analysis-progress/${sessionId}`)
      setEventSource(source)

      let consoleCleanupInterval = null
      
      source.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        if (data.type === 'connected') {
          console.log('🔄 Connected to simplified pipeline progress stream')
          // Set up periodic console clearing every 30 seconds
          consoleCleanupInterval = setInterval(() => {
            if (console.clear) {
              console.clear()
            }
          }, 30000)
        } else if (data.type === 'analysis-completed') {
          console.log('🔄 Simplified pipeline analysis completed!')
          setAnalysisData(data.data)
          setLoading(false)
          source.close()
          setEventSource(null)
          // Clear cleanup interval
          if (consoleCleanupInterval) {
            clearInterval(consoleCleanupInterval)
          }
        } else if (data.type === 'analysis-error') {
          console.error('🔄 Simplified pipeline analysis error:', data.data)
          setError(data.data.error || 'Vegetation analysis failed')
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
          
          // Store important completion messages for city planners
          if (data.data?.message && (data.data.message.includes('complete') || data.data.message.includes('Step'))) {
            const timestamp = new Date().toLocaleTimeString()
            setAnalysisLogs(prev => {
              const newLogs = [...prev, {
                id: Date.now() + Math.random(),
                timestamp,
                message: data.data.message,
                type: data.type
              }]
              // Keep only last 15 logs to prevent memory overflow
              return newLogs.slice(-15)
            })
          }
        }
      }

      source.onerror = (error) => {
        console.error('🔄 Simplified pipeline SSE error:', error)
        setError('Connection to analysis server lost')
        setLoading(false)
        source.close()
        setEventSource(null)
      }

    } catch (err) {
      console.error('🔄 Failed to start simplified pipeline analysis:', err)
      setError(err.response?.data?.error || 'Failed to start vegetation analysis')
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TreePine className="h-8 w-8 text-purple-600" />
                <Leaf className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Greenspace Analyzer</h1>
                <p className="text-sm text-gray-600 mt-1">Simplified vegetation analysis for city planners • Steps 1 & 6 Pipeline</p>
              </div>
            </div>
            <Globe className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analyze City Vegetation Coverage</h2>
            <p className="text-gray-600">
              Simplified pipeline for city planners • Real-time NDVI-based vegetation detection with purple overlay visualization
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
                <h3 className="text-sm font-medium text-red-800">Vegetation Analysis Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-1">Simplified pipeline requires satellite data connectivity</p>
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
            
            {/* Analysis Logs for City Planners */}
            {analysisLogs.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Analysis Pipeline Log</h3>
                  <span className="text-sm text-gray-500">({analysisLogs.length} entries)</span>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto">
                  <div className="font-mono text-sm space-y-1">
                    {analysisLogs.map((log) => (
                      <div key={log.id} className="flex space-x-3">
                        <span className="text-purple-400 flex-shrink-0">[{log.timestamp}]</span>
                        <span className="text-gray-300">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Instructions for City Planners */}
        {!selectedCity && !loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Leaf className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Simplified Pipeline for City Planning</h3>
              <div className="max-w-2xl mx-auto text-gray-600 space-y-3">
                <p>• <strong>Step 1 (Data Preprocessing):</strong> Satellite imagery processing with cloud masking</p>
                <p>• <strong>Step 6 (Validation):</strong> Accuracy assessment and confidence metrics</p>
                <p>• <strong>Purple Overlay Visualization:</strong> Darker purple = more vegetation, translucent = less</p>
                <p>• <strong>City Planning Focus:</strong> Real-time analysis optimized for urban planning decisions</p>
                <p>• <strong>Sentinel Satellite:</strong> High-resolution satellite imagery for accurate vegetation detection</p>
              </div>
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">For City Planners</h4>
                <p className="text-sm text-purple-700">
                  This simplified pipeline provides fast, reliable vegetation analysis with visual overlays 
                  designed specifically for urban planning decisions. Purple density indicates vegetation 
                  coverage suitable for preservation or development planning.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App 