import { useState, useEffect } from 'react';
import { helmApi } from '../../services/api';
import type {
  HelmRelease,
  HelmReleaseHistory,
  HelmRepository,
  HelmChartSearchResult,
  HelmReleaseStatus,
} from '../../types';
import {
  CubeIcon,
  ArrowPathIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

interface ReleaseDetailProps {
  release: HelmRelease;
  onClose: () => void;
  onRollback: (revision: number) => void;
  onUpgrade: () => void;
  onUninstall: () => void;
}

function ReleaseDetail({ release, onClose, onRollback, onUpgrade, onUninstall }: ReleaseDetailProps) {
  const [history, setHistory] = useState<HelmReleaseHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'values'>('history');
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadHistory();
  }, [release]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [historyRes, valuesRes] = await Promise.all([
        helmApi.getReleaseHistory(release.namespace, release.name),
        helmApi.getReleaseValues(release.namespace, release.name, false),
      ]);
      setHistory(historyRes.data);
      setValues(valuesRes.data.user_supplied || {});
    } catch (error) {
      console.error('Failed to load release details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative w-full max-w-4xl rounded-lg bg-white dark:bg-slate-800 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 p-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {release.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {release.chart} ({release.chart_version}) in {release.namespace}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onUpgrade}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Upgrade
              </button>
              <button
                onClick={onUninstall}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Uninstall
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Revision History
              </button>
              <button
                onClick={() => setActiveTab('values')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'values'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Values
              </button>
            </nav>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : activeTab === 'history' ? (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.revision}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                        Rev {h.revision}
                      </span>
                      <StatusBadge status={h.status} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {h.chart} ({h.chart_version})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(h.updated).toLocaleString()}
                      </span>
                      {h.revision !== release.revision && (
                        <button
                          onClick={() => onRollback(h.revision)}
                          className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
                {Object.keys(values).length > 0
                  ? JSON.stringify(values, null, 2)
                  : '# No user-supplied values'}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: HelmReleaseStatus }) {
  const config: Record<HelmReleaseStatus, { bg: string; text: string; icon: React.ElementType }> = {
    deployed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircleIcon },
    failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircleIcon },
    'pending-install': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: ClockIcon },
    'pending-upgrade': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: ClockIcon },
    'pending-rollback': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: ClockIcon },
    uninstalling: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: TrashIcon },
    superseded: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: ArrowUturnLeftIcon },
    unknown: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: ExclamationTriangleIcon },
  };

  const { bg, text, icon: Icon } = config[status] || config.unknown;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  );
}

