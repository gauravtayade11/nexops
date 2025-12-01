import { useEffect, useState } from 'react';
import {
  ServerIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CpuChipIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import type { NodeInfo, NodeMetrics } from '../../types';

function StatusBadge({ status }: { status: string }) {
  const isReady = status === 'Ready';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isReady ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
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

function NodeCard({ node, metrics }: { node: NodeInfo; metrics?: NodeMetrics }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-lg">
            <ServerIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{node.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={node.status} />
              {node.roles.map((role) => (
                <span
                  key={role}
                  className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded text-xs"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          {expanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500">Internal IP</p>
          <p className="font-medium text-gray-900">{node.internal_ip || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Version</p>
          <p className="font-medium text-gray-900">{node.version}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Age</p>
          <p className="font-medium text-gray-900">{node.age}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Container Runtime</p>
          <p className="font-medium text-gray-900 truncate">{node.container_runtime}</p>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <CpuChipIcon className="h-5 w-5 text-primary-500" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">CPU</span>
                <span className="font-medium">{metrics.cpu_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.cpu_percent >= 90
                      ? 'bg-danger-500'
                      : metrics.cpu_percent >= 70
                      ? 'bg-warning-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${Math.min(metrics.cpu_percent, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CircleStackIcon className="h-5 w-5 text-success-500" />
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Memory</span>
                <span className="font-medium">{metrics.memory_percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metrics.memory_percent >= 90
                      ? 'bg-danger-500'
                      : metrics.memory_percent >= 70
                      ? 'bg-warning-500'
                      : 'bg-success-500'
                  }`}
                  style={{ width: `${Math.min(metrics.memory_percent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Capacity */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Capacity</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">CPU</p>
                <p className="font-medium text-gray-900">{node.capacity.cpu}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Memory</p>
                <p className="font-medium text-gray-900">{node.capacity.memory}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Pods</p>
                <p className="font-medium text-gray-900">{node.capacity.pods}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Storage</p>
                <p className="font-medium text-gray-900">{node.capacity.storage || '-'}</p>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">System Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">OS Image</span>
                <span className="text-gray-900">{node.os_image}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Kernel Version</span>
                <span className="text-gray-900">{node.kernel_version}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">External IP</span>
                <span className="text-gray-900">{node.external_ip || 'None'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Container Runtime</span>
                <span className="text-gray-900">{node.container_runtime}</span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
            <div className="space-y-2">
              {node.conditions.map((condition) => (
                <div
                  key={condition.type}
                  className={`p-3 rounded-lg text-sm ${
                    condition.status === 'True' && condition.type !== 'Ready'
                      ? 'bg-warning-50 border border-warning-200'
                      : condition.status === 'True'
                      ? 'bg-success-50 border border-success-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{condition.type}</span>
                    <span>{condition.status}</span>
                  </div>
                  {condition.message && (
                    <p className="text-gray-600 mt-1 text-xs">{condition.message}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Taints */}
          {node.taints.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Taints</h4>
              <div className="flex flex-wrap gap-2">
                {node.taints.map((taint, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-warning-50 text-warning-700 rounded text-xs"
                  >
                    {taint.key}={taint.value}:{taint.effect}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Labels</h4>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {Object.entries(node.labels).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {key}={value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nodes</h1>
          <p className="text-gray-500 mt-1">
            {readyNodes}/{nodes.length} nodes ready
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Nodes list */}
      {loading && nodes.length === 0 ? (
        <div className="card text-center py-12">
          <ArrowPathIcon className="h-8 w-8 text-gray-400 mx-auto animate-spin" />
          <p className="text-gray-500 mt-2">Loading nodes...</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="card text-center py-12">
          <ServerIcon className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900 mt-4">No Nodes Found</h3>
          <p className="text-gray-500 mt-2">Unable to connect to the Kubernetes cluster.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {nodes.map((node) => (
            <NodeCard key={node.name} node={node} metrics={getMetricsForNode(node.name)} />
          ))}
        </div>
      )}
    </div>
  );
}
