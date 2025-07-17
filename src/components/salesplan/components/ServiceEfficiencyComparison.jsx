import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, Target, DollarSign, Activity, BarChart3, Shield } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../../utils/formatters';

const ServiceEfficiencyComparison = ({ serviceData }) => {
  if (!serviceData?.services || serviceData.services.length === 0) {
    return null;
  }

  const { serviceCategories, services } = serviceData;
  
  // Calculate efficiency metrics
  const calculateEfficiencyMetrics = () => {
    const metrics2PL = {
      revenuePerOpp: serviceCategories['2PL'].revenue / serviceCategories['2PL'].count,
      gpPerOpp: (serviceCategories['2PL'].revenue * serviceCategories['2PL'].avg_gp) / serviceCategories['2PL'].count,
      avgDealSize: serviceCategories['2PL'].revenue / serviceCategories['2PL'].count,
      efficiency: (serviceCategories['2PL'].avg_gp * 100) * (serviceCategories['2PL'].count / 10) // GP% weighted by opportunity scale
    };
    
    const metrics3PL = {
      revenuePerOpp: serviceCategories['3PL'].revenue / serviceCategories['3PL'].count,
      gpPerOpp: (serviceCategories['3PL'].revenue * serviceCategories['3PL'].avg_gp) / serviceCategories['3PL'].count,
      avgDealSize: serviceCategories['3PL'].revenue / serviceCategories['3PL'].count,
      efficiency: (serviceCategories['3PL'].avg_gp * 100) * (serviceCategories['3PL'].count / 10)
    };
    
    return { metrics2PL, metrics3PL };
  };
  
  // Calculate concentration risk (Herfindahl-Hirschman Index)
  const calculateConcentrationRisk = () => {
    const totalRevenue = services.reduce((sum, s) => sum + s.total_revenue, 0);
    const hhi = services.reduce((sum, service) => {
      const marketShare = (service.total_revenue / totalRevenue) * 100;
      return sum + Math.pow(marketShare, 2);
    }, 0);
    
    // HHI ranges: <1500 = Low concentration, 1500-2500 = Moderate, >2500 = High
    const riskLevel = hhi < 1500 ? 'Low' : hhi < 2500 ? 'Moderate' : 'High';
    const riskColor = hhi < 1500 ? 'text-green-600' : hhi < 2500 ? 'text-yellow-600' : 'text-red-600';
    
    return { hhi: Math.round(hhi), riskLevel, riskColor };
  };
  
  const { metrics2PL, metrics3PL } = calculateEfficiencyMetrics();
  const concentrationRisk = calculateConcentrationRisk();
  
  // Prepare data for efficiency comparison chart
  const efficiencyData = [
    {
      metric: 'Revenue/Opp',
      '2PL': metrics2PL.revenuePerOpp / 1000, // Convert to thousands for better scale
      '3PL': metrics3PL.revenuePerOpp / 1000,
    },
    {
      metric: 'GP/Opp',
      '2PL': metrics2PL.gpPerOpp / 1000,
      '3PL': metrics3PL.gpPerOpp / 1000,
    },
    {
      metric: 'Efficiency Score',
      '2PL': metrics2PL.efficiency,
      '3PL': metrics3PL.efficiency,
    }
  ];
  
  // Prepare scatter data for revenue vs GP analysis
  const scatterData = services.map(service => ({
    name: service.service.replace('2PL - ', '').replace('3PL - ', ''),
    revenue: service.total_revenue / 1000, // in thousands
    gp: service.avg_gp_percent * 100,
    opportunities: service.count,
    type: service.service.includes('2PL') ? '2PL' : '3PL'
  }));
  
  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Revenue: {formatCurrency(data.revenue * 1000)}</p>
          <p className="text-sm text-gray-600">GP: {formatPercentage(data.gp)}</p>
          <p className="text-sm text-gray-600">Opportunities: {data.opportunities}</p>
        </div>
      );
    }
    return null;
  };
  
  // Radar chart data for multi-dimensional comparison
  const radarData = [
    {
      dimension: 'Revenue Scale',
      '2PL': (serviceCategories['2PL'].revenue / (serviceCategories['2PL'].revenue + serviceCategories['3PL'].revenue)) * 100,
      '3PL': (serviceCategories['3PL'].revenue / (serviceCategories['2PL'].revenue + serviceCategories['3PL'].revenue)) * 100,
    },
    {
      dimension: 'Profitability',
      '2PL': serviceCategories['2PL'].avg_gp * 100,
      '3PL': serviceCategories['3PL'].avg_gp * 100,
    },
    {
      dimension: 'Deal Volume',
      '2PL': (serviceCategories['2PL'].count / (serviceCategories['2PL'].count + serviceCategories['3PL'].count)) * 100,
      '3PL': (serviceCategories['3PL'].count / (serviceCategories['2PL'].count + serviceCategories['3PL'].count)) * 100,
    },
    {
      dimension: 'Efficiency',
      '2PL': metrics2PL.efficiency,
      '3PL': metrics3PL.efficiency,
    }
  ];

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Service Efficiency & Performance Analysis
        </h3>
        
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Revenue Efficiency */}
          <div className="bg-gradient-to-br from-primary/5 to-white rounded-lg p-4 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Revenue Efficiency Leader</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics2PL.revenuePerOpp > metrics3PL.revenuePerOpp ? '2PL' : '3PL'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatCurrency(Math.max(metrics2PL.revenuePerOpp, metrics3PL.revenuePerOpp))} per opportunity
            </p>
          </div>
          
          {/* Profitability Leader */}
          <div className="bg-gradient-to-br from-accent-blue/5 to-white rounded-lg p-4 border border-accent-blue/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-medium text-gray-700">Profitability Leader</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {serviceCategories['2PL'].avg_gp > serviceCategories['3PL'].avg_gp ? '2PL' : '3PL'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatPercentage(Math.max(serviceCategories['2PL'].avg_gp, serviceCategories['3PL'].avg_gp) * 100)} average GP
            </p>
          </div>
          
          {/* Concentration Risk */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Concentration Risk</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${concentrationRisk.riskColor}`}>
              {concentrationRisk.riskLevel}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              HHI: {concentrationRisk.hhi.toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Efficiency Comparison Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Efficiency Metrics Comparison
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'Efficiency Score' ? value.toFixed(1) : formatCurrency(value * 1000),
                    name
                  ]}
                />
                <Bar dataKey="2PL" fill="#9e1f63" radius={[4, 4, 0, 0]} />
                <Bar dataKey="3PL" fill="#005b8c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Performance Radar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Multi-Dimensional Performance
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="2PL" dataKey="2PL" stroke="#9e1f63" fill="#9e1f63" fillOpacity={0.3} />
                <Radar name="3PL" dataKey="3PL" stroke="#005b8c" fill="#005b8c" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Profitability vs Revenue Scatter */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Service Portfolio Analysis (Revenue vs Profitability)
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                dataKey="revenue" 
                name="Revenue (K)" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Revenue (SAR thousands)', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                type="number" 
                dataKey="gp" 
                name="GP%" 
                tick={{ fontSize: 11 }}
                label={{ value: 'Gross Profit %', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="opportunities" range={[50, 400]} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter name="Services" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.type === '2PL' ? '#9e1f63' : '#005b8c'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
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
        </div>
      </div>
    </div>
  );
};

export default ServiceEfficiencyComparison;