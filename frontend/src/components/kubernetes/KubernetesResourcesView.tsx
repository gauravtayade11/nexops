import { useEffect, useState } from 'react';
import {
  GlobeAltIcon,
  CircleStackIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  ServerStackIcon,
  CpuChipIcon,
  ClockIcon,
  CalendarIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  CubeIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import type {
  Namespace,
  K8sService,
  Ingress,
  ConfigMap,
  Secret,
  PVC,
  StatefulSet,
  DaemonSet,
  Job,
  CronJob,
  HPA,
  Deployment,
  Pod,
} from '../../types';

type CategoryType = 'workloads' | 'networking' | 'config' | 'storage' | 'scaling';
type WorkloadTab = 'deployments' | 'pods' | 'statefulsets' | 'daemonsets' | 'jobs' | 'cronjobs';
type NetworkTab = 'services' | 'ingresses';
type ConfigTab = 'configmaps' | 'secrets';

const categories: { id: CategoryType; label: string; icon: typeof CubeIcon }[] = [
  { id: 'workloads', label: 'Workloads', icon: CubeIcon },
  { id: 'networking', label: 'Networking', icon: GlobeAltIcon },
  { id: 'config', label: 'Config', icon: Cog6ToothIcon },
  { id: 'storage', label: 'Storage', icon: CircleStackIcon },
  { id: 'scaling', label: 'Scaling', icon: ArrowsPointingOutIcon },
];

const workloadTabs: { id: WorkloadTab; label: string; icon: typeof CubeIcon }[] = [
  { id: 'deployments', label: 'Deployments', icon: ServerStackIcon },
  { id: 'pods', label: 'Pods', icon: CubeIcon },
  { id: 'statefulsets', label: 'StatefulSets', icon: ServerStackIcon },
  { id: 'daemonsets', label: 'DaemonSets', icon: CpuChipIcon },
  { id: 'jobs', label: 'Jobs', icon: ClockIcon },
  { id: 'cronjobs', label: 'CronJobs', icon: CalendarIcon },
];

const networkTabs: { id: NetworkTab; label: string; icon: typeof GlobeAltIcon }[] = [
  { id: 'services', label: 'Services', icon: GlobeAltIcon },
  { id: 'ingresses', label: 'Ingresses', icon: GlobeAltIcon },
];

const configTabs: { id: ConfigTab; label: string; icon: typeof DocumentDuplicateIcon }[] = [
  { id: 'configmaps', label: 'ConfigMaps', icon: DocumentDuplicateIcon },
  { id: 'secrets', label: 'Secrets', icon: KeyIcon },
];

export default function KubernetesResourcesView() {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('workloads');
  const [activeWorkloadTab, setActiveWorkloadTab] = useState<WorkloadTab>('deployments');
  const [activeNetworkTab, setActiveNetworkTab] = useState<NetworkTab>('services');
  const [activeConfigTab, setActiveConfigTab] = useState<ConfigTab>('configmaps');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [loading, setLoading] = useState(true);

  // Workload states
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [pods, setPods] = useState<Pod[]>([]);
  const [statefulSets, setStatefulSets] = useState<StatefulSet[]>([]);
  const [daemonSets, setDaemonSets] = useState<DaemonSet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);

  // Network states
  const [services, setServices] = useState<K8sService[]>([]);
  const [ingresses, setIngresses] = useState<Ingress[]>([]);

  // Config states
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([]);
  const [secrets, setSecrets] = useState<Secret[]>([]);

  // Storage states
  const [pvcs, setPVCs] = useState<PVC[]>([]);

  // Scaling states
  const [hpas, setHPAs] = useState<HPA[]>([]);

  useEffect(() => {
    fetchNamespaces();
  }, []);

  useEffect(() => {
    fetchResourceData();
  }, [selectedNamespace, activeCategory, activeWorkloadTab, activeNetworkTab, activeConfigTab]);

  async function fetchNamespaces() {
    try {
      const res = await kubernetesApi.getNamespaces();
      setNamespaces(res.data);
    } catch (error) {
      console.error('Failed to fetch namespaces:', error);
    }
  }

  async function fetchResourceData() {
    setLoading(true);
    try {
      const ns = selectedNamespace || undefined;

      if (activeCategory === 'workloads') {
        switch (activeWorkloadTab) {
          case 'deployments':
            const depRes = await kubernetesApi.getDeployments(ns);
            setDeployments(depRes.data);
            break;
          case 'pods':
            const podRes = await kubernetesApi.getPods(ns);
            setPods(podRes.data);
            break;
          case 'statefulsets':
            const ssRes = await kubernetesApi.getStatefulSets(ns);
            setStatefulSets(ssRes.data);
            break;
          case 'daemonsets':
            const dsRes = await kubernetesApi.getDaemonSets(ns);
            setDaemonSets(dsRes.data);
            break;
          case 'jobs':
            const jobRes = await kubernetesApi.getJobs(ns);
            setJobs(jobRes.data);
            break;
          case 'cronjobs':
            const cjRes = await kubernetesApi.getCronJobs(ns);
            setCronJobs(cjRes.data);
            break;
        }
      } else if (activeCategory === 'networking') {
        switch (activeNetworkTab) {
          case 'services':
            const svcRes = await kubernetesApi.getServices(ns);
            setServices(svcRes.data);
            break;
          case 'ingresses':
            const ingRes = await kubernetesApi.getIngresses(ns);
            setIngresses(ingRes.data);
            break;
        }
      } else if (activeCategory === 'config') {
        switch (activeConfigTab) {
          case 'configmaps':
            const cmRes = await kubernetesApi.getConfigMaps(ns);
            setConfigMaps(cmRes.data);
            break;
          case 'secrets':
            const secRes = await kubernetesApi.getSecrets(ns);
            setSecrets(secRes.data);
            break;
        }
      } else if (activeCategory === 'storage') {
        const pvcRes = await kubernetesApi.getPVCs(ns);
        setPVCs(pvcRes.data);
      } else if (activeCategory === 'scaling') {
        const hpaRes = await kubernetesApi.getHPAs(ns);
        setHPAs(hpaRes.data);
      }
    } catch (error) {
      console.error(`Failed to fetch resources:`, error);
    } finally {
      setLoading(false);
    }
  }

  function renderSubTabs() {
    if (activeCategory === 'workloads') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          {workloadTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveWorkloadTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeWorkloadTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (activeCategory === 'networking') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          {networkTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveNetworkTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeNetworkTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      );
    }

    if (activeCategory === 'config') {
      return (
        <div className="flex flex-wrap gap-2 mb-4">
          {configTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveConfigTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeConfigTab === tab.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      );
    }

    return null;
  }

  function renderContent() {
    if (loading) {
      return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    if (activeCategory === 'workloads') {
      switch (activeWorkloadTab) {
        case 'deployments':
          return <DeploymentsTable data={deployments} />;
        case 'pods':
          return <PodsTable data={pods} />;
        case 'statefulsets':
          return <StatefulSetsTable data={statefulSets} />;
        case 'daemonsets':
          return <DaemonSetsTable data={daemonSets} />;
        case 'jobs':
          return <JobsTable data={jobs} />;
        case 'cronjobs':
          return <CronJobsTable data={cronJobs} />;
      }
    }

    if (activeCategory === 'networking') {
      switch (activeNetworkTab) {
        case 'services':
          return <ServicesTable data={services} />;
        case 'ingresses':
          return <IngressesTable data={ingresses} />;
      }
    }

    if (activeCategory === 'config') {
      switch (activeConfigTab) {
        case 'configmaps':
          return <ConfigMapsTable data={configMaps} />;
        case 'secrets':
          return <SecretsTable data={secrets} />;
      }
    }

    if (activeCategory === 'storage') {
      return <PVCsTable data={pvcs} />;
    }

    if (activeCategory === 'scaling') {
      return <HPAsTable data={hpas} />;
    }

    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kubernetes Resources</h1>
        <div className="flex gap-3">
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns.name} value={ns.name}>
                {ns.name}
              </option>
            ))}
          </select>
          <button onClick={fetchResourceData} className="btn-secondary flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-slate-700 gap-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeCategory === cat.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Card */}
      <div className="card">
        {/* Sub-tabs */}
        {renderSubTabs()}

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
}

