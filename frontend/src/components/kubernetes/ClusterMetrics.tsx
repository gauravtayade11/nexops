import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { kubernetesApi } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import GlassCard from '../common/GlassCard';
import type { ClusterMetrics as ClusterMetricsType, PodMetrics, Namespace } from '../../types';

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

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03 },
  }),
};

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const getGradient = () => {
    if (percent >= 90) return 'from-danger-400 to-danger-600';
    if (percent >= 70) return 'from-warning-400 to-warning-600';
    if (color === 'blue') return 'from-primary-400 to-primary-600';
    return 'from-success-400 to-success-600';
  };

  return (
    <div className="w-full bg-gray-200/50 dark:bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percent, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-2.5 rounded-full bg-gradient-to-r ${getGradient()} shadow-sm`}
      />
    </div>
  );
}

function parseMemoryToMi(mem: string): number {
  if (!mem) return 0;
  const value = parseInt(mem);
  if (mem.includes('Gi')) return value * 1024;
  if (mem.includes('Mi')) return value;
  if (mem.includes('Ki')) return value / 1024;
  return value / (1024 * 1024);
}

function parseCpuToMillicores(cpu: string): number {
  if (!cpu) return 0;
  return parseInt(cpu.replace('m', '')) || 0;
}

export default function ClusterMetrics() {
  const [clusterMetrics, setClusterMetrics] = useState<ClusterMetricsType | null>(null);
  const [podMetrics, setPodMetrics] = useState<PodMetrics[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchData();
  }, [selectedNamespace]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedNamespace]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, podMetricsRes, nsRes] = await Promise.all([
        kubernetesApi.getClusterMetrics().catch(() => null),
        kubernetesApi.getPodMetrics(selectedNamespace || undefined).catch(() => ({ data: [] })),
        kubernetesApi.getNamespaces().catch(() => ({ data: [] })),
      ]);

      if (metricsRes?.data) setClusterMetrics(metricsRes.data);
      setPodMetrics(podMetricsRes.data);
      setNamespaces(nsRes.data);
    } catch (err) {
      setError('Failed to fetch metrics. Ensure metrics-server is installed.');
    } finally {
      setLoading(false);
    }
  }

  // Prepare data for charts
  const topPodsByCpu = [...podMetrics]
    .sort((a, b) => parseCpuToMillicores(b.total_cpu) - parseCpuToMillicores(a.total_cpu))
    .slice(0, 10)
    .map(pod => ({
      name: pod.name.length > 20 ? pod.name.substring(0, 20) + '...' : pod.name,
      fullName: pod.name,
      cpu: parseCpuToMillicores(pod.total_cpu),
      memory: parseMemoryToMi(pod.total_memory),
      namespace: pod.namespace,
    }));

  const topPodsByMemory = [...podMetrics]
    .sort((a, b) => parseMemoryToMi(b.total_memory) - parseMemoryToMi(a.total_memory))
    .slice(0, 10)
    .map(pod => ({
      name: pod.name.length > 20 ? pod.name.substring(0, 20) + '...' : pod.name,
      fullName: pod.name,
      cpu: parseCpuToMillicores(pod.total_cpu),
      memory: parseMemoryToMi(pod.total_memory),
      namespace: pod.namespace,
    }));

  // Namespace resource distribution
  const namespaceDistribution = podMetrics.reduce((acc, pod) => {
    if (!acc[pod.namespace]) {
      acc[pod.namespace] = { cpu: 0, memory: 0, count: 0 };
    }
    acc[pod.namespace].cpu += parseCpuToMillicores(pod.total_cpu);
    acc[pod.namespace].memory += parseMemoryToMi(pod.total_memory);
    acc[pod.namespace].count += 1;
    return acc;
  }, {} as Record<string, { cpu: number; memory: number; count: number }>);

  const pieData = Object.entries(namespaceDistribution)
    .map(([name, data]) => ({
      name,
      value: data.cpu,
      memory: data.memory,
      pods: data.count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const chartTheme = {
    text: isDark ? '#94a3b8' : '#6b7280',
    grid: isDark ? '#334155' : '#e5e7eb',
    background: isDark ? '#1e293b' : '#ffffff',
  };

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
            Cluster Metrics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time resource monitoring and analytics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-200/50 dark:border-slate-600/50 rounded-xl text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
            >
              <option value="">All Namespaces</option>
              {namespaces.map((ns) => (
                <option key={ns.name} value={ns.name}>
                  {ns.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-600/50 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-500 text-primary-500 focus:ring-primary-500"
            />
            Auto-refresh
          </label>
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
        </div>
      </motion.div>

      {error ? (
        <motion.div variants={itemVariants}>
          <GlassCard className="bg-gradient-to-r from-warning-50/80 to-warning-100/50 dark:from-warning-500/10 dark:to-warning-600/5 border-warning-200/50 dark:border-warning-500/20">
            <p className="text-warning-700 dark:text-warning-300 font-medium">{error}</p>
            <p className="text-sm text-warning-600 dark:text-warning-400 mt-2">
              Run: <code className="bg-warning-100/80 dark:bg-warning-900/30 px-2 py-1 rounded-lg font-mono text-xs">kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml</code>
            </p>
          </GlassCard>
        </motion.div>
      ) : (
        <>
          {/* Cluster Overview */}
          {clusterMetrics && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Card */}
              <GlassCard variant="hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 ring-1 ring-primary-500/20">
                    <CpuChipIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">CPU Usage</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cluster-wide resource</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">{clusterMetrics.total_cpu_usage} / {clusterMetrics.total_cpu_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.cpu_percent} color="blue" />
                  <div className="text-right">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                      {clusterMetrics.cpu_percent}%
                    </span>
                  </div>
                </div>
              </GlassCard>

              {/* Memory Card */}
              <GlassCard variant="hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-success-500/10 to-success-600/10 ring-1 ring-success-500/20">
                    <CircleStackIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Memory Usage</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cluster-wide resource</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100 font-mono">{clusterMetrics.total_memory_usage} / {clusterMetrics.total_memory_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.memory_percent} color="green" />
                  <div className="text-right">
                    <span className="text-3xl font-bold bg-gradient-to-r from-success-500 to-success-600 bg-clip-text text-transparent">
                      {clusterMetrics.memory_percent}%
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Charts Row */}
          {topPodsByCpu.length > 0 && (
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pods by CPU Chart */}
              <GlassCard variant="hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-primary-500/10">
                    <ChartBarIcon className="h-5 w-5 text-primary-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Top Pods by CPU (millicores)
                  </h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPodsByCpu} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.5} />
                      <XAxis type="number" stroke={chartTheme.text} fontSize={12} />
                      <YAxis dataKey="name" type="category" width={120} stroke={chartTheme.text} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                        labelStyle={{ color: chartTheme.text }}
                        formatter={(value: number, name: string) => [
                          `${value}m`,
                          name === 'cpu' ? 'CPU' : 'Memory',
                        ]}
                      />
                      <Bar dataKey="cpu" fill="url(#cpuGradient)" radius={[0, 6, 6, 0]} />
                      <defs>
                        <linearGradient id="cpuGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Top Pods by Memory Chart */}
              <GlassCard variant="hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-success-500/10">
                    <ChartBarIcon className="h-5 w-5 text-success-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Top Pods by Memory (Mi)
                  </h2>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPodsByMemory} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.5} />
                      <XAxis type="number" stroke={chartTheme.text} fontSize={12} />
                      <YAxis dataKey="name" type="category" width={120} stroke={chartTheme.text} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                        labelStyle={{ color: chartTheme.text }}
                        formatter={(value: number) => [`${Math.round(value)} Mi`, 'Memory']}
                      />
                      <Bar dataKey="memory" fill="url(#memGradient)" radius={[0, 6, 6, 0]} />
                      <defs>
                        <linearGradient id="memGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#16a34a" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Namespace Distribution */}
          {pieData.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard variant="hover">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Resource Distribution by Namespace (CPU)
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                        formatter={(value: number, _name: string, entry) => {
                          const data = entry.payload;
                          return [
                            <div key="tooltip" className="space-y-1">
                              <div>CPU: {value}m</div>
                              <div>Memory: {Math.round(data.memory)} Mi</div>
                              <div>Pods: {data.pods}</div>
                            </div>,
                            data.name,
                          ];
                        }}
                      />
                      <Legend wrapperStyle={{ color: chartTheme.text }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Node Metrics */}
          {clusterMetrics?.nodes && clusterMetrics.nodes.length > 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard variant="hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-gray-500/10">
                    <ServerStackIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Node Resource Usage
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Node</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">CPU Usage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-40">CPU %</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-40">Memory %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusterMetrics.nodes.map((node, index) => (
                        <motion.tr
                          key={node.name}
                          custom={index}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{node.name}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{node.cpu_usage}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <ProgressBar percent={node.cpu_percent} color="blue" />
                              </div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">{node.cpu_percent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{node.memory_usage}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <ProgressBar percent={node.memory_percent} color="green" />
                              </div>
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">{node.memory_percent}%</span>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !clusterMetrics && podMetrics.length === 0 && (
            <motion.div variants={itemVariants}>
              <GlassCard className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <CpuChipIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Metrics Available</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Metrics server may not be installed or accessible.</p>
              </GlassCard>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
