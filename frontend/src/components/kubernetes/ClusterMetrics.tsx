import { useEffect, useState } from 'react';
import {
  CpuChipIcon,
  CircleStackIcon,
  ServerStackIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import type { ClusterMetrics as ClusterMetricsType, PodMetrics, Namespace } from '../../types';

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
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full transition-all duration-300 ${getColor()}`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

export default function ClusterMetrics() {
  const [clusterMetrics, setClusterMetrics] = useState<ClusterMetricsType | null>(null);
  const [podMetrics, setPodMetrics] = useState<PodMetrics[]>([]);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  const sortedPodMetrics = [...podMetrics].sort((a, b) => {
    const cpuA = parseInt(a.total_cpu.replace('m', '')) || 0;
    const cpuB = parseInt(b.total_cpu.replace('m', '')) || 0;
    return cpuB - cpuA;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Cluster Metrics</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns.name} value={ns.name}>
                {ns.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
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
        <div className="card bg-warning-50 border-warning-200">
          <p className="text-warning-700">{error}</p>
          <p className="text-sm text-warning-600 mt-2">
            Run: <code className="bg-warning-100 px-2 py-1 rounded">kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml</code>
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
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <CpuChipIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">CPU Usage</h3>
                    <p className="text-sm text-gray-500">Cluster-wide</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage</span>
                    <span className="font-medium">{clusterMetrics.total_cpu_usage} / {clusterMetrics.total_cpu_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.cpu_percent} color="blue" />
                  <div className="text-right text-2xl font-bold text-gray-900">
                    {clusterMetrics.cpu_percent}%
                  </div>
                </div>
              </div>

              {/* Memory Card */}
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-success-100 rounded-lg">
                    <CircleStackIcon className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Memory Usage</h3>
                    <p className="text-sm text-gray-500">Cluster-wide</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usage</span>
                    <span className="font-medium">{clusterMetrics.total_memory_usage} / {clusterMetrics.total_memory_capacity}</span>
                  </div>
                  <ProgressBar percent={clusterMetrics.memory_percent} color="green" />
                  <div className="text-right text-2xl font-bold text-gray-900">
                    {clusterMetrics.memory_percent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Node Metrics */}
          {clusterMetrics?.nodes && clusterMetrics.nodes.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ServerStackIcon className="h-5 w-5" />
                Node Resource Usage
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Node</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">CPU Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-32">CPU %</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Memory Usage</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-32">Memory %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusterMetrics.nodes.map((node) => (
                      <tr key={node.name} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">{node.name}</td>
                        <td className="py-3 px-4 text-gray-600">{node.cpu_usage}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar percent={node.cpu_percent} color="blue" />
                            <span className="text-sm text-gray-600 w-12">{node.cpu_percent}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{node.memory_usage}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <ProgressBar percent={node.memory_percent} color="green" />
                            <span className="text-sm text-gray-600 w-12">{node.memory_percent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Pods by Resource Usage */}
          {sortedPodMetrics.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Top Pods by CPU Usage
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Pod</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Namespace</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">CPU</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Memory</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Containers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPodMetrics.slice(0, 20).map((pod) => (
                      <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs">{pod.name}</td>
                        <td className="py-3 px-4 text-gray-600">{pod.namespace}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm font-medium">
                            {pod.total_cpu}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-success-50 text-success-700 rounded text-sm font-medium">
                            {pod.total_memory}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{pod.containers.length}</td>
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
              <CpuChipIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No Metrics Available</h3>
              <p className="text-gray-500 mt-2">Metrics server may not be installed or accessible.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
