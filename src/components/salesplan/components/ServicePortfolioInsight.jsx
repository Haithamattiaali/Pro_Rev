import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import { TrendingUp, AlertCircle, Target, Shield, DollarSign, Activity, Award, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

const ServicePortfolioInsight = ({ serviceData }) => {
  if (!serviceData?.services || serviceData.services.length === 0) {
    return (
      <div className="mt-12 bg-gradient-to-br from-white to-secondary-pale/20 rounded-2xl shadow-lg border border-secondary-light/30 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-pale flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Service Analysis Data Available</h3>
          <p className="text-gray-500 mb-4">Upload opportunities data to see service portfolio analysis</p>
          <p className="text-sm text-gray-400">
            Include opportunities data in the "Opportunities" sheet of your Excel upload
          </p>
        </div>
      </div>
    );
  }

  // Prepare scatter data for revenue vs GP analysis
  const scatterData = serviceData.services.map(service => ({
    name: service.service.replace('2PL - ', '').replace('3PL - ', ''),
    revenue: service.total_revenue / 1000, // in thousands
    gp: service.avg_gp_percent * 100,
    opportunities: service.count,
    type: service.service.includes('2PL') ? '2PL' : '3PL',
    fullName: service.service
  }));
  
  // Calculate total opportunities
  const totalOpportunities = scatterData.reduce((sum, s) => sum + s.opportunities, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 text-sm">{data.fullName}</p>
          <p className="text-xs text-gray-600">Revenue: {formatCurrency(data.revenue * 1000)}</p>
          <p className="text-xs text-gray-600">Gross Profit: {formatPercentage(data.gp)}</p>
          <p className="text-xs text-gray-600">Opportunities: {data.opportunities}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Opportunity Pipeline Analysis (Revenue vs Profitability)
      </h3>

      {/* Revenue vs Profitability Scatter Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            type="number" 
            dataKey="revenue" 
            name="Revenue" 
            tick={{ fontSize: 10 }}
            label={{ value: 'Revenue (SAR thousands)', position: 'insideBottom', offset: -5, fontSize: 11 }}
            domain={[0, 'dataMax + 100']}
          />
          <YAxis 
            type="number" 
            dataKey="gp" 
            name="GP%" 
            tick={{ fontSize: 10 }}
            label={{ value: 'Gross Profit %', angle: -90, position: 'insideLeft', fontSize: 11 }}
            domain={[0, 60]}
          />
          <ZAxis type="number" dataKey="opportunities" range={[50, 400]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Services" data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.type === '2PL' ? '#9e1f63' : '#005b8c'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-gray-600">2PL Services</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent-blue"></div>
          <span className="text-gray-600">3PL Services</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-300 opacity-50"></div>
          <span className="text-gray-600">Bubble size = Opportunities</span>
        </div>
      </div>
      
      {/* Summary Metrics Labels */}
      <div className="flex flex-wrap items-center justify-center gap-8 mt-4 mb-6 py-4 bg-secondary-pale rounded-lg">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-secondary" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-secondary tracking-wide">Total Revenue:</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(scatterData.reduce((sum, s) => sum + s.revenue * 1000, 0)).replace('SAR ', '')}
            </span>
          </div>
        </div>
        
        <div className="w-px h-6 bg-secondary-light opacity-30"></div>
        
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-secondary tracking-wide">Average GP:</span>
            <span className="text-lg font-bold text-primary">
              {formatPercentage(scatterData.reduce((sum, s) => sum + s.gp, 0) / scatterData.length)}
            </span>
          </div>
        </div>
        
        <div className="w-px h-6 bg-secondary-light opacity-30"></div>
        
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-secondary" />
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-secondary tracking-wide">Total Opportunities:</span>
            <span className="text-lg font-bold text-primary">{totalOpportunities}</span>
          </div>
        </div>
      </div>
      
      {/* Performance Cards - High Performers, Low Margin and Standard Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* High Performers Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-primary-light/20 via-primary-light/10 to-white rounded-xl p-6 border-2 border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-primary-light/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-secondary">High Performers</h5>
                  <p className="text-xs text-neutral-mid">Services with GP &gt; 30%</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-primary-light/20 rounded-full">
                <span className="text-sm font-bold text-primary">Excellence</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-5">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {scatterData.filter(s => s.gp >= 30).length}
                </p>
                <p className="text-lg font-medium text-secondary">
                  out of {totalOpportunities}
                </p>
              </div>
              <p className="text-base font-semibold text-neutral-mid">
                Average GP: {formatPercentage(
                  scatterData.filter(s => s.gp >= 30).length > 0 
                    ? scatterData.filter(s => s.gp >= 30).reduce((sum, s) => sum + s.gp, 0) / scatterData.filter(s => s.gp >= 30).length
                    : 0
                )}
              </p>
            </div>
            
            <div className="pt-4 border-t-2 border-primary/20 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Total Revenue</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(scatterData.filter(s => s.gp >= 30).reduce((sum, s) => sum + s.revenue * 1000, 0))}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Opportunities Count</p>
                <p className="text-lg font-bold text-primary">
                  {scatterData.filter(s => s.gp >= 30).reduce((sum, s) => sum + s.opportunities, 0)}
                </p>
              </div>
              <div className="w-full bg-primary-light/20 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full flex items-center justify-end pr-2 transition-all duration-500" 
                     style={{ width: `${(scatterData.filter(s => s.gp >= 30).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100}%` }}>
                  <span className="text-xs text-white font-semibold">
                    {((scatterData.filter(s => s.gp >= 30).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Low Margin Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-accent-coral/20 via-accent-coral/10 to-white rounded-xl p-6 border-2 border-accent-coral/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-coral/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-accent-coral/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-coral to-primary-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-secondary">Low Margin</h5>
                  <p className="text-xs text-neutral-mid">Services with GP &lt; 20%</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-accent-coral/20 rounded-full">
                <span className="text-sm font-bold text-accent-coral">Review</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-5">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-accent-coral to-primary-dark bg-clip-text text-transparent">
                  {scatterData.filter(s => s.gp < 20).length}
                </p>
                <p className="text-lg font-medium text-secondary">
                  out of {totalOpportunities}
                </p>
              </div>
              <p className="text-base font-semibold text-neutral-mid">
                Average GP: {formatPercentage(
                  scatterData.filter(s => s.gp < 20).length > 0 
                    ? scatterData.filter(s => s.gp < 20).reduce((sum, s) => sum + s.gp, 0) / scatterData.filter(s => s.gp < 20).length
                    : 0
                )}
              </p>
            </div>
            
            <div className="pt-4 border-t-2 border-accent-coral/20 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Revenue Impact</p>
                <p className="text-lg font-bold text-accent-coral">
                  {formatCurrency(scatterData.filter(s => s.gp < 20).reduce((sum, s) => sum + s.revenue * 1000, 0))}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Opportunities Count</p>
                <p className="text-lg font-bold text-accent-coral">
                  {scatterData.filter(s => s.gp < 20).reduce((sum, s) => sum + s.opportunities, 0)}
                </p>
              </div>
              <div className="w-full bg-accent-coral/20 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-accent-coral to-primary-dark h-3 rounded-full flex items-center justify-end pr-2 transition-all duration-500" 
                     style={{ width: `${(scatterData.filter(s => s.gp < 20).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100}%` }}>
                  <span className="text-xs text-white font-semibold">
                    {((scatterData.filter(s => s.gp < 20).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Standard Performers Card */}
        <div className="group relative overflow-hidden bg-gradient-to-br from-accent-blue/20 via-accent-blue/10 to-white rounded-xl p-6 border-2 border-accent-blue/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-blue/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-accent-blue/30 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-secondary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="text-lg font-bold text-secondary">Standard Performers</h5>
                  <p className="text-xs text-neutral-mid">Services with 20-30% GP</p>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-accent-blue/20 rounded-full">
                <span className="text-sm font-bold text-accent-blue">Stable</span>
              </div>
            </div>
            
            <div className="space-y-3 mb-5">
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold bg-gradient-to-r from-accent-blue to-secondary bg-clip-text text-transparent">
                  {scatterData.filter(s => s.gp >= 20 && s.gp < 30).length}
                </p>
                <p className="text-lg font-medium text-secondary">
                  out of {totalOpportunities}
                </p>
              </div>
              <p className="text-base font-semibold text-neutral-mid">
                Average GP: {formatPercentage(
                  scatterData.filter(s => s.gp >= 20 && s.gp < 30).length > 0 
                    ? scatterData.filter(s => s.gp >= 20 && s.gp < 30).reduce((sum, s) => sum + s.gp, 0) / scatterData.filter(s => s.gp >= 20 && s.gp < 30).length
                    : 0
                )}
              </p>
            </div>
            
            <div className="pt-4 border-t-2 border-accent-blue/20 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Revenue Contribution</p>
                <p className="text-lg font-bold text-accent-blue">
                  {formatCurrency(scatterData.filter(s => s.gp >= 20 && s.gp < 30).reduce((sum, s) => sum + s.revenue * 1000, 0))}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-neutral-mid">Opportunities Count</p>
                <p className="text-lg font-bold text-accent-blue">
                  {scatterData.filter(s => s.gp >= 20 && s.gp < 30).reduce((sum, s) => sum + s.opportunities, 0)}
                </p>
              </div>
              <div className="w-full bg-accent-blue/20 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-accent-blue to-secondary h-3 rounded-full flex items-center justify-end pr-2 transition-all duration-500" 
                     style={{ width: `${(scatterData.filter(s => s.gp >= 20 && s.gp < 30).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100}%` }}>
                  <span className="text-xs text-white font-semibold">
                    {((scatterData.filter(s => s.gp >= 20 && s.gp < 30).reduce((sum, s) => sum + s.opportunities, 0) / totalOpportunities) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Opportunity Distribution by Category */}
      <div className="mt-6 bg-gradient-to-br from-secondary-pale to-white rounded-xl p-5 border border-secondary-light/30">
        <h4 className="text-base font-bold text-secondary mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Opportunity Distribution by Category
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-primary shadow-sm"></div>
                <span className="text-sm font-semibold text-secondary">2PL Services</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  {scatterData.filter(s => s.type === '2PL').reduce((sum, s) => sum + s.opportunities, 0)}
                </p>
                <p className="text-xs font-medium text-neutral-mid">opportunities</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-primary/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-mid">Services:</span>
                <span className="text-sm font-semibold text-secondary">{scatterData.filter(s => s.type === '2PL').length}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-accent-blue/20 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-accent-blue shadow-sm"></div>
                <span className="text-sm font-semibold text-secondary">3PL Services</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-accent-blue">
                  {scatterData.filter(s => s.type === '3PL').reduce((sum, s) => sum + s.opportunities, 0)}
                </p>
                <p className="text-xs font-medium text-neutral-mid">opportunities</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-accent-blue/10">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-mid">Services:</span>
                <span className="text-sm font-semibold text-secondary">{scatterData.filter(s => s.type === '3PL').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePortfolioInsight;