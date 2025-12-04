import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ServerStackIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CloudIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { clustersApi } from '../../services/api';
import { useCluster } from '../../contexts/ClusterContext';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard, { SectionHeader } from '../common/GlassCard';

interface KubeContext {
  name: string;
  cluster: string;
  user: string;
  namespace?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

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
    } catch {
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to add cluster');
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete cluster');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-success-500';
      case 'disconnected':
        return 'text-warning-500';
      case 'error':
        return 'text-danger-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-success-500/10';
      case 'disconnected':
        return 'bg-warning-500/10';
      case 'error':
        return 'bg-danger-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cluster Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your Kubernetes clusters and switch between them
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => refreshClusters()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 disabled:opacity-50 transition-all"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 text-sm font-medium shadow-lg shadow-primary-500/25 transition-all"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Cluster
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-danger-500/10 backdrop-blur-sm border border-danger-500/20 rounded-xl p-4"
          >
            <div className="flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 text-danger-500 mr-2" />
              <span className="text-danger-600 dark:text-danger-400 text-sm">{error}</span>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-success-500/10 backdrop-blur-sm border border-success-500/20 rounded-xl p-4"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
              <span className="text-success-600 dark:text-success-400 text-sm">{success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clusters Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map((cluster, index) => (
          <motion.div
            key={cluster.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard
              hover
              variant={cluster.is_active ? 'glow' : 'hover'}
              className={`${cluster.is_active ? 'ring-2 ring-primary-500/50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`p-2.5 rounded-xl ${getStatusBg(cluster.status)}`}>
                    <ServerStackIcon className={`h-6 w-6 ${getStatusColor(cluster.status)}`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {cluster.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cluster.id}</p>
                  </div>
                </div>
                {cluster.is_active && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`font-medium capitalize ${getStatusColor(cluster.status)}`}>
                    {cluster.status}
                  </span>
                </div>

                {cluster.version && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Version</span>
                    <span className="font-medium text-gray-900 dark:text-white">{cluster.version}</span>
                  </div>
                )}

                {cluster.context && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Context</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                      {cluster.context}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Nodes</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cluster.node_count}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Namespaces</span>
                  <span className="font-medium text-gray-900 dark:text-white">{cluster.namespace_count}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between">
                {!cluster.is_active ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSetActive(cluster.id)}
                    disabled={loading}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 disabled:opacity-50"
                  >
                    Switch to this cluster
                  </motion.button>
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Currently active</span>
                )}

                {isAdmin && !cluster.is_default && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteCluster(cluster.id)}
                    disabled={loading || cluster.is_active}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title={cluster.is_active ? 'Cannot delete active cluster' : 'Delete cluster'}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {clusters.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="col-span-full"
          >
            <GlassCard className="flex flex-col items-center justify-center py-12">
              <div className="p-4 rounded-2xl bg-gray-500/10 mb-4">
                <CloudIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">No clusters configured</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a cluster to get started
              </p>
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 text-sm font-medium shadow-lg shadow-primary-500/25"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Cluster
                </motion.button>
              )}
            </GlassCard>
          </motion.div>
        )}
      </motion.div>

      {/* Available Contexts */}
      {contexts.length > 0 && (
        <motion.div variants={itemVariants}>
          <GlassCard>
            <SectionHeader
              title="Available Kubeconfig Contexts"
              subtitle="Contexts found in your kubeconfig file"
            />
            <div className="overflow-x-auto -mx-4 lg:-mx-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-slate-700/50">
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Context Name
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Cluster
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      User
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Namespace
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/50 dark:divide-slate-700/30">
                  {contexts.map((ctx, index) => (
                    <motion.tr
                      key={ctx.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {ctx.name}
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{ctx.cluster}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{ctx.user}</td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {ctx.namespace || 'default'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Add Cluster Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowAddModal(false)}
              />
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/20 dark:border-slate-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New Cluster</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </motion.button>
                </div>

                <form onSubmit={handleAddCluster} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cluster ID *
                    </label>
                    <input
                      type="text"
                      value={addForm.id}
                      onChange={(e) => setAddForm({ ...addForm, id: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all"
                      placeholder="my-cluster"
                      required
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Unique identifier for this cluster</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all"
                      placeholder="My Production Cluster"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kubeconfig Context
                    </label>
                    <select
                      value={addForm.context}
                      onChange={(e) => setAddForm({ ...addForm, context: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all"
                    >
                      <option value="">Select a context...</option>
                      {contexts.map((ctx) => (
                        <option key={ctx.name} value={ctx.name}>
                          {ctx.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[10px] text-gray-500">Select from available kubeconfig contexts</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kubeconfig Path
                    </label>
                    <input
                      type="text"
                      value={addForm.kubeconfig_path}
                      onChange={(e) => setAddForm({ ...addForm, kubeconfig_path: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200/50 dark:border-slate-600/50 rounded-xl bg-white/50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all"
                      placeholder="~/.kube/config"
                    />
                    <p className="mt-1 text-[10px] text-gray-500">Leave empty to use default kubeconfig</p>
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/50 dark:bg-slate-700/50 rounded-xl hover:bg-gray-200/50 dark:hover:bg-slate-600/50 transition-all"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading || !addForm.id || !addForm.name}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/25 transition-all"
                    >
                      {loading ? 'Adding...' : 'Add Cluster'}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
