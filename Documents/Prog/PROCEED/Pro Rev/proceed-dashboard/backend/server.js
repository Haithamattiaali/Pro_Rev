require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const etlService = require('./services/etl.service');
const dataService = require('./services/data.service');
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
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  : {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173'
      ],
      credentials: true,
      optionsSuccessStatus: 200
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

// Apply middleware
app.use(requestTimeout(30000)); // 30 second timeout
app.use('/api', ensureConnection); // Ensure DB connection for all API routes

// Configure multer for file uploads
const uploadDir = process.env.NODE_ENV === 'production' ? '/var/data/uploads' : 'uploads/';
const upload = multer({
  dest: uploadDir,
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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    cors: 'CORS is configured',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await db.get('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'connected'
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