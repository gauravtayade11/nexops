import { useState, useEffect } from 'react';
import {
  ServerStackIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudIcon,
} from '@heroicons/react/24/outline';
import { clustersApi } from '../../services/api';
import { useCluster } from '../../contexts/ClusterContext';
import { useAuth } from '../../contexts/AuthContext';
// ClusterInfo type imported from context

interface KubeContext {
  name: string;
  cluster: string;
  user: string;
  namespace?: string;
}

export default function ClusterManagement() {
  const { clusters, setActiveCluster, refreshClusters } = useCluster();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contexts, setContexts] = useState<KubeContext[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    id: '',
    name: '',
    context: '',
    kubeconfig_path: '',
    is_default: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadContexts();
  }, []);

  const loadContexts = async () => {
    try {
      const response = await clustersApi.getContexts();
      setContexts(response.data);
    } catch (err) {
      console.error('Failed to load contexts:', err);
    }
  };

  const handleSetActive = async (clusterId: string) => {
    try {
      setLoading(true);
      setError(null);
      await setActiveCluster(clusterId);
      setSuccess(`Switched to cluster: ${clusterId}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to switch cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCluster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      await clustersApi.create({
        id: addForm.id.toLowerCase().replace(/\s+/g, '-'),
        name: addForm.name,
        context: addForm.context || undefined,
        kubeconfig_path: addForm.kubeconfig_path || undefined,
        is_default: addForm.is_default,
      });

      setSuccess('Cluster added successfully');
      setShowAddModal(false);
      setAddForm({ id: '', name: '', context: '', kubeconfig_path: '', is_default: false });
      await refreshClusters();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add cluster');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    if (!confirm(`Are you sure you want to delete cluster "${clusterId}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await clustersApi.delete(clusterId);
      setSuccess('Cluster deleted successfully');
      await refreshClusters();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete cluster');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 dark:bg-green-900/30';
      case 'disconnected':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cluster Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Kubernetes clusters and switch between them
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshClusters()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Cluster
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
          </div>
        </div>
      )}

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border-2 transition-all ${
              cluster.is_active
                ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getStatusBg(cluster.status)}`}>
                    <ServerStackIcon className={`h-6 w-6 ${getStatusColor(cluster.status)}`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {cluster.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cluster.id}</p>
                  </div>
                </div>
                {cluster.is_active && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(cluster.status)}`}>
                    {cluster.status}
                  </span>
                </div>

                {cluster.version && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Version</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cluster.version}</span>
                  </div>
                )}

                {cluster.context && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Context</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                      {cluster.context}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Nodes</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cluster.node_count}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Namespaces</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cluster.namespace_count}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                {!cluster.is_active ? (
                  <button
                    onClick={() => handleSetActive(cluster.id)}
                    disabled={loading}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
                  >
                    Switch to this cluster
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Currently active</span>
                )}

                {isAdmin && !cluster.is_default && (
                  <button
                    onClick={() => handleDeleteCluster(cluster.id)}
                    disabled={loading || cluster.is_active}
                    className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={cluster.is_active ? 'Cannot delete active cluster' : 'Delete cluster'}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {clusters.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <CloudIcon className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No clusters configured</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add a cluster to get started
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Cluster
              </button>
            )}
          </div>
        )}
      </div>

      {/* Available Contexts */}
      {contexts.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Available Kubeconfig Contexts
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Context Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Cluster
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Namespace
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contexts.map((ctx) => (
                  <tr key={ctx.name} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {ctx.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{ctx.cluster}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{ctx.user}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {ctx.namespace || 'default'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Cluster Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Cluster</h2>

              <form onSubmit={handleAddCluster} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cluster ID *
                  </label>
                  <input
                    type="text"
                    value={addForm.id}
                    onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="my-cluster"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Unique identifier for this cluster</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="My Production Cluster"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kubeconfig Context
                  </label>
                  <select
                    value={addForm.context}
                    onChange={(e) => setAddForm({ ...addForm, context: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a context...</option>
                    {contexts.map((ctx) => (
                      <option key={ctx.name} value={ctx.name}>
                        {ctx.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Select from available kubeconfig contexts</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kubeconfig Path
                  </label>
                  <input
                    type="text"
                    value={addForm.kubeconfig_path}
                    onChange={(e) => setAddForm({ ...addForm, kubeconfig_path: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="~/.kube/config"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to use default kubeconfig</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addForm.is_default}
                    onChange={(e) => setAddForm({ ...addForm, is_default: e.target.checked })}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Set as default cluster
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !addForm.id || !addForm.name}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Cluster'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
