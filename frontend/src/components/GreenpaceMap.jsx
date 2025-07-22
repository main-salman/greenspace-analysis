import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Rectangle, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds && bounds.length === 4) {
      const leafletBounds = L.latLngBounds([
        [bounds[1], bounds[0]], // [south, west]
        [bounds[3], bounds[2]]  // [north, east]
      ])
      map.fitBounds(leafletBounds, { padding: [20, 20] })
    }
  }, [bounds, map])
  return null
}

const GreenpaceMap = ({ analysisData, city }) => {
  const [mapBounds, setMapBounds] = useState(null)
  const [vegetationCells, setVegetationCells] = useState([])
  const [cityBounds, setCityBounds] = useState(null)
  const [debugInfo, setDebugInfo] = useState({ total: 0, rendered: 0, filtered: 0 })

  // Vegetation threshold for city planners - focus on meaningful vegetation
  const vegetationThreshold = 25 // 25% minimum vegetation to display as requested by user

  useEffect(() => {
    console.log('🔄 SIMPLIFIED PIPELINE: Processing map data for city planners')
    
    if (analysisData?.cityInfo?.latitude && analysisData?.cityInfo?.longitude) {
      const { latitude, longitude } = analysisData.cityInfo
      console.log(`📍 City coordinates: ${latitude}, ${longitude}`)
      
      const buffer = 0.1
      const bounds = [
        longitude - buffer,
        latitude - buffer,
        longitude + buffer,
        latitude + buffer
      ]
      setMapBounds(bounds)

      // Set city boundaries for planning context
      if (analysisData.cityInfo?.boundaries) {
        console.log('🏙️ Loading city boundaries for planning context')
        setCityBounds(analysisData.cityInfo.boundaries)
      }

      // Process vegetation data for purple overlay visualization
      if (Array.isArray(analysisData.gridData) && analysisData.gridData.length > 0) {
        console.log('🟣 PROCESSING VEGETATION DATA FOR PURPLE OVERLAYS')
        console.log(`📊 Grid cells received: ${analysisData.gridData.length}`)
        console.log(`📊 Overall vegetation coverage: ${analysisData.greenspacePercentage}%`)
        
        let processedCount = 0
        let renderedCount = 0
        let filteredCount = 0
        
        const processedCells = analysisData.gridData
          .map((cell, index) => {
            if (!cell.bounds || cell.vegetationPercentage === undefined) {
              filteredCount++
              return null
            }
            
            processedCount++
            const [west, south, east, north] = cell.bounds
            const vegPercentage = parseFloat(cell.vegetationPercentage) || 0
            const ndvi = parseFloat(cell.ndvi) || 0
            
            const rectangleBounds = [
              [south, west],
              [north, east]
            ]
            
            return {
              id: index,
              bounds: rectangleBounds,
              vegetationPercentage: vegPercentage,
              ndvi: ndvi,
              originalBounds: cell.bounds
            }
          })
          .filter(cell => {
            if (cell === null) {
              return false
            }
            
            const vegPercentage = parseFloat(cell.vegetationPercentage)
            const shouldRender = !isNaN(vegPercentage) && vegPercentage >= vegetationThreshold
            
            if (shouldRender) {
              renderedCount++
              console.log(`🟣 Cell ${cell.id} included: ${vegPercentage.toFixed(1)}% vegetation`)
            }
            return shouldRender
          })

        console.log('🟣 PURPLE OVERLAY PROCESSING COMPLETE:')
        console.log(`   📊 Total cells: ${analysisData.gridData.length}`)
        console.log(`   ✅ Processed: ${processedCount}`)
        console.log(`   ❌ Filtered: ${filteredCount}`)
        console.log(`   🟣 Purple overlays: ${renderedCount}`)
        console.log(`   📈 Vegetation threshold: ${vegetationThreshold}%`)
        
        setDebugInfo({ 
          total: analysisData.gridData.length, 
          rendered: renderedCount, 
          filtered: filteredCount
        })
        setVegetationCells(processedCells)
        
        console.log(`🟣 Ready to render ${processedCells.length} purple vegetation overlays`)
      } else {
        console.warn('❌ No vegetation data available for purple overlays')
        setVegetationCells([])
        setDebugInfo({ total: 0, rendered: 0, filtered: 0 })
      }
    } else {
      console.warn('❌ Missing city coordinates for map display')
    }
  }, [analysisData, vegetationThreshold])

  // Calculate purple color and opacity based on vegetation density
  const getPurpleStyle = (vegetationPercentage) => {
    // Normalize vegetation percentage to 0-1 scale for city planning visualization
    const normalizedVeg = Math.min(vegetationPercentage / 80, 1) // Cap at 80% for visualization
    
    let fillColor = '#9333ea' // Base purple
    let fillOpacity = 0.3 // Base translucent
    
    if (vegetationPercentage >= 50) {
      // Dense vegetation - Dark purple, high opacity
      fillColor = '#581c87' // Dark purple
      fillOpacity = 0.8
    } else if (vegetationPercentage >= 30) {
      // Moderate vegetation - Medium purple, medium opacity
      fillColor = '#7c3aed' // Medium purple
      fillOpacity = 0.6
    } else if (vegetationPercentage >= 15) {
      // Light vegetation - Light purple, lower opacity
      fillColor = '#a855f7' // Light purple
      fillOpacity = 0.5
    } else {
      // Sparse vegetation - Very light purple, translucent
      fillColor = '#c084fc' // Very light purple
      fillOpacity = 0.3
    }
    
    return {
      fillColor,
      fillOpacity,
      color: '#6b21a8', // Purple border
      weight: 0.5,
      opacity: 0.7
    }
  }

  if (!mapBounds || !analysisData?.cityInfo?.latitude || !analysisData?.cityInfo?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading map for city planners...</p>
      </div>
    )
  }

  if (vegetationCells.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Vegetation Density Map</h3>
          <p className="text-sm text-gray-600">
            No significant vegetation detected (≥{vegetationThreshold}%) for city planning analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Vegetation Density Map for City Planners</h3>
        <p className="text-sm text-gray-600 mb-2">
          Purple overlays show vegetation density. Darker purple = more vegetation, translucent = less vegetation.
        </p>
        <div className="text-xs text-gray-500">
          Showing {vegetationCells.length} areas with ≥{vegetationThreshold}% vegetation coverage • {debugInfo.total} total cells analyzed
        </div>
                  <div className="text-xs text-purple-600 font-semibold mt-1">
            Areas with &gt;25% vegetation are marked with purple overlays for city planning
          </div>
      </div>
      
      <div className="h-[48rem] relative">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          zoom={11}
          center={[analysisData.cityInfo.latitude, analysisData.cityInfo.longitude]}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
          
          <FitBounds bounds={mapBounds} />
          
          {/* Purple vegetation overlays - darker for more vegetation, translucent for less */}
          {vegetationCells.map((cell) => {
            const vegPercentage = parseFloat(cell.vegetationPercentage)
            const ndvi = parseFloat(cell.ndvi)
            const purpleStyle = getPurpleStyle(vegPercentage)

            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={purpleStyle}
              >
                <Popup>
                  <div className="text-sm space-y-2">
                    <div className="font-bold text-purple-700">Vegetation Analysis #{cell.id + 1}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-semibold">Vegetation:</span><br />
                        <span className="text-lg font-bold text-purple-600">
                          {vegPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">NDVI Score:</span><br />
                        <span className="text-lg font-bold text-green-600">
                          {ndvi.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 border-t pt-1">
                      <div><strong>Planning Category:</strong> {
                        vegPercentage >= 50 ? 'Dense Green Space' :
                        vegPercentage >= 30 ? 'Moderate Green Space' :
                        vegPercentage >= 15 ? 'Light Green Space' : 'Sparse Vegetation'
                      }</div>
                      <div><strong>Purple Intensity:</strong> {
                        vegPercentage >= 50 ? 'Dark (High Density)' :
                        vegPercentage >= 30 ? 'Medium (Moderate)' :
                        vegPercentage >= 15 ? 'Light (Low Density)' : 'Translucent (Minimal)'
                      }</div>
                      <div><strong>Coordinates:</strong> 
                        [{cell.originalBounds[1].toFixed(4)}, {cell.originalBounds[0].toFixed(4)}] to 
                        [{cell.originalBounds[3].toFixed(4)}, {cell.originalBounds[2].toFixed(4)}]
                      </div>
                    </div>
                  </div>
                </Popup>
              </Rectangle>
            )
          })}
          
          {/* City boundaries in red for planning context */}
          {cityBounds && cityBounds.geometry && cityBounds.geometry.coordinates && (
            <Polygon
              positions={cityBounds.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
              pathOptions={{
                fillColor: 'transparent',
                color: '#dc2626', // Red border for city boundary
                weight: 3,
                opacity: 0.8,
                fillOpacity: 0
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>City Planning Boundary</strong><br />
                  {analysisData.cityInfo?.name || city?.city || 'Unknown City'}<br />
                  <span className="text-xs text-gray-600">
                    Total Area: {analysisData.totalArea?.toFixed(2)} km²<br />
                    Vegetation Coverage: {analysisData.greenspacePercentage?.toFixed(1)}%
                  </span>
                </div>
              </Popup>
            </Polygon>
          )}
        </MapContainer>
      </div>
      
      {/* Purple overlay legend for city planners */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Vegetation Density Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-900 opacity-80 rounded"></div>
              <span className="text-gray-600">Dense (≥50%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-600 opacity-60 rounded"></div>
              <span className="text-gray-600">Moderate (30-49%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-400 opacity-50 rounded"></div>
              <span className="text-gray-600">Light (15-29%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-300 opacity-30 rounded"></div>
              <span className="text-gray-600">Sparse (25-29%)</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm border-t pt-2">
          <div className="text-gray-600">
            <strong>Analysis:</strong> Comprehensive multi-index vegetation detection (NDVI, EVI, GNDVI, BSI, MSAVI2)
          </div>
          <div className="text-gray-500">
            {vegetationCells.length} vegetation zones • {analysisData.greenspacePercentage?.toFixed(1)}% total coverage
          </div>
        </div>
        
        <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
          <strong>For City Planners:</strong> Darker purple areas indicate high vegetation density suitable for preservation. 
          Translucent areas show opportunities for green space development.
        </div>
      </div>
    </div>
  )
}

export default GreenpaceMap