require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const etlService = require('./services/etl.service');
const dataService = require('./services/data.service');
const salesPlanService = require('./services/salesPlan.service');
// Use new sustainable Excel export system
const ExcelExportService = require('./services/excel');
const legacyExcelExportService = require('./services/excel-export.service'); // Keep for fallback
const db = require('./database/db-wrapper');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple CORS configuration for production
const corsOptions = process.env.NODE_ENV === 'production' 
  ? {
      origin: true, // Allow all origins in production
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'Content-Type']
    }
  : {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ],
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
      exposedHeaders: ['Content-Length', 'Content-Type']
    };

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// Import request handling middleware
const { ensureConnection, requestTimeout, errorRecovery } = require('./middleware/requestHandler');

// Apply middleware with longer timeout for uploads
app.use((req, res, next) => {
  // Set longer timeout for upload endpoints
  if (req.path === '/api/upload') {
    req.setTimeout(5 * 60 * 1000); // 5 minutes for uploads
  }
  next();
});
app.use(requestTimeout(120000)); // 2 minute default timeout
app.use('/api', ensureConnection); // Ensure DB connection for all API routes

// Configure multer for file uploads
const fs = require('fs');
const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : 'uploads/';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Initialize the new Excel export service
const excelExportService = new ExcelExportService(dataService);

// API Routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    cors: 'CORS is configured',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString(),
    excelSystem: 'New sustainable Excel export system active'
  });
});

// Upload and process Excel file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await etlService.processExcelFile(req.file.path);
    
    // Format response based on what was processed
    const response = {
      success: true,
      message: 'File processed successfully',
      sheets: result.sheets,
      results: {}
    };
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let hasData = false;
    
    if (result.revenueData) {
      response.results.revenueData = result.revenueData;
      if (result.revenueData.totalRecords > 0) hasData = true;
      totalInserted += result.revenueData.inserted || 0;
      totalUpdated += result.revenueData.updated || 0;
    }
    if (result.salesPlan) {
      response.results.salesPlan = result.salesPlan;
      if (result.salesPlan.totalRecords > 0) hasData = true;
      totalInserted += result.salesPlan.inserted || 0;
      totalUpdated += result.salesPlan.updated || 0;
    }
    if (result.opportunities) {
      response.results.opportunities = result.opportunities;
      if (result.opportunities.totalRecords > 0) hasData = true;
      totalInserted += result.opportunities.inserted || 0;
      totalUpdated += result.opportunities.updated || 0;
    }
    
    // Add summary for frontend
    response.totalRecords = (result.revenueData?.totalRecords || 0) + 
                           (result.salesPlan?.totalRecords || 0) + 
                           (result.opportunities?.totalRecords || 0);
    response.inserted = totalInserted;
    response.updated = totalUpdated;
    response.errors = (result.revenueData?.errors || 0) + 
                     (result.salesPlan?.errors || 0) + 
                     (result.opportunities?.errors || 0);
    
    if (!hasData) {
      response.message = 'File uploaded successfully but no data was found. Please ensure your file contains data rows.';
    }
    
    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download Excel template with current data
app.get('/api/template/download', async (req, res) => {
  try {
    const { year } = req.query;
    const templateService = require('./services/template.service');
    
    // Generate template with optional year filter
    const buffer = await templateService.generateTemplate(year ? parseInt(year) : null);
    const filename = templateService.generateFilename();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get overview data with period filter
app.get('/api/overview', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    console.log('🌐 API /overview received:', { year, period, month, quarter });
    
    const data = await dataService.getOverviewData(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select overview data
app.post('/api/overview/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly' } = req.body;
    
    console.log('🌐 API /overview/multi-select received:', { 
      years, 
      periods, 
      viewMode,
      body: req.body,
      periodsLength: periods.length,
      periodsType: Array.isArray(periods) ? 'array' : typeof periods
    });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    // Additional validation for Q1+Q2 selection
    if (filters.quarters && filters.quarters.length === 2 && 
        filters.quarters.includes(1) && filters.quarters.includes(2)) {
      console.log('🔍 Q1+Q2 Selection Detected - Expecting months: Jan-Jun only');
    }
    
    console.log('🌐 Converted filters:', filters);
    
    const data = await dataService.getOverviewDataMultiSelect(filters);
    res.json(data);
  } catch (error) {
    console.error('Multi-select overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get business unit data
app.get('/api/business-units', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getBusinessUnitData(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Business units error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select business unit data
app.post('/api/business-units/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly' } = req.body;
    
    console.log('🌐 API /business-units/multi-select received:', { years, periods, viewMode });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    const data = await dataService.getBusinessUnitDataMultiSelect(filters);
    res.json(data);
  } catch (error) {
    console.error('Multi-select business units error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer data
app.get('/api/customers', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getCustomerData(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select customer data
app.post('/api/customers/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly' } = req.body;
    
    console.log('🌐 API /customers/multi-select received:', { years, periods, viewMode });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    const data = await dataService.getCustomerDataMultiSelect(filters);
    res.json(data);
  } catch (error) {
    console.error('Multi-select customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get monthly trend data
app.get('/api/trends/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), serviceType = null } = req.query;
    const data = await dataService.getMonthlyTrends(parseInt(year), serviceType);
    res.json(data);
  } catch (error) {
    console.error('Monthly trends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer achievement data
app.get('/api/customers/achievement', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getCustomerAchievement(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Customer achievement error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get gross profit data with pro-rated targets
app.get('/api/gross-profit', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getGrossProfitData(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Gross profit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get customer service breakdown
app.get('/api/customers/service-breakdown', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getCustomerServiceBreakdown(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Customer service breakdown error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available years
app.get('/api/years', async (req, res) => {
  try {
    const years = await dataService.getAvailableYears();
    res.json(years);
  } catch (error) {
    console.error('Years error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get analysis period validation for a specific year
app.get('/api/analysis-validation/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const validation = await dataService.getAnalysisPeriodValidation(parseInt(year));
    res.json(validation);
  } catch (error) {
    console.error('Analysis validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export endpoints
// Export overview data to Excel (using new sustainable system)
app.get('/api/export/overview', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    // Use the new export service
    const result = await excelExportService.exportOverview({
      year: parseInt(year),
      period,
      month: month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter: quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Export overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export business unit data to Excel
app.get('/api/export/business-units', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await dataService.getBusinessUnitData(
      parseInt(year), 
      period,
      month ? (month === 'all' ? 'all' : parseInt(month)) : null,
      quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null
    );
    
    const workbook = excelExportService.exportBusinessUnitData(data, year, period);
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=proceed-business-units-${period}-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export business units error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export customer data to Excel
app.get('/api/export/customers', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const [customerData, achievementData, serviceBreakdown] = await Promise.all([
      dataService.getCustomerData(parseInt(year), period, month ? (month === 'all' ? 'all' : parseInt(month)) : null, quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null),
      dataService.getCustomerAchievement(parseInt(year), period, month ? (month === 'all' ? 'all' : parseInt(month)) : null, quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null),
      dataService.getCustomerServiceBreakdown(parseInt(year), period, month ? (month === 'all' ? 'all' : parseInt(month)) : null, quarter ? (quarter === 'all' ? 'all' : parseInt(quarter)) : null)
    ]);
    
    const workbook = excelExportService.exportCustomerData(customerData, achievementData, serviceBreakdown, year, period);
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=proceed-customers-${period}-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export monthly trends to Excel
app.get('/api/export/trends', async (req, res) => {
  try {
    const { year = new Date().getFullYear(), serviceType = null } = req.query;
    const data = await dataService.getMonthlyTrends(parseInt(year), serviceType);
    
    const workbook = excelExportService.exportMonthlyTrends(data, year);
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=proceed-trends-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export trends error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export sales plan data to Excel
app.get('/api/export/sales-plan', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;

    // Fetch all sales plan data
    const [overview, byGL, byBU, monthly] = await Promise.all([
      salesPlanService.getSalesPlanOverview(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanByGL(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanByBusinessUnit(parseInt(year), period, month ? parseInt(month) : null, quarter ? parseInt(quarter) : null),
      salesPlanService.getSalesPlanMonthly(parseInt(year))
    ]);

    const workbook = legacyExcelExportService.exportSalesPlanData({
      overview,
      byGL,
      byBU,
      monthly,
      year,
      period
    });
    
    const buffer = legacyExcelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=proceed-sales-plan-${period}-${year}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export sales plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export generic table data (using new sustainable system)
app.post('/api/export/table', express.json(), async (req, res) => {
  try {
    const { data, headers, title, filename } = req.body;
    
    if (!data || !headers) {
      return res.status(400).json({ error: 'Data and headers are required' });
    }
    
    // Use the new export service for table exports
    const result = await excelExportService.exportTable({
      data,
      headers,
      title,
      filename,
      includeTotals: req.body.includeTotals
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Export table error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Custom export endpoints for selective exports (using new sustainable system)
app.post('/api/export/custom/overview', async (req, res) => {
  try {
    const { sections, period, data } = req.body;
    
    // Use the new export service for custom exports
    const result = await excelExportService.exportCustom('overview', {
      sections,
      period,
      data,
      year: req.body.year || new Date().getFullYear()
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export/custom/business-units', async (req, res) => {
  try {
    const { sections, period, data } = req.body;
    const workbook = await excelExportService.exportCustomBusinessUnits(sections, period, data);
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="proceed_business_units_custom.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/export/custom/customers', async (req, res) => {
  try {
    const { sections, period, data } = req.body;
    const workbook = await excelExportService.exportCustomCustomers(sections, period, data);
    const buffer = excelExportService.workbookToBuffer(workbook);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="proceed_customers_custom.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deployment test endpoint
app.get('/api/deployment-test', (req, res) => {
  res.json({ 
    message: 'Performance cost fix deployed!',
    version: '1.0.3-fix',
    timestamp: new Date().toISOString(),
    fix: 'Gross profit calculation now uses performance-adjusted costs'
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.get('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.3-performance-cost-fix',
      deploymentTest: true,
      autoDeployment: 'working',
      features: {
        performanceCost: true,
        originalCostField: true
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Forecast API endpoints
const forecastService = require('./services/forecast.service');

// Get forecast data
app.get('/api/forecast', async (req, res) => {
  try {
    const { 
      year, 
      historicalStart, 
      historicalEnd, 
      forecastStart, 
      forecastEnd, 
      method = 'linear',
      methodConfig 
    } = req.query;
    
    // Handle legacy year-only requests
    if (year && !historicalStart) {
      const config = await forecastService.getForecastConfig();
      const forecast = await forecastService.generateForecast(parseInt(year), config);
      res.json(forecast);
    } else {
      // New flexible date range request
      const params = {
        historicalStart: historicalStart ? new Date(historicalStart) : undefined,
        historicalEnd: historicalEnd ? new Date(historicalEnd) : undefined,
        forecastStart: forecastStart ? new Date(forecastStart) : undefined,
        forecastEnd: forecastEnd ? new Date(forecastEnd) : undefined,
        method,
        methodConfig: methodConfig ? JSON.parse(methodConfig) : {},
        ...(await forecastService.getForecastConfig())
      };
      
      const forecast = await forecastService.generateForecast(params);
      res.json(forecast);
    }
  } catch (error) {
    console.error('Forecast error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
});

// Generate new forecast
app.post('/api/forecast/generate', async (req, res) => {
  try {
    const { 
      year,
      historicalStart,
      historicalEnd,
      forecastStart,
      forecastEnd,
      method = 'linear',
      methodConfig = {},
      ...config 
    } = req.body;
    
    // Handle legacy year-only requests
    if (year && !historicalStart) {
      const forecast = await forecastService.generateForecast(parseInt(year), config);
      res.json(forecast);
    } else {
      // New flexible date range request
      const params = {
        historicalStart: historicalStart ? new Date(historicalStart) : undefined,
        historicalEnd: historicalEnd ? new Date(historicalEnd) : undefined,
        forecastStart: forecastStart ? new Date(forecastStart) : undefined,
        forecastEnd: forecastEnd ? new Date(forecastEnd) : undefined,
        method,
        methodConfig,
        ...config
      };
      
      const forecast = await forecastService.generateForecast(params);
      res.json(forecast);
    }
  } catch (error) {
    console.error('Forecast generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  }
});

// Get forecast opportunities
app.get('/api/forecast/opportunities', async (req, res) => {
  try {
    const opportunities = await forecastService.getOpportunities();
    res.json(opportunities);
  } catch (error) {
    console.error('Opportunities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create opportunity
app.post('/api/forecast/opportunities', async (req, res) => {
  try {
    const opportunity = await forecastService.createOpportunity(req.body);
    res.json(opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update opportunity
app.put('/api/forecast/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await forecastService.updateOpportunity(parseInt(id), req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Opportunity not found' });
    }
  } catch (error) {
    console.error('Update opportunity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete opportunity
app.delete('/api/forecast/opportunities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await forecastService.deleteOpportunity(parseInt(id));
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Opportunity not found' });
    }
  } catch (error) {
    console.error('Delete opportunity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get forecast configuration
app.get('/api/forecast/config', async (req, res) => {
  try {
    const config = await forecastService.getForecastConfig();
    res.json(config);
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update forecast configuration
app.put('/api/forecast/config', async (req, res) => {
  try {
    const success = await forecastService.updateForecastConfig(req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Failed to update configuration' });
    }
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export forecast data
app.get('/api/export/forecast', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const config = await forecastService.getForecastConfig();
    const forecast = await forecastService.generateForecast(parseInt(year), config);
    
    // Use the excel export service
    const result = await legacyExcelExportService.exportForecast(forecast, parseInt(year));
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (error) {
    console.error('Export forecast error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sales Plan API endpoints
// Get sales plan overview
app.get('/api/sales-plan/overview', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null,
      serviceType = null
    } = req.query;
    
    const data = await salesPlanService.getSalesPlanOverview(
      parseInt(year), 
      period,
      month ? parseInt(month) : null,
      quarter ? parseInt(quarter) : null,
      serviceType
    );
    res.json(data);
  } catch (error) {
    console.error('Sales plan overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get monthly sales plan data
app.get('/api/sales-plan/monthly', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null,
      serviceType = null 
    } = req.query;
    const data = await salesPlanService.getSalesPlanMonthly(
      parseInt(year), 
      period,
      month ? parseInt(month) : null,
      quarter ? parseInt(quarter) : null,
      serviceType
    );
    res.json(data);
  } catch (error) {
    console.error('Sales plan monthly error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select sales plan monthly
app.post('/api/sales-plan/monthly/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly', serviceType = null } = req.body;
    
    console.log('🌐 API /sales-plan/monthly/multi-select received:', { years, periods, viewMode, serviceType });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    const data = await salesPlanService.getSalesPlanMonthlyMultiSelect(filters, serviceType);
    res.json(data);
  } catch (error) {
    console.error('Sales plan monthly multi-select error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sales plan by GL account
app.get('/api/sales-plan/by-gl', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null,
      serviceType = null
    } = req.query;
    
    const data = await salesPlanService.getSalesPlanByGL(
      parseInt(year), 
      period,
      month ? parseInt(month) : null,
      quarter ? parseInt(quarter) : null,
      serviceType
    );
    res.json(data);
  } catch (error) {
    console.error('Sales plan by GL error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get sales plan by business unit
app.get('/api/sales-plan/by-business-unit', async (req, res) => {
  try {
    const { 
      year = new Date().getFullYear(), 
      period = 'YTD',
      month = null,
      quarter = null
    } = req.query;
    
    const data = await salesPlanService.getSalesPlanByBusinessUnit(
      parseInt(year), 
      period,
      month ? parseInt(month) : null,
      quarter ? parseInt(quarter) : null
    );
    res.json(data);
  } catch (error) {
    console.error('Sales plan by business unit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select sales plan overview
app.post('/api/sales-plan/overview/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly', serviceType = null } = req.body;
    
    console.log('🌐 API /sales-plan/overview/multi-select received:', { 
      years, 
      periods, 
      viewMode, 
      serviceType,
      yearsType: Array.isArray(years) ? years.map(y => typeof y) : typeof years,
      periodsLength: periods.length 
    });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    const data = await salesPlanService.getSalesPlanOverviewMultiSelect(filters, serviceType);
    res.json(data);
  } catch (error) {
    console.error('Sales plan overview multi-select error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Multi-select sales plan by GL
app.post('/api/sales-plan/by-gl/multi-select', async (req, res) => {
  try {
    const { years = [], periods = [], viewMode = 'quarterly', serviceType = null } = req.body;
    
    console.log('🌐 API /sales-plan/by-gl/multi-select received:', { years, periods, viewMode, serviceType });
    
    // Convert periods to months/quarters based on viewMode
    const filters = {
      years: years.map(y => parseInt(y)),
      months: [],
      quarters: []
    };
    
    if (viewMode === 'monthly') {
      filters.months = periods.map(p => parseInt(p));
    } else if (viewMode === 'quarterly') {
      filters.quarters = periods.map(p => {
        const quarterNum = parseInt(p.toString().replace('Q', ''));
        console.log(`🌐 Converting period '${p}' to quarter: ${quarterNum}`);
        return quarterNum;
      });
    }
    
    console.log('🌐 Final filters:', JSON.stringify(filters));
    
    const data = await salesPlanService.getSalesPlanByGLMultiSelect(filters, serviceType);
    res.json(data);
  } catch (error) {
    console.error('Sales plan by GL multi-select error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    const { status, service, location } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (service) filters.service = service;
    if (location) filters.location = location;
    
    const data = await salesPlanService.getOpportunities(filters);
    res.json(data);
  } catch (error) {
    console.error('Opportunities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities by status
app.get('/api/opportunities/by-status', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesByStatus();
    res.json(data);
  } catch (error) {
    console.error('Opportunities by status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities by service
app.get('/api/opportunities/by-service', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesByService();
    res.json(data);
  } catch (error) {
    console.error('Opportunities by service error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities by location
app.get('/api/opportunities/by-location', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesByLocation();
    res.json(data);
  } catch (error) {
    console.error('Opportunities by location error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities pipeline
app.get('/api/opportunities/pipeline', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesPipeline();
    res.json(data);
  } catch (error) {
    console.error('Opportunities pipeline error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities insights
app.get('/api/opportunities/insights', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesInsights();
    res.json(data);
  } catch (error) {
    console.error('Opportunities insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities pipeline by status
app.get('/api/opportunities/pipeline-by-status', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesPipelineByStatus();
    res.json(data);
  } catch (error) {
    console.error('Opportunities pipeline by status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities service analysis
app.get('/api/opportunities/service-analysis', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesServiceAnalysis();
    res.json(data);
  } catch (error) {
    console.error('Opportunities service analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunities matrix (Revenue vs GP%)
app.get('/api/opportunities/matrix', async (req, res) => {
  try {
    const data = await salesPlanService.getOpportunitiesMatrix();
    res.json(data);
  } catch (error) {
    console.error('Opportunities matrix error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Distribute opportunities to sales plan
app.post('/api/opportunities/distribute', async (req, res) => {
  try {
    const { year = 2025 } = req.body;
    const opportunityDistribution = require('./services/opportunityDistribution.service');
    
    // Get current distribution before update
    const before = await opportunityDistribution.getCurrentDistribution(year);
    
    // Distribute opportunities
    const result = await opportunityDistribution.updateSalesPlanOpportunities(year);
    
    // Get distribution after update
    const after = await opportunityDistribution.getCurrentDistribution(year);
    
    res.json({
      success: true,
      message: 'Opportunities distributed successfully',
      before: before.summary,
      after: after.summary,
      verification: result.verification,
      details: result.distributions
    });
  } catch (error) {
    console.error('Opportunity distribution error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get opportunity distribution analysis
app.get('/api/opportunities/distribution-analysis', async (req, res) => {
  try {
    const { year = 2025 } = req.query;
    const opportunityDistribution = require('./services/opportunityDistribution.service');
    
    const categorized = await opportunityDistribution.getOpportunitiesByServiceType();
    const current = await opportunityDistribution.getCurrentDistribution(year);
    const verification = await opportunityDistribution.verifyOpportunityDistribution(year);
    
    res.json({
      opportunity_totals: categorized,
      current_distribution: current,
      verification
    });
  } catch (error) {
    console.error('Distribution analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use(errorRecovery);
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server only if not in test environment
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

// Handle server errors
if (server) {
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error('Server error:', error);
    }
  });
}

// Graceful shutdown
if (server) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
}

// Export app for testing
module.exports = app;// Auto-deploy test: Fri Jul 18 08:39:27 +03 2025
// Auto-deploy verification: Fri Jul 18 09:37:59 +03 2025
