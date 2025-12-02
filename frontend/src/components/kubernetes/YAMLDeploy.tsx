import { useState, useEffect } from 'react';
import { kubernetesApi } from '../../services/api';
import type { Namespace, YAMLApplyResponse } from '../../types';
import {
  DocumentTextIcon,
  PlayIcon,
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const SAMPLE_YAML = `# Sample Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: nginx:latest
        ports:
        - containerPort: 80
---
# Sample Service
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
`;

export default function YAMLDeploy() {
  const [yamlContent, setYamlContent] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YAMLApplyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNamespaces();
  }, []);

  const loadNamespaces = async () => {
    try {
      const response = await kubernetesApi.getNamespaces();
      setNamespaces(response.data);
    } catch (err) {
      console.error('Failed to load namespaces:', err);
    }
  };

  const handleApply = async (dryRun: boolean) => {
    if (!yamlContent.trim()) {
      setError('Please enter YAML content');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await kubernetesApi.applyYAML({
        yaml_content: yamlContent,
        namespace: selectedNamespace || undefined,
        dry_run: dryRun,
      });
      setResult(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply YAML';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setYamlContent(SAMPLE_YAML);
    setResult(null);
    setError(null);
  };

  const clearAll = () => {
    setYamlContent('');
    setResult(null);
    setError(null);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'configured':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'validated':
        return <DocumentMagnifyingGlassIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400';
      case 'configured':
        return 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-400';
      case 'validated':
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Deploy YAML</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Apply Kubernetes manifests directly to the cluster
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSample}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">YAML Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Use namespace from YAML</option>
                {namespaces.map((ns) => (
                  <option key={ns.name} value={ns.name}>
                    {ns.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-4">
            <textarea
              value={yamlContent}
              onChange={(e) => setYamlContent(e.target.value)}
              placeholder="Paste your Kubernetes YAML manifest here..."
              className="w-full h-[500px] font-mono text-sm p-4 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              spellCheck="false"
            />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-700/50">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {yamlContent ? `${yamlContent.split('\n').length} lines` : 'No content'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleApply(true)}
                disabled={loading || !yamlContent.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                Dry Run
              </button>
              <button
                onClick={() => handleApply(false)}
                disabled={loading || !yamlContent.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PlayIcon className="h-4 w-4" />
                {loading ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
            {result ? (
              result.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )
            ) : (
              <DocumentMagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            )}
            <span className="font-medium text-gray-700 dark:text-gray-300">Results</span>
            {result?.dry_run && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full">
                Dry Run
              </span>
            )}
          </div>
          <div className="p-4 h-[550px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircleIcon className="h-5 w-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4">
                {/* Summary */}
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30'
                      : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30'
                  }`}
                >
                  <p
                    className={`font-medium ${
                      result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>

                {/* Applied Resources */}
                {result.resources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resources ({result.resources.length})
                    </h3>
                    <div className="space-y-2">
                      {result.resources.map((resource, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getActionIcon(resource.action)}
                            <div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {resource.kind}/{resource.name}
                              </span>
                              {resource.namespace && (
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                  ({resource.namespace})
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getActionBadgeColor(
                              resource.action
                            )}`}
                          >
                            {resource.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                      Errors ({result.errors.length})
                    </h3>
                    <div className="space-y-2">
                      {result.errors.map((err, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm text-red-700 dark:text-red-400"
                        >
                          <XCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!loading && !error && !result && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mb-2" />
                <p className="text-sm">Enter YAML and click Apply or Dry Run</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/30 rounded-xl p-4">
        <h3 className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-2">Tips</h3>
        <ul className="text-sm text-primary-700 dark:text-primary-400 space-y-1">
          <li>
            - Use <strong>Dry Run</strong> to validate your YAML without making
            changes
          </li>
          <li>- Multiple resources can be separated with `---`</li>
          <li>
            - Select a namespace to override the namespace in your manifest
          </li>
          <li>
            - Existing resources will be updated (patched) instead of recreated
          </li>
        </ul>
      </div>
    </div>
  );
}
