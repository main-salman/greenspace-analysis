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
      const buffer = 0.05 // degrees
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

      try {
        // DEBUG: Log what we received
        console.log('FRONTEND DEBUG: analysisData.gridData:', analysisData.gridData)
        console.log('FRONTEND DEBUG: gridData length:', analysisData.gridData?.length)
        
        // Use only real satellite data - no synthetic fallbacks
        if (analysisData.gridData && analysisData.gridData.length > 0) {
          console.log('Using real SENTINEL-2 satellite data:', analysisData.gridData.length, 'cells')
          
          // DEBUG: Log sample of grid data
          console.log('Sample grid cells:', analysisData.gridData.slice(0, 3))
          
          const cells = analysisData.gridData.map(cell => ({
            bounds: [
              [cell.bounds[1], cell.bounds[0]], // [south, west]
              [cell.bounds[1], cell.bounds[2]], // [south, east]  
              [cell.bounds[3], cell.bounds[2]], // [north, east]
              [cell.bounds[3], cell.bounds[0]]  // [north, west]
            ],
            intensity: cell.vegetationPercentage / 100,
            ndvi: cell.ndvi.toFixed(3),
            vegetationPercentage: cell.vegetationPercentage.toFixed(1)
          }))
          
          // DEBUG: Log vegetation percentages
          const vegPercentages = cells.map(c => parseFloat(c.vegetationPercentage))
          console.log('Vegetation percentages range:', Math.min(...vegPercentages), 'to', Math.max(...vegPercentages))
          console.log('Cells with >0.1% vegetation:', vegPercentages.filter(v => v > 0.1).length)
          
          setGreenspaceCells(cells)
        } else {
          // No real satellite data available - show error instead of synthetic data
          console.error('No real satellite data available for visualization')
          setGreenspaceCells([])
        }
      } catch (error) {
        console.error('Error generating greenspace cells:', error)
        setGreenspaceCells([])
      }
    }
  }, [analysisData])

  // Mock data generation function removed - Real satellite data only

  if (!mapBounds || !analysisData?.cityInfo?.latitude || !analysisData?.cityInfo?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  // Show error message if no real satellite data is available
  if (greenspaceCells.length === 0 && analysisData?.gridData !== undefined) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Visualization Unavailable</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>No real SENTINEL-2 satellite data available for this location and time period.</p>
            <p className="text-xs">This application only uses authentic satellite imagery. Please try:</p>
            <ul className="text-xs list-disc list-inside ml-4 space-y-1">
              <li>A different city or location</li>
              <li>Checking back later for updated satellite data</li>
              <li>Ensuring the location has recent satellite coverage</li>
            </ul>
          </div>
        </div>
        <div className="h-64 bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146-.832-5.657-2.343" />
            </svg>
            <p className="text-sm">Real satellite data required for analysis</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Greenspace Map Visualization</h3>
        <p className="text-sm text-gray-600">
          Green areas indicate detected vegetation. Darker shades represent higher vegetation density (NDVI values).
        </p>
      </div>
      
      <div className="h-[48rem] relative">
        <MapContainer
          style={{ height: '100%', width: '100%' }}
          zoom={13}
          center={[analysisData.cityInfo.latitude, analysisData.cityInfo.longitude]}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
          
          <FitBounds bounds={mapBounds} />
          
          {/* Render greenspace cells */}
          {greenspaceCells.map((cell, index) => {
            const intensity = cell.intensity || 0
            const vegetationPercentage = parseFloat(cell.vegetationPercentage) || 0
            
            // Show cells with any vegetation (lowered threshold to show more coverage)
            if (vegetationPercentage > 0.1) {
              return (
                <Rectangle
                  key={index}
                  bounds={cell.bounds}
                  pathOptions={{
                    fillColor: '#10b981', // Green for greenspace
                    fillOpacity: Math.max(0.2, intensity * 0.8), // Minimum opacity for visibility
                    color: '#059669',
                    weight: 0.5,
                    opacity: 0.9
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong>Vegetation Detected</strong><br />
                      NDVI: {cell.ndvi}<br />
                      Vegetation: {vegetationPercentage.toFixed(1)}%<br />
                      Grid Cell: {index + 1}
                    </div>
                  </Popup>
                </Rectangle>
              )
            }
            return null
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
            {greenspaceCells.length} vegetation cells detected
          </span>
        </div>
      </div>
    </div>
  )
}

export default GreenpaceMap 