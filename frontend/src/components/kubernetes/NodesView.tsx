import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ServerIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  CpuChipIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import GlassCard from '../common/GlassCard';
import type { NodeInfo, NodeMetrics } from '../../types';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function StatusBadge({ status }: { status: string }) {
  const isReady = status === 'Ready';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
        isReady
          ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
          : 'bg-danger-500/10 text-danger-600 dark:text-danger-400 ring-danger-500/20'
      }`}
    >
      {isReady ? (
        <CheckCircleIcon className="h-3.5 w-3.5" />
      ) : (
        <XCircleIcon className="h-3.5 w-3.5" />
      )}
      {status}
    </span>
  );
}

function ProgressBar({ percent, color }: { percent: number; color: 'blue' | 'green' }) {
  const getGradient = () => {
    if (percent >= 90) return 'from-danger-400 to-danger-600';
    if (percent >= 70) return 'from-warning-400 to-warning-600';
    if (color === 'blue') return 'from-primary-400 to-primary-600';
    return 'from-success-400 to-success-600';
  };

  return (
    <div className="w-full bg-gray-200/50 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-2 rounded-full bg-gradient-to-r ${getGradient()} shadow-sm`}
      />
    </div>
  );
}

function NodeCard({ node, metrics }: { node: NodeInfo; metrics?: NodeMetrics }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassCard variant="hover">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/10 ring-1 ring-gray-500/20">
            <ServerIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{node.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <StatusBadge status={node.status} />
              {node.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-medium ring-1 ring-primary-500/20"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-gray-100/50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </motion.div>
        </motion.button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Internal IP</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{node.internal_ip || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Version</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{node.version}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Age</p>
          <p className="font-medium text-gray-900 dark:text-gray-100">{node.age}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Container Runtime</p>
          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{node.container_runtime}</p>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-500/10">
              <CpuChipIcon className="h-4 w-4 text-primary-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">CPU</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{metrics.cpu_percent}%</span>
              </div>
              <ProgressBar percent={metrics.cpu_percent} color="blue" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-500/10">
              <CircleStackIcon className="h-4 w-4 text-success-500" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600 dark:text-gray-400">Memory</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{metrics.memory_percent}%</span>
              </div>
              <ProgressBar percent={metrics.memory_percent} color="green" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-gray-100/50 dark:border-slate-700/50 space-y-4">
              {/* Capacity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capacity</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-600/50">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">CPU</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{node.capacity.cpu}</p>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-600/50">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Memory</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{node.capacity.memory}</p>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-600/50">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Pods</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{node.capacity.pods}</p>
                  </div>
                  <div className="bg-gray-50/50 dark:bg-slate-700/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-600/50">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Storage</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{node.capacity.storage || '-'}</p>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">System Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100/50 dark:border-slate-700/50">
                    <span className="text-gray-500 dark:text-gray-400">OS Image</span>
                    <span className="text-gray-900 dark:text-gray-100 text-right">{node.os_image}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100/50 dark:border-slate-700/50">
                    <span className="text-gray-500 dark:text-gray-400">Kernel Version</span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{node.kernel_version}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100/50 dark:border-slate-700/50">
                    <span className="text-gray-500 dark:text-gray-400">External IP</span>
                    <span className="text-gray-900 dark:text-gray-100 font-mono">{node.external_ip || 'None'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100/50 dark:border-slate-700/50">
                    <span className="text-gray-500 dark:text-gray-400">Container Runtime</span>
                    <span className="text-gray-900 dark:text-gray-100">{node.container_runtime}</span>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Conditions</h4>
                <div className="space-y-2">
                  {node.conditions.map((condition) => (
                    <div
                      key={condition.type}
                      className={`p-3 rounded-xl text-sm ring-1 ${
                        condition.status === 'True' && condition.type !== 'Ready'
                          ? 'bg-warning-500/5 ring-warning-500/20'
                          : condition.status === 'True'
                          ? 'bg-success-500/5 ring-success-500/20'
                          : 'bg-gray-50/50 dark:bg-slate-700/50 ring-gray-200/50 dark:ring-slate-600/50'
                      }`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{condition.type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          condition.status === 'True'
                            ? 'bg-success-500/10 text-success-600 dark:text-success-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {condition.status}
                        </span>
                      </div>
                      {condition.message && (
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">{condition.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Taints */}
              {node.taints.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Taints</h4>
                  <div className="flex flex-wrap gap-2">
                    {node.taints.map((taint, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-lg text-xs font-medium ring-1 ring-warning-500/20"
                      >
                        {taint.key}={taint.value}:{taint.effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Labels */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Labels</h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {Object.entries(node.labels).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100/50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-mono"
                    >
                      {key}={value}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

export default function NodesView() {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [metrics, setMetrics] = useState<NodeMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [nodesRes, metricsRes] = await Promise.all([
        kubernetesApi.getNodes().catch(() => ({ data: [] })),
        kubernetesApi.getNodeMetrics().catch(() => ({ data: [] })),
      ]);

      setNodes(nodesRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      console.error('Failed to fetch nodes:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMetricsForNode(nodeName: string): NodeMetrics | undefined {
    return metrics.find((m) => m.name === nodeName);
  }

  const readyNodes = nodes.filter((n) => n.status === 'Ready').length;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
            Cluster Nodes
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${
              readyNodes === nodes.length
                ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                : 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
            }`}>
              <CheckCircleIcon className="h-3.5 w-3.5" />
              {readyNodes}/{nodes.length} nodes ready
            </span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {/* Nodes list */}
      <AnimatePresence mode="wait">
        {loading && nodes.length === 0 ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="text-center py-12">
              <ArrowPathIcon className="h-8 w-8 text-primary-500 mx-auto animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 mt-4">Loading nodes...</p>
            </GlassCard>
          </motion.div>
        ) : nodes.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                <ServerIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Nodes Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Unable to connect to the Kubernetes cluster.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-4">
            {nodes.map((node, index) => (
              <motion.div
                key={node.name}
                variants={itemVariants}
                custom={index}
              >
                <NodeCard node={node} metrics={getMetricsForNode(node.name)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
