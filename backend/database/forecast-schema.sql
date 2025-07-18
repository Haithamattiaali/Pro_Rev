-- Forecast opportunities table
CREATE TABLE IF NOT EXISTS forecast_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    service_type TEXT NOT NULL,
    target_value REAL NOT NULL,
    probability REAL NOT NULL CHECK (probability >= 0 AND probability <= 1),
    start_month INTEGER NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
    duration INTEGER NOT NULL CHECK (duration >= 1),
    enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forecast configurations table
CREATE TABLE IF NOT EXISTS forecast_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    periods INTEGER NOT NULL DEFAULT 6,
    include_opportunities BOOLEAN DEFAULT 1,
    probability_threshold REAL DEFAULT 0.5 CHECK (probability_threshold >= 0 AND probability_threshold <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forecast results cache table
CREATE TABLE IF NOT EXISTS forecast_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month TEXT NOT NULL,
    base_forecast REAL NOT NULL,
    opportunity_impact REAL DEFAULT 0,
    total_forecast REAL NOT NULL,
    lower_bound REAL NOT NULL,
    upper_bound REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forecast_opportunities_customer ON forecast_opportunities(customer);
CREATE INDEX IF NOT EXISTS idx_forecast_opportunities_enabled ON forecast_opportunities(enabled);
CREATE INDEX IF NOT EXISTS idx_forecast_results_year_month ON forecast_results(year, month);

-- Insert default forecast configuration
INSERT OR IGNORE INTO forecast_configs (id, periods, include_opportunities, probability_threshold)
VALUES (1, 6, 1, 0.5);