// Table Components
function DeploymentsTable({ data }: { data: Deployment[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No deployments found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ready</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Image</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((dep) => (
            <tr key={`${dep.namespace}-${dep.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{dep.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{dep.namespace}</td>
              <td className="py-3 px-4">
                <span className={dep.ready_replicas === dep.replicas ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'}>
                  {dep.ready_replicas}/{dep.replicas}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">{dep.image?.split('/').pop() || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{dep.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PodsTable({ data }: { data: Pod[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No pods found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Restarts</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Node</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pod) => (
            <tr key={`${pod.namespace}-${pod.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{pod.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pod.namespace}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pod.status === 'Running'
                      ? 'bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400'
                      : pod.status === 'Pending'
                      ? 'bg-warning-50 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400'
                      : 'bg-danger-50 dark:bg-danger-500/20 text-danger-600 dark:text-danger-400'
                  }`}
                >
                  {pod.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pod.restarts}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{pod.node || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pod.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ServicesTable({ data }: { data: K8sService[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No services found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cluster IP</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">External IP</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ports</th>
          </tr>
        </thead>
        <tbody>
          {data.map((svc) => (
            <tr key={`${svc.namespace}-${svc.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{svc.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{svc.namespace}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  {svc.type}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{svc.cluster_ip || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{svc.external_ip || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                {svc.ports.map((p, i) => (
                  <span key={i} className="mr-2">
                    {p.port}:{p.targetPort}/{p.protocol}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngressesTable({ data }: { data: Ingress[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No ingresses found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Class</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Hosts</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Address</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ing) => (
            <tr key={`${ing.namespace}-${ing.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ing.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ing.namespace}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ing.class_name || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{ing.hosts.join(', ') || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{ing.address || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ing.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigMapsTable({ data }: { data: ConfigMap[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No configmaps found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Data Keys</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cm) => (
            <tr key={`${cm.namespace}-${cm.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{cm.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cm.namespace}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{cm.data_count} keys</span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cm.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecretsTable({ data }: { data: Secret[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No secrets found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Data</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((sec) => (
            <tr key={`${sec.namespace}-${sec.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{sec.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{sec.namespace}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  {sec.type}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">{sec.data_count} keys</span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{sec.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PVCsTable({ data }: { data: PVC[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No PVCs found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Capacity</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Access Modes</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Storage Class</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((pvc) => (
            <tr key={`${pvc.namespace}-${pvc.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{pvc.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pvc.namespace}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pvc.status === 'Bound' ? 'bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400' : 'bg-warning-50 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400'
                }`}>
                  {pvc.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pvc.capacity || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{pvc.access_modes.join(', ')}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pvc.storage_class || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pvc.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatefulSetsTable({ data }: { data: StatefulSet[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No statefulsets found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ready</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Image</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ss) => (
            <tr key={`${ss.namespace}-${ss.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ss.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ss.namespace}</td>
              <td className="py-3 px-4">
                <span className={ss.ready_replicas === ss.replicas ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'}>
                  {ss.ready_replicas}/{ss.replicas}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">{ss.image?.split('/').pop() || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ss.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DaemonSetsTable({ data }: { data: DaemonSet[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No daemonsets found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Desired</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ready</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Available</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Image</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ds) => (
            <tr key={`${ds.namespace}-${ds.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ds.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.namespace}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.desired}</td>
              <td className="py-3 px-4">
                <span className={ds.ready === ds.desired ? 'text-success-600 dark:text-success-400' : 'text-warning-600 dark:text-warning-400'}>
                  {ds.ready}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.available}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">{ds.image?.split('/').pop() || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsTable({ data }: { data: Job[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No jobs found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Completions</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Succeeded</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Failed</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((job) => (
            <tr key={`${job.namespace}-${job.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{job.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{job.namespace}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{job.completions ?? '-'}</td>
              <td className="py-3 px-4 text-success-600 dark:text-success-400">{job.succeeded}</td>
              <td className="py-3 px-4 text-danger-600 dark:text-danger-400">{job.failed}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{job.duration || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{job.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CronJobsTable({ data }: { data: CronJob[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No cronjobs found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Schedule</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Suspend</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Active</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Schedule</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((cj) => (
            <tr key={`${cj.namespace}-${cj.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{cj.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cj.namespace}</td>
              <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">{cj.schedule}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cj.suspend ? 'bg-warning-50 dark:bg-warning-500/20 text-warning-600 dark:text-warning-400' : 'bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400'
                }`}>
                  {cj.suspend ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cj.active}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">{cj.last_schedule || '-'}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cj.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HPAsTable({ data }: { data: HPA[] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No HPAs found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Namespace</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Reference</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Min/Max</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Replicas</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">CPU</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Age</th>
          </tr>
        </thead>
        <tbody>
          {data.map((hpa) => (
            <tr key={`${hpa.namespace}-${hpa.name}`} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{hpa.name}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{hpa.namespace}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{hpa.reference}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{hpa.min_replicas}/{hpa.max_replicas}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{hpa.current_replicas}</td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                {hpa.current_cpu || '-'} / {hpa.target_cpu || '-'}
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{hpa.age}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
