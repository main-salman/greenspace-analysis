import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, MapPin, Globe, Calendar, Settings } from 'lucide-react'

const CitySearch = ({ onCitySelect }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cities, setCities] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [yearRange, setYearRange] = useState({
    startYear: 2020,
    endYear: 2021
  })

  useEffect(() => {
    // Load cities data on component mount
    const loadCities = async () => {
      try {
        const response = await axios.get('/api/cities')
        setCities(response.data)
      } catch (error) {
        console.error('Failed to load cities:', error)
      }
    }
    loadCities()
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      // Filter cities from our list
      const filtered = cities
        .filter(city => 
          city.city.toLowerCase().includes(query.toLowerCase()) ||
          city.country.toLowerCase().includes(query.toLowerCase()) ||
          city.state_province.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8) // Limit to 8 suggestions
        .map(city => ({
          ...city,
          type: 'predefined'
        }))

      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query, cities])

  const handleInputChange = (e) => {
    setQuery(e.target.value)
  }

  const handleSuggestionClick = (city) => {
    setQuery(city.type === 'predefined' ? `${city.city}, ${city.country}` : city.city)
    setShowSuggestions(false)
    onCitySelect({ city, yearRange })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      // If it's not a predefined city, pass as string for geocoding
      onCitySelect({ city: query.trim(), yearRange })
    }
  }

  const handleYearChange = (field, value) => {
    const numValue = parseInt(value)
    if (isNaN(numValue)) return
    
    setYearRange(prev => {
      const newRange = { ...prev, [field]: numValue }
      
      // Ensure start year is not greater than end year
      if (field === 'startYear' && numValue > prev.endYear) {
        newRange.endYear = numValue
      } else if (field === 'endYear' && numValue < prev.startYear) {
        newRange.startYear = numValue
      }
      
      return newRange
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search for any city (e.g., Toronto, London, Tokyo)..."
            className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
            autoComplete="off"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center px-4 bg-green-600 text-white rounded-r-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <span className="sr-only">Search</span>
            <Globe className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {suggestions.map((city, index) => (
            <button
              key={`${city.city_id}-${index}`}
              onClick={() => handleSuggestionClick(city)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {city.city}
                  </div>
                  <div className="text-sm text-gray-600">
                    {city.state_province && `${city.state_province}, `}{city.country}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
                     {/* Option to search for entered text if no exact match */}
           {query && !suggestions.some(s => s.city.toLowerCase() === query.toLowerCase()) && (
             <button
               onClick={() => handleSuggestionClick({ city: query, type: 'custom' })}
               className="w-full px-4 py-3 text-left hover:bg-blue-50 border-t border-gray-200 focus:outline-none focus:bg-blue-50"
             >
               <div className="flex items-center space-x-3">
                 <Search className="h-4 w-4 text-blue-500 flex-shrink-0" />
                 <div>
                   <div className="font-medium text-blue-700">
                     Search for "{query}"
                   </div>
                   <div className="text-sm text-blue-600">
                     Find this city worldwide
                   </div>
                 </div>
               </div>
             </button>
           )}
         </div>
       )}

       {/* Advanced Options */}
       <div className="mt-4">
         <button
           onClick={() => setShowAdvanced(!showAdvanced)}
           className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
         >
           <Settings className="h-4 w-4" />
           <span>Advanced Options</span>
           <span className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
         </button>

         {showAdvanced && (
           <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
             <div className="flex items-center space-x-2 mb-3">
               <Calendar className="h-4 w-4 text-gray-600" />
               <span className="text-sm font-medium text-gray-700">Historical Analysis Range</span>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs text-gray-600 mb-1">Start Year</label>
                 <input
                   type="number"
                   min="1990"
                   max={new Date().getFullYear()}
                   value={yearRange.startYear}
                   onChange={(e) => handleYearChange('startYear', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                 />
               </div>
               <div>
                 <label className="block text-xs text-gray-600 mb-1">End Year</label>
                 <input
                   type="number"
                   min="1990"
                   max={new Date().getFullYear()}
                   value={yearRange.endYear}
                   onChange={(e) => handleYearChange('endYear', e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                 />
               </div>
             </div>
             
             <div className="mt-2 text-xs text-gray-500">
               <span>Analysis will cover {Math.ceil((yearRange.endYear - yearRange.startYear) / 2) + 1} data points over {yearRange.endYear - yearRange.startYear} years</span>
             </div>
             
             {/* Preset buttons */}
             <div className="mt-3 flex flex-wrap gap-2">
               <button
                 onClick={() => setYearRange({ startYear: new Date().getFullYear() - 5, endYear: new Date().getFullYear() })}
                 className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
               >
                 Last 5 years
               </button>
               <button
                 onClick={() => setYearRange({ startYear: new Date().getFullYear() - 10, endYear: new Date().getFullYear() })}
                 className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
               >
                 Last 10 years
               </button>
               <button
                 onClick={() => setYearRange({ startYear: new Date().getFullYear() - 20, endYear: new Date().getFullYear() })}
                 className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
               >
                 Last 20 years
               </button>
             </div>
           </div>
         )}
       </div>

       {/* Quick Examples */}
       {!query && (
         <div className="mt-4 text-center">
           <p className="text-sm text-gray-600 mb-2">Try searching for:</p>
           <div className="flex flex-wrap justify-center gap-2">
             {['Toronto', 'London', 'Tokyo', 'New York', 'Paris', 'Sydney'].map((city) => (
               <button
                 key={city}
                 onClick={() => {
                   setQuery(city)
                   onCitySelect({ city, yearRange })
                 }}
                 className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
               >
                 {city}
               </button>
             ))}
           </div>
         </div>
       )}
    </div>
  )
}

export default CitySearch 