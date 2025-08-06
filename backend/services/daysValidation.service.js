class DaysValidationService {
  constructor() {
    this.monthDays = {
      1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
      7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
    };
  }

  // Get calendar days for a specific month/year
  getCalendarDays(year, month) {
    // Handle February leap years
    if (month === 2) {
      return this.isLeapYear(year) ? 29 : 28;
    }
    return this.monthDays[month];
  }

  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  // Get business days elapsed in current month up to today
  getElapsedBusinessDays(year, month) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // If it's not the current month, return null
    if (year !== currentYear || month !== currentMonth) {
      return null;
    }

    // Count business days from start of month to today
    let businessDays = 0;
    for (let day = 1; day <= currentDay; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      // Count weekdays (Monday = 1 to Friday = 5)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    return businessDays;
  }

  // Main validation function
  validateDays(year, month, providedDays) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const dataDate = new Date(year, month - 1, 1);
    const currentDate = new Date(currentYear, currentMonth - 1, 1);
    
    const validation = {
      isValid: true,
      correctedDays: providedDays,
      message: '',
      requiresConfirmation: false,
      validationType: 'none',
      suggestedDays: null
    };

    // Scenario 1: Past months (already completed)
    if (dataDate < currentDate) {
      const calendarDays = this.getCalendarDays(year, month);
      
      // For past months, if days doesn't equal calendar days, auto-correct
      if (providedDays !== calendarDays) {
        validation.isValid = false;
        validation.correctedDays = calendarDays;
        validation.message = `Past month ${month}/${year}: Days (${providedDays}) doesn't match calendar days (${calendarDays}). Auto-corrected to ${calendarDays}.`;
        validation.validationType = 'auto-corrected';
        validation.suggestedDays = calendarDays;
      }
    }
    
    // Scenario 2: Current month
    else if (year === currentYear && month === currentMonth) {
      const elapsedBusinessDays = this.getElapsedBusinessDays(year, month);
      const calendarDays = this.getCalendarDays(year, month);
      
      // For current month, if days doesn't match elapsed business days exactly, require confirmation
      if (providedDays !== elapsedBusinessDays) {
        validation.requiresConfirmation = true;
        validation.message = `Current month ${month}/${year}: ${providedDays} work days entered, but ${elapsedBusinessDays} business days have elapsed. Accept or reject?`;
        validation.validationType = 'current-month-variance';
        validation.suggestedDays = elapsedBusinessDays;
      }
    }
    
    // Scenario 3: Future months
    else if (dataDate > currentDate) {
      validation.requiresConfirmation = true;
      validation.message = `Future month ${month}/${year}: This is a simulation/forecast with ${providedDays} projected work days. Proceed with simulation?`;
      validation.validationType = 'future-simulation';
      
      // Suggest typical business days (roughly 22 per month)
      const calendarDays = this.getCalendarDays(year, month);
      validation.suggestedDays = Math.min(22, calendarDays);
    }

    return validation;
  }

  // Validate entire dataset
  async validateDataset(records) {
    const validationResults = {
      valid: [],
      warnings: [],
      errors: [],
      requiresConfirmation: [],
      summary: {
        total: records.length,
        valid: 0,
        warnings: 0,
        errors: 0,
        confirmationNeeded: 0
      }
    };

    for (const record of records) {
      const validation = this.validateDays(
        record.year,
        this.getMonthNumber(record.month),
        record.days || 30
      );

      const result = {
        ...record,
        validation
      };

      if (!validation.isValid) {
        validationResults.errors.push(result);
        validationResults.summary.errors++;
      } else if (validation.requiresConfirmation) {
        validationResults.requiresConfirmation.push(result);
        validationResults.summary.confirmationNeeded++;
      } else if (validation.validationType !== 'none') {
        validationResults.warnings.push(result);
        validationResults.summary.warnings++;
      } else {
        validationResults.valid.push(result);
        validationResults.summary.valid++;
      }
    }

    return validationResults;
  }

  getMonthNumber(monthName) {
    const monthMap = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
      'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
      'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return monthMap[monthName] || 0;
  }

  // Apply user decisions to records requiring confirmation
  applyUserDecisions(records, decisions) {
    return records.map((record, index) => {
      const decision = decisions[index];
      
      if (decision.accepted) {
        // User accepted the value
        return {
          ...record,
          days: record.days,
          validationNote: record.validation.message
        };
      } else if (decision.useSuggested) {
        // User wants to use suggested value
        return {
          ...record,
          days: record.validation.suggestedDays,
          validationNote: `Changed from ${record.days} to ${record.validation.suggestedDays} (${record.validation.validationType})`
        };
      } else {
        // User provided custom value
        return {
          ...record,
          days: decision.customValue,
          validationNote: `User override: ${decision.customValue} days`
        };
      }
    });
  }
}

module.exports = new DaysValidationService();