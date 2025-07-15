# Greenspace Analyzer

A real-time web application that measures and analyzes urban greenspace coverage in cities worldwide using satellite imagery. The app provides historical trend analysis, scoring, and recommendations for urban environmental planning.

## Features

- 🌍 **Global Coverage**: Analyze any city worldwide
- 🛰️ **Satellite Analysis**: Uses NDVI (Normalized Difference Vegetation Index) from satellite imagery
- 📊 **Historical Trends**: 10-20 year greenspace change analysis
- 🏆 **Scoring System**: 1-100 score based on greenspace percentage
- 🔍 **Smart Search**: Autocomplete from 2600+ predefined cities + global geocoding
- 📈 **Data Visualization**: Interactive charts and trend analysis
- 🎯 **Grid-based Analysis**: Precise area analysis using grid methodology

## Technology Stack

### Frontend
- **React 18** with Vite for fast development
- **Tailwind CSS** for modern styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API communication

### Backend
- **Node.js** with Express
- **SENTINEL HUB API** for satellite imagery
- **Google Earth Engine API** for additional satellite data
- **Google Maps API** for geocoding
- **Turf.js** for geospatial calculations

## Prerequisites

- Node.js 18+
- npm or yarn
- API Keys (already configured in `.env`):
  - SENTINEL HUB API credentials
  - Google Earth Engine API key

## Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend && npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend && npm install
   ```

4. **Environment variables**
   Your `.env` file is already configured with:
   ```
   VITE_SENTINEL_API_KEY=PLAKba450c24a3bd42aa958dbde1337eca43
   VITE_SENTINEL_NAME=SENTINEL2
   VITE_SENTINEL_ID=c9720a1a-99cd-4006-9bbb-a9c61314a96f   
   VITE_SENTINEL_CLIENT_ID=3683ccb0-f77b-445c-bb73-3edba4a1da81
   VITE_SENTINEL_CLIENT_SECRET=ihYAQbjhecJrTgybbQrd8Lzy84PR8DRY
   GOOGLE_EARTH_ENGINE_API_KEY=AIzaSyCXZ8hmzG8D4kMwuaMIPTOs4ganmZqKLVY
   ```

## Running the Application

### Development Mode
```bash
# Run both frontend and backend simultaneously
npm run dev
```

This will start:
- Frontend at `http://localhost:3000`
- Backend at `http://localhost:5001`

### Individual Services
```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend
```

### Production Build
```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Cities
- `GET /api/cities` - Get all cities for autocomplete
- `GET /api/cities/search?q={query}` - Search for cities by name

### Analysis
- `POST /api/analyze-greenspace` - Analyze greenspace for a city
  ```json
  {
    "city": "Toronto" // or city object from cities.json
  }
  ```

### Health Check
- `GET /api/health` - Server health and status

## How It Works

### 1. City Selection
- Users can search from 2600+ predefined cities with precise boundaries
- Or enter any city name for global geocoding via Google Maps API

### 2. Greenspace Analysis
- Uses grid-based analysis with ~500m resolution cells
- Calculates NDVI from satellite imagery (Red and Near-Infrared bands)
- NDVI threshold of 0.3+ identifies vegetation
- Aggregates results across the entire city boundary

### 3. Historical Analysis
- Analyzes greenspace coverage for past 15 years
- Generates trend data showing changes over time
- Identifies increasing, decreasing, or stable patterns

### 4. Scoring Algorithm
- **90-100**: Exceptional greenspace (50%+ coverage)
- **80-89**: Excellent greenspace (40-50% coverage)
- **60-79**: Good greenspace (25-40% coverage)
- **40-59**: Moderate greenspace (15-25% coverage)
- **20-39**: Limited greenspace (5-15% coverage)
- **0-19**: Very limited greenspace (<5% coverage)

## Data Sources

- **SENTINEL-2**: 10m resolution satellite imagery
- **Google Earth Engine**: Additional satellite data sources
- **OpenStreetMap**: City boundary definitions
- **Cities.json**: 2600+ predefined cities with precise polygons

## Project Structure

```
greenspace-claude/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js backend
│   ├── services/           # Business logic
│   │   ├── greenpaceAnalyzer.js  # Core analysis logic
│   │   └── geocoding.js    # Geocoding service
│   ├── server.js           # Express server
│   └── package.json        # Backend dependencies
├── cities.json             # Predefined cities database
├── .env                    # Environment variables
└── package.json            # Root package.json
```

## Development Notes

### Current Implementation
- **Simulation Mode**: Currently uses simulated NDVI data for demonstration
- **Grid Analysis**: Implements the requested grid-based methodology
- **Historical Trends**: Generates realistic historical data patterns
- **Scoring**: Implements percentage-based scoring system

### Production Considerations
For production deployment, you would need to:
1. Implement actual SENTINEL API calls for real satellite data
2. Add caching for analysis results
3. Implement rate limiting for API calls
4. Add user authentication if needed
5. Set up monitoring and logging
6. Configure production database for caching results

### API Rate Limits
- SENTINEL API: Check your plan limits
- Google Earth Engine: 25,000 requests/day (free tier)
- Google Maps Geocoding: 2,500 requests/day (free tier)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for research and personal use.

---

**Note**: This application currently uses simulated satellite data for demonstration purposes. For production use with real satellite imagery analysis, implement the actual SENTINEL and Google Earth Engine API calls in the `greenpaceAnalyzer.js` service. 