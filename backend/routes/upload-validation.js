const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const etlService = require('../services/etl.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Initial upload with validation
router.post('/upload-validate', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    // Process file with validation
    const results = await etlService.processExcelFile(req.file.path);

    if (results.validationRequired) {
      // Return validation results for user confirmation
      return res.json({
        success: true,
        validationRequired: true,
        validation: results.validationResults,
        tempFilePath: req.file.path, // Keep for re-processing
        summary: {
          total: results.validationResults.summary.total,
          valid: results.validationResults.summary.valid,
          warnings: results.validationResults.summary.warnings,
          errors: results.validationResults.summary.errors,
          confirmationNeeded: results.validationResults.summary.confirmationNeeded
        }
      });
    }

    // No validation required, return success
    return res.json({
      success: true,
      validationRequired: false,
      results: results
    });

  } catch (error) {
    console.error('Upload validation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Upload processing failed',
      error: error.message 
    });
  }
});

// Process upload with user decisions
router.post('/upload-confirm', async (req, res) => {
  try {
    const { tempFilePath, decisions } = req.body;

    if (!tempFilePath) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file path provided' 
      });
    }

    // Process file with user decisions
    const results = await etlService.processExcelFile(tempFilePath, {
      skipValidation: true,
      decisions: decisions
    });

    return res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Upload confirmation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Upload confirmation failed',
      error: error.message 
    });
  }
});

module.exports = router;