import React from 'react'
import { TrendingUp, AlertTriangle, DollarSign, Target } from 'lucide-react'
import { formatCurrency } from '../../../utils/formatters'
import MonthlyBadge from '../../indicators/MonthlyBadge'

const OpportunityInsights = ({ insights }) => {
  if (!insights) {
    return <div className="text-center text-gray-500 py-4">Loading insights...</div>
  }

  const { quickWins, atRisk, topRevenue, metrics } = insights

  return (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pipeline</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(metrics?.total_revenue || 0)}
              </p>
              <MonthlyBadge size="mini" className="mt-1" />
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Opportunities</p>
              <p className="text-xl font-bold text-gray-900">{metrics?.total_count || 0}</p>
            </div>
            <Target className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-mid">Avg Opportunity Size</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(metrics?.avg_deal_size || 0)}
              </p>
              <MonthlyBadge size="mini" className="mt-1" />
            </div>
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg GP%</p>
              <p className="text-xl font-bold text-gray-900">
                {(metrics?.avg_gp_percent || 0).toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className="text-green-600">{metrics?.high_gp_count || 0} high</span>
              <span>/</span>
              <span className="text-red-600">{metrics?.low_gp_count || 0} low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Wins */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-green-900">Quick Wins</h3>
          </div>
          <p className="text-sm text-green-700 mb-4">
            High margin opportunities under 100K SAR - easier to close
          </p>
          <div className="space-y-3">
            {quickWins && quickWins.length > 0 ? (
              quickWins.slice(0, 3).map((opp, index) => (
                <div key={index} className="bg-white/70 backdrop-blur rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{opp.project}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">{formatCurrency(opp.est_monthly_revenue)}</span>
                    <span className="text-xs font-semibold text-green-600">{opp.est_gp_percent.toFixed(1)}% GP</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-green-700">No quick wins identified</p>
            )}
          </div>
        </div>

        {/* Top Revenue Opportunities */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-600 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">Major Deals</h3>
          </div>
          <p className="text-sm text-blue-700 mb-4">
            Top opportunities by revenue potential
          </p>
          <div className="space-y-3">
            {topRevenue && topRevenue.length > 0 ? (
              topRevenue.slice(0, 3).map((opp, index) => (
                <div key={index} className="bg-white/70 backdrop-blur rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{opp.project}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-semibold text-blue-600">{formatCurrency(opp.est_monthly_revenue)}</span>
                    <span className="text-xs text-gray-600">{opp.est_gp_percent.toFixed(1)}% GP</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-blue-700">No major deals found</p>
            )}
          </div>
        </div>

        {/* At Risk */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-red-900">Risk Areas</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">
            High revenue but low margin opportunities
          </p>
          <div className="space-y-3">
            {atRisk && atRisk.length > 0 ? (
              atRisk.slice(0, 3).map((opp, index) => (
                <div key={index} className="bg-white/70 backdrop-blur rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">{opp.project}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">{formatCurrency(opp.est_monthly_revenue)}</span>
                    <span className="text-xs font-semibold text-red-600">{opp.est_gp_percent.toFixed(1)}% GP</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-red-700">No at-risk opportunities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OpportunityInsights