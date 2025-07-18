-- Migration: Add Sales Plan and Opportunities tables
-- Date: 2025-01-08

-- Sales Plan table (based on GL accounts structure)
CREATE TABLE IF NOT EXISTS sales_plan_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gl TEXT NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    service_type TEXT NOT NULL,
    baseline_forecast REAL DEFAULT 0,
    opportunity_value REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gl, month, year, service_type)
);

-- Opportunities table (based on provided structure)
CREATE TABLE IF NOT EXISTS opportunities_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project TEXT NOT NULL,
    service TEXT NOT NULL,
    location TEXT,
    scope_of_work TEXT,
    requirements TEXT,
    status TEXT,
    est_monthly_revenue REAL DEFAULT 0,
    est_gp_percent REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_plan_year_month ON sales_plan_data(year, month);
CREATE INDEX IF NOT EXISTS idx_sales_plan_gl ON sales_plan_data(gl);
CREATE INDEX IF NOT EXISTS idx_sales_plan_service ON sales_plan_data(service_type);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities_data(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_service ON opportunities_data(service);
CREATE INDEX IF NOT EXISTS idx_opportunities_project ON opportunities_data(project);

-- Create views for easier querying
CREATE VIEW IF NOT EXISTS sales_plan_monthly_summary AS
SELECT 
    year,
    month,
    SUM(baseline_forecast) as total_baseline_forecast,
    SUM(opportunity_value) as total_opportunity_value,
    SUM(baseline_forecast + opportunity_value) as total_forecast,
    COUNT(DISTINCT gl) as gl_count,
    COUNT(DISTINCT service_type) as service_type_count
FROM sales_plan_data
GROUP BY year, month;

CREATE VIEW IF NOT EXISTS opportunities_summary AS
SELECT 
    status,
    COUNT(*) as opportunity_count,
    SUM(est_monthly_revenue) as total_monthly_revenue,
    AVG(est_gp_percent) as avg_gp_percent,
    COUNT(DISTINCT service) as service_count
FROM opportunities_data
WHERE est_monthly_revenue > 0
GROUP BY status;