import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const BusinessUnitBarChart = ({ data, title = 'Monthly Performance' }) => {
  // Custom tooltip to show formatted values
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-secondary-light">
          <p className="font-semibold text-secondary mb-2">{label}</p>
          {payload.map((entry, index) => {
            // Get the actual value from the payload
            const value = entry.value || 0;
            let formattedValue = '';
            
            // Check if this is the achievement bar by dataKey
            if (entry.dataKey === 'achievement') {
              // Format achievement as percentage with 1 decimal
              formattedValue = `${Number(value).toFixed(1)}%`;
            } else {
              // Format monetary values as millions
              formattedValue = `${(value / 1000000).toFixed(1)}M`;
            }
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <span style={{ color: entry.color }} className="font-medium">
                  {entry.name}:
                </span>
                <span className="font-semibold">
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };
  
  // Custom label renderer for each bar type
  const renderTargetLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#2d2d2d" 
        textAnchor="middle" 
        fontSize={11}
        fontWeight="bold"
      >
        {`${(value / 1000000).toFixed(1)}M`}
      </text>
    );
  };
  
  const renderRevenueLabel = (props) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#2d2d2d" 
        textAnchor="middle" 
        fontSize={11}
        fontWeight="bold"
      >
        {`${(value / 1000000).toFixed(1)}M`}
      </text>
    );
  };
  
  const renderAchievementLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (value === undefined || value === null) return null;
    
    // Always position on top of the bar
    const yPosition = y - 5;
    const textColor = '#000000'; // Black color
    
    return (
      <text 
        x={x + width / 2} 
        y={yPosition} 
        fill={textColor} 
        textAnchor="middle" 
        dominantBaseline="baseline"
        fontSize={11}
        fontWeight="bold"
      >
        {`${Number(value).toFixed(1)}%`}
      </text>
    );
  };

  // If no data, show message
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-mid">
        <p>No data available for the selected period</p>
      </div>
    );
  }

  // Calculate max value for better scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.revenue || 0, d.target || 0, d.cost || 0))
  );

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-secondary mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e1e6" />
          <XAxis 
            dataKey="month" 
            stroke="#2d2d2d"
            tick={{ fontSize: 12, fontWeight: 'bold' }}
            angle={-45}
            textAnchor="end"
            height={80}
            label={{ value: 'Month', position: 'insideBottom', offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#2d2d2d"
            tick={{ fontSize: 12, fontWeight: 'bold' }}
            domain={[0, maxValue * 1.1]}
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `${(value / 1000000).toFixed(1)}M`;
              } else if (value >= 1000) {
                return `${(value / 1000).toFixed(0)}K`;
              }
              return value;
            }}
            label={{ value: 'Amount (SAR)', angle: -90, position: 'insideLeft', style: { fontSize: 14, fontWeight: 'bold' } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#2d2d2d"
            tick={{ fontSize: 12, fontWeight: 'bold' }}
            domain={[0, 120]}
            tickFormatter={(value) => `${Math.round(value)}%`}
            label={{ value: 'Achievement %', angle: 90, position: 'insideRight', style: { fontSize: 14, fontWeight: 'bold' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            verticalAlign="bottom"
            height={36}
          />
          
          {/* Target Bar */}
          <Bar
            yAxisId="left"
            dataKey="target"
            name="Target"
            fill="#005b8c"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
            label={renderTargetLabel}
          />
          
          {/* Revenue Bar */}
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            fill="#9e1f63"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
            label={renderRevenueLabel}
          />
          
          {/* Achievement Bar on secondary axis */}
          <Bar
            yAxisId="right"
            dataKey="achievement"
            name="Achievement"
            fill="#6a686f"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
            label={renderAchievementLabel}
          />
        </BarChart>
      </ResponsiveContainer>
      
      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-secondary-pale rounded-lg">
          <p className="text-xs text-neutral-mid uppercase font-semibold">Total Target</p>
          <p className="text-xl font-bold text-accent-blue mt-1">
            {formatCurrency(data.reduce((sum, d) => sum + (d.target || 0), 0))}
          </p>
        </div>
        <div className="text-center p-3 bg-secondary-pale rounded-lg">
          <p className="text-xs text-neutral-mid uppercase font-semibold">Total Revenue</p>
          <p className="text-xl font-bold text-primary mt-1">
            {formatCurrency(data.reduce((sum, d) => sum + (d.revenue || 0), 0))}
          </p>
        </div>
        <div className="text-center p-3 bg-secondary-pale rounded-lg">
          <p className="text-xs text-neutral-mid uppercase font-semibold">Avg Achievement</p>
          <p className="text-xl font-bold text-primary-dark mt-1">
            {formatPercentage(
              data.reduce((sum, d) => sum + (d.achievement || 0), 0) / data.length
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessUnitBarChart;