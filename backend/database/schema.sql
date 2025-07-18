-- Create main revenue data table
CREATE TABLE IF NOT EXISTS revenue_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    service_type TEXT NOT NULL,
    year INTEGER NOT NULL,
    month TEXT NOT NULL,
    cost REAL DEFAULT 0,
    target REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    receivables_collected REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer, service_type, year, month)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_revenue_customer ON revenue_data(customer);
CREATE INDEX IF NOT EXISTS idx_revenue_service_type ON revenue_data(service_type);
CREATE INDEX IF NOT EXISTS idx_revenue_year_month ON revenue_data(year, month);
CREATE INDEX IF NOT EXISTS idx_revenue_composite ON revenue_data(customer, service_type, year, month);

-- Create aggregated views for faster reporting
CREATE VIEW IF NOT EXISTS revenue_summary AS
SELECT 
    customer,
    service_type,
    year,
    SUM(cost) as total_cost,
    SUM(target) as total_target,
    SUM(revenue) as total_revenue,
    SUM(receivables_collected) as total_receivables,
    CASE 
        WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
        ELSE 0 
    END as achievement_percentage
FROM revenue_data
GROUP BY customer, service_type, year;

-- Create monthly summary view
CREATE VIEW IF NOT EXISTS monthly_summary AS
SELECT 
    year,
    month,
    SUM(cost) as total_cost,
    SUM(target) as total_target,
    SUM(revenue) as total_revenue,
    SUM(receivables_collected) as total_receivables,
    COUNT(DISTINCT customer) as customer_count,
    COUNT(DISTINCT service_type) as service_type_count
FROM revenue_data
GROUP BY year, month;