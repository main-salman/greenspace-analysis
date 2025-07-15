import React, { useState, useEffect } from 'react'
import { Activity, Grid, Clock, Satellite, MapPin, Zap, TrendingUp, Eye } from 'lucide-react'

const ProgressAnalysis = ({ city, progressData }) => {
  const [logs, setLogs] = useState([])
  const [currentStatus, setCurrentStatus] = useState('Initializing analysis...')
  const [gridProgress, setGridProgress] = useState(null)
  const [currentYear, setCurrentYear] = useState(null)
  const [analysisPhase, setAnalysisPhase] = useState('starting')
  const [startTime] = useState(Date.now())
  const [currentCoordinates, setCurrentCoordinates] = useState(null)
  const [memoryUsage, setMemoryUsage] = useState(null)

  useEffect(() => {
    if (progressData) {
      const { type, data } = progressData

      // Update status
      if (data.status) {
        setCurrentStatus(data.status)
      }

      // PERFORMANCE OPTIMIZATION: Aggressive log management for speed
      if (data.message) {
        const timestamp = new Date().toLocaleTimeString()
        setLogs(prev => {
          const newLogs = [...prev, { // Add new log
            id: Date.now() + Math.random(),
            timestamp,
            message: data.message,
            type: type
          }]
          // Keep only last 10 logs to prevent memory overflow and improve performance
          return newLogs.slice(-10)
        })
      }

      // Update grid progress
      if (type === 'grid-progress') {
        setGridProgress(data)
        setCurrentYear(data.year)
        setCurrentCoordinates(data.cellCoordinates)
        setAnalysisPhase(data.phase)
      } else if (type === 'grid-started') {
        setCurrentYear(data.year)
        setAnalysisPhase(data.phase)
        setGridProgress({ ...data, currentCell: 0, percentage: 0 })
      } else if (type === 'historical-started') {
        setAnalysisPhase('historical')
      } else if (type === 'analysis-started') {
        setAnalysisPhase('current')
      }
    }
  }, [progressData])

  const getElapsedTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // PERFORMANCE OPTIMIZATION: Monitor memory usage
  useEffect(() => {
    const interval = setInterval(() => {
      if (performance.memory) {
        setMemoryUsage({
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'current': return <Satellite className="h-5 w-5 text-blue-500" />
      case 'historical': return <Clock className="h-5 w-5 text-purple-500" />
      case 'starting': return <Zap className="h-5 w-5 text-green-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'current': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'historical': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'starting': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-green-600 animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Analyzing {city}
                  {gridProgress && (
                    <span className="ml-2 text-xl text-blue-600">
                      {gridProgress.percentage || 0}%
                    </span>
                  )}
                </h2>
                <p className="text-gray-600">SENTINEL-2 real satellite imagery analysis</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full border ${getPhaseColor(analysisPhase)} flex items-center space-x-2`}>
              {getPhaseIcon(analysisPhase)}
              <span className="text-sm font-medium capitalize">{analysisPhase} Analysis</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Elapsed Time</div>
              <div className="text-lg font-mono font-bold text-gray-900">{getElapsedTime()}</div>
              {/* PERFORMANCE OPTIMIZATION: Memory usage display */}
              {memoryUsage && (
                <div className="text-xs text-gray-500 mt-1">
                  <span>Memory: </span>
                  <span className={`font-mono ${memoryUsage.used > memoryUsage.limit * 0.8 ? 'text-red-500' : 'text-green-500'}`}>
                    {memoryUsage.used}MB/{memoryUsage.total}MB
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Current Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            {gridProgress && (
              <span className="ml-auto text-lg font-bold text-blue-600">
                {gridProgress.percentage || 0}% Complete
              </span>
            )}
          </div>
          <p className="text-gray-900">{currentStatus}</p>
          
          {/* PERFORMANCE OPTIMIZATION: Large progress bar for visibility */}
          {gridProgress && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${gridProgress.percentage || 0}%` }}
                ></div>
              </div>
              <div className="text-center mt-1 text-sm text-gray-600">
                Cell {gridProgress.currentCell || 0} of {gridProgress.totalCells || 0}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Grid */}
      {gridProgress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Grid className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Grid Analysis Progress - {currentYear}
            </h3>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Grid Cells Processed</span>
              <span>{gridProgress.currentCell || 0} / {gridProgress.totalCells}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${gridProgress.percentage || 0}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className="text-lg font-bold text-gray-900">{gridProgress.percentage || 0}%</span>
              <span className="text-gray-600 ml-2">Complete</span>
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-blue-600 text-sm font-medium">Current Cell</div>
              <div className="text-xl font-bold text-blue-900">{gridProgress.currentCell || 0}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-green-600 text-sm font-medium">Green Detected</div>
              <div className="text-xl font-bold text-green-900">{gridProgress.currentGreenPercentage || 0}%</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-purple-600 text-sm font-medium">Year</div>
              <div className="text-xl font-bold text-purple-900">{currentYear || '-'}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-orange-600 text-sm font-medium">Phase</div>
              <div className="text-lg font-bold text-orange-900 capitalize">{analysisPhase}</div>
            </div>
          </div>

          {/* Current Coordinates */}
          {currentCoordinates && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Processing Location</span>
              </div>
              <div className="text-sm text-gray-600">
                Lat: {currentCoordinates.lat?.toFixed(4)}, Lng: {currentCoordinates.lng?.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Satellite Imagery Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <Satellite className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-700">Real NDVI Analysis</div>
            <div className="text-xs text-gray-600 mt-1">SENTINEL-2 Satellite Data</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <Grid className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-700">Grid Analysis</div>
            <div className="text-xs text-gray-600 mt-1">
              {gridProgress?.actualResolution ? `${gridProgress.actualResolution}m` : 'Adaptive'} Real Satellite Pixels
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-700">Historical Trends</div>
            <div className="text-xs text-gray-600 mt-1">Real ESA Satellite Archive</div>
          </div>
        </div>
      </div>

      {/* Real-time Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Analysis Logs</h3>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 h-32 overflow-y-auto">
          <div className="font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-400">Starting analysis...</div>
            ) : (
              logs.slice(-5).map((log) => (
                <div key={log.id} className="flex space-x-2">
                  <span className="text-green-400 flex-shrink-0 text-xs">[{log.timestamp}]</span>
                  <span className="text-gray-300 text-xs truncate">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressAnalysis 