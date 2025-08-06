const xlsx = require('xlsx');
const dbWrapper = require('../database/db-wrapper');
const db = require('../database/persistent-db');
const fs = require('fs').promises;
const daysValidation = require('./daysValidation.service');

class ETLService {
  constructor() {
    this.monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    this.validationCorrections = new Map(); // Store corrections for later use
  }

  async processExcelFile(filePath, userDecisions = {}) {
    try {
      console.log('Processing Excel file:', filePath);
      
      // Read Excel file
      const workbook = xlsx.readFile(filePath);
      const results = {
        revenueData: null,
        salesPlan: null,
        opportunities: null,
        sheets: workbook.SheetNames,
        validationRequired: false,
        validationResults: null
      };
      
      // Process each sheet
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`Processing sheet: ${sheetName} (${jsonData.length} rows)`);
        
        // Determine sheet type based on name or position
        if (sheetName.toLowerCase().includes('revenue') || i === 0) {
          // First validate the data
          const validation = await this.validateRevenueData(jsonData);
          
          // Store validation results for use during insertion
          this.storeValidationCorrections(validation);
          
          if (validation.summary.confirmationNeeded > 0 && !userDecisions.skipValidation) {
            // Return validation results for user confirmation
            results.validationRequired = true;
            results.validationResults = validation;
            results.pendingData = jsonData;
            return results;
          }
          
          // Apply user decisions if provided
          let dataToProcess = jsonData;
          if (userDecisions.decisions && validation.requiresConfirmation.length > 0) {
            dataToProcess = this.applyValidationDecisions(jsonData, validation, userDecisions.decisions);
          }
          
          // Process as revenue data with validation corrections
          results.revenueData = await this.insertData(dataToProcess, validation);
          
          // Add validation summary to results
          results.revenueData.validationSummary = {
            autoCorrections: validation.summary.errors,
            confirmations: validation.summary.confirmationNeeded,
            validRecords: validation.summary.valid
          };
        } else if (sheetName.toLowerCase().includes('sales plan') || i === 1) {
          // Process as sales plan data
          results.salesPlan = await this.processSalesPlanData(jsonData);
        } else if (sheetName.toLowerCase().includes('opportunities') || i === 2) {
          // Process as opportunities data
          results.opportunities = await this.processOpportunitiesData(jsonData);
        }
      }
      
      // Clean up temp file if exists
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.log('Error deleting temp file:', err);
      }
      
      return results;
    } catch (error) {
      console.error('ETL process error:', error);
      throw error;
    }
  }

  // NEW METHOD: Validate required fields and format for validation service
  validateRequiredFields(row) {
    // Check required fields
    if (!row.Customer && !row.customer) {
      return null;
    }
    if (!row.Year && !row.year) {
      return null;
    }
    if (!row.Month && !row.month) {
      return null;
    }
    
    // Handle different column name variations
    const customer = row.Customer || row.customer;
    const serviceType = row.Service_Type || row.service_type || row['Service Type'] || 'General';
    const year = parseInt(row.Year || row.year);
    const month = row.Month || row.month;
    const days = parseInt(row.Days || row.days || row['Days '] || row['Days']);
    const revenue = parseFloat(row.Revenue || row.revenue || 0);
    const target = parseFloat(row.Target || row.target || 0);
    const cost = parseFloat(row.Cost || row.cost || 0);
    
    return {
      customer: String(customer).trim(),
      service_type: String(serviceType).trim(),
      year: year,
      month: String(month).trim(),
      days: isNaN(days) ? null : days, // Don't default to 30!
      revenue: revenue,
      target: target,
      cost: cost
    };
  }

  // NEW METHOD: Store validation corrections for use during insertion
  storeValidationCorrections(validation) {
    this.validationCorrections.clear();
    
    // Store auto-corrections
    validation.errors.forEach(error => {
      const key = this.getRecordKey(error);
      this.validationCorrections.set(key, {
        type: 'auto-correct',
        correctedDays: error.validation.correctedDays,
        message: error.validation.message
      });
    });
    
    // Store confirmations (if user accepted suggested values)
    validation.requiresConfirmation.forEach(conf => {
      const key = this.getRecordKey(conf);
      this.validationCorrections.set(key, {
        type: 'confirmation',
        suggestedDays: conf.validation.suggestedDays,
        message: conf.validation.message
      });
    });
  }

  // NEW METHOD: Get unique key for a record
  getRecordKey(record) {
    return `${record.customer}-${record.service_type}-${record.year}-${record.month}`;
  }

  async insertData(data, validation = null) {
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    let corrected = 0;
    
    // Check if data is empty
    if (!data || data.length === 0) {
      return {
        success: true,
        totalRecords: 0,
        inserted: 0,
        updated: 0,
        errors: 0,
        corrected: 0,
        message: 'No data found in the uploaded file'
      };
    }
    
    // Use direct database access for transactions
    const transaction = db.transaction((records) => {
      // Prepare statement for better performance
      const stmt = db.db.prepare(`
        INSERT INTO revenue_data (
          customer, service_type, year, month,
          cost, target, revenue, receivables_collected, days,
          calendar_days, original_cost, original_target, analysis_date,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(customer, service_type, year, month)
        DO UPDATE SET
          cost = excluded.cost,
          target = excluded.target,
          revenue = excluded.revenue,
          receivables_collected = excluded.receivables_collected,
          days = excluded.days,
          calendar_days = excluded.calendar_days,
          original_cost = excluded.original_cost,
          original_target = excluded.original_target,
          analysis_date = excluded.analysis_date,
          updated_at = datetime('now')
      `);
      
      for (const record of records) {
        try {
          // Validate and clean data with corrections applied
          const cleanedData = this.validateAndCleanRow(record);
          if (!cleanedData) {
            errors++;
            continue;
          }
          
          // Execute prepared statement
          const result = stmt.run(
            cleanedData.customer,
            cleanedData.service_type,
            cleanedData.year,
            cleanedData.month,
            cleanedData.cost,
            cleanedData.target,
            cleanedData.revenue,
            cleanedData.receivables_collected,
            cleanedData.days,
            cleanedData.calendar_days,
            cleanedData.original_cost,
            cleanedData.original_target
          );
          
          if (result.changes > 0) {
            if (result.lastInsertRowid) inserted++;
            else updated++;
            
            if (cleanedData.wasCorrected) {
              corrected++;
            }
          }
        } catch (err) {
          console.error('Error processing row:', record, err);
          errors++;
        }
      }
    });
    
    try {
      // Execute transaction
      transaction(data);
      
      return {
        success: true,
        totalRecords: data.length,
        inserted,
        updated,
        errors,
        corrected
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  validateAndCleanRow(row) {
    // Required fields
    const customer = row.Customer || row.customer;
    const serviceType = row.Service_Type || row.service_type || row['Service Type'];
    const year = parseInt(row.Year || row.year);
    const month = String(row.Month || row.month).trim();
    
    if (!customer || !serviceType || !year || !month) {
      console.warn('Missing required fields:', row);
      return null;
    }
    
    // Get days value - don't default yet!
    let days = parseInt(row.Days || row.days || row['Days '] || row['Days']);
    let wasCorrected = false;
    
    // Check for validation corrections
    const key = `${customer.trim()}-${serviceType.trim()}-${year}-${month}`;
    const correction = this.validationCorrections.get(key);
    
    if (correction) {
      if (correction.type === 'auto-correct' && correction.correctedDays) {
        console.log(`Auto-correcting ${month} ${year} for ${customer}: ${days} → ${correction.correctedDays} days`);
        days = correction.correctedDays;
        wasCorrected = true;
      }
    }
    
    // If still no days value, use calendar days as default
    if (!days || isNaN(days)) {
      const monthNumber = daysValidation.getMonthNumber(month);
      days = daysValidation.getCalendarDays(year, monthNumber) || 30;
    }
    
    // Get calendar days for the month
    const monthNumber = daysValidation.getMonthNumber(month);
    const calendarDays = daysValidation.getCalendarDays(year, monthNumber);
    
    // Parse numeric values
    const cost = parseFloat(row.Cost || row.cost) || 0;
    const target = parseFloat(row.Target || row.target) || 0;
    const revenue = parseFloat(row.Revenue || row.revenue) || 0;
    
    // Calculate pro-rated values if current month
    const currentDate = new Date();
    const isCurrentMonth = year === currentDate.getFullYear() && 
                          monthNumber === (currentDate.getMonth() + 1);
    
    let proRatedCost = cost;
    let proRatedTarget = target;
    
    if (isCurrentMonth && calendarDays > 0) {
      const elapsedDays = currentDate.getDate();
      const proRateRatio = elapsedDays / calendarDays;
      proRatedCost = cost * proRateRatio;
      proRatedTarget = target * proRateRatio;
    }
    
    return {
      customer: String(customer).trim(),
      service_type: String(serviceType).trim(),
      year: year,
      month: month,
      cost: proRatedCost,
      target: proRatedTarget,
      revenue: revenue,
      receivables_collected: parseFloat(row['Receivables Collected'] || row.receivables_collected) || 0,
      days: days,
      calendar_days: calendarDays,
      original_cost: cost,
      original_target: target,
      wasCorrected: wasCorrected
    };
  }

  // Validate revenue data before processing
  async validateRevenueData(jsonData) {
    // Convert Excel data to validation format
    const recordsToValidate = jsonData.map(row => {
      const validatedRow = this.validateRequiredFields(row);
      if (!validatedRow) return null;
      return validatedRow;
    }).filter(row => row !== null);

    // Run validation
    const validation = await daysValidation.validateDataset(recordsToValidate);
    
    // Log validation summary
    console.log('Validation Summary:');
    console.log(`  Total records: ${validation.summary.total}`);
    console.log(`  Valid: ${validation.summary.valid}`);
    console.log(`  Auto-corrections: ${validation.summary.errors}`);
    console.log(`  Confirmations needed: ${validation.summary.confirmationNeeded}`);
    
    return validation;
  }

  // Apply user decisions to data requiring confirmation
  applyValidationDecisions(jsonData, validation, userDecisions) {
    const updatedData = [...jsonData];
    
    // Create a map of records requiring confirmation
    const confirmationMap = new Map();
    validation.requiresConfirmation.forEach((record, index) => {
      const key = `${record.customer}-${record.service_type}-${record.year}-${record.month}`;
      confirmationMap.set(key, { record, index, decision: userDecisions[index] });
    });

    // Apply decisions to original data
    return updatedData.map(row => {
      const validatedRow = this.validateRequiredFields(row);
      if (!validatedRow) return row;
      
      const key = `${validatedRow.customer}-${validatedRow.service_type}-${validatedRow.year}-${validatedRow.month}`;
      const confirmation = confirmationMap.get(key);
      
      if (confirmation && confirmation.decision) {
        const decision = confirmation.decision;
        
        if (decision.accepted) {
          // Keep original days value
          return row;
        } else if (decision.useSuggested) {
          // Use suggested days
          return {
            ...row,
            Days: confirmation.record.validation.suggestedDays
          };
        } else if (decision.customValue) {
          // Use custom value
          return {
            ...row,
            Days: decision.customValue
          };
        }
      }
      
      // For records not requiring confirmation, apply auto-corrections
      const errorRecord = validation.errors.find(err => {
        return err.customer === validatedRow.customer &&
               err.service_type === validatedRow.service_type &&
               err.year === validatedRow.year &&
               err.month === validatedRow.month;
      });
      
      if (errorRecord && errorRecord.validation.correctedDays) {
        return {
          ...row,
          Days: errorRecord.validation.correctedDays
        };
      }
      
      return row;
    });
  }

  // ... rest of the methods remain the same ...
}

module.exports = new ETLService();