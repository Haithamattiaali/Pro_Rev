# Days Column Update Documentation

## Overview
The "Days" column has been repositioned to appear immediately after the "Month" column in all Excel imports and exports for better logical flow and data organization.

## Updated Column Order

### Revenue Data Template
**Old Order:**
```
Customer | Service_Type | Year | Month | Cost | Target | Revenue | Receivables Collected | Days
```

**New Order:**
```
Customer | Service_Type | Year | Month | Days | Cost | Target | Revenue | Receivables Collected
```

### Sales Plan Template
**Old Order:**
```
gl | month | year | service_type | baseline_forecast | opportunity_value | days
```

**New Order:**
```
gl | month | days | year | service_type | baseline_forecast | opportunity_value
```

## Files Updated

### 1. Excel Import (ETL Service)
- **File**: `backend/services/etl.service.js`
- **Change**: Parser expects "Days" column after "Month" in Excel uploads
- **Default**: If Days column is missing, defaults to 30 days

### 2. Excel Export Service
- **File**: `backend/services/excel-export.service.js`
- **Changes**:
  - Monthly Trends export now includes Days column after Month
  - Business Unit monthly breakdown includes Days column
  - Sales Plan monthly trend includes Days column
  - All exports maintain consistent column ordering

### 3. Excel Templates
- **Location**: `backend/templates/`
- **Files**:
  - `revenue_data_template.xlsx` - Updated column order
  - `sales_plan_template.xlsx` - Updated column order

## Usage

### Creating Templates
Run the template creation script to generate properly formatted Excel templates:
```bash
cd backend
node scripts/create-excel-template.js
```

### Example Export
To see an example of the new column order in exports:
```bash
cd backend
node scripts/export-with-days-example.js
```

## Important Notes

1. **Days Column Purpose**: Represents the number of calendar days worked in a month (not total calendar days)
2. **Achievement Calculation**: Uses the formula:
   - Daily Target = Monthly Target / Calendar Days in Month
   - Period Target = Daily Target × Days Worked
   - Achievement % = (Revenue / Period Target) × 100
3. **Backwards Compatibility**: The system will still accept old format files but new exports will use the updated column order

## Migration Guide

If you have existing Excel files in the old format:
1. Open your Excel file
2. Cut the "Days" column
3. Insert it right after the "Month" column
4. Save the file

Alternatively, use the provided templates as a guide for reformatting your data.