export default function HelmDashboard() {
  const [releases, setReleases] = useState<HelmRelease[]>([]);
  const [repositories, setRepositories] = useState<HelmRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<HelmRelease | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartSearchQuery, setChartSearchQuery] = useState('');
  const [chartSearchResults, setChartSearchResults] = useState<HelmChartSearchResult[]>([]);
  const [searchingCharts, setSearchingCharts] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set());
  const [operationMessage, setOperationMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [releasesRes, reposRes] = await Promise.all([
        helmApi.listReleases(),
        helmApi.listRepositories(),
      ]);
      setReleases(releasesRes.data.releases || []);
      setRepositories(reposRes.data.repositories || []);

      // Auto-expand namespaces with releases
      const namespaces = new Set(releasesRes.data.releases?.map(r => r.namespace) || []);
      setExpandedNamespaces(namespaces);
    } catch (error) {
      console.error('Failed to load Helm data:', error);
      setOperationMessage({ type: 'error', message: 'Failed to load Helm data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCharts = async () => {
    if (!chartSearchQuery.trim()) return;

    try {
      setSearchingCharts(true);
      const response = await helmApi.searchCharts(chartSearchQuery);
      setChartSearchResults(response.data || []);
    } catch (error) {
      console.error('Chart search failed:', error);
      setOperationMessage({ type: 'error', message: 'Chart search failed' });
    } finally {
      setSearchingCharts(false);
    }
  };

  const handleRollback = async (release: HelmRelease, revision: number) => {
    try {
      const result = await helmApi.rollbackRelease(release.namespace, release.name, revision);
      if (result.data.success) {
        setOperationMessage({ type: 'success', message: `Rolled back ${release.name} to revision ${revision}` });
        loadData();
        setSelectedRelease(null);
      } else {
        setOperationMessage({ type: 'error', message: result.data.message });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Rollback failed' });
    }
  };

  const handleUninstall = async (release: HelmRelease) => {
    if (!confirm(`Are you sure you want to uninstall ${release.name}?`)) return;

    try {
      const result = await helmApi.uninstallRelease(release.namespace, release.name);
      if (result.data.success) {
        setOperationMessage({ type: 'success', message: `Uninstalled ${release.name}` });
        loadData();
        setSelectedRelease(null);
      } else {
        setOperationMessage({ type: 'error', message: result.data.message });
      }
    } catch (error) {
      setOperationMessage({ type: 'error', message: 'Uninstall failed' });
    }
  };

  const toggleNamespace = (namespace: string) => {
    setExpandedNamespaces(prev => {
      const next = new Set(prev);
      if (next.has(namespace)) {
        next.delete(namespace);
      } else {
        next.add(namespace);
      }
      return next;
    });
  };

  // Group releases by namespace
  const releasesByNamespace = releases.reduce((acc, release) => {
    if (!acc[release.namespace]) {
      acc[release.namespace] = [];
    }
    acc[release.namespace].push(release);
    return acc;
  }, {} as Record<string, HelmRelease[]>);

  // Filter releases by search query
  const filteredNamespaces = Object.entries(releasesByNamespace).filter(([namespace, releases]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      namespace.toLowerCase().includes(query) ||
      releases.some(r => r.name.toLowerCase().includes(query) || r.chart.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Helm Releases
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage Helm chart deployments across your clusters
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowInstallModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5" />
            Install Chart
          </button>
        </div>
      </div>

      {/* Operation Message */}
      {operationMessage && (
        <div
          className={`p-4 rounded-lg ${
            operationMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{operationMessage.message}</span>
            <button onClick={() => setOperationMessage(null)}>
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search releases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Releases</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{releases.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Repositories</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{repositories.length}</p>
        </div>
      </div>

      {/* Releases List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : releases.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <CubeIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Helm Releases</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Install a Helm chart to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNamespaces.map(([namespace, nsReleases]) => (
            <div
              key={namespace}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => toggleNamespace(namespace)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-3">
                  {expandedNamespaces.has(namespace) ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900 dark:text-white">{namespace}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({nsReleases.length} releases)
                  </span>
                </div>
              </button>

              {expandedNamespaces.has(namespace) && (
                <div className="border-t border-gray-200 dark:border-slate-700">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Release
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Chart
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Revision
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Updated
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {nsReleases
                        .filter(r => !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((release) => (
                          <tr
                            key={`${release.namespace}-${release.name}`}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700"
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setSelectedRelease(release)}
                                className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                {release.name}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {release.chart}
                              <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({release.chart_version})
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={release.status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {release.revision}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {release.updated
                                ? new Date(release.updated).toLocaleString()
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedRelease(release)}
                                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 rounded"
                                  title="View Details"
                                >
                                  <CubeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUninstall(release)}
                                  className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                  title="Uninstall"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Release Detail Modal */}
      {selectedRelease && (
        <ReleaseDetail
          release={selectedRelease}
          onClose={() => setSelectedRelease(null)}
          onRollback={(revision) => handleRollback(selectedRelease, revision)}
          onUpgrade={() => {
            // TODO: Implement upgrade modal
            setOperationMessage({ type: 'error', message: 'Upgrade modal not yet implemented' });
          }}
          onUninstall={() => handleUninstall(selectedRelease)}
        />
      )}

      {/* Install Chart Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowInstallModal(false)} />
            <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-slate-800 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-700 p-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Install Helm Chart
                </h2>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Chart Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Charts
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., nginx, redis, postgresql"
                      value={chartSearchQuery}
                      onChange={(e) => setChartSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearchCharts()}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={handleSearchCharts}
                      disabled={searchingCharts}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {searchingCharts ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {chartSearchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    {chartSearchResults.map((chart, index) => (
                      <div
                        key={`${chart.repository}-${chart.name}-${index}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-200 dark:border-slate-700 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {chart.repository}/{chart.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {chart.description?.slice(0, 100)}
                            {chart.description && chart.description.length > 100 ? '...' : ''}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            v{chart.version}
                            {chart.app_version && ` (App: ${chart.app_version})`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            // TODO: Open install form with this chart
                            setOperationMessage({
                              type: 'error',
                              message: 'Install form not yet implemented'
                            });
                          }}
                          className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                          Install
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {chartSearchResults.length === 0 && chartSearchQuery && !searchingCharts && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No charts found. Try updating your repositories.
                  </p>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-b-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Available repositories: {repositories.map(r => r.name).join(', ') || 'None configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
