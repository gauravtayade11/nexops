import { useEffect, useState } from 'react';
import {
  ServerStackIcon,
  CubeIcon,
  ArrowPathIcon,
  ArrowsUpDownIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CommandLineIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import type { Namespace, Pod, Deployment, K8sEvent, ClusterHealth } from '../../types';
import PodLogsViewer from '../kubernetes/PodLogsViewer';
import PodExecTerminal from '../kubernetes/PodExecTerminal';

type TabType = 'pods' | 'deployments' | 'events';

export default function KubernetesView() {
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [events, setEvents] = useState<K8sEvent[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPodForLogs, setSelectedPodForLogs] = useState<Pod | null>(null);
  const [selectedPodForExec, setSelectedPodForExec] = useState<Pod | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pods');

  useEffect(() => {
    fetchData();
  }, [selectedNamespace]);

  async function fetchData() {
    setLoading(true);
    try {
      const [healthRes, nsRes, podsRes, depsRes, eventsRes] = await Promise.all([
        kubernetesApi.getHealth().catch(() => null),
        kubernetesApi.getNamespaces().catch(() => ({ data: [] })),
        kubernetesApi.getPods(selectedNamespace || undefined).catch(() => ({ data: [] })),
        kubernetesApi.getDeployments(selectedNamespace || undefined).catch(() => ({ data: [] })),
        kubernetesApi.getEvents(selectedNamespace || undefined, 50).catch(() => ({ data: [] })),
      ]);

      if (healthRes?.data) setHealth(healthRes.data);
      setNamespaces(nsRes.data);
      setPods(podsRes.data);
      setDeployments(depsRes.data);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Failed to fetch K8s data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleScale(namespace: string, deployment: string, replicas: number) {
    setActionLoading(`scale-${deployment}`);
    try {
      await kubernetesApi.scale(namespace, deployment, replicas);
      await fetchData();
    } catch (error) {
      console.error('Scale failed:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestart(namespace: string, deployment: string) {
    setActionLoading(`restart-${deployment}`);
    try {
      await kubernetesApi.restart(namespace, deployment);
      await fetchData();
    } catch (error) {
      console.error('Restart failed:', error);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Kubernetes Cluster</h1>
        <div className="flex gap-3">
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
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Cluster Health Summary */}
      {health && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Status</p>
            <p className={`text-lg font-bold ${health.healthy ? 'text-success-600' : 'text-danger-600'}`}>
              {health.healthy ? 'Healthy' : 'Degraded'}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Nodes</p>
            <p className="text-lg font-bold text-gray-900">
              {health.ready_nodes}/{health.node_count}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Pods</p>
            <p className="text-lg font-bold text-gray-900">
              {health.running_pods}/{health.total_pods}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Namespaces</p>
            <p className="text-lg font-bold text-gray-900">{health.namespaces}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Warnings</p>
            <p className={`text-lg font-bold ${health.warnings.length > 0 ? 'text-warning-600' : 'text-gray-900'}`}>
              {health.warnings.length}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('pods')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pods'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CubeIcon className="h-4 w-4" />
            Pods ({pods.length})
          </button>
          <button
            onClick={() => setActiveTab('deployments')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'deployments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ServerStackIcon className="h-4 w-4" />
            Deployments ({deployments.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
            Events ({events.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Pods Tab */}
            {activeTab === 'pods' && (
              pods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pods found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Namespace</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Restarts</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Node</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Age</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pods.map((pod) => (
                        <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900 truncate max-w-xs">{pod.name}</td>
                          <td className="py-3 px-4 text-gray-600">{pod.namespace}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                pod.status === 'Running'
                                  ? 'bg-success-50 text-success-600'
                                  : pod.status === 'Pending'
                                  ? 'bg-warning-50 text-warning-600'
                                  : 'bg-danger-50 text-danger-600'
                              }`}
                            >
                              {pod.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{pod.restarts}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{pod.node || '-'}</td>
                          <td className="py-3 px-4 text-gray-600">{pod.age}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => setSelectedPodForLogs(pod)}
                                className="p-1 text-gray-400 hover:text-primary-600"
                                title="View Logs"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelectedPodForExec(pod)}
                                disabled={pod.status !== 'Running'}
                                className={`p-1 ${
                                  pod.status === 'Running'
                                    ? 'text-gray-400 hover:text-green-600'
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                                title={pod.status === 'Running' ? 'Exec Terminal' : `Cannot exec: Pod is ${pod.status}`}
                              >
                                <CommandLineIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Deployments Tab */}
            {activeTab === 'deployments' && (
              deployments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No deployments found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Namespace</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Replicas</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Image</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Age</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deployments.map((dep) => (
                        <tr key={`${dep.namespace}-${dep.name}`} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{dep.name}</td>
                          <td className="py-3 px-4 text-gray-600">{dep.namespace}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`${
                                dep.ready_replicas === dep.replicas ? 'text-success-600' : 'text-warning-600'
                              }`}
                            >
                              {dep.ready_replicas}/{dep.replicas}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm truncate max-w-xs">
                            {dep.image?.split('/').pop() || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-600">{dep.age}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleScale(dep.namespace, dep.name, dep.replicas + 1)}
                                disabled={actionLoading === `scale-${dep.name}`}
                                className="p-1 text-gray-400 hover:text-primary-600"
                                title="Scale Up"
                              >
                                <ArrowsUpDownIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRestart(dep.namespace, dep.name)}
                                disabled={actionLoading === `restart-${dep.name}`}
                                className="p-1 text-gray-400 hover:text-primary-600"
                                title="Restart"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent events</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {events.map((event, index) => (
                    <div
                      key={`${event.name}-${index}`}
                      className={`p-3 rounded-lg border ${
                        event.type === 'Warning'
                          ? 'border-warning-200 bg-warning-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{event.reason}</p>
                          <p className="text-sm text-gray-600 mt-1">{event.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {event.involved_object.kind}/{event.involved_object.name} in {event.namespace}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">x{event.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Pod Logs Modal */}
      {selectedPodForLogs && (
        <PodLogsViewer
          pod={selectedPodForLogs}
          onClose={() => setSelectedPodForLogs(null)}
        />
      )}

      {/* Pod Exec Terminal Modal */}
      {selectedPodForExec && (
        <PodExecTerminal
          pod={selectedPodForExec}
          onClose={() => setSelectedPodForExec(null)}
        />
      )}
    </div>
  );
}
