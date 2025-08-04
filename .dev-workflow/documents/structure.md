# Structure Document - Proceed Revenue Dashboard

## Project Architecture Overview

### Framework & Build System
- **Frontend Framework**: React 18.2.0 with Vite 5.1.0
- **Backend Framework**: Express.js with Node.js
- **Build Tool**: Vite for fast HMR and optimized production builds
- **Package Manager**: npm
- **Monorepo Structure**: Frontend and backend in single repository

## Directory Structure

```
proceed-dashboard/
├── src/                          # Frontend source code
│   ├── main.jsx                 # Application entry point
│   ├── App.jsx                  # Root component with routing
│   ├── index.css                # Global styles and Tailwind imports
│   ├── assets/                  # Static assets
│   │   └── logo.png            # Company logo
│   ├── components/              # Reusable UI components
│   ├── contexts/                # React Context providers
│   ├── pages/                   # Page-level components
│   ├── services/                # API and business logic
│   └── utils/                   # Utility functions
├── backend/                     # Backend API server
│   ├── server.js               # Express server entry point
│   ├── database/               # SQLite database files
│   ├── services/               # Business logic services
│   ├── middleware/             # Express middleware
│   ├── scripts/                # Database and utility scripts
│   └── templates/              # Excel templates
├── public/                      # Static public assets
├── e2e/                        # Playwright E2E tests
└── Configuration files         # Various config files
```

## Frontend Architecture

### Pages (Routes)
1. **`/` - Overview**: Executive dashboard with KPIs
2. **`/business-units` - Business Units**: Transportation & Warehouse performance
3. **`/customers` - Customers**: Customer achievement analysis
4. **`/forecast` - Forecast**: Sales forecasting and scenarios
5. **`/sales-plan` - Sales Plan**: Opportunity pipeline management
6. **`/upload` - Upload**: Data import interface

### Component Organization

#### Layout Components (`/components/layout/`)
- `DashboardLayout.jsx`: Main layout wrapper
- `Sidebar.jsx`: Navigation sidebar
- `Header.jsx`: Top header bar
- `ToolbarSection.jsx`: Page-specific toolbars

#### Card Components (`/components/cards/`)
- `MetricCard.jsx`: KPI display cards
- `ContentCard.jsx`: General content wrapper
- `EnhancedMetricCard.jsx`: Advanced metric displays

#### Chart Components (`/components/charts/`)
- `GaugeChart.jsx`: Achievement gauge visualization
- `BusinessUnitBarChart.jsx`: Bar charts for units
- `CustomerPerformanceChart.jsx`: Customer analytics
- `PeriodComparisonChart.jsx`: Time period comparisons

#### Filter Components (`/components/filters/`)
- `HierarchicalFilter.jsx`: Main filter system
- `PeriodFilter.jsx`: Period selection
- `FilterBar.jsx`: Compact filter bar
- `QuickRangePresets.jsx`: YTD/QTD/MTD buttons
- `ViewModeToggle.jsx`: Yearly/Quarterly/Monthly toggle

#### Export Components (`/components/export/`)
- `ExportButton.jsx`: Export trigger
- `ExportDialog.jsx`: Format selection
- `ExportProgress.jsx`: Export status

### Context Providers (`/contexts/`)
1. **FilterContext**: Global filter state management
2. **HierarchicalFilterContext**: Advanced filter logic
3. **DataRefreshContext**: Data refresh orchestration
4. **SalesPlanContext**: Sales plan specific state
5. **ExportContext**: Export functionality state

### Services (`/services/`)
- `api.service.js`: Base API communication
- `dataService.js`: Data fetching with caching
- `connectionManager.js`: API health & retry logic
- `exportService.js`: Export functionality

## Backend Architecture

### API Endpoints

#### Overview Data
- `GET /api/overview/:year` - Overview metrics
- `GET /api/service-breakdown/:year` - Service type breakdown

#### Business Units
- `GET /api/business-units/:year` - Unit performance
- `GET /api/business-units/monthly-breakdown/:year` - Monthly details

#### Customers
- `GET /api/customers/:year` - Customer list
- `GET /api/customers/by-service/:year` - Service breakdown
- `GET /api/customer-ranking/:year` - Top customers

#### Data Management
- `POST /api/upload` - Excel file upload
- `GET /api/analysis-validation/:year` - Data validation
- `GET /api/available-years` - Available data years

#### Forecasting
- `GET /api/forecast/:year` - Forecast data
- `POST /api/opportunities` - Create opportunity
- `PUT /api/opportunities/:id` - Update opportunity

#### Export
- `GET /api/export/overview` - Export overview data
- `GET /api/export/customers` - Export customer data
- `POST /api/export/table` - Export custom table

### Database Schema (SQLite)

#### Core Tables
- `revenue_data`: Main revenue records
- `business_unit_mapping`: BU categorization
- `gl_mapping`: GL code mappings
- `revenue_summary`: Aggregated data

#### Forecast Tables
- `opportunities`: Sales opportunities
- `opportunity_products`: Product details
- `opportunity_activities`: Activity tracking

#### Sales Plan Tables
- `sales_plan_data`: Plan records
- `sales_plan_summary`: Aggregated plans

### Services (`/backend/services/`)
- `data.service.js`: Data queries and aggregation
- `etl.service.js`: Excel import and transformation
- `forecast.service.js`: Forecasting logic
- `excel-export.service.js`: Excel generation
- `salesPlan.service.js`: Sales planning

## Design Patterns

### Frontend Patterns
1. **Container/Presenter**: Pages fetch data, components display
2. **Context Provider**: Global state management
3. **Custom Hooks**: Reusable logic extraction
4. **Compound Components**: Complex UI composition
5. **Lazy Loading**: Route-based code splitting

### Backend Patterns
1. **Service Layer**: Business logic separation
2. **Middleware Pipeline**: Request processing
3. **Repository Pattern**: Database abstraction
4. **Factory Pattern**: Export format generation
5. **Singleton**: Database connection

## Naming Conventions

### Files
- React Components: `PascalCase.jsx`
- Services: `camelCase.service.js`
- Utilities: `camelCase.js`
- Tests: `*.test.js` or `*.test.jsx`
- Styles: `kebab-case.css`

### Code
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- CSS Classes: `kebab-case`
- API Routes: `/kebab-case`

## Configuration Files

### Frontend
- `vite.config.js`: Vite configuration
- `tailwind.config.js`: Tailwind CSS setup
- `vitest.config.js`: Test configuration
- `.env`: Environment variables

### Backend
- `jest.config.js`: Backend test config
- `render.yaml`: Render deployment
- `.env`: API configuration

### Quality Tools
- `.eslintrc.js`: Linting rules
- `.prettierrc.json`: Code formatting
- `.gitignore`: Version control