-- Add original_target column to store the full month target value
ALTER TABLE revenue_data ADD COLUMN original_target REAL DEFAULT 0;

-- Update existing records to set original_target = target (for historical data)
UPDATE revenue_data SET original_target = target WHERE original_target = 0;

-- Add analysis_date column to track when the data was analyzed/uploaded
ALTER TABLE revenue_data ADD COLUMN analysis_date DATE DEFAULT (date('now'));