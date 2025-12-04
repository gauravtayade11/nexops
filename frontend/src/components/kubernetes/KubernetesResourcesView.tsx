import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MagnifyingGlassIcon,
  PlayIcon,
  StopIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ScaleIcon,
  TrashIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  CodeBracketIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import GlassCard from '../common/GlassCard';
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
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Get current resource count based on active category and sub-tab
  function getCurrentResourceCount(): number {
    if (activeCategory === 'workloads') {
      switch (activeWorkloadTab) {
        case 'deployments': return deployments.length;
        case 'pods': return pods.length;
        case 'statefulsets': return statefulSets.length;
        case 'daemonsets': return daemonSets.length;
        case 'jobs': return jobs.length;
        case 'cronjobs': return cronJobs.length;
      }
    } else if (activeCategory === 'networking') {
      switch (activeNetworkTab) {
        case 'services': return services.length;
        case 'ingresses': return ingresses.length;
      }
    } else if (activeCategory === 'config') {
      switch (activeConfigTab) {
        case 'configmaps': return configMaps.length;
        case 'secrets': return secrets.length;
      }
    } else if (activeCategory === 'storage') {
      return pvcs.length;
    } else if (activeCategory === 'scaling') {
      return hpas.length;
    }
    return 0;
  }

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
          case 'deployments': {
            const depRes = await kubernetesApi.getDeployments(ns);
            setDeployments(depRes.data);
            break;
          }
          case 'pods': {
            const podRes = await kubernetesApi.getPods(ns);
            setPods(podRes.data);
            break;
          }
          case 'statefulsets': {
            const ssRes = await kubernetesApi.getStatefulSets(ns);
            setStatefulSets(ssRes.data);
            break;
          }
          case 'daemonsets': {
            const dsRes = await kubernetesApi.getDaemonSets(ns);
            setDaemonSets(dsRes.data);
            break;
          }
          case 'jobs': {
            const jobRes = await kubernetesApi.getJobs(ns);
            setJobs(jobRes.data);
            break;
          }
          case 'cronjobs': {
            const cjRes = await kubernetesApi.getCronJobs(ns);
            setCronJobs(cjRes.data);
            break;
          }
        }
      } else if (activeCategory === 'networking') {
        switch (activeNetworkTab) {
          case 'services': {
            const svcRes = await kubernetesApi.getServices(ns);
            setServices(svcRes.data);
            break;
          }
          case 'ingresses': {
            const ingRes = await kubernetesApi.getIngresses(ns);
            setIngresses(ingRes.data);
            break;
          }
        }
      } else if (activeCategory === 'config') {
        switch (activeConfigTab) {
          case 'configmaps': {
            const cmRes = await kubernetesApi.getConfigMaps(ns);
            setConfigMaps(cmRes.data);
            break;
          }
          case 'secrets': {
            const secRes = await kubernetesApi.getSecrets(ns);
            setSecrets(secRes.data);
            break;
          }
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
    const renderTabGroup = (
      tabs: { id: string; label: string; icon: typeof CubeIcon }[],
      activeTab: string,
      setActiveTab: (id: string) => void
    ) => (
      <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-100/50 dark:border-slate-700/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary-100/80 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium ring-1 ring-primary-200 dark:ring-primary-800'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </motion.button>
          );
        })}
      </div>
    );

    if (activeCategory === 'workloads') {
      return renderTabGroup(workloadTabs, activeWorkloadTab, (id) => setActiveWorkloadTab(id as WorkloadTab));
    }

    if (activeCategory === 'networking') {
      return renderTabGroup(networkTabs, activeNetworkTab, (id) => setActiveNetworkTab(id as NetworkTab));
    }

    if (activeCategory === 'config') {
      return renderTabGroup(configTabs, activeConfigTab, (id) => setActiveConfigTab(id as ConfigTab));
    }

    return null;
  }

  function renderContent() {
    if (loading) {
      return <TableSkeleton />;
    }

    if (activeCategory === 'workloads') {
      switch (activeWorkloadTab) {
        case 'deployments':
          return <DeploymentsTable data={deployments} searchQuery={searchQuery} onRefresh={fetchResourceData} />;
        case 'pods':
          return <PodsTable data={pods} searchQuery={searchQuery} />;
        case 'statefulsets':
          return <StatefulSetsTable data={statefulSets} searchQuery={searchQuery} />;
        case 'daemonsets':
          return <DaemonSetsTable data={daemonSets} searchQuery={searchQuery} />;
        case 'jobs':
          return <JobsTable data={jobs} searchQuery={searchQuery} />;
        case 'cronjobs':
          return <CronJobsTable data={cronJobs} searchQuery={searchQuery} />;
      }
    }

    if (activeCategory === 'networking') {
      switch (activeNetworkTab) {
        case 'services':
          return <ServicesTable data={services} searchQuery={searchQuery} />;
        case 'ingresses':
          return <IngressesTable data={ingresses} searchQuery={searchQuery} />;
      }
    }

    if (activeCategory === 'config') {
      switch (activeConfigTab) {
        case 'configmaps':
          return <ConfigMapsTable data={configMaps} searchQuery={searchQuery} />;
        case 'secrets':
          return <SecretsTable data={secrets} searchQuery={searchQuery} />;
      }
    }

    if (activeCategory === 'storage') {
      return <PVCsTable data={pvcs} searchQuery={searchQuery} />;
    }

    if (activeCategory === 'scaling') {
      return <HPAsTable data={hpas} searchQuery={searchQuery} />;
    }

    return null;
  }

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
            Kubernetes Resources
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and monitor cluster resources
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="pl-10 pr-4 py-2.5 w-64 border border-gray-200/50 dark:border-slate-600/50 rounded-xl text-sm bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchResourceData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Category Tabs with Resource Count Badges */}
      <motion.div variants={itemVariants}>
        <GlassCard className="p-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const count = isActive ? getCurrentResourceCount() : 0;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {cat.label}
                  {isActive && count > 0 && !loading && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-white/20 text-white">
                      {count}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>

      {/* Content Card */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="hover">
          {/* Sub-tabs */}
          {renderSubTabs()}

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${activeWorkloadTab}-${activeNetworkTab}-${activeConfigTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// Table Skeleton Component
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Table Header Skeleton */}
      <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-100 dark:border-slate-700">
        <div className="w-8 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="w-32 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="w-24 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="w-16 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
        <div className="flex-1" />
        <div className="w-20 h-4 bg-gray-200 dark:bg-slate-600 rounded" />
      </div>
      {/* Table Rows Skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 py-4 px-4 border-b border-gray-50 dark:border-slate-700/50"
        >
          <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/4" />
          </div>
          <div className="w-16 h-6 bg-gray-200 dark:bg-slate-600 rounded-full" />
          <div className="w-24 h-4 bg-gray-100 dark:bg-slate-700 rounded" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-lg" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Empty State Component with Enhanced Visuals
function EmptyState({ icon: Icon, title }: { icon: typeof CubeIcon; title: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg shadow-gray-200/50 dark:shadow-slate-900/50"
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Icon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
      </motion.div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        No resources match your current filters. Try adjusting your search or namespace selection.
      </p>
    </motion.div>
  );
}

// Status Filter Component
type StatusFilterOption = { value: string; label: string; color: string };

function StatusFilter({
  options,
  selected,
  onChange
}: {
  options: StatusFilterOption[];
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <FunnelIcon className="h-4 w-4 text-gray-400" />
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter:</span>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              selected === option.value
                ? `${option.color} ring-1 ring-current`
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sortable Header Component
type SortDirection = 'asc' | 'desc' | null;
type SortConfig<T> = { key: keyof T | null; direction: SortDirection };

function SortableHeader<T>({
  label,
  sortKey,
  sortConfig,
  onSort,
  className = ''
}: {
  label: string;
  sortKey: keyof T;
  sortConfig: SortConfig<T>;
  onSort: (key: keyof T) => void;
  className?: string;
}) {
  const isActive = sortConfig.key === sortKey;

  return (
    <th
      className={`text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ChevronUpDownIcon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary-500' : 'text-gray-300 dark:text-gray-600'}`} />
        {isActive && sortConfig.direction && (
          <span className="text-xs text-primary-500">
            {sortConfig.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

// Sort helper function
function sortData<T>(data: T[], sortConfig: SortConfig<T>): T[] {
  if (!sortConfig.key || !sortConfig.direction) return data;

  return [...data].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof T];
    const bVal = b[sortConfig.key as keyof T];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}

// YAML Modal Component
function YAMLModal({
  isOpen,
  onClose,
  resourceType,
  namespace,
  name
}: {
  isOpen: boolean;
  onClose: () => void;
  resourceType: string;
  namespace: string;
  name: string;
}) {
  const [yaml, setYaml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchYAML();
    }
  }, [isOpen, resourceType, namespace, name]);

  async function fetchYAML() {
    setLoading(true);
    setError(null);
    try {
      const result = await kubernetesApi.executeKubectl({
        command: `get ${resourceType} ${name} -n ${namespace} -o yaml`,
      });
      if (result.data.success) {
        setYaml(result.data.stdout);
      } else {
        setError(result.data.stderr || 'Failed to fetch YAML');
      }
    } catch (err) {
      setError('Failed to fetch resource YAML');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <CodeBracketIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Resource YAML
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {resourceType}/{name} in {namespace}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              disabled={loading || !!error}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-success-500" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-4 w-4" />
                  Copy
                </>
              )}
            </motion.button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                <span>Loading YAML...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-danger-500 dark:text-danger-400 font-medium">{error}</p>
                <button
                  onClick={fetchYAML}
                  className="mt-3 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <pre className="text-sm font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl overflow-auto whitespace-pre-wrap">
              {yaml}
            </pre>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Deployment filter options
const deploymentFilterOptions: StatusFilterOption[] = [
  { value: 'all', label: 'All', color: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700' },
  { value: 'healthy', label: 'Healthy', color: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20' },
  { value: 'degraded', label: 'Degraded', color: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20' },
];

// Table Components
function DeploymentsTable({ data, searchQuery, onRefresh }: { data: Deployment[]; searchQuery: string; onRefresh: () => void }) {
  const toast = useToast();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [scaleModal, setScaleModal] = useState<{ dep: Deployment; replicas: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig<Deployment>>({ key: null, direction: null });
  const [yamlModal, setYamlModal] = useState<{ namespace: string; name: string } | null>(null);

  // Filter by search query
  const searchFiltered = data.filter(dep =>
    dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dep.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dep.image?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by status
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'all') return searchFiltered;
    if (statusFilter === 'healthy') return searchFiltered.filter(dep => dep.ready_replicas === dep.replicas);
    if (statusFilter === 'degraded') return searchFiltered.filter(dep => dep.ready_replicas !== dep.replicas);
    return searchFiltered;
  }, [searchFiltered, statusFilter]);

  // Sort data
  const sortedData = useMemo(() => sortData(statusFiltered, sortConfig), [statusFiltered, sortConfig]);

  const handleSort = (key: keyof Deployment) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleScale = async (dep: Deployment, replicas: number) => {
    setActionLoading(`scale-${dep.namespace}-${dep.name}`);
    try {
      await kubernetesApi.scale(dep.namespace, dep.name, replicas);
      toast.success('Deployment scaled', `${dep.name} scaled to ${replicas} replicas`);
      onRefresh();
    } catch (error) {
      toast.error('Scale failed', `Failed to scale ${dep.name}`);
      console.error('Failed to scale deployment:', error);
    } finally {
      setActionLoading(null);
      setScaleModal(null);
    }
  };

  const handleRestart = async (dep: Deployment) => {
    setActionLoading(`restart-${dep.namespace}-${dep.name}`);
    try {
      await kubernetesApi.restart(dep.namespace, dep.name);
      toast.success('Deployment restarted', `${dep.name} is restarting`);
      onRefresh();
    } catch (error) {
      toast.error('Restart failed', `Failed to restart ${dep.name}`);
      console.error('Failed to restart deployment:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (data.length === 0) {
    return <EmptyState icon={ServerStackIcon} title={searchQuery ? "No matching deployments" : "No deployments found"} />;
  }

  return (
    <>
      {/* Status Filter */}
      <StatusFilter options={deploymentFilterOptions} selected={statusFilter} onChange={setStatusFilter} />

      {sortedData.length === 0 ? (
        <EmptyState icon={ServerStackIcon} title="No deployments match filters" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                <SortableHeader<Deployment> label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Deployment> label="Namespace" sortKey="namespace" sortConfig={sortConfig} onSort={handleSort} />
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ready</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Image</th>
                <SortableHeader<Deployment> label="Age" sortKey="age" sortConfig={sortConfig} onSort={handleSort} />
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((dep, index) => {
                const isExpanded = expandedRow === `${dep.namespace}-${dep.name}`;
                const rowKey = `${dep.namespace}-${dep.name}`;
                return (
                  <>
                    <motion.tr
                      key={rowKey}
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      className={`border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors ${isExpanded ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </motion.button>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{dep.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {dep.namespace}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          dep.ready_replicas === dep.replicas
                            ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-1 ring-success-500/20'
                            : 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-1 ring-warning-500/20'
                        }`}>
                          {dep.ready_replicas}/{dep.replicas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs font-mono">{dep.image?.split('/').pop() || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{dep.age}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setScaleModal({ dep, replicas: dep.replicas })}
                            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="Scale"
                          >
                            <ScaleIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRestart(dep)}
                            disabled={actionLoading === `restart-${dep.namespace}-${dep.name}`}
                            className="p-2 rounded-lg text-gray-500 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors disabled:opacity-50"
                            title="Restart"
                          >
                            {actionLoading === `restart-${dep.namespace}-${dep.name}` ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <ArrowPathIcon className="h-4 w-4" />
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setYamlModal({ namespace: dep.namespace, name: dep.name })}
                            className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="View YAML"
                          >
                            <CodeBracketIcon className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          key={`${rowKey}-details`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={7} className="p-0">
                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Image Path</h4>
                                  <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all bg-gray-100 dark:bg-slate-700 p-2 rounded-lg">
                                    {dep.image || '-'}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Labels</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {dep.labels && Object.keys(dep.labels).length > 0 ? (
                                      Object.entries(dep.labels).slice(0, 4).map(([key, value]) => (
                                        <span key={key} className="px-2 py-0.5 rounded text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-mono">
                                          {key.split('/').pop()}={value.length > 15 ? value.slice(0, 15) + '...' : value}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-gray-400">No labels</span>
                                    )}
                                    {dep.labels && Object.keys(dep.labels).length > 4 && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-slate-700 text-gray-500">
                                        +{Object.keys(dep.labels).length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h4>
                                  <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                                      View Pods
                                    </button>
                                    <button
                                      onClick={() => setYamlModal({ namespace: dep.namespace, name: dep.name })}
                                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                      View YAML
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scale Modal */}
      <AnimatePresence>
        {scaleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setScaleModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Scale Deployment
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Scaling <span className="font-medium text-gray-700 dark:text-gray-300">{scaleModal.dep.name}</span> in namespace <span className="font-medium text-gray-700 dark:text-gray-300">{scaleModal.dep.namespace}</span>
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Replicas
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScaleModal({ ...scaleModal, replicas: Math.max(0, scaleModal.replicas - 1) })}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <StopIcon className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={scaleModal.replicas}
                    onChange={(e) => setScaleModal({ ...scaleModal, replicas: parseInt(e.target.value) || 0 })}
                    className="w-20 text-center px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                  />
                  <button
                    onClick={() => setScaleModal({ ...scaleModal, replicas: scaleModal.replicas + 1 })}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setScaleModal(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleScale(scaleModal.dep, scaleModal.replicas)}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Scaling...' : 'Scale'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YAML Modal */}
      <AnimatePresence>
        {yamlModal && (
          <YAMLModal
            isOpen={!!yamlModal}
            onClose={() => setYamlModal(null)}
            resourceType="deployment"
            namespace={yamlModal.namespace}
            name={yamlModal.name}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Pod filter options
const podFilterOptions: StatusFilterOption[] = [
  { value: 'all', label: 'All', color: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700' },
  { value: 'running', label: 'Running', color: 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20' },
  { value: 'pending', label: 'Pending', color: 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20' },
  { value: 'failed', label: 'Failed', color: 'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20' },
];

function PodsTable({ data, searchQuery }: { data: Pod[]; searchQuery: string }) {
  const toast = useToast();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig<Pod>>({ key: null, direction: null });
  const [yamlModal, setYamlModal] = useState<{ namespace: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Filter by search query
  const searchFiltered = data.filter(pod =>
    pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pod.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pod.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pod.node?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by status
  const statusFiltered = useMemo(() => {
    if (statusFilter === 'all') return searchFiltered;
    if (statusFilter === 'running') return searchFiltered.filter(pod => pod.status === 'Running');
    if (statusFilter === 'pending') return searchFiltered.filter(pod => pod.status === 'Pending');
    if (statusFilter === 'failed') return searchFiltered.filter(pod => !['Running', 'Pending'].includes(pod.status));
    return searchFiltered;
  }, [searchFiltered, statusFilter]);

  // Sort data
  const sortedData = useMemo(() => sortData(statusFiltered, sortConfig), [statusFiltered, sortConfig]);

  const handleSort = (key: keyof Pod) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (pod: Pod) => {
    if (!confirm(`Are you sure you want to delete pod "${pod.name}"?`)) return;

    setDeleteLoading(`${pod.namespace}-${pod.name}`);
    try {
      await kubernetesApi.executeKubectl({
        command: `delete pod ${pod.name} -n ${pod.namespace}`,
      });
      toast.success('Pod deleted', `${pod.name} has been deleted`);
    } catch (error) {
      toast.error('Delete failed', `Failed to delete ${pod.name}`);
      console.error('Failed to delete pod:', error);
    } finally {
      setDeleteLoading(null);
    }
  };

  if (data.length === 0) {
    return <EmptyState icon={CubeIcon} title={searchQuery ? "No matching pods" : "No pods found"} />;
  }

  return (
    <>
      {/* Status Filter */}
      <StatusFilter options={podFilterOptions} selected={statusFilter} onChange={setStatusFilter} />

      {sortedData.length === 0 ? (
        <EmptyState icon={CubeIcon} title="No pods match filters" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                <SortableHeader<Pod> label="Name" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Pod> label="Namespace" sortKey="namespace" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Pod> label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Pod> label="Restarts" sortKey="restarts" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Pod> label="Node" sortKey="node" sortConfig={sortConfig} onSort={handleSort} />
                <SortableHeader<Pod> label="Age" sortKey="age" sortConfig={sortConfig} onSort={handleSort} />
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((pod, index) => {
                const isExpanded = expandedRow === `${pod.namespace}-${pod.name}`;
                const rowKey = `${pod.namespace}-${pod.name}`;
                const isDeleting = deleteLoading === rowKey;
                return (
                  <>
                    <motion.tr
                      key={rowKey}
                      custom={index}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      className={`border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors ${isExpanded ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </motion.button>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">{pod.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                          {pod.namespace}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                            pod.status === 'Running'
                              ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                              : pod.status === 'Pending'
                              ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
                              : 'bg-danger-500/10 text-danger-600 dark:text-danger-400 ring-danger-500/20'
                          }`}
                        >
                          {pod.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{pod.restarts}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm font-mono">{pod.node || '-'}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{pod.age}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                            title="View Logs"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setYamlModal({ namespace: pod.namespace, name: pod.name })}
                            className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="View YAML"
                          >
                            <CodeBracketIcon className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(pod)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-gray-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          key={`${rowKey}-details`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <td colSpan={8} className="p-0">
                            <div className="px-6 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pod IP</h4>
                                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded inline-block">
                                    {pod.ip || 'Not assigned'}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Containers ({pod.containers?.length || 0})</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {pod.containers && pod.containers.length > 0 ? (
                                      pod.containers.map((container, idx) => (
                                        <span key={idx} className="px-2 py-0.5 rounded text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-mono">
                                          {container}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-gray-400">No containers</span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h4>
                                  <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
                                      Stream Logs
                                    </button>
                                    <button
                                      onClick={() => setYamlModal({ namespace: pod.namespace, name: pod.name })}
                                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                      View YAML
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* YAML Modal */}
      <AnimatePresence>
        {yamlModal && (
          <YAMLModal
            isOpen={!!yamlModal}
            onClose={() => setYamlModal(null)}
            resourceType="pod"
            namespace={yamlModal.namespace}
            name={yamlModal.name}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ServicesTable({ data, searchQuery }: { data: K8sService[]; searchQuery: string }) {
  const filteredData = data.filter(svc =>
    svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    svc.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    svc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    svc.cluster_ip?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={GlobeAltIcon} title={searchQuery ? "No matching services" : "No services found"} />;
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
          {filteredData.map((svc, index) => (
            <motion.tr
              key={`${svc.namespace}-${svc.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{svc.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {svc.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                  {svc.type}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{svc.cluster_ip || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{svc.external_ip || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">
                {svc.ports.map((p, i) => (
                  <span key={i} className="inline-block mr-2 px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono text-xs">
                    {p.port}:{p.targetPort}/{p.protocol}
                  </span>
                ))}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IngressesTable({ data, searchQuery }: { data: Ingress[]; searchQuery: string }) {
  const filteredData = data.filter(ing =>
    ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ing.hosts.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={GlobeAltIcon} title={searchQuery ? "No matching ingresses" : "No ingresses found"} />;
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
          {filteredData.map((ing, index) => (
            <motion.tr
              key={`${ing.namespace}-${ing.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ing.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {ing.namespace}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{ing.class_name || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{ing.hosts.join(', ') || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{ing.address || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{ing.age}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigMapsTable({ data, searchQuery }: { data: ConfigMap[]; searchQuery: string }) {
  const filteredData = data.filter(cm =>
    cm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cm.namespace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={DocumentDuplicateIcon} title={searchQuery ? "No matching configmaps" : "No configmaps found"} />;
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
          {filteredData.map((cm, index) => (
            <motion.tr
              key={`${cm.namespace}-${cm.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{cm.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {cm.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                  {cm.data_count} keys
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{cm.age}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SecretsTable({ data, searchQuery }: { data: Secret[]; searchQuery: string }) {
  const filteredData = data.filter(sec =>
    sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={KeyIcon} title={searchQuery ? "No matching secrets" : "No secrets found"} />;
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
          {filteredData.map((sec, index) => (
            <motion.tr
              key={`${sec.namespace}-${sec.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{sec.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {sec.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                  {sec.type}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs">
                  {sec.data_count} keys
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{sec.age}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PVCsTable({ data, searchQuery }: { data: PVC[]; searchQuery: string }) {
  const filteredData = data.filter(pvc =>
    pvc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pvc.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pvc.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pvc.storage_class?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={CircleStackIcon} title={searchQuery ? "No matching PVCs" : "No PVCs found"} />;
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
          {filteredData.map((pvc, index) => (
            <motion.tr
              key={`${pvc.namespace}-${pvc.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{pvc.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {pvc.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  pvc.status === 'Bound'
                    ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                    : 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
                }`}>
                  {pvc.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-sm">{pvc.capacity || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{pvc.access_modes.join(', ')}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{pvc.storage_class || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{pvc.age}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatefulSetsTable({ data, searchQuery }: { data: StatefulSet[]; searchQuery: string }) {
  const filteredData = data.filter(ss =>
    ss.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ss.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ss.image?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={ServerStackIcon} title={searchQuery ? "No matching statefulsets" : "No statefulsets found"} />;
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
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((ss, index) => (
            <motion.tr
              key={`${ss.namespace}-${ss.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ss.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {ss.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  ss.ready_replicas === ss.replicas
                    ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                    : 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
                }`}>
                  {ss.ready_replicas}/{ss.replicas}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm truncate max-w-xs font-mono">{ss.image?.split('/').pop() || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{ss.age}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title="Scale"
                  >
                    <ScaleIcon className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                    title="Restart"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DaemonSetsTable({ data, searchQuery }: { data: DaemonSet[]; searchQuery: string }) {
  const filteredData = data.filter(ds =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.image?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={CpuChipIcon} title={searchQuery ? "No matching daemonsets" : "No daemonsets found"} />;
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
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((ds, index) => (
            <motion.tr
              key={`${ds.namespace}-${ds.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{ds.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {ds.namespace}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.desired}</td>
              <td className="py-3 px-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  ds.ready === ds.desired
                    ? 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                    : 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
                }`}>
                  {ds.ready}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ds.available}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm truncate max-w-xs font-mono">{ds.image?.split('/').pop() || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{ds.age}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                    title="Restart"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsTable({ data, searchQuery }: { data: Job[]; searchQuery: string }) {
  const filteredData = data.filter(job =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.namespace.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={ClockIcon} title={searchQuery ? "No matching jobs" : "No jobs found"} />;
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
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((job, index) => (
            <motion.tr
              key={`${job.namespace}-${job.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{job.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {job.namespace}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{job.completions ?? '-'}</td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-success-500/10 text-success-600 dark:text-success-400 ring-1 ring-success-500/20">
                  {job.succeeded}
                </span>
              </td>
              <td className="py-3 px-4">
                {job.failed > 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-500/10 text-danger-600 dark:text-danger-400 ring-1 ring-danger-500/20">
                    {job.failed}
                  </span>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{job.duration || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{job.age}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title="View Logs"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CronJobsTable({ data, searchQuery }: { data: CronJob[]; searchQuery: string }) {
  const filteredData = data.filter(cj =>
    cj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cj.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cj.schedule.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={CalendarIcon} title={searchQuery ? "No matching cronjobs" : "No cronjobs found"} />;
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
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((cj, index) => (
            <motion.tr
              key={`${cj.namespace}-${cj.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{cj.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {cj.namespace}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono text-xs text-gray-600 dark:text-gray-300">
                  {cj.schedule}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
                  cj.suspend
                    ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-warning-500/20'
                    : 'bg-success-500/10 text-success-600 dark:text-success-400 ring-success-500/20'
                }`}>
                  {cj.suspend ? 'Yes' : 'No'}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{cj.active}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{cj.last_schedule || '-'}</td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{cj.age}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title="Trigger Now"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg text-gray-500 hover:text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                    title={cj.suspend ? "Resume" : "Suspend"}
                  >
                    {cj.suspend ? <PlayIcon className="h-4 w-4" /> : <StopIcon className="h-4 w-4" />}
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HPAsTable({ data, searchQuery }: { data: HPA[]; searchQuery: string }) {
  const filteredData = data.filter(hpa =>
    hpa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hpa.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hpa.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredData.length === 0) {
    return <EmptyState icon={ArrowsPointingOutIcon} title={searchQuery ? "No matching HPAs" : "No HPAs found"} />;
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
          {filteredData.map((hpa, index) => (
            <motion.tr
              key={`${hpa.namespace}-${hpa.name}`}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{hpa.name}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                  {hpa.namespace}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{hpa.reference}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-0.5 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 font-mono text-xs">
                  {hpa.min_replicas}/{hpa.max_replicas}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-1 ring-primary-500/20">
                  {hpa.current_replicas}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm font-mono">
                {hpa.current_cpu || '-'} / {hpa.target_cpu || '-'}
              </td>
              <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-sm">{hpa.age}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
