'use client';

import { useState, useMemo } from 'react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { API_CONFIGS } from '@/lib/api/config';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JsonTreeNode {
  key: string;
  value: unknown;
  path: string;
  type: 'object' | 'array' | 'value';
}

const ENDPOINT_CONFIGS: Record<string, Record<string, string>> = {
  ALPHA_VANTAGE: {
    QUOTE: 'Global Quote',
    INTRADAY: 'Intraday Series',
    DAILY: 'Daily Series',
    MONTHLY: 'Monthly Series',
  },
  FINNHUB: {
    QUOTE: 'Stock Quote',
    COMPANY: 'Company News',
    PROFILE: 'Company Profile',
  },
};

export default function AddWidgetModal({ isOpen, onClose }: AddWidgetModalProps) {
  const addWidget = useDashboardStore((state) => state.addWidget);

  const [provider, setProvider] = useState<string>('ALPHA_VANTAGE');
  const [endpoint, setEndpoint] = useState<string>('QUOTE');
  const [symbol, setSymbol] = useState('');
  const [widgetName, setWidgetName] = useState('');
  const [widgetType, setWidgetType] = useState<'card' | 'table' | 'chart'>('card');
  const [refreshInterval, setRefreshInterval] = useState(60);

  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [dataKey, setDataKey] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build API URL based on provider, endpoint, and symbol
  const apiUrl = useMemo(() => {
    if (useCustomUrl) return customUrl.trim();

    if (!symbol) return '';

    if (provider === 'ALPHA_VANTAGE') {
      const config = API_CONFIGS.ALPHA_VANTAGE;
      const endpointMap: Record<string, string> = {
        QUOTE: 'GLOBAL_QUOTE',
        INTRADAY: 'TIME_SERIES_INTRADAY',
        DAILY: 'TIME_SERIES_DAILY',
        MONTHLY: 'TIME_SERIES_MONTHLY',
      };
      const func = endpointMap[endpoint];
      return `${config.baseUrl}?function=${func}&symbol=${symbol}&apikey=${config.apiKey}`;
    } else if (provider === 'FINNHUB') {
      const config = API_CONFIGS.FINNHUB;
      const endpointMap: Record<string, string> = {
        QUOTE: 'quote',
        COMPANY: 'company-news',
        PROFILE: 'profile',
      };
      const path = endpointMap[endpoint];
      const queryParam = endpoint === 'COMPANY' ? 'symbol' : 'symbol';
      return `${config.baseUrl}/${path}?${queryParam}=${symbol}&token=${config.apiKey}`;
    }

    return '';
  }, [provider, endpoint, symbol, useCustomUrl, customUrl]);

  const handleTestApi = async () => {
    if (!apiUrl) {
      setApiError(useCustomUrl ? 'Please enter a custom API URL' : 'Please fill in Provider, Endpoint, and Symbol');
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);
    setApiResponse(null);
    setExpandedNodes(new Set());

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();

      // Log full response for debugging
      console.log('API Response:', data);

      // Check for API errors
      if (data?.Note || data?.['Error Message']) {
        console.error('API Error:', data.Note || data['Error Message']);
        throw new Error(data.Note || data['Error Message']);
      }

      setApiResponse(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch API';
      console.error('Fetch Error:', errorMsg);
      setApiError(errorMsg);
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleAddWidget = () => {
    if (!widgetName || !apiUrl || !dataKey) {
      setApiError('Please fill in Widget Name, test the API, and select a Data Key');
      return;
    }

    addWidget({
      type: widgetType,
      name: widgetName,
      apiUrl,
      dataKey,
      refreshInterval,
    });

    // Reset form
    setWidgetName('');
    setSymbol('');
    setDataKey('');
    setApiResponse(null);
    setApiError(null);
    setExpandedNodes(new Set());
    onClose();
  };

  const toggleNodeExpansion = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const selectDataKey = (path: string) => {
    setDataKey(path);
    setApiError(null);
  };

  // Build JSON tree
  const buildJsonTree = (obj: unknown, path = ''): JsonTreeNode[] => {
    if (obj === null || obj === undefined) return [];

    const nodes: JsonTreeNode[] = [];

    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        // Don't expand arrays by default, just show first item
        if (obj.length > 0 && typeof obj[0] === 'object') {
          nodes.push({
            key: `[Array - ${obj.length} items]`,
            value: obj[0],
            path: path || 'root',
            type: 'array',
          });
        }
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const nodePath = path ? `${path}.${key}` : key;
          const nodeType =
            typeof value === 'object'
              ? Array.isArray(value)
                ? 'array'
                : 'object'
              : 'value';

          nodes.push({
            key,
            value,
            path: nodePath,
            type: nodeType,
          });
        });
      }
    }

    return nodes;
  };

  const renderJsonTree = (obj: unknown, depth = 0, maxDepth = 3): React.ReactNode => {
    if (depth > maxDepth) return null;

    const nodes = buildJsonTree(obj);

    return (
      <div className="space-y-1">
        {nodes.map((node) => (
          <div key={node.path}>
            {node.type !== 'value' ? (
              <div>
                <button
                  onClick={() => toggleNodeExpansion(node.path)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1 hover:bg-blue-100 rounded text-sm font-mono text-gray-700"
                >
                  <span className="w-4 text-center">
                    {expandedNodes.has(node.path) ? '▼' : '▶'}
                  </span>
                  <span className="text-blue-600 font-semibold">{node.key}</span>
                  {node.type === 'array' && (
                    <span className="text-gray-500 text-xs">
                      {Array.isArray(node.value) ? `${node.value.length} items` : ''}
                    </span>
                  )}
                </button>

                {expandedNodes.has(node.path) && (
                  <div className="ml-4 border-l border-gray-300 pl-2">
                    {renderJsonTree(node.value, depth + 1, maxDepth)}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => selectDataKey(node.path)}
                className={`block w-full text-left px-2 py-1 rounded text-sm font-mono ${
                  dataKey === node.path
                    ? 'bg-green-200 text-green-800'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="text-purple-600">{node.key}:</span>{' '}
                <span className="text-orange-600 font-semibold">
                  {typeof node.value === 'string'
                    ? `"${String(node.value).substring(0, 30)}"`
                    : String(node.value).substring(0, 30)}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  const endpoints = ENDPOINT_CONFIGS[provider] || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Add Widget</h2>

        {/* Widget Configuration */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Name
            </label>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="e.g., IBM Stock Price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Type
            </label>
            <select
              value={widgetType}
              onChange={(e) => setWidgetType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={useCustomUrl}
            >
              <option value="card">Finance Card</option>
              <option value="table">Table</option>
              <option value="chart">Chart</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
              min="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* API Configuration */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>

          <div className="mb-4 flex items-center gap-3">
            <input
              id="customUrlToggle"
              type="checkbox"
              checked={useCustomUrl}
              onChange={(e) => {
                setUseCustomUrl(e.target.checked);
                setApiResponse(null);
                setDataKey('');
                setExpandedNodes(new Set());
              }}
              className="h-4 w-4"
            />
            <label htmlFor="customUrlToggle" className="text-sm font-medium text-gray-700">
              Use custom API URL
            </label>
          </div>

          {useCustomUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom API URL</label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://api.example.com/data?symbol=IBM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setEndpoint(
                    Object.keys(ENDPOINT_CONFIGS[e.target.value] || {})[0] || ''
                  );
                  setApiResponse(null);
                  setDataKey('');
                  setExpandedNodes(new Set());
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={useCustomUrl}
              >
                <option value="ALPHA_VANTAGE">Alpha Vantage</option>
                <option value="FINNHUB">Finnhub</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint
              </label>
              <select
                value={endpoint}
                onChange={(e) => {
                  setEndpoint(e.target.value);
                  setApiResponse(null);
                  setDataKey('');
                  setExpandedNodes(new Set());
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={useCustomUrl}
              >
                {Object.entries(endpoints).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., IBM, AAPL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={useCustomUrl}
              />
            </div>
          </div>

          <button
            onClick={handleTestApi}
            disabled={isLoadingApi || !apiUrl}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 mb-4 font-medium"
          >
            {isLoadingApi ? 'Testing...' : 'Test API & Select Fields'}
          </button>
        </div>

        {/* Error Display */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800">{apiError}</p>
          </div>
        )}

        {/* JSON Explorer */}
        {apiResponse && (
          <div className="mb-6 border border-gray-300 rounded-md p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              📋 Click a field to select it as the Data Key:
            </p>
            <p className="text-xs text-gray-600 mb-3">
              💡 <strong>Tip:</strong> Click the arrow (▶) to expand nested objects, then select the specific field.
            </p>
            {renderJsonTree(apiResponse)}
          </div>
        )}

        {/* Selected Data Key */}
        {dataKey && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Selected Data Key:</strong>
            </p>
            <p className="text-sm font-mono text-green-800 mt-1">{dataKey}</p>
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
            disabled={!dataKey}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
}
