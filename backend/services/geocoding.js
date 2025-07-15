import { Client } from '@googlemaps/google-maps-services-js'

const googleMapsClient = new Client({})

export async function geocodeCity(cityName) {
  try {
    if (!process.env.GOOGLE_EARTH_ENGINE_API_KEY) {
      throw new Error('Google API key not configured')
    }

    const response = await googleMapsClient.geocode({
      params: {
        address: cityName,
        key: process.env.GOOGLE_EARTH_ENGINE_API_KEY,
        components: { administrative_area: 'locality' } // Focus on city-level results
      }
    })

    if (response.data.results.length === 0) {
      return null
    }

    const result = response.data.results[0]
    const location = result.geometry.location

    // Extract city information from the geocoding result
    const cityInfo = {
      city: extractCityName(result),
      country: extractCountry(result),
      state_province: extractStateProvince(result),
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      type: 'geocoded'
    }

    return cityInfo

  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error(`Failed to geocode city: ${error.message}`)
  }
}

function extractCityName(geocodeResult) {
  // Try to find the city name from address components
  const components = geocodeResult.address_components
  
  // Look for locality (city) first
  let city = findComponent(components, ['locality'])
  
  // If no locality, try administrative_area_level_2 (county/district)
  if (!city) {
    city = findComponent(components, ['administrative_area_level_2'])
  }
  
  // If still no city, try sublocality
  if (!city) {
    city = findComponent(components, ['sublocality', 'sublocality_level_1'])
  }
  
  // Last resort: use the first part of formatted address
  if (!city) {
    const addressParts = geocodeResult.formatted_address.split(',')
    city = addressParts[0].trim()
  }
  
  return city || 'Unknown City'
}

function extractCountry(geocodeResult) {
  const components = geocodeResult.address_components
  return findComponent(components, ['country']) || 'Unknown Country'
}

function extractStateProvince(geocodeResult) {
  const components = geocodeResult.address_components
  return findComponent(components, ['administrative_area_level_1']) || ''
}

function findComponent(components, types) {
  for (const component of components) {
    for (const type of types) {
      if (component.types.includes(type)) {
        return component.long_name
      }
    }
  }
  return null
} 