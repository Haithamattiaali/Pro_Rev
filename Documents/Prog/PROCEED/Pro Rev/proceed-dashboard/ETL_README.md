# Proceed Revenue Dashboard - ETL Integration

## Overview
The dashboard now features a complete ETL (Extract, Transform, Load) service that processes Excel files and stores data in a SQLite database. All visualizations are connected to this database and support dynamic filtering by period (MTD, QTD, YTD).

## Architecture

### Backend Components
- **SQLite Database**: Stores all revenue data with proper indexing for performance
- **ETL Service**: Processes Excel files and populates the database
- **REST API**: Serves data to the frontend with period-based filtering
- **Express Server**: Runs on port 3001

### Frontend Components
- **Data Service**: Fetches data from the API with caching
- **Period Filters**: MTD, QTD, YTD filters that dynamically update all visualizations
- **React Dashboard**: Runs on port 5173

## Getting Started

### Quick Start
```bash
# Run this command to start both backend and frontend
./start.sh
```

This will:
1. Install all dependencies
2. Initialize the database with existing data
3. Start the backend server on port 3001
4. Start the frontend server on port 5173

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
npm run init-db  # Initialize database with master_table.json
npm start        # Start the backend server
```

#### Frontend Setup
```bash
npm install
npm run dev      # Start the frontend server
```

## Data Upload

### Upload Excel File via API
You can upload new Excel files to update the database:

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@your_excel_file.xlsx"
```

### Excel File Format
The Excel file should have the following columns:
- Customer
- Service_Type (Transportation or Warehouses)
- Year
- Month (Jan, Feb, Mar, etc.)
- Cost
- Target
- Revenue
- Receivables Collected

## API Endpoints

### Overview Data
```
GET /api/overview?year=2025&period=YTD
```

### Business Units
```
GET /api/business-units?year=2025&period=QTD
```

### Customers
```
GET /api/customers?year=2025&period=MTD
```

### Monthly Trends
```
GET /api/trends/monthly?year=2025
```

### Customer Achievement
```
GET /api/customers/achievement?year=2025&period=YTD
```

### Available Years
```
GET /api/years
```

## Period Filters

- **MTD (Month to Date)**: Shows data for the current month only
- **QTD (Quarter to Date)**: Shows data from the start of the current quarter
- **YTD (Year to Date)**: Shows all data from the beginning of the year

## Database Schema

The main table `revenue_data` contains:
- customer (TEXT)
- service_type (TEXT)
- year (INTEGER)
- month (TEXT)
- cost (REAL)
- target (REAL)
- revenue (REAL)
- receivables_collected (REAL)

## Troubleshooting

### Port Already in Use
If you get a "port already in use" error:
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Database Issues
To reset the database:
```bash
cd backend
rm database/proceed_revenue.db
npm run init-db
```

### API Connection Issues
Make sure the `.env` file contains:
```
VITE_API_URL=http://localhost:3001/api
```

## Development

### Adding New Data Fields
1. Update the database schema in `backend/database/schema.sql`
2. Modify the ETL service in `backend/services/etl.service.js`
3. Update API endpoints in `backend/services/data.service.js`
4. Update frontend components to display new fields

### Performance Optimization
- The database uses indexes for fast queries
- Frontend implements caching with 5-minute TTL
- API responses are optimized for minimal data transfer