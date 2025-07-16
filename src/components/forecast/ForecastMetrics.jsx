import React from 'react'
import { formatCurrency } from '../../utils/formatters'

const ForecastMetrics = ({ forecastResults, config }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Configuration</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forecast Period
          </label>
          <div className="text-lg font-semibold text-gray-900">
            {config.periods} months
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Include Opportunities
          </label>
          <div className="text-lg font-semibold text-gray-900">
            {config.includeOpportunities ? 'Yes' : 'No'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Probability
          </label>
          <div className="text-lg font-semibold text-gray-900">
            {(config.probabilityThreshold * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Forecast Details Table */}
      <div className="mt-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Forecast Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Forecast
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opportunities
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Range
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastResults.map((result, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {result.month}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatCurrency(result.base)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-600">
                    {formatCurrency(result.opportunities)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(result.total)}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatCurrency(result.lower)} - {formatCurrency(result.upper)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ForecastMetrics