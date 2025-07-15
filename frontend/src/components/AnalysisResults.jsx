import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TreePine, TrendingUp, TrendingDown, Minus, Award, MapPin } from 'lucide-react'
import GreenpaceMap from './GreenpaceMap'

const AnalysisResults = ({ data, city }) => {
  const { score, greenspacePercentage, historicalData, analysis, cityInfo } = data

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B+'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    return 'D'
  }

  const getTrendIcon = (trend) => {
    if (trend > 0.5) return <TrendingUp className="h-5 w-5 text-green-600" />
    if (trend < -0.5) return <TrendingDown className="h-5 w-5 text-red-600" />
    return <Minus className="h-5 w-5 text-gray-600" />
  }

  const calculateTrend = () => {
    if (!historicalData || historicalData.length < 2) return 0
    const recent = historicalData.slice(-3).reduce((sum, d) => sum + d.percentage, 0) / 3
    const older = historicalData.slice(0, 3).reduce((sum, d) => sum + d.percentage, 0) / 3
    return recent - older
  }

  const trend = calculateTrend()

  return (
    <div className="space-y-6">
      {/* Header with City Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-6 w-6 text-gray-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {typeof city === 'string' ? city : `${city.city}, ${city.country}`}
              </h2>
              {cityInfo && (
                <p className="text-gray-600">
                  {cityInfo.region} • Population: {cityInfo.population?.toLocaleString() || 'N/A'}
                </p>
              )}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${getScoreColor(score)}`}>
            <span className="text-sm font-medium">Grade {getScoreGrade(score)}</span>
          </div>
        </div>
      </div>

      {/* Score and Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Score */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <div className="mb-4">
              <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${getScoreColor(score)}`}>
                <span className="text-3xl font-bold">{Math.round(score)}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Greenspace Score</h3>
            <p className="text-gray-600 text-sm">Out of 100</p>
          </div>
        </div>

        {/* Greenspace Percentage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TreePine className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Coverage</h3>
              <p className="text-3xl font-bold text-green-600">{greenspacePercentage.toFixed(1)}%</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Total green space area relative to city boundary
          </p>
        </div>

        {/* Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            {getTrendIcon(trend)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">10-Year Trend</h3>
              <p className={`text-3xl font-bold ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            {trend > 0.5 ? 'Increasing' : trend < -0.5 ? 'Decreasing' : 'Stable'} greenspace over time
          </p>
        </div>
      </div>

      {/* Greenspace Map Visualization */}
      <GreenpaceMap analysisData={data} city={city} />

      {/* Historical Trend Chart */}
      {historicalData && historicalData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Historical Greenspace Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(2)}%`, 'Greenspace']}
                  labelFormatter={(year) => `Year: ${year}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Analysis Details */}
      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Analysis Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• NDVI analysis from satellite imagery</li>
                <li>• {analysis.method || 'Grid-based vegetation detection'}</li>
                <li>• {analysis.dataSource || 'Multiple satellite sources'}</li>
                <li>• {analysis.resolution || 'High-resolution analysis'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Coverage Types</h4>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>• Parks and recreational areas</li>
                <li>• Urban forests and tree cover</li>
                <li>• Private gardens and yards</li>
                <li>• Agricultural land within city limits</li>
              </ul>
            </div>
          </div>
          
          {analysis.confidence && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Analysis Confidence:</strong> {Math.round(analysis.confidence * 100)}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {score < 50 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Low greenspace coverage.</strong> Consider initiatives to increase urban forests, 
                create more parks, and implement green building requirements.
              </p>
            </div>
          )}
          {score >= 50 && score < 75 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Moderate greenspace coverage.</strong> Look for opportunities to connect existing 
                green areas and add green corridors throughout the city.
              </p>
            </div>
          )}
          {score >= 75 && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">
                <strong>Excellent greenspace coverage!</strong> Focus on maintaining existing green areas 
                and ensuring sustainable development practices.
              </p>
            </div>
          )}
          {trend < -1 && (
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-orange-800 text-sm">
                <strong>Declining trend detected.</strong> Implement policies to protect existing greenspace 
                and prevent further urban sprawl into natural areas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalysisResults 