import React, { useState, useEffect } from 'react'
import { X, TrendingUp, BarChart3, Activity, Calendar, BrainCircuit, Info, ChevronDown, ChevronUp, Check } from 'lucide-react'

const ForecastSettingsModal = ({ isOpen, onClose, selectedMethod, config, onConfigChange, onMethodChange }) => {
  const [expandedSections, setExpandedSections] = useState({ basic: true, advanced: false })
  const [localConfig, setLocalConfig] = useState(config)
  
  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config)
  }, [config])
  
  if (!isOpen) return null
  
  const methods = [
    { 
      id: 'linear', 
      name: 'Linear Regression', 
      icon: TrendingUp,
      tooltip: {
        title: 'Linear Regression Forecasting',
        description: 'Fits a straight line through historical data points using least squares method.',
        example: 'If revenue was: Jan: 100K, Feb: 110K, Mar: 120K\nLinear forecast for Apr: 130K (±5%)',
        useCase: 'Best for: Steady growth patterns, stable markets',
        accuracy: 'Typical accuracy: ±5-10% for stable businesses',
        formula: 'y = mx + b (with optional polynomial terms)',
        parameters: {
          'Trend Weight': '0% = equal weight to all data, 100% = recent data matters most',
          'Confidence': '95% means forecast ±2 standard deviations',
          'Outlier Detection': 'IQR method removes extreme values that skew predictions',
          'Regularization': 'Ridge/LASSO prevent overfitting on small datasets'
        }
      }
    },
    { 
      id: 'movingAverage', 
      name: 'Moving Average (MA)', 
      icon: BarChart3,
      tooltip: {
        title: 'Moving Average Forecasting',
        description: 'Smooths out short-term fluctuations by averaging recent periods.',
        example: '3-month MA: (Jan: 100K + Feb: 90K + Mar: 110K) / 3 = 100K',
        useCase: 'Best for: Volatile data, removing noise from trends',
        accuracy: 'Typical accuracy: ±10-15% for fluctuating data',
        formula: {
          'Simple': 'All periods equal weight',
          'Weighted': 'Recent periods get higher weight (1x, 2x, 3x...)',
          'Exponential': 'Smooth decay, α controls speed (0.3 = 30% new, 70% old)'
        },
        parameters: {
          'Window Size': 'Larger windows = smoother trends but slower to react',
          'Center Alignment': 'Looks both forward and backward for better trend capture'
        }
      }
    },
    { 
      id: 'exponential', 
      name: 'Exponential Smoothing (ETS)', 
      icon: Activity,
      tooltip: {
        title: 'Exponential Smoothing',
        description: 'Gives more weight to recent observations, adapts quickly to changes.',
        example: 'With α=0.3: Forecast = 0.3×(Latest) + 0.7×(Previous Forecast)',
        useCase: 'Best for: Trending data with recent changes',
        accuracy: 'Typical accuracy: ±8-12% for dynamic markets',
        formula: 'Level + Trend + Seasonal components',
        parameters: {
          'Alpha (α)': 'How fast to adapt to level changes (0.1 = slow, 0.9 = fast)',
          'Beta (β)': 'How fast to adapt to trend changes',
          'Model Type': 'Simple (level only), Double (+ trend), Triple (+ seasonality)',
          'Damped Trend': 'Prevents unrealistic long-term growth/decline'
        }
      }
    },
    { 
      id: 'seasonal', 
      name: 'Seasonal Decomposition (STL)', 
      icon: Calendar,
      tooltip: {
        title: 'Seasonal Decomposition',
        description: 'Separates trend, seasonal patterns, and random components.',
        example: 'Detects +20% in Ramadan, -15% in summer vacation',
        useCase: 'Best for: Businesses with clear seasonal patterns',
        accuracy: 'Typical accuracy: ±5-8% when patterns are stable',
        formula: 'Data = Trend + Seasonal + Random',
        parameters: {
          'Decomposition Type': 'Additive: Season adds fixed amount (±SAR 50K), Multiplicative: Season multiplies (×1.2 for 20% increase)',
          'Season Length': 'Your business cycle (quarterly, semi-annual, annual)',
          'Saudi Events': 'Ramadan (+15-20%), Hajj (+10-15%), Summer (-10-15%), National Day (+5-10%)',
          'STL Robust': 'Handles outliers better using iterative weighting'
        }
      }
    },
    { 
      id: 'arima', 
      name: 'ARIMA Model', 
      icon: BrainCircuit,
      tooltip: {
        title: 'AutoRegressive Integrated Moving Average',
        description: 'Advanced statistical model combining autoregression and moving averages.',
        example: 'ARIMA(1,1,1): Uses 1 lag, 1 differencing, 1 MA term',
        useCase: 'Best for: Complex patterns, time-dependent data',
        accuracy: 'Typical accuracy: ±3-7% with proper tuning',
        formula: 'Combines past values (AR) + past errors (MA) + differencing (I)',
        parameters: {
          'p (AR)': 'Past values used (autoregression order)',
          'd (I)': 'Times to difference data (remove trend)',
          'q (MA)': 'Past errors used (moving average order)',
          'Auto-configure': 'Uses AIC to find best p,d,q automatically',
          'Seasonal': 'Add P,D,Q for seasonal patterns (e.g., monthly cycles)'
        }
      }
    }
  ]
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  const handleLocalConfigChange = (newConfig) => {
    setLocalConfig(newConfig)
  }
  
  
  const renderMethodConfig = () => {
    console.log('Rendering config for method:', selectedMethod)
    console.log('Available cases: linear, movingAverage, exponential, seasonal, arima')
    
    switch(selectedMethod) {
      case 'linear':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {/* Basic Settings */}
            <div className="border border-neutral-light rounded-lg p-4">
              <button
                onClick={() => toggleSection('basic')}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-medium text-neutral-dark">Basic Settings</h4>
                {expandedSections.basic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.basic && (
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-neutral-dark">Trend Weight</label>
                      <span className="text-sm text-neutral-mid">{localConfig.trendWeight || 50}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localConfig.trendWeight || 50}
                      onChange={(e) => handleLocalConfigChange({ ...localConfig, trendWeight: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-neutral-light rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-neutral-mid mt-1">Higher values give more importance to recent trends. Use 70-100% for fast-changing markets, 30-50% for stable businesses.</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-dark mb-2 block">Confidence Interval</label>
                    <div className="flex space-x-2">
                      {['70', '80', '90', '95'].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleLocalConfigChange({ ...localConfig, confidenceLevel: parseInt(level) })}
                          className={`px-3 py-1 text-xs rounded-full transition-all ${
                            localConfig.confidenceLevel === parseInt(level)
                              ? 'bg-primary text-white'
                              : 'bg-neutral-light text-neutral-mid hover:bg-neutral-light/80'
                          }`}
                        >
                          {level}%
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-mid mt-1">Higher confidence = wider prediction range</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced Settings */}
            <div className="border border-neutral-light rounded-lg p-4">
              <button
                onClick={() => toggleSection('advanced')}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-sm font-medium text-neutral-dark">Advanced Settings</h4>
                {expandedSections.advanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.advanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm text-neutral-dark mb-2 block">Outlier Detection (IQR Method)</label>
                    <div className="flex space-x-2">
                      {['none', 'moderate', 'aggressive'].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleLocalConfigChange({ ...localConfig, outlierDetection: level })}
                          className={`px-3 py-1 text-xs rounded-full capitalize transition-all ${
                            (localConfig.outlierDetection || 'moderate') === level
                              ? 'bg-primary text-white'
                              : 'bg-neutral-light text-neutral-mid hover:bg-neutral-light/80'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-dark mb-2 block">Regularization</label>
                    <select
                      value={localConfig.regularization || 'none'}
                      onChange={(e) => handleLocalConfigChange({ ...localConfig, regularization: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm border-0 bg-neutral-light rounded-lg focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="none">None</option>
                      <option value="ridge">Ridge (L2)</option>
                      <option value="lasso">Lasso (L1)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-neutral-dark mb-2 block">Polynomial Degree</label>
                    <div className="flex space-x-2">
                      {[1, 2, 3].map((degree) => (
                        <button
                          key={degree}
                          onClick={() => handleLocalConfigChange({ ...localConfig, polynomialDegree: degree })}
                          className={`px-3 py-1 text-xs rounded-full transition-all ${
                            (localConfig.polynomialDegree || 1) === degree
                              ? 'bg-primary text-white'
                              : 'bg-neutral-light text-neutral-mid hover:bg-neutral-light/80'
                          }`}
                        >
                          {degree}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-neutral-mid mt-1">1=linear, 2=quadratic, 3=cubic</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
        
      case 'movingAverage':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="border border-neutral-light rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-dark mb-4">Configuration</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Window Size</label>
                  <select
                    value={localConfig.windowSize || 6}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, windowSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-sm border-0 bg-neutral-light rounded-lg focus:ring-1 focus:ring-primary/20"
                  >
                    {[3, 6, 12, 18, 24].map(size => (
                      <option key={size} value={size}>{size} months</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-mid mt-1">Larger windows = smoother trends</p>
                </div>
                
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Weighting Method</label>
                  <div className="space-y-2">
                    {[
                      { value: 'simple', label: 'Simple Moving Average', desc: 'Equal weight for all periods' },
                      { value: 'weighted', label: 'Weighted Moving Average', desc: 'Linear weights (recent = higher)' },
                      { value: 'exponential', label: 'Exponential Moving Average', desc: 'Exponential decay weights' }
                    ].map(method => (
                      <label key={method.value} className="flex items-start">
                        <input
                          type="radio"
                          name="weightType"
                          value={method.value}
                          checked={(localConfig.weightType || 'simple') === method.value}
                          onChange={(e) => handleLocalConfigChange({ ...localConfig, weightType: e.target.value })}
                          className="mr-2 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium">{method.label}</span>
                          <p className="text-xs text-neutral-mid">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.centerAlign || false}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, centerAlign: e.target.checked })}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-neutral-dark">Center Alignment</span>
                </label>
                
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Missing Data Handling</label>
                  <select
                    value={localConfig.missingDataMethod || 'interpolate'}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, missingDataMethod: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border-0 bg-neutral-light rounded-lg focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="skip">Skip missing values</option>
                    <option value="interpolate">Linear interpolation</option>
                    <option value="forward">Forward fill</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'exponential':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="border border-neutral-light rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-dark mb-4">Smoothing Parameters</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-neutral-dark">Alpha (Level)</label>
                    <span className="text-sm text-neutral-mid">{(localConfig.alpha || 0.3).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={(localConfig.alpha || 0.3) * 100}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, alpha: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-neutral-light rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-neutral-mid mt-1">Controls reaction to recent observations</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-neutral-dark">Beta (Trend)</label>
                    <span className="text-sm text-neutral-mid">{(localConfig.beta || 0.1).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={(localConfig.beta || 0.1) * 100}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, beta: parseInt(e.target.value) / 100 })}
                    className="w-full h-1.5 bg-neutral-light rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-neutral-mid mt-1">Controls trend smoothing</p>
                </div>
                
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Model Type</label>
                  <div className="space-y-2">
                    {[
                      { value: 'simple', label: 'Simple (SES)', desc: 'No trend or seasonality' },
                      { value: 'double', label: 'Double (Holt)', desc: 'With trend component' },
                      { value: 'triple', label: 'Triple (Holt-Winters)', desc: 'With trend and seasonality' }
                    ].map(model => (
                      <label key={model.value} className="flex items-start">
                        <input
                          type="radio"
                          name="modelType"
                          value={model.value}
                          checked={(localConfig.modelType || 'double') === model.value}
                          onChange={(e) => handleLocalConfigChange({ ...localConfig, modelType: e.target.value })}
                          className="mr-2 mt-0.5"
                        />
                        <div>
                          <span className="text-sm font-medium">{model.label}</span>
                          <p className="text-xs text-neutral-mid">{model.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.dampedTrend || false}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, dampedTrend: e.target.checked })}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-neutral-dark">Damped Trend</span>
                </label>
              </div>
            </div>
          </div>
        )
        
      case 'seasonal':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="border border-neutral-light rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-dark mb-4">Seasonal Configuration</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Season Length</label>
                  <select
                    value={localConfig.seasonLength || 12}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, seasonLength: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-sm border-0 bg-neutral-light rounded-lg focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="3">Quarterly (3 months)</option>
                    <option value="6">Semi-Annual (6 months)</option>
                    <option value="12">Annual (12 months)</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Decomposition Type</label>
                  <div className="flex space-x-2">
                    {['additive', 'multiplicative'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleLocalConfigChange({ ...localConfig, decompositionType: type })}
                        className={`px-3 py-1 text-xs rounded-full capitalize transition-all ${
                          (localConfig.decompositionType || 'multiplicative') === type
                            ? 'bg-primary text-white'
                            : 'bg-neutral-light text-neutral-mid hover:bg-neutral-light/80'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-mid mt-1">
                    Additive: fixed amounts, Multiplicative: percentages
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-neutral-dark mb-2 block">Saudi Calendar Events</label>
                  <div className="space-y-2">
                    {[
                      { key: 'ramadan', label: 'Ramadan Effect', impact: '+15-20% typically' },
                      { key: 'hajj', label: 'Hajj Season', impact: '+10-15% logistics' },
                      { key: 'summer', label: 'Summer Vacation', impact: '-10-15% typically' },
                      { key: 'nationalDay', label: 'National Day', impact: '+5-10% retail' }
                    ].map(event => (
                      <label key={event.key} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={localConfig[event.key] || false}
                            onChange={(e) => handleLocalConfigChange({ ...localConfig, [event.key]: e.target.checked })}
                            className="mr-2 rounded"
                          />
                          <span className="text-sm">{event.label}</span>
                        </div>
                        <span className="text-xs text-neutral-mid">{event.impact}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.robustToOutliers || true}
                    onChange={(e) => handleLocalConfigChange({ ...localConfig, robustToOutliers: e.target.checked })}
                    className="mr-2 rounded"
                  />
                  <span className="text-sm text-neutral-dark">Robust to Outliers (STL)</span>
                </label>
              </div>
            </div>
          </div>
        )
        
      case 'arima':
        return (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            <div className="border border-neutral-light rounded-lg p-4">
              <h4 className="text-sm font-medium text-neutral-dark mb-4">ARIMA Parameters</h4>
              
              <label className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={localConfig.autoArima || true}
                  onChange={(e) => handleLocalConfigChange({ ...localConfig, autoArima: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-neutral-dark">Auto-configure (recommended)</span>
              </label>
              
              {!localConfig.autoArima && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-neutral-dark mb-1 block">p (AR)</label>
                      <select
                        value={localConfig.p || 1}
                        onChange={(e) => handleLocalConfigChange({ ...localConfig, p: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                      >
                        {[0, 1, 2, 3, 4, 5].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-dark mb-1 block">d (I)</label>
                      <select
                        value={localConfig.d || 1}
                        onChange={(e) => handleLocalConfigChange({ ...localConfig, d: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                      >
                        {[0, 1, 2].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-dark mb-1 block">q (MA)</label>
                      <select
                        value={localConfig.q || 1}
                        onChange={(e) => handleLocalConfigChange({ ...localConfig, q: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                      >
                        {[0, 1, 2, 3, 4, 5].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={localConfig.seasonal || false}
                      onChange={(e) => handleLocalConfigChange({ ...localConfig, seasonal: e.target.checked })}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm text-neutral-dark">Include Seasonal Components</span>
                  </label>
                  
                  {localConfig.seasonal && (
                    <div className="grid grid-cols-3 gap-4 ml-6">
                      <div>
                        <label className="text-sm text-neutral-dark mb-1 block">P</label>
                        <select
                          value={localConfig.P || 1}
                          onChange={(e) => handleLocalConfigChange({ ...localConfig, P: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                        >
                          {[0, 1, 2].map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-dark mb-1 block">D</label>
                        <select
                          value={localConfig.D || 1}
                          onChange={(e) => handleLocalConfigChange({ ...localConfig, D: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                        >
                          {[0, 1].map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-neutral-dark mb-1 block">Q</label>
                        <select
                          value={localConfig.Q || 1}
                          onChange={(e) => handleLocalConfigChange({ ...localConfig, Q: parseInt(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border-0 bg-neutral-light rounded-lg"
                        >
                          {[0, 1, 2].map(val => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4">
                <label className="text-sm text-neutral-dark mb-2 block">Information Criterion</label>
                <div className="flex space-x-2">
                  {['AIC', 'BIC', 'AICC'].map((criterion) => (
                    <button
                      key={criterion}
                      onClick={() => handleLocalConfigChange({ ...localConfig, infoCriterion: criterion })}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        (localConfig.infoCriterion || 'AIC') === criterion
                          ? 'bg-primary text-white'
                          : 'bg-neutral-light text-neutral-mid hover:bg-neutral-light/80'
                      }`}
                    >
                      {criterion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
        
      default:
        console.warn('Unknown method selected:', selectedMethod)
        return <div className="text-sm text-neutral-mid">Select a method to configure (method: {selectedMethod})</div>
    }
  }
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-light flex-shrink-0">
            <h2 className="text-xl font-semibold text-neutral-dark">Forecast Configuration</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-light rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-neutral-mid" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Method Selection with Tooltips */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-dark mb-3">Select Forecasting Method</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {methods.map((method) => {
                  const Icon = method.icon
                  const isSelected = selectedMethod === method.id
                  return (
                    <div key={method.id} className="relative group">
                      <button
                        onClick={() => {
                          console.log('Method button clicked:', method.id)
                          onMethodChange(method.id)
                        }}
                        className={`relative w-full p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-neutral-light hover:border-neutral-mid/30'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${
                          isSelected ? 'text-primary' : 'text-neutral-mid'
                        }`} />
                        <p className="text-xs font-medium text-neutral-dark">{method.name}</p>
                      </button>
                      
                      {/* Hover Tooltip */}
                      <div className="absolute left-0 top-full mt-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 pointer-events-none">
                        <h4 className="font-semibold mb-2 text-sm">{method.tooltip.title}</h4>
                        <p className="mb-2">{method.tooltip.description}</p>
                        
                        {/* Formula section */}
                        {method.tooltip.formula && (
                          <div className="mb-3 border-t border-gray-700 pt-2">
                            <h5 className="font-semibold text-yellow-400 mb-1">Formula:</h5>
                            {typeof method.tooltip.formula === 'string' ? (
                              <p className="font-mono text-xs">{method.tooltip.formula}</p>
                            ) : (
                              <div className="space-y-1">
                                {Object.entries(method.tooltip.formula).map(([key, value]) => (
                                  <p key={key} className="text-xs">
                                    <span className="font-semibold">{key}:</span> {value}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Example */}
                        <div className="bg-gray-800 p-2 rounded mb-2 font-mono text-xs">
                          {method.tooltip.example}
                        </div>
                        
                        {/* Use case and accuracy */}
                        <p className="mb-1 text-green-400">{method.tooltip.useCase}</p>
                        <p className="text-blue-400">{method.tooltip.accuracy}</p>
                        
                        {/* Parameters explanation */}
                        {method.tooltip.parameters && (
                          <div className="mt-3 border-t border-gray-700 pt-2">
                            <h5 className="font-semibold text-orange-400 mb-1">Key Settings:</h5>
                            <div className="space-y-1">
                              {Object.entries(method.tooltip.parameters).map(([param, desc]) => (
                                <p key={param} className="text-xs">
                                  <span className="font-semibold text-gray-300">{param}:</span> <span className="text-gray-400">{desc}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Method Configuration */}
            <div className="border-t border-neutral-light pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-dark">Method Configuration</h3>
                <button
                  onClick={() => handleLocalConfigChange({})}
                  className="text-xs text-primary hover:text-primary-dark"
                >
                  Reset to defaults
                </button>
              </div>
              {renderMethodConfig()}
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end gap-2 p-6 border-t border-neutral-light flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-light rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfigChange(localConfig)
                onClose()
              }}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Apply & Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ForecastSettingsModal