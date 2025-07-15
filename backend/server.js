import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { analyzeGreenspace } from './services/greenpaceAnalyzer.js'
import { geocodeCity } from './services/geocoding.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5001

// Global progress emitter for real-time updates
const progressEmitter = new EventEmitter()

// PERFORMANCE OPTIMIZATION: Prevent crashes from unhandled errors
progressEmitter.on('error', (error) => {
  console.error('EventEmitter error (handled):', error)
  // Don't crash the process, just log the error
})

// Middleware
app.use(cors())
app.use(express.json())

// Load cities data
let citiesData = []
try {
  const citiesPath = join(__dirname, '../cities.json')
  const citiesJson = fs.readFileSync(citiesPath, 'utf8')
  citiesData = JSON.parse(citiesJson)
  console.log(`Loaded ${citiesData.length} cities from cities.json`)
} catch (error) {
  console.error('Error loading cities.json:', error)
}

// API Routes

// Server-Sent Events endpoint for real-time progress updates
app.get('/api/analysis-progress/:sessionId', (req, res) => {
  const { sessionId } = req.params
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`)

  // Set up event listeners for this session
  const progressHandler = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }
  }

  const completeHandler = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
      res.end()
    }
  }

  const errorHandler = (data) => {
    if (data.sessionId === sessionId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
      res.end()
    }
  }

  progressEmitter.on('progress', progressHandler)
  progressEmitter.on('complete', completeHandler)
  progressEmitter.on('error', errorHandler)

  // Clean up when client disconnects
  req.on('close', () => {
    progressEmitter.removeListener('progress', progressHandler)
    progressEmitter.removeListener('complete', completeHandler)
    progressEmitter.removeListener('error', errorHandler)
  })
})

// Get all cities for autocomplete
app.get('/api/cities', (req, res) => {
  try {
    // Return a subset of city data for autocomplete
    const cityList = citiesData.map(city => ({
      city_id: city.city_id,
      city: city.city,
      country: city.country,
      state_province: city.state_province,
      latitude: city.latitude,
      longitude: city.longitude
    }))
    res.json(cityList)
  } catch (error) {
    console.error('Error fetching cities:', error)
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

// Search for a specific city
app.get('/api/cities/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' })
    }

    // First, search in our predefined cities
    const matchingCities = citiesData.filter(city => 
      city.city.toLowerCase().includes(q.toLowerCase()) ||
      city.country.toLowerCase().includes(q.toLowerCase()) ||
      city.state_province.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 10)

    // If no matches found, try geocoding
    if (matchingCities.length === 0) {
      try {
        const geocodedCity = await geocodeCity(q)
        if (geocodedCity) {
          return res.json([{
            ...geocodedCity,
            type: 'geocoded'
          }])
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError)
      }
    }

    res.json(matchingCities.map(city => ({ ...city, type: 'predefined' })))
  } catch (error) {
    console.error('Error searching cities:', error)
    res.status(500).json({ error: 'Failed to search cities' })
  }
})

// Analyze greenspace for a city
app.post('/api/analyze-greenspace', async (req, res) => {
  try {
    const { city, yearRange } = req.body
    
    if (!city) {
      return res.status(400).json({ error: 'City is required' })
    }

    console.log('Starting analysis for:', city)
    if (yearRange) {
      console.log('Custom year range:', yearRange)
    }

    // Generate unique session ID for this analysis
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Starting analysis with session ID:', sessionId)

    let cityData = null
    let boundaries = null

    // Check if it's a predefined city with boundaries
    if (typeof city === 'object' && city.city_id) {
      cityData = citiesData.find(c => c.city_id === city.city_id)
      if (cityData) {
        boundaries = cityData.polygon_geojson
      }
    } else {
      // Search for the city in our predefined list
      const cityName = typeof city === 'string' ? city : city.city
      cityData = citiesData.find(c => 
        c.city.toLowerCase() === cityName.toLowerCase() ||
        `${c.city}, ${c.country}`.toLowerCase() === cityName.toLowerCase()
      )
      
      if (cityData) {
        boundaries = cityData.polygon_geojson
      } else {
        // Try to geocode the city
        const geocodedCity = await geocodeCity(cityName)
        if (geocodedCity) {
          cityData = geocodedCity
          // For geocoded cities, we'll create a simple boundary around the center point
          // This is a simplified approach - in production you'd want more sophisticated boundary detection
          const buffer = 0.1 // degrees, roughly 11km
          boundaries = {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: [[
                [geocodedCity.longitude - buffer, geocodedCity.latitude - buffer],
                [geocodedCity.longitude + buffer, geocodedCity.latitude - buffer],
                [geocodedCity.longitude + buffer, geocodedCity.latitude + buffer],
                [geocodedCity.longitude - buffer, geocodedCity.latitude + buffer],
                [geocodedCity.longitude - buffer, geocodedCity.latitude - buffer]
              ]]
            }
          }
        }
      }
    }

    if (!cityData) {
      return res.status(404).json({ error: 'City not found' })
    }

    // Return session ID immediately for SSE connection
    res.json({ sessionId, message: 'Analysis started', city: cityData.city || cityData.formatted_address })

    // Start analysis in background with progress emissions
    setImmediate(async () => {
      try {
        progressEmitter.emit('progress', {
          sessionId,
          type: 'analysis-started',
          data: {
            city: cityData.city || cityData.formatted_address,
            status: 'Starting greenspace analysis...',
            timestamp: new Date().toISOString()
          }
        })

        // Perform greenspace analysis with progress tracking
        const analysisResult = await analyzeGreenspace(cityData, boundaries, progressEmitter, sessionId, yearRange)
        
        progressEmitter.emit('complete', {
          sessionId,
          type: 'analysis-completed',
          data: analysisResult
        })

      } catch (error) {
        console.error('Error analyzing greenspace:', error)
        
        // Safely emit error without crashing
        try {
          progressEmitter.emit('error', {
            sessionId,
            type: 'analysis-error',
            data: { 
              error: 'Failed to analyze greenspace', 
              details: error.message 
            }
          })
        } catch (emitError) {
          console.error('Error emitting progress error:', emitError)
        }
      }
    })

  } catch (error) {
    console.error('Error starting analysis:', error)
    res.status(500).json({ 
      error: 'Failed to start analysis', 
      details: error.message 
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cities_loaded: citiesData.length 
  })
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
}) 