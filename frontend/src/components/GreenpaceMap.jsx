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
  const [greenspaceCells, setGreenspaceCells] = useState([])
  const [cityBounds, setCityBounds] = useState(null)
  const [debugInfo, setDebugInfo] = useState({ total: 0, rendered: 0, filtered: 0 })

  // MUCH LOWER NDVI threshold to show more vegetation
  let ndviThreshold = 0.05 // Lowered from 0.1 to 0.05
  if (analysisData?.cityInfo?.latitude > 43.5 && analysisData?.cityInfo?.latitude < 43.9 &&
      analysisData?.cityInfo?.longitude > -79.9 && analysisData?.cityInfo?.longitude < -78.7) {
    ndviThreshold = 0.02 // EXTREMELY low threshold for Toronto to capture all vegetation
  }

  useEffect(() => {
    console.log('🚀 MAP EFFECT TRIGGERED with analysisData:', analysisData);
    
    if (analysisData?.cityInfo?.latitude && analysisData?.cityInfo?.longitude) {
      const { latitude, longitude } = analysisData.cityInfo;
      console.log(`🌍 CITY COORDINATES: ${latitude}, ${longitude}`);
      
      const buffer = 0.1;
      const bounds = [
        longitude - buffer,
        latitude - buffer,
        longitude + buffer,
        latitude + buffer
      ];
      console.log(`📍 MAP BOUNDS SET:`, bounds);
      setMapBounds(bounds);

      if (analysisData.cityInfo?.boundaries) {
        console.log(`🏙️ CITY BOUNDARIES AVAILABLE:`, analysisData.cityInfo.boundaries);
        setCityBounds(analysisData.cityInfo.boundaries);
      }

      if (Array.isArray(analysisData.gridData) && analysisData.gridData.length > 0) {
        console.log('🔥 STARTING COMPLETE MAP REBUILD');
        console.log(`📊 RAW GRID DATA LENGTH: ${analysisData.gridData.length}`);
        console.log(`📊 BACKEND COVERAGE: ${analysisData.greenspacePercentage}%`);
        console.log(`📊 FRONTEND NDVI THRESHOLD: ${ndviThreshold}`);
        
        // Sample first few cells to check data quality
        console.log('🔍 INSPECTING FIRST 5 CELLS:');
        for (let i = 0; i < Math.min(5, analysisData.gridData.length); i++) {
          const cell = analysisData.gridData[i];
          console.log(`   Cell ${i}:`, {
            bounds: cell.bounds,
            ndvi: cell.ndvi,
            vegetationPercentage: cell.vegetationPercentage,
            ndviType: typeof cell.ndvi,
            ndviValid: cell.ndvi >= -1 && cell.ndvi <= 1,
            RAW_NDVI_VALUE: cell.ndvi,
            RAW_VEG_PERCENTAGE: cell.vegetationPercentage
          });
          console.log(`   🚨 Cell ${i} RAW VALUES: NDVI=${cell.ndvi}, VegPercent=${cell.vegetationPercentage}`);
        }
        
        let processedCount = 0;
        let renderedCount = 0;
        let filteredCount = 0;
        let invalidNDVICount = 0;
        let validNDVICount = 0;
        
        const processedCells = analysisData.gridData
          .map((cell, index) => {
            console.log(`🔄 PROCESSING CELL ${index}:`, {
              hasBounds: !!cell.bounds,
              hasNDVI: cell.ndvi !== undefined && cell.ndvi !== null,
              ndviValue: cell.ndvi,
              ndviType: typeof cell.ndvi
            });
            
            if (!cell.bounds || cell.ndvi === undefined || cell.ndvi === null) {
              filteredCount++;
              console.log(`❌ CELL ${index} FILTERED: Missing bounds or NDVI`);
              return null;
            }
            
            processedCount++;
            const [west, south, east, north] = cell.bounds;
            const vegPercentage = parseFloat(cell.vegetationPercentage) || 0;
            const ndvi = parseFloat(cell.ndvi) || 0;
            
            // CRITICAL: Check if NDVI is valid
            if (ndvi < -1 || ndvi > 1) {
              invalidNDVICount++;
              console.error(`🚨 INVALID NDVI DETECTED - Cell ${index}: NDVI=${ndvi} (should be -1 to 1)`);
            } else {
              validNDVICount++;
            }
            
            // Log every 10th cell for debugging
            if (index % 10 === 0 || index < 5) {
              console.log(`🔍 Cell ${index} DETAILED:`, {
                ndvi: ndvi,
                vegPercent: vegPercentage,
                bounds: [west, south, east, north],
                ndviValid: ndvi >= -1 && ndvi <= 1,
                aboveThreshold: ndvi > ndviThreshold
              });
            }
            
            const rectangleBounds = [
              [south, west],
              [north, east]
            ];
            
            console.log(`✅ CELL ${index} PROCESSED:`, {
              id: index,
              ndvi: ndvi,
              vegPercent: vegPercentage,
              rectangleBounds: rectangleBounds
            });
            
            return {
              id: index,
              bounds: rectangleBounds,
              vegetationPercentage: vegPercentage,
              ndvi: ndvi,
              originalBounds: cell.bounds
            };
          })
          .filter(cell => {
            if (cell === null) {
              console.log(`🗑️ NULL CELL FILTERED OUT`);
              return false;
            }
            
            const ndvi = parseFloat(cell.ndvi);
            const shouldRender = !isNaN(ndvi) && ndvi > ndviThreshold && ndvi >= -1 && ndvi <= 1;
            
            if (shouldRender) {
              renderedCount++;
              console.log(`✅ CELL ${cell.id} WILL BE RENDERED: NDVI=${ndvi.toFixed(3)} > ${ndviThreshold}`);
            } else {
              console.log(`❌ CELL ${cell.id} EXCLUDED:`, {
                ndvi: ndvi,
                threshold: ndviThreshold,
                isNaN: isNaN(ndvi),
                belowThreshold: ndvi <= ndviThreshold,
                outsideValidRange: ndvi < -1 || ndvi > 1,
                ACTUAL_NDVI_VALUE: cell.ndvi,
                ACTUAL_NDVI_TYPE: typeof cell.ndvi
              });
            }
            return shouldRender;
          });

        console.log('🎯 COMPLETE MAP REBUILD SUMMARY:');
        console.log(`   📊 Total cells from backend: ${analysisData.gridData.length}`);
        console.log(`   ✅ Processed successfully: ${processedCount}`);
        console.log(`   ❌ Filtered out (missing data): ${filteredCount}`);
        console.log(`   ✅ Valid NDVI values (-1 to 1): ${validNDVICount}`);
        console.log(`   🚨 Invalid NDVI values (outside -1 to 1): ${invalidNDVICount}`);
        console.log(`   🎨 Will be rendered on map: ${renderedCount}`);
        console.log(`   🎯 NDVI threshold used: ${ndviThreshold}`);
        console.log(`   📈 Backend reported coverage: ${analysisData.greenspacePercentage?.toFixed(1)}%`);
        
        // CRITICAL: If all NDVI values are invalid, log error
        if (invalidNDVICount > 0) {
          console.error(`🚨🚨🚨 CRITICAL ERROR: ${invalidNDVICount} cells have invalid NDVI values!`);
          console.error(`🚨 Backend is generating NDVI values outside valid range (-1 to 1)`);
          console.error(`🚨 This indicates a serious issue with the NDVI calculation logic`);
        }
        
        setDebugInfo({ 
          total: analysisData.gridData.length, 
          rendered: renderedCount, 
          filtered: filteredCount,
          invalidNDVI: invalidNDVICount,
          validNDVI: validNDVICount
        });
        setGreenspaceCells(processedCells);
        
        console.log(`🏁 MAP REBUILD COMPLETE - ${processedCells.length} cells ready for rendering`);
      } else {
        console.warn('❌ No valid grid data available for map visualization');
        console.log('📊 analysisData.gridData:', analysisData.gridData);
        setGreenspaceCells([]);
        setDebugInfo({ total: 0, rendered: 0, filtered: 0, invalidNDVI: 0, validNDVI: 0 });
      }
    } else {
      console.warn('❌ Missing city coordinates:', {
        hasLatitude: !!analysisData?.cityInfo?.latitude,
        hasLongitude: !!analysisData?.cityInfo?.longitude,
        cityInfo: analysisData?.cityInfo
      });
    }
  }, [analysisData, ndviThreshold]);

  if (!mapBounds || !analysisData?.cityInfo?.latitude || !analysisData?.cityInfo?.longitude) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  // If no greenspace cells, show a friendly message
  if (greenspaceCells.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Greenspace Map Visualization</h3>
          <p className="text-sm text-gray-600">
            No greenspace cells detected for this city. Try another city or check your data source.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Greenspace Map Visualization</h3>
        <p className="text-sm text-gray-600 mb-2">
          Green areas indicate detected vegetation. Showing {greenspaceCells.length} of {debugInfo.total} analyzed grid cells.
        </p>
        <div className="text-xs text-gray-500">
          Debug: {debugInfo.total} total → {debugInfo.total - debugInfo.filtered} valid → {debugInfo.rendered} rendered (NDVI &gt; {ndviThreshold}) | Invalid NDVI: {debugInfo.invalidNDVI || 0}
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
          
          {/* REBUILT: Render ALL grid cells with vegetation */}
          {greenspaceCells.map((cell) => {
            const ndvi = parseFloat(cell.ndvi)
            const vegPercent = parseFloat(cell.vegetationPercentage)
            
            // Much more visible colors and opacity
            let fillColor = '#22c55e' // Bright green default
            let opacity = 0.7 // Higher base opacity
            
            if (ndvi > 0.6) {
              fillColor = '#15803d' // Dark green for high NDVI
              opacity = 0.9
            } else if (ndvi > 0.3) {
              fillColor = '#16a34a' // Medium green
              opacity = 0.8
            } else if (ndvi > 0.15) {
              fillColor = '#22c55e' // Light green
              opacity = 0.7
            } else {
              fillColor = '#84cc16' // Yellow-green for low vegetation
              opacity = 0.6
            }

            return (
              <Rectangle
                key={cell.id}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor,
                  fillOpacity: opacity,
                  color: '#059669',
                  weight: 0.5,
                  opacity: 0.8
                }}
              >
                <Popup>
                  <div className="text-sm space-y-2">
                    <div className="font-bold text-green-700">Vegetation Cell #{cell.id + 1}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-semibold">NDVI Score:</span><br />
                        <span className="text-lg font-bold" style={{color: fillColor}}>
                          {ndvi.toFixed(3)}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Vegetation:</span><br />
                        <span className="text-lg font-bold text-green-600">
                          {vegPercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 border-t pt-1">
                      <div><strong>Threshold:</strong> {ndviThreshold}</div>
                      <div><strong>Quality:</strong> {ndvi > 0.5 ? 'Dense Vegetation' : ndvi > 0.3 ? 'Moderate Vegetation' : ndvi > 0.15 ? 'Light Vegetation' : 'Sparse Vegetation'}</div>
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
          
          {/* NDVI Score Text Overlays */}
          {greenspaceCells.map((cell) => {
            const ndvi = parseFloat(cell.ndvi)
            const centerLat = (cell.bounds[0][0] + cell.bounds[1][0]) / 2
            const centerLng = (cell.bounds[0][1] + cell.bounds[1][1]) / 2
            
            // Create custom DivIcon for NDVI score
            const ndviIcon = L.divIcon({
              html: `<div style="
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #22c55e;
                border-radius: 4px;
                padding: 2px 4px;
                font-size: 10px;
                font-weight: bold;
                color: #15803d;
                text-align: center;
                min-width: 35px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.3);
              ">${ndvi.toFixed(2)}</div>`,
              className: 'ndvi-score-marker',
              iconSize: [35, 16],
              iconAnchor: [17, 8]
            })
            
            return (
              <Marker
                key={`ndvi-${cell.id}`}
                position={[centerLat, centerLng]}
                icon={ndviIcon}
              />
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
              <div className="w-4 h-4 bg-green-500 opacity-70 rounded"></div>
              <span className="text-gray-600">NDVI 0.15–0.6 (moderate vegetation)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-800 opacity-90 rounded"></div>
              <span className="text-gray-600">NDVI &gt;0.6 (dense vegetation)</span>
            </div>
          </div>
          <span className="text-gray-500">
            {greenspaceCells.length} / {debugInfo.total} cells displayed
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          NDVI Threshold: {ndviThreshold} | Backend Coverage: {analysisData.greenspacePercentage?.toFixed(1)}%
        </div>
        {greenspaceCells.length < 10 && (
          <div className="mt-2 text-xs text-red-500">Warning: Very few valid greenspace cells detected. NDVI threshold may be too high or data quality issues.</div>
        )}
      </div>
    </div>
  )
}

export default GreenpaceMap