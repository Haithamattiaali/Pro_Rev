import React from 'react';
import ModularPeriodFilter from '../components/filters/ModularPeriodFilter';
import { FilterProvider } from '../contexts/FilterContext';
import { CheckCircle, X } from 'lucide-react';

const FilterDemo = () => {
  return (
    <FilterProvider>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Hybrid Design Filter Components Demo
          </h1>

          <div className="space-y-8">
            {/* Demo Section 1: Modular Period Filter with Date Selector */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Modular Period Filter with Calendar View
              </h2>
              <p className="text-gray-600 mb-6">
                Toggle between List and Calendar views using the button. The Calendar view features an ultra-concentrated design:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-1">
                <li><strong>Ultra-compact header buttons</strong> - 10px font size, minimal padding (px-1.5 py-0.5)</li>
                <li><strong>Concentrated grid layouts</strong> - 6 columns for months when expanded, tighter gaps</li>
                <li><strong>Bold visual hierarchy</strong> - Strong shadows and rings for selected states</li>
                <li><strong>Animated indicators</strong> - Pulsing dots for current periods</li>
                <li><strong>Compact footer</strong> - Color-coded actions (green Apply, red Cancel)</li>
                <li><strong>Space-efficient summary</strong> - Shows selections as tiny colored badges</li>
              </ul>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                <ModularPeriodFilter />
              </div>
            </section>

            {/* Design System Showcase */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Hybrid Design System Elements
              </h2>
              
              <div className="grid grid-cols-3 gap-6">
                {/* Material UI Elements */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Material UI</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Ripple effects on buttons</li>
                    <li>• Elevation shadows</li>
                    <li>• Clear state transitions</li>
                    <li>• Bold color usage</li>
                  </ul>
                </div>

                {/* Ant Design Elements */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Ant Design</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Compact header buttons</li>
                    <li>• Dense grid layouts</li>
                    <li>• Practical controls</li>
                    <li>• Bulk selection</li>
                  </ul>
                </div>

                {/* Apple Design Elements */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700">Apple Design</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Glass morphism</li>
                    <li>• Smooth animations</li>
                    <li>• Segmented controls</li>
                    <li>• Minimal aesthetic</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Button Styles Showcase */}
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Header Button Styles (Smaller Design)
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Ultra-compact Primary:</span>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all duration-150 hover:scale-102 active:scale-98 bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-md">
                    Apply
                  </button>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all duration-150 hover:scale-102 active:scale-98 bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md animate-pulse">
                    <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                    Apply
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Ultra-compact Secondary:</span>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all duration-150 hover:scale-102 active:scale-98 bg-white text-neutral-dark border border-neutral-mid hover:border-primary hover:text-primary hover:bg-primary/5">
                    2025
                  </button>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded transition-all duration-150 hover:scale-102 active:scale-98 bg-primary text-white border-primary shadow-sm">
                    2025
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-32">Ultra-compact Ghost:</span>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all duration-150 hover:scale-102 active:scale-98 text-neutral-mid hover:text-primary hover:bg-primary/5">
                    Reset
                  </button>
                  <button className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold rounded transition-all duration-150 hover:scale-102 active:scale-98 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="w-2.5 h-2.5 mr-0.5" />
                    Cancel
                  </button>
                </div>
                
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-gray-600 w-32">Selection badges:</span>
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px] font-bold shadow-sm">Jan</span>
                  <span className="px-1.5 py-0.5 bg-green-500 text-white rounded text-[10px] font-bold shadow-sm">Q1</span>
                  <span className="px-1.5 py-0.5 bg-purple-500 text-white rounded text-[10px] font-bold shadow-sm">2025</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </FilterProvider>
  );
};

export default FilterDemo;