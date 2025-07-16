import React from 'react'
import { TrendingUp, BarChart3, Activity, Calendar, BrainCircuit, Info, HelpCircle } from 'lucide-react'

const ForecastMethodConfig = ({ selectedMethod, config, onConfigChange, onMethodChange }) => {
  const methods = [
    {
      id: 'linear',
      name: 'Trend Analysis',
      icon: TrendingUp,
      description: 'Best for steady growth patterns',
      color: 'blue'
    },
    {
      id: 'movingAverage',
      name: 'Smoothed Trend',
      icon: BarChart3,
      description: 'Best for volatile data with no clear trend',
      color: 'green'
    },
    {
      id: 'exponential',
      name: 'Adaptive Forecast',
      icon: Activity,
      description: 'Best for data with changing trends',
      color: 'purple'
    },
    {
      id: 'seasonal',
      name: 'Pattern Recognition',
      icon: Calendar,
      description: 'Best for business with clear seasonal patterns',
      color: 'orange'
    },
    {
      id: 'arima',
      name: 'Statistical Forecast',
      icon: BrainCircuit,
      description: 'Best for complex patterns with auto-correlation',
      color: 'red'
    }
  ]
  
  const renderMethodConfig = () => {
    switch(selectedMethod) {
      case 'linear':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Trend Weight</label>
                <span className="text-sm text-gray-500">{config.trendWeight || 50}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.trendWeight || 50}
                onChange={(e) => onConfigChange({ ...config, trendWeight: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                0% uses all data equally, 100% heavily weights recent months
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Outlier Sensitivity</label>
              <div className="space-y-2">
                {['low', 'medium', 'high'].map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="outlierSensitivity"
                      value={level}
                      checked={config.outlierSensitivity === level}
                      onChange={(e) => onConfigChange({ ...config, outlierSensitivity: e.target.value })}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{level}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {level === 'low' && '- Include all data'}
                      {level === 'medium' && '- Remove extreme values'}
                      {level === 'high' && '- Focus on typical months'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeSeasonality || false}
                  onChange={(e) => onConfigChange({ ...config, includeSeasonality: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Include Seasonality</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">Account for recurring monthly/quarterly patterns</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Confidence Level</label>
              <div className="flex space-x-2">
                {['70', '80', '90', '95'].map((level) => (
                  <button
                    key={level}
                    onClick={() => onConfigChange({ ...config, confidenceLevel: parseInt(level) })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      config.confidenceLevel === parseInt(level)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Width of prediction range</p>
            </div>
          </div>
        )
        
      case 'movingAverage':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Window Size</label>
              <select
                value={config.windowSize || 6}
                onChange={(e) => onConfigChange({ ...config, windowSize: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Number of months to average</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Weighting Method</label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="weightType"
                    value="simple"
                    checked={config.weightType === 'simple'}
                    onChange={(e) => onConfigChange({ ...config, weightType: e.target.value })}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Simple</span>
                    <p className="text-xs text-gray-500">Equal weight for all months</p>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="weightType"
                    value="weighted"
                    checked={config.weightType === 'weighted'}
                    onChange={(e) => onConfigChange({ ...config, weightType: e.target.value })}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Weighted</span>
                    <p className="text-xs text-gray-500">Recent months matter more</p>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="weightType"
                    value="exponential"
                    checked={config.weightType === 'exponential'}
                    onChange={(e) => onConfigChange({ ...config, weightType: e.target.value })}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Exponential</span>
                    <p className="text-xs text-gray-500">Smooth decay of historical influence</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )
        
      case 'seasonal':
        return (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Season Length</label>
              <select
                value={config.seasonLength || 12}
                onChange={(e) => onConfigChange({ ...config, seasonLength: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="3">Quarterly (3 months)</option>
                <option value="6">Semi-Annual (6 months)</option>
                <option value="12">Annual (12 months)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Your typical business cycle</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Saudi Calendar Events</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.ramadanImpact || false}
                    onChange={(e) => onConfigChange({ ...config, ramadanImpact: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Ramadan Impact</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.hajjSeason || false}
                    onChange={(e) => onConfigChange({ ...config, hajjSeason: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Hajj Season</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.summerVacation || false}
                    onChange={(e) => onConfigChange({ ...config, summerVacation: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Summer Vacation</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Pattern Type</label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="patternType"
                    value="additive"
                    checked={config.patternType === 'additive'}
                    onChange={(e) => onConfigChange({ ...config, patternType: e.target.value })}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Additive</span>
                    <p className="text-xs text-gray-500">Fixed seasonal change amount</p>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="patternType"
                    value="multiplicative"
                    checked={config.patternType === 'multiplicative'}
                    onChange={(e) => onConfigChange({ ...config, patternType: e.target.value })}
                    className="mr-2 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Multiplicative</span>
                    <p className="text-xs text-gray-500">Percentage-based seasonal change</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )
        
      default:
        return <div className="text-sm text-gray-500">Configuration coming soon...</div>
    }
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {methods.map((method) => {
            const Icon = method.icon
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                onClick={() => onMethodChange(method.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary bg-opacity-5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`w-8 h-8 mx-auto mb-2 ${
                  isSelected ? 'text-primary' : 'text-gray-400'
                }`} />
                <h4 className="text-sm font-medium text-gray-900">{method.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{method.description}</p>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="border-t pt-6">
        <div className="flex items-center mb-4">
          <h4 className="text-md font-medium text-gray-900">Configuration</h4>
          <div className="ml-2 group relative">
            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
            <div className="absolute left-0 bottom-6 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Adjust these settings to fine-tune your forecast based on your business patterns and data characteristics.
            </div>
          </div>
        </div>
        {renderMethodConfig()}
      </div>
    </div>
  )
}

export default ForecastMethodConfig