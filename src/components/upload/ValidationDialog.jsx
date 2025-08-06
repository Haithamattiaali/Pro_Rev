import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const ValidationDialog = ({ validation, onConfirm, onCancel }) => {
  const [decisions, setDecisions] = useState({});

  // Initialize decisions for records requiring confirmation
  React.useEffect(() => {
    if (validation?.requiresConfirmation) {
      const initialDecisions = {};
      validation.requiresConfirmation.forEach((record, index) => {
        initialDecisions[index] = {
          accepted: false,
          useSuggested: true,
          customValue: null
        };
      });
      setDecisions(initialDecisions);
    }
  }, [validation]);

  const handleDecisionChange = (index, type, value = null) => {
    setDecisions(prev => ({
      ...prev,
      [index]: {
        accepted: type === 'accept',
        useSuggested: type === 'suggested',
        customValue: type === 'custom' ? value : null
      }
    }));
  };

  const handleConfirm = () => {
    onConfirm(decisions);
  };

  if (!validation) return null;

  const { summary, requiresConfirmation, errors, warnings } = validation;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Data Validation Results</h2>
          <p className="text-sm text-gray-600 mt-1">Review and confirm data before import</p>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.valid}</div>
              <div className="text-sm text-gray-600">Valid</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
              <div className="text-sm text-gray-600">Auto-Corrected</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Errors (Auto-corrected) */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                Auto-Corrected Issues
              </h3>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {error.customer} - {error.service_type} ({error.month}/{error.year})
                        </p>
                        <p className="text-sm text-red-700 mt-1">{error.validation.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Days changed from {error.days} to {error.validation.correctedDays}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Records requiring confirmation */}
          {requiresConfirmation.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
                Confirmation Required
              </h3>
              <div className="space-y-3">
                {requiresConfirmation.map((record, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">
                        {record.customer} - {record.service_type} ({record.month}/{record.year})
                      </p>
                      <p className="text-sm text-yellow-700 mt-1 flex items-start">
                        <Calendar className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        {record.validation.message}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`decision-${index}`}
                          checked={decisions[index]?.accepted === true}
                          onChange={() => handleDecisionChange(index, 'accept')}
                          className="mr-2"
                        />
                        <span className="text-sm">Accept {record.days} days as entered</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`decision-${index}`}
                          checked={decisions[index]?.useSuggested === true}
                          onChange={() => handleDecisionChange(index, 'suggested')}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          Use suggested value ({record.validation.suggestedDays} days)
                        </span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`decision-${index}`}
                          checked={decisions[index]?.customValue !== null}
                          onChange={() => handleDecisionChange(index, 'custom', record.days)}
                          className="mr-2"
                        />
                        <span className="text-sm mr-2">Custom value:</span>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={decisions[index]?.customValue || ''}
                          onChange={(e) => handleDecisionChange(index, 'custom', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border rounded"
                          disabled={decisions[index]?.customValue === null}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Validation Warnings
              </h3>
              <div className="space-y-2">
                {warnings.map((warning, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700">{warning.validation.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {requiresConfirmation.length > 0 && (
              <span>{requiresConfirmation.length} records need your decision</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Confirm & Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationDialog;