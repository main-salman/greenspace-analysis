import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, Rectangle, Popup, useMap } from 'react-leaflet'
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
  const [greenspaceCells, setGreenspaceCells] = useState([])
  const [cityBounds, setCityBounds] = useState(null)

  useEffect(() => {
    if (analysisData?.cityInfo?.latitude && analysisData?.cityInfo?.longitude) {
      const { latitude, longitude } = analysisData.cityInfo
      
      // Create bounds around the city center
      const buffer = 0.1 // Increased buffer for better visibility
      const bounds = [
        longitude - buffer, // west
        latitude - buffer,  // south
        longitude + buffer, // east
        latitude + buffer   // north
      ]
      setMapBounds(bounds)

      // Set city bounds if available
      if (analysisData.cityInfo?.boundaries) {
        setCityBounds(analysisData.cityInfo.boundaries)
      }

      // COMPLETE REBUILD: Simple and direct grid cell processing
      if (analysisData.gridData && analysisData.gridData.length > 0) {
        console.log('🔥 REBUILDING MAP: Processing', analysisData.gridData.length, 'grid cells')
        
        // Process ALL grid cells with simplified logic
        const processedCells = analysisData.gridData.map((cell, index) => {
          // Backend sends: [west, south, east, north]
          const [west, south, east, north] = cell.bounds
          const vegPercentage = parseFloat(cell.vegetationPercentage) || 0
          
          // DEBUG: Log every cell to see coordinate distribution
          if (index < 10 || index % 20 === 0) {
            console.log(`Cell ${index}: [${west.toFixed(4)}, ${south.toFixed(4)}, ${east.toFixed(4)}, ${north.toFixed(4)}] = ${vegPercentage.toFixed(1)}%`)
          }
          
          // Create Leaflet rectangle bounds - SIMPLIFIED
          const rectangleBounds = [
            [south, west], // Southwest corner
            [north, east]  // Northeast corner
          ]
          
          return {
            id: index,
            bounds: rectangleBounds,
            vegetationPercentage: vegPercentage,
            ndvi: cell.ndvi,
            originalBounds: cell.bounds
          }
        })
        
        // Show cells with any meaningful vegetation (lowered threshold for better coverage)
        const cellsToRender = processedCells.filter(cell => cell.vegetationPercentage >= 0.5)
        
        console.log(`🎯 RENDER DECISION: ${cellsToRender.length} of ${processedCells.length} cells will be rendered`)
        
        setGreenspaceCells(cellsToRender)
      } else {
        console.log('❌ No grid data available for map visualization')
        setGreenspaceCells([])
      }
    }
  }, [analysisData])

  if (!mapBounds || !analysisData?.cityInfo?.latitude || !analysisData?.cityInfo?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Greenspace Map Visualization</h3>
        <p className="text-sm text-gray-600">
          Green areas indicate detected vegetation. All {greenspaceCells.length} analyzed grid cells are displayed.
        </p>
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
          
          {/* REBUILT: Render ALL grid cells with vegetation */}
          {greenspaceCells.map((cell) => {
            const vegPercentage = cell.vegetationPercentage
            const hasVegetation = vegPercentage > 0.5 // Show cells with any detectable vegetation
            
            if (!hasVegetation) return null
            
            // Color intensity based on vegetation percentage
            const intensity = Math.min(1, vegPercentage / 100)
            const opacity = Math.max(0.3, intensity * 0.8)
            
            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor: '#10b981', // Consistent green color
                  fillOpacity: opacity,
                  color: '#059669',
                  weight: 1,
                  opacity: 0.8
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Vegetation Cell #{cell.id + 1}</strong><br />
                    <strong>Coverage:</strong> {vegPercentage.toFixed(1)}%<br />
                    <strong>NDVI:</strong> {parseFloat(cell.ndvi).toFixed(3)}<br />
                    <strong>Coordinates:</strong><br />
                    SW: [{cell.originalBounds[1].toFixed(4)}, {cell.originalBounds[0].toFixed(4)}]<br />
                    NE: [{cell.originalBounds[3].toFixed(4)}, {cell.originalBounds[2].toFixed(4)}]
                  </div>
                </Popup>
              </Rectangle>
            )
          })}
          
          {/* Render city boundaries */}
          {cityBounds && cityBounds.geometry && cityBounds.geometry.coordinates && (
            <Polygon
              positions={cityBounds.geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
              pathOptions={{
                fillColor: 'transparent',
                color: '#ef4444', // Red border for city boundary
                weight: 3,
                opacity: 0.8,
                fillOpacity: 0
              }}
            >
              <Popup>
                <div className="text-sm">
                  <strong>City Boundary</strong><br />
                  {analysisData.cityInfo?.name || city?.city || 'Unknown City'}
                </div>
              </Popup>
            </Polygon>
          )}
        </MapContainer>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-400 opacity-60 rounded"></div>
              <span className="text-gray-600">Low vegetation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-400 opacity-90 rounded"></div>
              <span className="text-gray-600">High vegetation</span>
            </div>
          </div>
          <span className="text-gray-500">
            {greenspaceCells.length} vegetation cells displayed
          </span>
        </div>
      </div>
    </div>
  )
}

export default GreenpaceMap 