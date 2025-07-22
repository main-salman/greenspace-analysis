import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Leaf, TreePine, TrendingUp, MapPin, Activity, Eye } from 'lucide-react'
import GreenpaceMap from './GreenpaceMap'

const AnalysisResults = ({ data, city }) => {
  if (!data) return null

  const cityName = data.cityInfo?.name || city?.city || 'Unknown City'
  const percentage = data.greenspacePercentage || 0
  const score = data.score || 0
  
  // City planning score interpretation
  const getScoreInterpretation = (score) => {
    if (score >= 85) return { grade: 'A+', label: 'Excellent', description: 'Outstanding vegetation coverage for urban planning' }
    if (score >= 70) return { grade: 'A', label: 'Very Good', description: 'Strong green infrastructure foundation' }
    if (score >= 55) return { grade: 'B+', label: 'Good', description: 'Adequate vegetation with room for improvement' }
    if (score >= 40) return { grade: 'B', label: 'Fair', description: 'Moderate vegetation, planning opportunities exist' }
    if (score >= 25) return { grade: 'C', label: 'Poor', description: 'Limited vegetation, significant planning needed' }
    return { grade: 'D', label: 'Very Poor', description: 'Critical need for green space development' }
  }

  const scoreInfo = getScoreInterpretation(score)

  // Determine score color for city planning context
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Purple theme for vegetation percentage
  const getVegetationColor = (percentage) => {
    if (percentage >= 40) return 'text-purple-700'
    if (percentage >= 25) return 'text-purple-600'
    if (percentage >= 15) return 'text-purple-500'
    return 'text-purple-400'
  }

  return (
    <div className="space-y-6">
      {/* Header with City Planning Focus */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TreePine className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">{cityName} Vegetation Analysis</h2>
                <p className="text-purple-100">Simplified pipeline for city planning decisions</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-purple-100 text-sm">Planning Score</div>
              <div className={`text-3xl font-bold text-white`}>
                {score.toFixed(0)}/100
              </div>
              <div className="text-purple-100 text-sm">{scoreInfo.grade}</div>
            </div>
          </div>
        </div>

        {/* Key Metrics for City Planners */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Vegetation Coverage */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Leaf className={`h-6 w-6 ${getVegetationColor(percentage)}`} />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Vegetation Coverage</div>
                  <div className={`text-2xl font-bold ${getVegetationColor(percentage)}`}>
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.greenspaceArea?.toFixed(2)} km² of {data.totalArea?.toFixed(2)} km²
                  </div>
                </div>
              </div>
            </div>

            {/* Planning Assessment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Activity className={`h-6 w-6 ${getScoreColor(score)}`} />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Planning Assessment</div>
                  <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                    {scoreInfo.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {scoreInfo.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Method */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Analysis Method</div>
                  <div className="text-lg font-bold text-blue-600">
                    Simplified NDVI
                  </div>
                  <div className="text-xs text-gray-500">
                    Step 1 + Step 6 Pipeline
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purple Overlay Map */}
      <GreenpaceMap analysisData={data} city={city} />

      {/* Historical Trends (Simplified) */}
      {data.historicalData && data.historicalData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
            Historical Vegetation Trends (Simplified)
          </h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Vegetation Coverage']}
                  labelFormatter={(year) => `Year: ${year}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Analysis Details for City Planners */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-purple-600" />
          Analysis Details & Methodology
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analysis Specifications */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Analysis Specifications</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Data Source:</span>
                <span className="font-medium">{data.analysis?.dataSource || 'Sentinel Satellite'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">Simplified NDVI Detection</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resolution:</span>
                <span className="font-medium">{data.analysis?.resolution || '~440m grid cells'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pipeline:</span>
                <span className="font-medium">{data.analysis?.pipeline || 'Step 1 + Step 6'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target User:</span>
                <span className="font-medium text-purple-600">City Planners</span>
              </div>
            </div>
          </div>

          {/* Validation Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Validation & Accuracy</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">{(data.validation?.confidence * 100 || 85).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cells Analyzed:</span>
                <span className="font-medium">{data.analysis?.totalCells || data.validation?.cellsAnalyzed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vegetation Detected:</span>
                <span className="font-medium">{data.analysis?.vegetationCells || data.validation?.vegetationDetected || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analysis Date:</span>
                <span className="font-medium">{new Date(data.analysis?.analysisDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* City Planning Recommendations */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-2">City Planning Recommendations</h4>
          <div className="text-sm text-purple-700">
            {percentage >= 40 && (
              <div>
                <strong>Preservation Focus:</strong> High vegetation coverage detected. Consider conservation policies 
                and maintenance of existing green infrastructure. Dark purple areas on the map indicate prime conservation zones.
              </div>
            )}
            {percentage >= 25 && percentage < 40 && (
              <div>
                <strong>Enhancement Opportunities:</strong> Moderate vegetation coverage provides a good foundation. 
                Focus on connecting existing green spaces and filling gaps shown by translucent purple areas.
              </div>
            )}
            {percentage >= 15 && percentage < 25 && (
              <div>
                <strong>Development Priority:</strong> Limited vegetation coverage indicates significant opportunities 
                for green space development. Translucent purple areas show potential sites for new parks and green corridors.
              </div>
            )}
            {percentage < 15 && (
              <div>
                <strong>Critical Action Needed:</strong> Very low vegetation coverage requires immediate planning attention. 
                Consider mandatory green space requirements, urban tree planting programs, and green building standards.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalysisResults 