import React from 'react';
import { Truck, Package } from 'lucide-react';

const ServiceFilter = ({ value, onChange }) => {
  const services = [
    { value: 'all', label: 'All Services', icon: null },
    { value: 'Transportation', label: 'Transportation', icon: Truck },
    { value: 'Warehousing', label: 'Warehousing', icon: Package }
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-sm">
      <span className="text-sm text-gray-600">Service:</span>
      <div className="flex gap-1">
        {services.map((service) => {
          const Icon = service.icon;
          const isSelected = value === service.value;
          
          return (
            <button
              key={service.value}
              onClick={() => onChange(service.value)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${isSelected 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {service.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceFilter;