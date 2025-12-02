import { useEffect, useState } from 'react';
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
import type { ClusterMetrics as ClusterMetricsType, PodMetrics, Namespace } from '../../types';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const colorClasses: Record<string, string> = {
    green: 'bg-success-500',
    yellow: 'bg-warning-500',
    red: 'bg-danger-500',
    blue: 'bg-primary-500',
  };

  const getColor = () => {
    if (percent >= 90) return colorClasses.red;
    if (percent >= 70) return colorClasses.yellow;
    return colorClasses[color] || colorClasses.green;
  };

  return (
    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-300 ${getColor()}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cluster Metrics</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 rounded-lg text-sm"
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns.name} value={ns.name}>
                {ns.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="card bg-warning-50 dark:bg-yellow-900/20 border-warning-200 dark:border-yellow-800">
          <p className="text-warning-700 dark:text-yellow-300">{error}</p>
          <p className="text-sm text-warning-600 dark:text-yellow-400 mt-2">
            Run: <code className="bg-warning-100 dark:bg-yellow-900/30 px-2 py-1 rounded">kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml</code>
          </p>
        </div>
      ) : (
        <>
          {/* Cluster Overview */}
          {clusterMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Card */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <CpuChipIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">CPU Usage</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cluster-wide</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{clusterMetrics.total_cpu_usage} / {clusterMetrics.total_cpu_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.cpu_percent} color="blue" />
                  <div className="text-right text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {clusterMetrics.cpu_percent}%
                  </div>
                </div>
              </div>

              {/* Memory Card */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-success-100 dark:bg-green-900/30 rounded-lg">
                    <CircleStackIcon className="h-6 w-6 text-success-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Memory Usage</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cluster-wide</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Usage</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{clusterMetrics.total_memory_usage} / {clusterMetrics.total_memory_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.memory_percent} color="green" />
                  <div className="text-right text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {clusterMetrics.memory_percent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          {topPodsByCpu.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Pods by CPU Chart */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Top Pods by CPU (millicores)
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPodsByCpu} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                      <XAxis type="number" stroke={chartTheme.text} fontSize={12} />
                      <YAxis dataKey="name" type="category" width={120} stroke={chartTheme.text} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.background,
                          border: `1px solid ${chartTheme.grid}`,
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: chartTheme.text }}
                        formatter={(value: number, name: string) => [
                          `${value}m`,
                          name === 'cpu' ? 'CPU' : 'Memory',
                        ]}
                      />
                      <Bar dataKey="cpu" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Pods by Memory Chart */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  Top Pods by Memory (Mi)
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topPodsByMemory} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                      <XAxis type="number" stroke={chartTheme.text} fontSize={12} />
                      <YAxis dataKey="name" type="category" width={120} stroke={chartTheme.text} fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: chartTheme.background,
                          border: `1px solid ${chartTheme.grid}`,
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: chartTheme.text }}
                        formatter={(value: number) => [`${Math.round(value)} Mi`, 'Memory']}
                      />
                      <Bar dataKey="memory" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Namespace Distribution */}
          {pieData.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                        backgroundColor: chartTheme.background,
                        border: `1px solid ${chartTheme.grid}`,
                        borderRadius: '8px',
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
                    <Legend
                      wrapperStyle={{ color: chartTheme.text }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Node Metrics */}
          {clusterMetrics?.nodes && clusterMetrics.nodes.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <ServerStackIcon className="h-5 w-5" />
                Node Resource Usage
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Node</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">CPU Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-32">CPU %</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Memory Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-32">Memory %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusterMetrics.nodes.map((node) => (
                      <tr key={node.name} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{node.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{node.cpu_usage}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar percent={node.cpu_percent} color="blue" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{node.cpu_percent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{node.memory_usage}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar percent={node.memory_percent} color="green" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{node.memory_percent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !clusterMetrics && podMetrics.length === 0 && (
            <div className="card text-center py-12">
              <CpuChipIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Metrics Available</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Metrics server may not be installed or accessible.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
