'use client';

import { useState } from 'react';
import { useDashboardStore, Widget } from '@/store/useDashboardStore';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const addWidget = useDashboardStore((state) => state.addWidget);

  const [formData, setFormData] = useState({
    name: '',
    apiUrl: '',
    dataKey: '',
    type: 'card' as const,
    refreshInterval: 60,
  });

  const [apiResponse, setApiResponse] = useState<Record<string, unknown> | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'refreshInterval' ? parseInt(value) : value,
    }));
  };

  const handleTestApi = async () => {
    if (!formData.apiUrl) {
      setApiError('Please enter an API URL');
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await fetch(formData.apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to fetch API');
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleAddWidget = () => {
    if (!formData.name || !formData.apiUrl) {
      setApiError('Please fill in Widget Name and API URL');
      return;
    }

    addWidget({
      type: formData.type,
      name: formData.name,
      apiUrl: formData.apiUrl,
      dataKey: formData.dataKey || '',
      refreshInterval: formData.refreshInterval,
    });

    setFormData({
      name: '',
      apiUrl: '',
      dataKey: '',
      type: 'card',
      refreshInterval: 60,
    });
    setApiResponse(null);
    setApiError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Add Widget</h2>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widget Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="card">Finance Card</option>
              <option value="table">Table</option>
              <option value="chart">Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Widget Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., BTC Price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API URL
            </label>
            <input
              type="text"
              name="apiUrl"
              value={formData.apiUrl}
              onChange={handleInputChange}
              placeholder="https://api.example.com/data"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Key (JSON path) <span className="text-gray-500 text-xs font-normal">Optional</span>
            </label>
            <input
              type="text"
              name="dataKey"
              value={formData.dataKey}
              onChange={handleInputChange}
              placeholder="e.g., data.price or price (leave empty for root)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              name="refreshInterval"
              value={formData.refreshInterval}
              onChange={handleInputChange}
              min="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Test API Button */}
        <button
          onClick={handleTestApi}
          disabled={isLoadingApi}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 mb-4 font-medium"
        >
          {isLoadingApi ? 'Testing...' : 'Test API'}
        </button>

        {/* API Response Display */}
        {apiResponse && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md max-h-40 overflow-y-auto">
            <p className="text-sm font-medium text-green-800 mb-2">API Response:</p>
            <pre className="text-xs text-green-700 whitespace-pre-wrap break-words">
              {JSON.stringify(apiResponse as Record<string, unknown>, null, 2)}
            </pre>
          </div>
        )}

        {/* Error Display */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800">{apiError}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAddWidget}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
}
