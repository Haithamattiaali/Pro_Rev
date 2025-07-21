const persistentDb = require('../database/persistent-db');

class ForecastService {
  getDb() {
    return persistentDb.getDatabase();
  }
  
  // Convert date to month/year for SQL queries
  getMonthYear(date) {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: months[d.getMonth()],
      year: d.getFullYear()
    };
  }
  
  // Get monthly revenue totals for forecast calculation with date range support
  getMonthlyTotals(startDate, endDate) {
    const start = this.getMonthYear(startDate);
    const end = this.getMonthYear(endDate);
    
    const query = `
      SELECT 
        year,
        month,
        SUM(revenue) as revenue,
        SUM(target) as target,
        SUM(cost) as cost,
        SUM(CASE WHEN service_type = 'Transportation' THEN revenue ELSE 0 END) as transportation,
        SUM(CASE WHEN service_type = 'Warehouses' THEN revenue ELSE 0 END) as warehouses
      FROM revenue_data
      WHERE (year > ? OR (year = ? AND 
        CASE month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END >= CASE ?
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END))
      AND (year < ? OR (year = ? AND 
        CASE month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END <= CASE ?
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END))
      GROUP BY year, month
      ORDER BY year, 
        CASE month
          WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
          WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
          WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
          WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    `;
    
    return this.getDb().prepare(query).all(start.year, start.year, start.month, end.year, end.year, end.month);
  }

  // Get customer performance data
  getCustomerPerformance(year) {
    const query = `
      SELECT 
        customer,
        SUM(revenue) as totalRevenue,
        SUM(target) as totalTarget,
        SUM(cost) as totalCost,
        SUM(CASE WHEN service_type = 'Transportation' THEN revenue ELSE 0 END) as transportation,
        SUM(CASE WHEN service_type = 'Warehouses' THEN revenue ELSE 0 END) as warehouses,
        CASE 
          WHEN SUM(target) > 0 THEN (SUM(revenue) / SUM(target)) * 100 
          ELSE 0 
        END as achievement,
        SUM(revenue) - SUM(cost) as grossProfit,
        CASE 
          WHEN SUM(revenue) > 0 THEN ((SUM(revenue) - SUM(cost)) / SUM(revenue)) * 100
          ELSE 0
        END as grossMargin
      FROM revenue_data
      WHERE year = ?
      GROUP BY customer
      ORDER BY totalRevenue DESC
    `;
    
    return this.getDb().prepare(query).all(year);
  }

  // Generate forecast with flexible date ranges and methods
  generateForecast(params) {
    // Handle legacy year-only parameter
    if (typeof params === 'number') {
      const year = params;
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 5, 30); // End of June
      const forecastStart = new Date(year, 6, 1); // July 1
      const forecastEnd = new Date(year, 11, 31); // December 31
      
      params = {
        historicalStart: startDate,
        historicalEnd: endDate,
        forecastStart,
        forecastEnd,
        method: 'linear',
        methodConfig: {},
        includeOpportunities: true,
        probabilityThreshold: 0.5
      };
    }
    
    const {
      historicalStart,
      historicalEnd,
      forecastStart,
      forecastEnd,
      method = 'linear',
      methodConfig = {},
      includeOpportunities = true,
      probabilityThreshold = 0.5
    } = params;
    
    // Get historical data
    const monthlyTotals = this.getMonthlyTotals(historicalStart, historicalEnd);
    
    if (monthlyTotals.length === 0) {
      throw new Error('No historical data available for forecasting');
    }
    
    // Calculate number of forecast periods needed
    const forecastMonths = this.getMonthsBetween(forecastStart, forecastEnd);
    
    // Generate forecast based on selected method
    let forecastResults;
    switch (method) {
      case 'linear':
        forecastResults = this.linearRegression(monthlyTotals, forecastMonths, methodConfig);
        break;
      case 'movingAverage':
        forecastResults = this.movingAverage(monthlyTotals, forecastMonths, methodConfig);
        break;
      case 'exponential':
        forecastResults = this.exponentialSmoothing(monthlyTotals, forecastMonths, methodConfig);
        break;
      case 'seasonal':
        forecastResults = this.seasonalDecomposition(monthlyTotals, forecastMonths, methodConfig);
        break;
      case 'arima':
        forecastResults = this.arima(monthlyTotals, forecastMonths, methodConfig);
        break;
      default:
        forecastResults = this.linearRegression(monthlyTotals, forecastMonths, methodConfig);
    }
    
    // Add opportunities if enabled
    if (includeOpportunities) {
      const opportunities = this.getOpportunities();
      const activeOpportunities = opportunities.filter(opp => 
        opp.enabled && opp.probability >= probabilityThreshold
      );
      
      forecastResults = this.applyOpportunities(forecastResults, activeOpportunities, forecastStart);
    }
    
    // Cache the results (using the forecast start year)
    const forecastYear = new Date(forecastStart).getFullYear();
    this.cacheForecastResults(forecastYear, forecastResults);
    
    return {
      historical: monthlyTotals,
      forecast: forecastResults,
      metrics: this.calculateMetrics(monthlyTotals, this.getOpportunities()),
      customerPerformance: this.getCustomerPerformance(new Date(forecastStart).getFullYear()),
      config: params
    };
  }
  
  // Enhanced Linear/Polynomial Regression with Regularization
  linearRegression(historicalData, forecastMonths, config) {
    const { 
      trendWeight = 50, 
      outlierSensitivity = 'medium', 
      includeSeasonality = false, 
      confidenceLevel = 90,
      polynomialDegree = 1, // 1 for linear, 2 for quadratic, etc.
      regularization = 'none', // 'none', 'ridge', 'lasso'
      regularizationParam = 0.01 // Lambda for regularization
    } = config;
    
    // Filter outliers using IQR method
    const data = outlierSensitivity !== 'none' 
      ? this.filterOutliersIQR(historicalData, outlierSensitivity)
      : historicalData;
    
    const n = data.length;
    const weights = this.calculateWeights(n, trendWeight);
    
    // Prepare data for regression
    const x = Array.from({ length: n }, (_, i) => i + 1);
    const y = data.map(m => m.revenue || 0);
    
    // Build design matrix for polynomial regression
    const X = this.buildPolynomialFeatures(x, polynomialDegree);
    
    // Apply regularized regression
    let coefficients;
    if (regularization === 'ridge') {
      coefficients = this.ridgeRegression(X, y, weights, regularizationParam);
    } else if (regularization === 'lasso') {
      coefficients = this.lassoRegression(X, y, weights, regularizationParam);
    } else {
      coefficients = this.weightedPolynomialRegression(X, y, weights);
    }
    
    // Calculate residuals and prediction intervals
    const predictions = x.map((xi, i) => {
      const features = this.getPolynomialFeatures(xi, polynomialDegree);
      return features.reduce((sum, f, j) => sum + f * coefficients[j], 0);
    });
    
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    
    // Detect heteroscedasticity and adjust error bounds
    const heteroscedasticity = this.detectHeteroscedasticity(x, residuals);
    
    // Generate forecasts
    const results = [];
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);
    
    forecastMonths.forEach((monthInfo, i) => {
      const t = n + i + 1;
      const features = this.getPolynomialFeatures(t, polynomialDegree);
      let baseForecast = features.reduce((sum, f, j) => sum + f * coefficients[j], 0);
      baseForecast = Math.max(0, baseForecast);
      
      // Add seasonality if enabled
      if (includeSeasonality) {
        const seasonalFactor = this.getSeasonalFactor(data, monthInfo.month);
        baseForecast *= seasonalFactor;
      }
      
      // Calculate prediction interval
      let errorMargin;
      if (heteroscedasticity) {
        // Adjust error margin based on trend
        errorMargin = rmse * confidenceMultiplier * Math.sqrt(1 + 0.05 * t);
      } else {
        errorMargin = rmse * confidenceMultiplier;
      }
      
      // Widen intervals for extrapolation
      const extrapolationFactor = 1 + (i / forecastMonths.length) * 0.5;
      errorMargin *= extrapolationFactor;
      
      results.push({
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(baseForecast),
        opportunities: 0,
        total: Math.round(baseForecast),
        lower: Math.round(Math.max(0, baseForecast - errorMargin)),
        upper: Math.round(baseForecast + errorMargin),
        diagnostics: {
          rmse: rmse,
          r2: this.calculateR2(y, predictions),
          coefficients: coefficients,
          polynomialDegree: polynomialDegree
        }
      });
    });
    
    return results;
  }
  
  // Enhanced Moving Average with Center Alignment and Missing Data Handling
  movingAverage(historicalData, forecastMonths, config) {
    const { 
      windowSize = 6, 
      weightType = 'simple', // 'simple', 'weighted', 'exponential', 'centered'
      handleMissing = 'interpolate', // 'interpolate', 'forward', 'average'
      outlierSensitivity = 'medium',
      confidenceLevel = 90,
      adaptiveWindow = false // Adjust window size based on data variance
    } = config;
    
    // Filter outliers if configured
    const cleanData = outlierSensitivity !== 'none' 
      ? this.filterOutliersIQR(historicalData, outlierSensitivity)
      : historicalData;
    
    // Handle missing data
    let data = this.handleMissingData(cleanData, handleMissing);
    const values = data.map(d => d.revenue || 0);
    
    // Calculate centered moving average for better trend capture
    const smoothedValues = weightType === 'centered' 
      ? this.centeredMovingAverage(values, windowSize)
      : values;
    
    // Determine adaptive window if enabled
    const effectiveWindowSize = adaptiveWindow 
      ? this.calculateAdaptiveWindow(smoothedValues, windowSize)
      : windowSize;
    
    // Calculate historical errors for confidence intervals
    const historicalErrors = this.calculateMovingAverageErrors(
      smoothedValues, 
      effectiveWindowSize, 
      weightType
    );
    const mae = historicalErrors.reduce((sum, e) => sum + Math.abs(e), 0) / historicalErrors.length;
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);
    
    const results = [];
    let extendedData = [...smoothedValues];
    
    forecastMonths.forEach((monthInfo, i) => {
      let forecast;
      const window = extendedData.slice(-effectiveWindowSize);
      
      switch (weightType) {
        case 'simple':
          forecast = this.simpleMovingAverage(window);
          break;
          
        case 'weighted':
          forecast = this.linearWeightedMovingAverage(window);
          break;
          
        case 'exponential':
          const alpha = 2 / (effectiveWindowSize + 1);
          forecast = this.exponentialMovingAverage(window, alpha);
          break;
          
        case 'centered':
          // For forecasting, use the last smoothed value plus trend
          const trend = this.estimateLocalTrend(window);
          forecast = window[window.length - 1] + trend * (i + 1);
          break;
          
        default:
          forecast = this.simpleMovingAverage(window);
      }
      
      // Apply seasonal adjustment if detected
      const seasonalMultiplier = this.detectSeasonality(data, monthInfo.month);
      if (seasonalMultiplier !== 1) {
        forecast *= seasonalMultiplier;
      }
      
      // Calculate dynamic confidence intervals
      const errorGrowth = 1 + (i * 0.1); // Error grows with forecast horizon
      const errorMargin = mae * confidenceMultiplier * errorGrowth;
      
      results.push({
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(Math.max(0, forecast)),
        opportunities: 0,
        total: Math.round(Math.max(0, forecast)),
        lower: Math.round(Math.max(0, forecast - errorMargin)),
        upper: Math.round(forecast + errorMargin),
        diagnostics: {
          windowSize: effectiveWindowSize,
          mae: mae,
          seasonalAdjustment: seasonalMultiplier !== 1
        }
      });
      
      // Add forecast to data for next iteration
      extendedData.push(forecast);
    });
    
    return results;
  }
  
  // Helper methods
  getMonthsBetween(startDate, endDate) {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let current = new Date(startDate);
    while (current <= endDate) {
      months.push({
        month: current.getMonth(),
        year: current.getFullYear(),
        label: monthNames[current.getMonth()]
      });
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  }
  
  filterOutliers(data, sensitivity) {
    if (sensitivity === 'low') return data;
    
    const values = data.map(d => d.revenue || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    const factor = sensitivity === 'medium' ? 2 : 1.5;
    
    return data.filter(d => {
      const z = Math.abs((d.revenue - mean) / stdDev);
      return z <= factor;
    });
  }
  
  calculateWeights(n, trendWeight) {
    const weight = trendWeight / 100;
    return Array.from({ length: n }, (_, i) => {
      const position = (i + 1) / n;
      return 1 + (position - 0.5) * weight;
    });
  }
  
  weightedLinearRegression(x, y, weights) {
    const n = x.length;
    let sumW = 0, sumWX = 0, sumWY = 0, sumWX2 = 0, sumWXY = 0;
    
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      sumW += w;
      sumWX += w * x[i];
      sumWY += w * y[i];
      sumWX2 += w * x[i] * x[i];
      sumWXY += w * x[i] * y[i];
    }
    
    const slope = (sumW * sumWXY - sumWX * sumWY) / (sumW * sumWX2 - sumWX * sumWX);
    const intercept = (sumWY - slope * sumWX) / sumW;
    
    return { slope, intercept };
  }
  
  getConfidenceMultiplier(level) {
    const zScores = {
      70: 1.04,
      80: 1.28,
      90: 1.64,
      95: 1.96
    };
    return zScores[level] || 1.64;
  }
  
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }
  
  // Exponential Smoothing (Holt-Winters)
  exponentialSmoothing(historicalData, forecastMonths, config) {
    const {
      alpha = 0.3, // Level smoothing parameter
      beta = 0.1,  // Trend smoothing parameter
      gamma = 0.1, // Seasonal smoothing parameter
      seasonalPeriods = 12,
      multiplicative = false,
      damped = true,
      phi = 0.9, // Damping parameter
      outlierSensitivity = 'medium',
      confidenceLevel = 90
    } = config;

    // Filter outliers if configured
    const data = outlierSensitivity !== 'none' 
      ? this.filterOutliersIQR(historicalData, outlierSensitivity)
      : historicalData;

    const values = data.map(d => d.revenue || 0);
    const n = values.length;
    
    // Validate we have enough data
    if (n < seasonalPeriods) {
      console.warn(`Exponential smoothing requires at least ${seasonalPeriods} data points, but only ${n} available. Falling back to simple exponential smoothing.`);
      // Fall back to simple exponential smoothing without seasonality
      return this.simpleExponentialSmoothing(values, forecastMonths, alpha, confidenceLevel, data);
    }

    // Initialize components
    let level = values.slice(0, seasonalPeriods).reduce((sum, v) => sum + v, 0) / seasonalPeriods;
    let trend = this.calculateInitialTrend(values, seasonalPeriods);
    let seasonal = this.calculateInitialSeasonals(values, seasonalPeriods, multiplicative);

    // Store components for analysis
    const components = {
      level: [level],
      trend: [trend],
      seasonal: [...seasonal]
    };

    // Apply Holt-Winters
    for (let i = seasonalPeriods; i < n; i++) {
      const prevLevel = level;
      const prevTrend = trend;
      const seasonalIdx = i % seasonalPeriods;

      if (multiplicative) {
        // Multiplicative Holt-Winters
        level = alpha * (values[i] / seasonal[seasonalIdx]) + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
        seasonal[seasonalIdx] = gamma * (values[i] / level) + (1 - gamma) * seasonal[seasonalIdx];
      } else {
        // Additive Holt-Winters
        level = alpha * (values[i] - seasonal[seasonalIdx]) + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
        seasonal[seasonalIdx] = gamma * (values[i] - level) + (1 - gamma) * seasonal[seasonalIdx];
      }

      components.level.push(level);
      components.trend.push(trend);
    }

    // Calculate residuals for error bounds
    const residuals = this.calculateResiduals(values, components, seasonalPeriods, multiplicative);
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);

    // Generate forecasts
    const results = [];
    let currentLevel = level;
    let currentTrend = trend;

    forecastMonths.forEach((monthInfo, h) => {
      const seasonalIdx = (n + h) % seasonalPeriods;
      let forecast;

      if (damped) {
        // Damped trend
        const dampedTrend = currentTrend * Math.pow(phi, h + 1);
        forecast = currentLevel + dampedTrend;
      } else {
        forecast = currentLevel + (h + 1) * currentTrend;
      }

      if (multiplicative) {
        forecast *= seasonal[seasonalIdx];
      } else {
        forecast += seasonal[seasonalIdx];
      }

      // Calculate prediction intervals
      const errorMargin = rmse * confidenceMultiplier * Math.sqrt(1 + h * 0.1); // Wider intervals for further forecasts

      results.push({
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(Math.max(0, forecast)),
        opportunities: 0,
        total: Math.round(Math.max(0, forecast)),
        lower: Math.round(Math.max(0, forecast - errorMargin)),
        upper: Math.round(forecast + errorMargin),
        components: {
          level: currentLevel,
          trend: currentTrend,
          seasonal: seasonal[seasonalIdx]
        }
      });
    });

    return results;
  }

  // STL-like Seasonal Decomposition with Saudi events
  seasonalDecomposition(historicalData, forecastMonths, config) {
    const {
      seasonalWindow = 13, // Loess window for seasonal extraction
      trendWindow = 7,     // Loess window for trend extraction
      robustIterations = 2, // Number of robust iterations
      includeSaudiEvents = true,
      outlierSensitivity = 'medium',
      confidenceLevel = 90
    } = config;

    // Filter outliers if configured
    const data = outlierSensitivity !== 'none' 
      ? this.filterOutliersIQR(historicalData, outlierSensitivity)
      : historicalData;

    const values = data.map(d => d.revenue || 0);
    const n = values.length;
    
    // Validate we have enough data for seasonal decomposition
    if (n < 24) { // Need at least 2 years of monthly data
      console.warn(`Seasonal decomposition requires at least 24 data points, but only ${n} available. Falling back to trend-only forecast.`);
      // Fall back to linear regression
      return this.linearRegression(historicalData, forecastMonths, { ...config, includeSeasonality: false });
    }

    // Apply STL decomposition
    let { trend, seasonal, remainder } = this.stlDecompose(
      values, 
      12, // Period (monthly)
      seasonalWindow,
      trendWindow,
      robustIterations
    );

    // Adjust for Saudi calendar events if enabled
    if (includeSaudiEvents) {
      const eventAdjustments = this.calculateSaudiEventAdjustments(data);
      seasonal = seasonal.map((s, i) => s + eventAdjustments[i % 12]);
    }

    // Forecast trend using local polynomial regression
    const trendForecast = this.forecastTrend(trend, forecastMonths.length);

    // Calculate seasonal indices for forecast periods
    const seasonalIndices = this.calculateSeasonalIndices(seasonal, 12);

    // Calculate prediction intervals from remainder
    const rmse = Math.sqrt(remainder.reduce((sum, r) => sum + r * r, 0) / remainder.length);
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);

    // Generate forecasts
    const results = [];
    forecastMonths.forEach((monthInfo, i) => {
      const monthIdx = monthInfo.month;
      const trendValue = trendForecast[i];
      const seasonalValue = seasonalIndices[monthIdx];

      const forecast = trendValue + seasonalValue;
      const errorMargin = rmse * confidenceMultiplier * Math.sqrt(1 + i * 0.05);

      results.push({
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(Math.max(0, forecast)),
        opportunities: 0,
        total: Math.round(Math.max(0, forecast)),
        lower: Math.round(Math.max(0, forecast - errorMargin)),
        upper: Math.round(forecast + errorMargin),
        components: {
          trend: trendValue,
          seasonal: seasonalValue,
          rmse: rmse
        }
      });
    });

    return results;
  }
  
  getSeasonalFactor(historicalData, month) {
    // Simple seasonal factor calculation
    const monthData = historicalData.filter(d => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthNames.indexOf(d.month) === month;
    });
    
    if (monthData.length === 0) return 1;
    
    const monthAvg = monthData.reduce((sum, d) => sum + d.revenue, 0) / monthData.length;
    const overallAvg = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
    
    return monthAvg / overallAvg;
  }
  
  exponentialMovingAverage(data, alpha) {
    if (data.length === 0) return 0;
    
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = alpha * data[i] + (1 - alpha) * ema;
    }
    return ema;
  }
  
  applyOpportunities(forecastResults, opportunities, forecastStart) {
    const startDate = new Date(forecastStart);
    
    return forecastResults.map((result, index) => {
      const currentMonth = new Date(startDate);
      currentMonth.setMonth(currentMonth.getMonth() + index);
      
      let opportunityImpact = 0;
      opportunities.forEach(opp => {
        // Check if opportunity applies to this month
        const oppStart = new Date(startDate);
        oppStart.setMonth(oppStart.getMonth() + opp.start_month - 1);
        
        const oppEnd = new Date(oppStart);
        oppEnd.setMonth(oppEnd.getMonth() + opp.duration);
        
        if (currentMonth >= oppStart && currentMonth < oppEnd) {
          const monthlyValue = opp.target_value / opp.duration;
          opportunityImpact += monthlyValue * opp.probability;
        }
      });
      
      return {
        ...result,
        opportunities: Math.round(opportunityImpact),
        total: Math.round(result.base + opportunityImpact)
      };
    });
  }

  // Calculate key metrics
  calculateMetrics(monthlyTotals, opportunities) {
    const currentRevenue = monthlyTotals.length > 0 ? monthlyTotals[monthlyTotals.length - 1].revenue : 0;
    const avgMonthlyRevenue = monthlyTotals.reduce((sum, m) => sum + (m.revenue || 0), 0) / monthlyTotals.length;
    
    const enabledOpps = opportunities.filter(opp => opp.enabled);
    const totalPipeline = enabledOpps.reduce((sum, opp) => sum + opp.target_value, 0);
    const weightedPipeline = enabledOpps.reduce((sum, opp) => sum + (opp.target_value * opp.probability), 0);
    
    // Service type distribution
    const totalTransportation = monthlyTotals.reduce((sum, m) => sum + (m.transportation || 0), 0);
    const totalWarehouses = monthlyTotals.reduce((sum, m) => sum + (m.warehouses || 0), 0);
    
    return {
      currentRevenue,
      avgMonthlyRevenue,
      totalPipeline,
      weightedPipeline,
      serviceTypeDistribution: [
        { name: 'Transportation', value: totalTransportation },
        { name: 'Warehouses', value: totalWarehouses }
      ]
    };
  }

  // Cache forecast results
  cacheForecastResults(year, results) {
    const stmt = this.getDb().prepare(`
      INSERT OR REPLACE INTO forecast_results 
      (year, month, base_forecast, opportunity_impact, total_forecast, lower_bound, upper_bound)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = this.getDb().transaction((results) => {
      for (const result of results) {
        stmt.run(
          year,
          result.month,
          result.base,
          result.opportunities,
          result.total,
          result.lower,
          result.upper
        );
      }
    });
    
    insertMany(results);
  }

  // Get forecast opportunities
  getOpportunities() {
    return this.getDb().prepare('SELECT * FROM forecast_opportunities ORDER BY customer').all();
  }

  // Create opportunity
  createOpportunity(opportunity) {
    const stmt = this.getDb().prepare(`
      INSERT INTO forecast_opportunities 
      (customer, service_type, target_value, probability, start_month, duration, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      opportunity.customer,
      opportunity.service_type,
      opportunity.target_value,
      opportunity.probability,
      opportunity.start_month,
      opportunity.duration,
      opportunity.enabled !== false ? 1 : 0
    );
    
    return { id: result.lastInsertRowid, ...opportunity };
  }

  // Update opportunity
  updateOpportunity(id, updates) {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'enabled' ? (value ? 1 : 0) : value);
      }
    });
    
    if (fields.length === 0) return false;
    
    values.push(id);
    const stmt = this.getDb().prepare(`
      UPDATE forecast_opportunities 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    return stmt.run(...values).changes > 0;
  }

  // Delete opportunity
  deleteOpportunity(id) {
    return this.getDb().prepare('DELETE FROM forecast_opportunities WHERE id = ?').run(id).changes > 0;
  }

  // Get forecast configuration
  getForecastConfig() {
    const config = this.getDb().prepare('SELECT * FROM forecast_configs WHERE id = 1').get();
    return config || { periods: 6, include_opportunities: true, probability_threshold: 0.5 };
  }

  // Update forecast configuration
  updateForecastConfig(updates) {
    const fields = [];
    const values = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'include_opportunities' ? (value ? 1 : 0) : value);
      }
    });
    
    if (fields.length === 0) return false;
    
    const stmt = this.getDb().prepare(`
      UPDATE forecast_configs 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);
    
    return stmt.run(...values).changes > 0;
  }

  // Get cached forecast results
  getCachedForecast(year) {
    return this.getDb().prepare('SELECT * FROM forecast_results WHERE year = ? ORDER BY id').all(year);
  }

  // Get service type summary
  getServiceTypeSummary(year) {
    const query = `
      SELECT 
        service_type,
        SUM(revenue) as total_revenue,
        SUM(target) as total_target,
        COUNT(DISTINCT customer) as customer_count
      FROM revenue_data
      WHERE year = ?
      GROUP BY service_type
    `;
    
    return this.getDb().prepare(query).all(year);
  }

  // ARIMA Implementation
  arima(historicalData, forecastMonths, config) {
    const {
      p = 1, // AR order
      d = 1, // Differencing order
      q = 1, // MA order
      seasonalP = 0, // Seasonal AR
      seasonalD = 0, // Seasonal differencing
      seasonalQ = 0, // Seasonal MA
      seasonalPeriod = 12,
      outlierSensitivity = 'medium',
      confidenceLevel = 90
    } = config;

    // Filter outliers
    const data = outlierSensitivity !== 'none' 
      ? this.filterOutliersIQR(historicalData, outlierSensitivity)
      : historicalData;

    const values = data.map(d => d.revenue || 0);

    // Apply differencing
    let diffValues = [...values];
    for (let i = 0; i < d; i++) {
      diffValues = this.difference(diffValues, 1);
    }

    // Apply seasonal differencing
    for (let i = 0; i < seasonalD; i++) {
      diffValues = this.difference(diffValues, seasonalPeriod);
    }

    // Fit ARIMA model
    const model = this.fitARIMA(diffValues, p, q);
    
    // Generate forecasts
    const forecasts = [];
    let currentValues = [...diffValues];

    for (let h = 0; h < forecastMonths.length; h++) {
      // AR component
      let arComponent = 0;
      for (let i = 0; i < p && i < currentValues.length; i++) {
        arComponent += model.arCoefficients[i] * currentValues[currentValues.length - 1 - i];
      }

      // MA component (using past errors)
      let maComponent = 0;
      for (let i = 0; i < q && i < model.residuals.length; i++) {
        maComponent += model.maCoefficients[i] * model.residuals[model.residuals.length - 1 - i];
      }

      const forecast = model.intercept + arComponent + maComponent;
      forecasts.push(forecast);
      currentValues.push(forecast);
    }

    // Integrate forecasts back
    let integratedForecasts = this.integrate(forecasts, values, d, seasonalD, seasonalPeriod);

    // Calculate prediction intervals
    const rmse = Math.sqrt(model.residuals.reduce((sum, r) => sum + r * r, 0) / model.residuals.length);
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);

    const results = forecastMonths.map((monthInfo, i) => {
      const forecast = integratedForecasts[i];
      const errorMargin = rmse * confidenceMultiplier * Math.sqrt(1 + i * 0.1);

      return {
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(Math.max(0, forecast)),
        opportunities: 0,
        total: Math.round(Math.max(0, forecast)),
        lower: Math.round(Math.max(0, forecast - errorMargin)),
        upper: Math.round(forecast + errorMargin),
        diagnostics: {
          arimaOrder: `(${p},${d},${q})`,
          seasonalOrder: `(${seasonalP},${seasonalD},${seasonalQ})`,
          aic: model.aic,
          bic: model.bic
        }
      };
    });

    return results;
  }

  // Helper Methods for Enhanced Forecasting

  // IQR-based outlier detection
  filterOutliersIQR(data, sensitivity) {
    const values = data.map(d => d.revenue || 0);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;
    
    const k = sensitivity === 'high' ? 1.5 : sensitivity === 'medium' ? 2.0 : 2.5;
    const lowerBound = q1 - k * iqr;
    const upperBound = q3 + k * iqr;
    
    return data.filter(d => {
      const value = d.revenue || 0;
      return value >= lowerBound && value <= upperBound;
    });
  }

  // Holt-Winters initialization helpers
  calculateInitialTrend(values, seasonalPeriods) {
    // Check if we have enough data for trend calculation
    if (values.length < seasonalPeriods * 2) {
      console.warn(`Not enough data for trend calculation. Need ${seasonalPeriods * 2}, have ${values.length}`);
      // Simple trend fallback
      if (values.length >= 2) {
        return (values[values.length - 1] - values[0]) / (values.length - 1);
      }
      return 0;
    }
    
    let sum = 0;
    for (let i = 0; i < seasonalPeriods; i++) {
      sum += (values[i + seasonalPeriods] - values[i]) / seasonalPeriods;
    }
    return sum / seasonalPeriods;
  }

  calculateInitialSeasonals(values, seasonalPeriods, multiplicative) {
    const seasonals = new Array(seasonalPeriods);
    const avgFirstYear = values.slice(0, seasonalPeriods).reduce((a, b) => a + b, 0) / seasonalPeriods;
    
    for (let i = 0; i < seasonalPeriods; i++) {
      if (multiplicative) {
        seasonals[i] = values[i] / avgFirstYear;
      } else {
        seasonals[i] = values[i] - avgFirstYear;
      }
    }
    
    return seasonals;
  }

  calculateResiduals(values, components, seasonalPeriods, multiplicative) {
    const residuals = [];
    for (let i = seasonalPeriods; i < values.length; i++) {
      const levelIdx = Math.min(i - seasonalPeriods, components.level.length - 1);
      const seasonalIdx = i % seasonalPeriods;
      
      let predicted;
      if (multiplicative) {
        predicted = components.level[levelIdx] * components.seasonal[seasonalIdx];
      } else {
        predicted = components.level[levelIdx] + components.seasonal[seasonalIdx];
      }
      
      residuals.push(values[i] - predicted);
    }
    return residuals;
  }

  // Simple exponential smoothing fallback
  simpleExponentialSmoothing(values, forecastMonths, alpha, confidenceLevel, originalData) {
    const n = values.length;
    let smoothed = [values[0]];
    
    // Apply simple exponential smoothing
    for (let i = 1; i < n; i++) {
      smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
    }
    
    // Calculate residuals
    const residuals = values.map((v, i) => v - smoothed[i]);
    const rmse = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length);
    const confidenceMultiplier = this.getConfidenceMultiplier(confidenceLevel);
    
    // Generate forecasts
    const results = [];
    const lastSmoothed = smoothed[n - 1];
    
    forecastMonths.forEach((monthInfo, i) => {
      const errorMargin = rmse * confidenceMultiplier * Math.sqrt(1 + i * 0.05);
      
      results.push({
        month: monthInfo.label,
        year: monthInfo.year,
        base: Math.round(Math.max(0, lastSmoothed)),
        opportunities: 0,
        total: Math.round(Math.max(0, lastSmoothed)),
        lower: Math.round(Math.max(0, lastSmoothed - errorMargin)),
        upper: Math.round(lastSmoothed + errorMargin)
      });
    });
    
    return results;
  }
  
  // STL decomposition helpers
  stlDecompose(values, period, seasonalWindow, trendWindow, iterations) {
    const n = values.length;
    let trend = new Array(n);
    let seasonal = new Array(n).fill(0);
    let remainder = new Array(n);
    
    // Simple STL approximation
    for (let iter = 0; iter < iterations; iter++) {
      // Extract trend using moving average
      trend = this.loessSmooth(values.map((v, i) => v - seasonal[i]), trendWindow);
      
      // Extract seasonal
      const detrended = values.map((v, i) => v - trend[i]);
      for (let s = 0; s < period; s++) {
        const seasonalValues = [];
        for (let i = s; i < n; i += period) {
          seasonalValues.push(detrended[i]);
        }
        const smoothed = this.loessSmooth(seasonalValues, seasonalWindow);
        for (let i = 0; i < smoothed.length; i++) {
          seasonal[s + i * period] = smoothed[i];
        }
      }
      
      // Normalize seasonal
      for (let i = 0; i < n; i += period) {
        const periodSum = seasonal.slice(i, Math.min(i + period, n)).reduce((a, b) => a + b, 0);
        for (let j = i; j < Math.min(i + period, n); j++) {
          seasonal[j] -= periodSum / period;
        }
      }
    }
    
    // Calculate remainder
    remainder = values.map((v, i) => v - trend[i] - seasonal[i]);
    
    return { trend, seasonal, remainder };
  }

  loessSmooth(values, window) {
    const smoothed = new Array(values.length);
    const halfWindow = Math.floor(window / 2);
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(values.length, i + halfWindow + 1);
      const windowValues = values.slice(start, end);
      smoothed[i] = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    }
    
    return smoothed;
  }

  calculateSaudiEventAdjustments(data) {
    // Saudi-specific calendar events impact
    const eventImpacts = {
      0: 0,    // Jan
      1: 0,    // Feb
      2: 0.05, // Mar (possible Ramadan start)
      3: 0.1,  // Apr (Ramadan)
      4: 0.15, // May (Eid al-Fitr)
      5: -0.05,// Jun
      6: 0.1,  // Jul (Hajj season)
      7: 0.05, // Aug
      8: 0,    // Sep
      9: 0,    // Oct
      10: 0,   // Nov
      11: 0.1  // Dec (Year-end)
    };
    
    return Object.values(eventImpacts);
  }

  forecastTrend(trend, periods) {
    // Use local polynomial regression for trend extrapolation
    const n = trend.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const coeffs = this.fitPolynomial(x, trend, 2);
    
    const forecasts = [];
    for (let i = 0; i < periods; i++) {
      const t = n + i;
      const forecast = coeffs[0] + coeffs[1] * t + coeffs[2] * t * t;
      forecasts.push(forecast);
    }
    
    return forecasts;
  }

  calculateSeasonalIndices(seasonal, period) {
    const indices = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    
    for (let i = 0; i < seasonal.length; i++) {
      const idx = i % period;
      indices[idx] += seasonal[i];
      counts[idx]++;
    }
    
    return indices.map((sum, i) => sum / counts[i]);
  }

  // Polynomial regression helpers
  buildPolynomialFeatures(x, degree) {
    const n = x.length;
    const X = [];
    
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let d = 0; d <= degree; d++) {
        row.push(Math.pow(x[i], d));
      }
      X.push(row);
    }
    
    return X;
  }

  getPolynomialFeatures(x, degree) {
    const features = [];
    for (let d = 0; d <= degree; d++) {
      features.push(Math.pow(x, d));
    }
    return features;
  }

  weightedPolynomialRegression(X, y, weights) {
    // Weighted least squares
    const n = X.length;
    const p = X[0].length;
    
    // Build weighted normal equations
    const XtWX = this.matrixMultiply(
      this.matrixTranspose(X),
      this.diagonalMultiply(X, weights)
    );
    
    const XtWy = this.matrixVectorMultiply(
      this.matrixTranspose(X),
      this.vectorMultiply(y, weights)
    );
    
    // Solve using Gaussian elimination
    return this.solveLinearSystem(XtWX, XtWy);
  }

  ridgeRegression(X, y, weights, lambda) {
    const n = X.length;
    const p = X[0].length;
    
    // Build weighted normal equations with regularization
    const XtWX = this.matrixMultiply(
      this.matrixTranspose(X),
      this.diagonalMultiply(X, weights)
    );
    
    // Add regularization term (except for intercept)
    for (let i = 1; i < p; i++) {
      XtWX[i][i] += lambda;
    }
    
    const XtWy = this.matrixVectorMultiply(
      this.matrixTranspose(X),
      this.vectorMultiply(y, weights)
    );
    
    return this.solveLinearSystem(XtWX, XtWy);
  }

  lassoRegression(X, y, weights, lambda) {
    // Simplified LASSO using coordinate descent
    const n = X.length;
    const p = X[0].length;
    const beta = new Array(p).fill(0);
    const maxIter = 100;
    const tol = 1e-4;
    
    for (let iter = 0; iter < maxIter; iter++) {
      const betaOld = [...beta];
      
      for (let j = 0; j < p; j++) {
        let rho = 0;
        for (let i = 0; i < n; i++) {
          let prediction = 0;
          for (let k = 0; k < p; k++) {
            if (k !== j) prediction += X[i][k] * beta[k];
          }
          rho += weights[i] * X[i][j] * (y[i] - prediction);
        }
        
        const z = X.map(row => row[j] * row[j]).reduce((sum, val, i) => sum + weights[i] * val, 0);
        
        if (j === 0) {
          // Don't regularize intercept
          beta[j] = rho / z;
        } else {
          // Soft thresholding
          if (rho > lambda) {
            beta[j] = (rho - lambda) / z;
          } else if (rho < -lambda) {
            beta[j] = (rho + lambda) / z;
          } else {
            beta[j] = 0;
          }
        }
      }
      
      // Check convergence
      const change = beta.reduce((sum, b, i) => sum + Math.abs(b - betaOld[i]), 0);
      if (change < tol) break;
    }
    
    return beta;
  }

  detectHeteroscedasticity(x, residuals) {
    // Breusch-Pagan test approximation
    const n = x.length;
    const squaredResiduals = residuals.map(r => r * r);
    const avgSquaredResidual = squaredResiduals.reduce((a, b) => a + b, 0) / n;
    
    // Check if variance increases with x
    const firstHalf = squaredResiduals.slice(0, Math.floor(n / 2));
    const secondHalf = squaredResiduals.slice(Math.floor(n / 2));
    
    const var1 = this.calculateVariance(firstHalf);
    const var2 = this.calculateVariance(secondHalf);
    
    return var2 > var1 * 1.5; // Significant increase in variance
  }

  calculateR2(actual, predicted) {
    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
    const ssTotal = actual.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const ssResidual = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    return 1 - (ssResidual / ssTotal);
  }

  // Moving average helpers
  handleMissingData(data, method) {
    const result = [...data];
    
    for (let i = 0; i < result.length; i++) {
      if (!result[i].revenue || result[i].revenue === 0) {
        switch (method) {
          case 'interpolate':
            // Linear interpolation
            let prev = i - 1;
            let next = i + 1;
            while (prev >= 0 && (!result[prev].revenue || result[prev].revenue === 0)) prev--;
            while (next < result.length && (!result[next].revenue || result[next].revenue === 0)) next++;
            
            if (prev >= 0 && next < result.length) {
              const prevVal = result[prev].revenue;
              const nextVal = result[next].revenue;
              result[i] = { ...result[i], revenue: prevVal + (nextVal - prevVal) * ((i - prev) / (next - prev)) };
            }
            break;
            
          case 'forward':
            // Forward fill
            if (i > 0 && result[i - 1].revenue) {
              result[i] = { ...result[i], revenue: result[i - 1].revenue };
            }
            break;
            
          case 'average':
            // Use average of available data
            const validData = data.filter(d => d.revenue && d.revenue > 0);
            if (validData.length > 0) {
              const avg = validData.reduce((sum, d) => sum + d.revenue, 0) / validData.length;
              result[i] = { ...result[i], revenue: avg };
            }
            break;
        }
      }
    }
    
    return result;
  }

  centeredMovingAverage(values, window) {
    const result = [...values];
    const halfWindow = Math.floor(window / 2);
    
    for (let i = halfWindow; i < values.length - halfWindow; i++) {
      const windowValues = values.slice(i - halfWindow, i + halfWindow + 1);
      result[i] = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
    }
    
    return result;
  }

  calculateAdaptiveWindow(values, baseWindow) {
    // Adjust window based on coefficient of variation
    const cv = this.calculateCoefficientOfVariation(values);
    
    if (cv < 0.1) {
      // Low variation, use larger window
      return Math.min(baseWindow + 2, values.length - 1);
    } else if (cv > 0.3) {
      // High variation, use smaller window
      return Math.max(baseWindow - 2, 3);
    }
    
    return baseWindow;
  }

  calculateMovingAverageErrors(values, window, weightType) {
    const errors = [];
    
    for (let i = window; i < values.length; i++) {
      const windowValues = values.slice(i - window, i);
      let prediction;
      
      switch (weightType) {
        case 'simple':
          prediction = this.simpleMovingAverage(windowValues);
          break;
        case 'weighted':
          prediction = this.linearWeightedMovingAverage(windowValues);
          break;
        case 'exponential':
          const alpha = 2 / (window + 1);
          prediction = this.exponentialMovingAverage(windowValues, alpha);
          break;
        default:
          prediction = this.simpleMovingAverage(windowValues);
      }
      
      errors.push(values[i] - prediction);
    }
    
    return errors;
  }

  simpleMovingAverage(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  linearWeightedMovingAverage(values) {
    const weights = values.map((_, i) => i + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    return values.reduce((sum, val, i) => sum + val * weights[i], 0) / weightSum;
  }

  detectSeasonality(data, targetMonth) {
    // Simple seasonality detection
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    data.forEach(d => {
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(d.month);
      if (monthIndex >= 0 && d.revenue) {
        monthlyAverages[monthIndex] += d.revenue;
        monthlyCounts[monthIndex]++;
      }
    });
    
    const overallAverage = data.reduce((sum, d) => sum + (d.revenue || 0), 0) / data.length;
    
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      } else {
        monthlyAverages[i] = overallAverage;
      }
    }
    
    return monthlyAverages[targetMonth] / overallAverage;
  }

  estimateLocalTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear trend estimation
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (values[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    return denominator !== 0 ? numerator / denominator : 0;
  }

  // ARIMA helpers
  difference(values, lag) {
    const result = [];
    for (let i = lag; i < values.length; i++) {
      result.push(values[i] - values[i - lag]);
    }
    return result;
  }

  fitARIMA(values, p, q) {
    // Simplified ARIMA fitting using least squares
    const n = values.length;
    
    // Build design matrix
    const X = [];
    const y = [];
    
    for (let i = Math.max(p, q); i < n; i++) {
      const row = [1]; // Intercept
      
      // AR terms
      for (let j = 1; j <= p; j++) {
        row.push(values[i - j]);
      }
      
      X.push(row);
      y.push(values[i]);
    }
    
    // Fit initial model
    const coeffs = this.ordinaryLeastSquares(X, y);
    
    // Calculate residuals
    const residuals = [];
    for (let i = 0; i < X.length; i++) {
      const prediction = X[i].reduce((sum, x, j) => sum + x * coeffs[j], 0);
      residuals.push(y[i] - prediction);
    }
    
    // Estimate MA coefficients if needed
    const maCoeffs = new Array(q).fill(0);
    if (q > 0) {
      // Simple approximation
      for (let i = 0; i < q; i++) {
        maCoeffs[i] = -0.5 * Math.pow(0.7, i + 1);
      }
    }
    
    // Calculate AIC and BIC
    const k = p + q + 1; // Number of parameters
    const logLikelihood = -n / 2 * Math.log(2 * Math.PI) - n / 2 * Math.log(this.calculateVariance(residuals));
    const aic = 2 * k - 2 * logLikelihood;
    const bic = Math.log(n) * k - 2 * logLikelihood;
    
    return {
      intercept: coeffs[0],
      arCoefficients: coeffs.slice(1, p + 1),
      maCoefficients: maCoeffs,
      residuals: residuals,
      aic: aic,
      bic: bic
    };
  }

  integrate(forecasts, originalValues, d, seasonalD, seasonalPeriod) {
    let result = [...forecasts];
    
    // Integrate seasonal differences
    for (let i = 0; i < seasonalD; i++) {
      const integrated = [];
      for (let j = 0; j < result.length; j++) {
        const baseIndex = originalValues.length - seasonalPeriod + j;
        if (baseIndex >= 0) {
          integrated.push(result[j] + originalValues[baseIndex]);
        } else {
          integrated.push(result[j]);
        }
      }
      result = integrated;
    }
    
    // Integrate regular differences
    for (let i = 0; i < d; i++) {
      const integrated = [];
      let lastValue = originalValues[originalValues.length - 1];
      for (let j = 0; j < result.length; j++) {
        lastValue += result[j];
        integrated.push(lastValue);
      }
      result = integrated;
    }
    
    return result;
  }

  // Matrix operations
  matrixTranspose(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = Array(cols).fill(null).map(() => Array(rows));
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = matrix[i][j];
      }
    }
    
    return result;
  }

  matrixMultiply(A, B) {
    const rowsA = A.length;
    const colsA = A[0].length;
    const colsB = B[0].length;
    const result = Array(rowsA).fill(null).map(() => Array(colsB).fill(0));
    
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    
    return result;
  }

  diagonalMultiply(matrix, weights) {
    return matrix.map((row, i) => row.map(val => val * weights[i]));
  }

  matrixVectorMultiply(matrix, vector) {
    return matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));
  }

  vectorMultiply(vector, weights) {
    return vector.map((val, i) => val * weights[i]);
  }

  solveLinearSystem(A, b) {
    // Gaussian elimination with partial pivoting
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);
    
    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Partial pivoting
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        const factor = augmented[k][i] / augmented[i][i];
        for (let j = i; j <= n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
    
    // Back substitution
    const solution = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      solution[i] = augmented[i][n];
      for (let j = i + 1; j < n; j++) {
        solution[i] -= augmented[i][j] * solution[j];
      }
      solution[i] /= augmented[i][i];
    }
    
    return solution;
  }

  ordinaryLeastSquares(X, y) {
    const XtX = this.matrixMultiply(this.matrixTranspose(X), X);
    const Xty = this.matrixVectorMultiply(this.matrixTranspose(X), y);
    return this.solveLinearSystem(XtX, Xty);
  }

  fitPolynomial(x, y, degree) {
    const X = this.buildPolynomialFeatures(x, degree);
    return this.ordinaryLeastSquares(X, y);
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }

  calculateCoefficientOfVariation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(this.calculateVariance(values));
    return stdDev / mean;
  }
}

module.exports = new ForecastService();