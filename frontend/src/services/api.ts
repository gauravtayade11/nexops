import axios from 'axios';
import type {
  Namespace, Pod, Deployment, K8sEvent, ClusterHealth,
  Incident, IncidentAnalysis,
  TimelineEvent,
  Release, DeploymentStatus,
  SelfServiceAction, ServiceCatalogItem,
  JenkinsJob, JenkinsBuild,
  NodeInfo, NodeMetrics, PodMetrics, ClusterMetrics,
  PodLogs, PodExecResult,
  K8sService, Ingress, ConfigMap, Secret, PVC,
  StatefulSet, DaemonSet, Job, CronJob, HPA,
  YAMLApplyRequest, YAMLApplyResponse,
  KubectlRequest, KubectlResponse,
  ShellRequest, ShellResponse,
  ClusterInfo, ClusterListResponse, ClusterHealthInfo,
  User, LoginResponse,
  HelmRelease, HelmReleaseHistory, HelmReleaseValues,
  HelmChartInfo, HelmChartSearchResult,
  HelmInstallRequest, HelmUpgradeRequest, HelmOperationResult,
  HelmReleaseListResponse, HelmRepositoryListResponse,
  CostDashboardResponse, NamespaceCost, PodCost, CostTrend, CostRecommendation, ResourceEfficiency
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Kubernetes API
export const kubernetesApi = {
  getHealth: () => api.get<ClusterHealth>('/kubernetes/health'),
  getNamespaces: () => api.get<Namespace[]>('/kubernetes/namespaces'),
  getPods: (namespace?: string) =>
    api.get<Pod[]>('/kubernetes/pods', { params: { namespace } }),
  getDeployments: (namespace?: string) =>
    api.get<Deployment[]>('/kubernetes/deployments', { params: { namespace } }),
  getEvents: (namespace?: string, limit = 100) =>
    api.get<K8sEvent[]>('/kubernetes/events', { params: { namespace, limit } }),
  getPodEvents: (namespace: string, podName: string) =>
    api.get<K8sEvent[]>(`/kubernetes/pods/${namespace}/${podName}/events`),
  scale: (namespace: string, deploymentName: string, replicas: number) =>
    api.post('/kubernetes/scale', { namespace, deployment_name: deploymentName, replicas }),
  restart: (namespace: string, deploymentName: string) =>
    api.post('/kubernetes/restart', { namespace, deployment_name: deploymentName }),
  deploy: (releaseId: string, environment: string, namespace: string, services: string[]) =>
    api.post<DeploymentStatus>('/kubernetes/deploy', {
      release_id: releaseId,
      environment,
      namespace,
      services,
    }),
  rollback: (deploymentId: string, reason: string, targetVersion?: string) =>
    api.post<DeploymentStatus>('/kubernetes/rollback', {
      deployment_id: deploymentId,
      target_version: targetVersion,
      reason,
    }),
  // Nodes
  getNodes: () => api.get<NodeInfo[]>('/kubernetes/nodes'),
  getNode: (name: string) => api.get<NodeInfo>(`/kubernetes/nodes/${name}`),
  // Metrics
  getClusterMetrics: () => api.get<ClusterMetrics>('/kubernetes/metrics'),
  getNodeMetrics: () => api.get<NodeMetrics[]>('/kubernetes/metrics/nodes'),
  getPodMetrics: (namespace?: string) =>
    api.get<PodMetrics[]>('/kubernetes/metrics/pods', { params: { namespace } }),
  // Logs
  getPodLogs: (
    namespace: string,
    podName: string,
    options?: {
      container?: string;
      tailLines?: number;
      sinceSeconds?: number;
      timestamps?: boolean;
      previous?: boolean;
    }
  ) => {
    // Build params object, excluding undefined/null values
    const params: Record<string, string | number | boolean> = {};
    if (options?.container) params.container = options.container;
    if (options?.tailLines) params.tail_lines = options.tailLines;
    if (options?.sinceSeconds) params.since_seconds = options.sinceSeconds;
    if (options?.timestamps) params.timestamps = options.timestamps;
    if (options?.previous) params.previous = options.previous;

    return api.get<PodLogs>(`/kubernetes/pods/${namespace}/${podName}/logs`, { params });
  },
  // Exec
  execPodCommand: (namespace: string, podName: string, command: string[], container?: string) =>
    api.post<PodExecResult>(`/kubernetes/pods/${namespace}/${podName}/exec`, {
      namespace,
      pod_name: podName,
      command,
      container,
    }),
  // Services
  getServices: (namespace?: string) =>
    api.get<K8sService[]>('/kubernetes/services', { params: { namespace } }),
  // Ingresses
  getIngresses: (namespace?: string) =>
    api.get<Ingress[]>('/kubernetes/ingresses', { params: { namespace } }),
  // ConfigMaps
  getConfigMaps: (namespace?: string) =>
    api.get<ConfigMap[]>('/kubernetes/configmaps', { params: { namespace } }),
  // Secrets
  getSecrets: (namespace?: string) =>
    api.get<Secret[]>('/kubernetes/secrets', { params: { namespace } }),
  // PVCs
  getPVCs: (namespace?: string) =>
    api.get<PVC[]>('/kubernetes/pvcs', { params: { namespace } }),
  // StatefulSets
  getStatefulSets: (namespace?: string) =>
    api.get<StatefulSet[]>('/kubernetes/statefulsets', { params: { namespace } }),
  // DaemonSets
  getDaemonSets: (namespace?: string) =>
    api.get<DaemonSet[]>('/kubernetes/daemonsets', { params: { namespace } }),
  // Jobs
  getJobs: (namespace?: string) =>
    api.get<Job[]>('/kubernetes/jobs', { params: { namespace } }),
  // CronJobs
  getCronJobs: (namespace?: string) =>
    api.get<CronJob[]>('/kubernetes/cronjobs', { params: { namespace } }),
  // HPAs
  getHPAs: (namespace?: string) =>
    api.get<HPA[]>('/kubernetes/hpas', { params: { namespace } }),
  // YAML Apply
  applyYAML: (request: YAMLApplyRequest) =>
    api.post<YAMLApplyResponse>('/kubernetes/apply', request),
  // Kubectl
  executeKubectl: (request: KubectlRequest) =>
    api.post<KubectlResponse>('/kubernetes/kubectl', request),
  // Shell
  executeShell: (request: ShellRequest) =>
    api.post<ShellResponse>('/kubernetes/shell', request),
  // Deployment Revisions & Rollback
  getDeploymentRevisions: (namespace: string, deploymentName: string) =>
    api.get<DeploymentRevision[]>(`/kubernetes/deployments/${namespace}/${deploymentName}/revisions`),
  rollbackDeployment: (namespace: string, deploymentName: string, revision: number) =>
    api.post(`/kubernetes/deployments/${namespace}/${deploymentName}/rollback`, null, { params: { revision } }),
};

// Deployment Revision type
export interface DeploymentRevision {
  revision: number;
  name: string;
  replicas: number;
  ready_replicas: number;
  image: string | null;
  change_cause: string;
  created_at: string | null;
  age: string;
}

// Incidents API
export const incidentsApi = {
  list: (params?: { status?: string; severity?: string; namespace?: string }) =>
    api.get<Incident[]>('/incidents', { params }),
  get: (id: string) => api.get<Incident>(`/incidents/${id}`),
  create: (data: Partial<Incident>) => api.post<Incident>('/incidents', data),
  update: (id: string, data: Partial<Incident>) => api.patch<Incident>(`/incidents/${id}`, data),
  analyze: (id: string, options?: { include_k8s_context?: boolean; additional_context?: string }) =>
    api.post<IncidentAnalysis>(`/incidents/${id}/analyze`, {
      incident_id: id,
      include_k8s_context: options?.include_k8s_context ?? true,
      include_jenkins_context: true,
      additional_context: options?.additional_context,
    }),
  getRunbook: (id: string) => api.post(`/incidents/${id}/runbook`),
  getTimeline: (id: string) => api.get(`/incidents/${id}/timeline`),
  delete: (id: string) => api.delete(`/incidents/${id}`),
};

// Timeline API
export const timelineApi = {
  list: (params?: {
    start_date?: string;
    end_date?: string;
    event_types?: string[];
    sources?: string[];
    namespaces?: string[];
    limit?: number;
  }) => api.get<TimelineEvent[]>('/timeline', { params }),
  create: (event: Partial<TimelineEvent>) => api.post<TimelineEvent>('/timeline', event),
  getStats: (hours = 24) => api.get('/timeline/stats', { params: { hours } }),
  correlate: (incidentId: string, incidentTimestamp: string) =>
    api.get(`/timeline/correlate/${incidentId}`, { params: { incident_timestamp: incidentTimestamp } }),
};

// GitFlow API
export const gitflowApi = {
  getConfig: () => api.get('/gitflow/config'),
  getBranches: (branchType?: string) =>
    api.get('/gitflow/branches', { params: { branch_type: branchType } }),
  createRelease: (version: string, sourceBranch = 'develop', changelog?: string) =>
    api.post<Release>('/gitflow/releases', {
      version,
      source_branch: sourceBranch,
      changelog,
      auto_create_branch: true,
    }),
  listReleases: (status?: string, limit = 20) =>
    api.get<{ releases: Release[]; total_count: number }>('/gitflow/releases', { params: { status, limit } }),
  getRelease: (id: string) => api.get<Release>(`/gitflow/releases/${id}`),
  approveRelease: (id: string, approvedBy: string) =>
    api.post<Release>(`/gitflow/releases/${id}/approve`, null, { params: { approved_by: approvedBy } }),
  finishRelease: (id: string) => api.post<Release>(`/gitflow/releases/${id}/finish`),
  createHotfix: (version: string, description: string) =>
    api.post<Release>('/gitflow/hotfix', null, { params: { version, description } }),
  finishHotfix: (id: string) => api.post<Release>(`/gitflow/hotfix/${id}/finish`),
  getVersions: () => api.get('/gitflow/versions'),
  promote: (releaseId: string, fromEnv: string, toEnv: string) =>
    api.post('/gitflow/promote', {
      release_id: releaseId,
      from_environment: fromEnv,
      to_environment: toEnv,
    }),
};

// Self-Service API
export const selfServiceApi = {
  getCatalog: (namespace?: string, environment?: string) =>
    api.get<ServiceCatalogItem[]>('/selfservice/catalog', { params: { namespace, environment } }),
  getService: (namespace: string, serviceName: string) =>
    api.get<ServiceCatalogItem>(`/selfservice/catalog/${namespace}/${serviceName}`),
  getEnvironments: () => api.get('/selfservice/environments'),
  getQuickActions: () => api.get('/selfservice/quick-actions'),
  createAction: (action: Partial<SelfServiceAction>) =>
    api.post<SelfServiceAction>('/selfservice/actions', action),
  listActions: (status?: string, limit = 50) =>
    api.get<SelfServiceAction[]>('/selfservice/actions', { params: { status, limit } }),
  getAction: (id: string) => api.get<SelfServiceAction>(`/selfservice/actions/${id}`),
  approveAction: (id: string, approvedBy: string) =>
    api.post<SelfServiceAction>(`/selfservice/actions/${id}/approve`, null, { params: { approved_by: approvedBy } }),
  rejectAction: (id: string, reason: string) =>
    api.post<SelfServiceAction>(`/selfservice/actions/${id}/reject`, null, { params: { reason } }),
};

// Jenkins API
export const jenkinsApi = {
  getHealth: () => api.get('/jenkins/health'),
  listJobs: (folder?: string) => api.get<JenkinsJob[]>('/jenkins/jobs', { params: { folder } }),
  getJob: (name: string) => api.get<JenkinsJob>(`/jenkins/jobs/${name}`),
  getBuild: (jobName: string, buildNumber: number) =>
    api.get<JenkinsBuild>(`/jenkins/jobs/${jobName}/builds/${buildNumber}`),
  getBuildLog: (jobName: string, buildNumber: number) =>
    api.get(`/jenkins/jobs/${jobName}/builds/${buildNumber}/log`),
  triggerBuild: (jobName: string, parameters?: Record<string, string>) =>
    api.post(`/jenkins/jobs/${jobName}/build`, { parameters }),
  stopBuild: (jobName: string, buildNumber: number) =>
    api.post(`/jenkins/jobs/${jobName}/builds/${buildNumber}/stop`),
  getQueue: () => api.get('/jenkins/queue'),
};

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { username, password }),
  getCurrentUser: () => api.get<User>('/auth/me'),
  listUsers: () => api.get<User[]>('/auth/users'),
  createUser: (data: { username: string; password: string; email?: string; full_name?: string; role: string }) =>
    api.post<User>('/auth/users', data),
  updateUser: (userId: string, data: { email?: string; full_name?: string; role?: string; is_active?: boolean }) =>
    api.patch<User>(`/auth/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete(`/auth/users/${userId}`),
};

// Clusters API
export const clustersApi = {
  list: () => api.get<ClusterListResponse>('/clusters'),
  getActive: () => api.get<ClusterInfo>('/clusters/active'),
  setActive: (clusterId: string) => api.put('/clusters/active', { cluster_id: clusterId }),
  get: (clusterId: string) => api.get<ClusterInfo>(`/clusters/${clusterId}`),
  getHealth: (clusterId: string) => api.get<ClusterHealthInfo>(`/clusters/${clusterId}/health`),
  getContexts: () => api.get<{ name: string; cluster: string; user: string; namespace?: string }[]>('/clusters/contexts'),
  create: (data: { id: string; name: string; context?: string; kubeconfig_path?: string; is_default?: boolean }) =>
    api.post<ClusterInfo>('/clusters', data),
  delete: (clusterId: string) => api.delete(`/clusters/${clusterId}`),
};

// Helm API
export const helmApi = {
  // Releases
  listReleases: (namespace?: string, allNamespaces = true) =>
    api.get<HelmReleaseListResponse>('/helm/releases', {
      params: { namespace, all_namespaces: allNamespaces }
    }),
  getRelease: (namespace: string, name: string) =>
    api.get<HelmRelease>(`/helm/releases/${namespace}/${name}`),
  getReleaseHistory: (namespace: string, name: string) =>
    api.get<HelmReleaseHistory[]>(`/helm/releases/${namespace}/${name}/history`),
  getReleaseValues: (namespace: string, name: string, allValues = false) =>
    api.get<HelmReleaseValues>(`/helm/releases/${namespace}/${name}/values`, {
      params: { all_values: allValues }
    }),
  installRelease: (request: HelmInstallRequest) =>
    api.post<HelmOperationResult>('/helm/releases', request),
  upgradeRelease: (namespace: string, name: string, request: HelmUpgradeRequest) =>
    api.put<HelmOperationResult>(`/helm/releases/${namespace}/${name}`, request),
  rollbackRelease: (namespace: string, name: string, revision: number, options?: { wait?: boolean; dry_run?: boolean }) =>
    api.post<HelmOperationResult>(`/helm/releases/${namespace}/${name}/rollback`, {
      revision,
      ...options
    }),
  uninstallRelease: (namespace: string, name: string, keepHistory = false, dryRun = false) =>
    api.delete<HelmOperationResult>(`/helm/releases/${namespace}/${name}`, {
      params: { keep_history: keepHistory, dry_run: dryRun }
    }),

  // Repositories
  listRepositories: () => api.get<HelmRepositoryListResponse>('/helm/repositories'),
  addRepository: (name: string, url: string) =>
    api.post('/helm/repositories', null, { params: { name, url } }),
  removeRepository: (name: string) =>
    api.delete(`/helm/repositories/${name}`),

  // Charts
  searchCharts: (query: string, repository?: string) =>
    api.get<HelmChartSearchResult[]>('/helm/charts/search', {
      params: { query, repository }
    }),
  getChartInfo: (chart: string, repository?: string) =>
    api.get<HelmChartInfo>(`/helm/charts/${chart}/info`, {
      params: { repository }
    }),
  getChartValues: (chart: string, repository?: string) =>
    api.get<Record<string, unknown>>(`/helm/charts/${chart}/values`, {
      params: { repository }
    }),
};

// Cost API
export const costApi = {
  getDashboard: () => api.get<CostDashboardResponse>('/cost/dashboard'),
  getNamespaceCosts: () => api.get<NamespaceCost[]>('/cost/namespaces'),
  getPodCosts: (limit = 10) => api.get<PodCost[]>('/cost/pods', { params: { limit } }),
  getCostTrends: (days = 30) => api.get<CostTrend[]>('/cost/trends', { params: { days } }),
  getRecommendations: () => api.get<CostRecommendation[]>('/cost/recommendations'),
  getEfficiencyMetrics: () => api.get<ResourceEfficiency[]>('/cost/efficiency'),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
  ready: () => api.get('/ready'),
  live: () => api.get('/live'),
};

export default api;
