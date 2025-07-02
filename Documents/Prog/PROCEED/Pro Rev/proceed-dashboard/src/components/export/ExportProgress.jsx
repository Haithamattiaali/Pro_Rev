import React from 'react';
import { motion } from 'framer-motion';

const ExportProgress = ({ progress, onCancel }) => {
  const { phase, percentage, message, estimatedTimeRemaining } = progress;

  // Format time remaining
  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s remaining`;
  };

  // Get phase display info
  const getPhaseInfo = () => {
    const phases = {
      capture: {
        title: 'Capturing Dashboard',
        icon: '📸',
        color: 'blue'
      },
      translation: {
        title: 'Processing Layout',
        icon: '🔄',
        color: 'indigo'
      },
      compilation: {
        title: 'Generating Documents',
        icon: '📄',
        color: 'purple'
      },
      delivery: {
        title: 'Finalizing Export',
        icon: '✉️',
        color: 'green'
      }
    };
    return phases[phase] || { title: phase, icon: '⏳', color: 'gray' };
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="py-8">
      {/* Phase Icon and Title */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">{phaseInfo.icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">
          {phaseInfo.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-${phaseInfo.color}-500`}
            style={{ backgroundColor: `var(--color-${phaseInfo.color}-500)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{percentage}%</span>
          {estimatedTimeRemaining && (
            <span>{formatTime(estimatedTimeRemaining)}</span>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {['capture', 'translation', 'compilation', 'delivery'].map((step, index) => {
          const stepPhases = ['capture', 'translation', 'compilation', 'delivery'];
          const currentIndex = stepPhases.indexOf(phase);
          const stepIndex = stepPhases.indexOf(step);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex > currentIndex;

          return (
            <div key={step} className="flex items-center flex-1">
              <div className="relative flex items-center justify-center">
                <div
                  className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-primary text-white' : ''}
                    ${isPending ? 'bg-gray-200 text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Phase Details */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="space-y-2">
          {phase === 'capture' && (
            <>
              <p>• Analyzing dashboard structure</p>
              <p>• Collecting visual elements</p>
              <p>• Processing interactive components</p>
            </>
          )}
          {phase === 'translation' && (
            <>
              <p>• Converting to export format</p>
              <p>• Optimizing layout for output</p>
              <p>• Preserving data relationships</p>
            </>
          )}
          {phase === 'compilation' && (
            <>
              <p>• Generating document pages</p>
              <p>• Embedding charts and visualizations</p>
              <p>• Applying formatting and styles</p>
            </>
          )}
          {phase === 'delivery' && (
            <>
              <p>• Finalizing document</p>
              <p>• Compressing for optimal size</p>
              <p>• Preparing download</p>
            </>
          )}
        </div>
      </div>

      {/* Cancel Button */}
      <div className="mt-6 text-center">
        <button
          onClick={onCancel}
          className="text-sm text-gray-600 hover:text-gray-900 underline focus:outline-none"
        >
          Cancel Export
        </button>
      </div>
    </div>
  );
};

export default ExportProgress;