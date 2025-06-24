const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const etlService = require('./services/etl.service');
const dataService = require('./services/data.service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// API Routes

// Upload and process Excel file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await etlService.processExcelFile(req.file.path);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
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

// Get monthly trend data
app.get('/api/trends/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const data = await dataService.getMonthlyTrends(parseInt(year));
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});

// Graceful shutdown
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