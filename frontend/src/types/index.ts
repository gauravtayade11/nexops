// Kubernetes types
export interface Namespace {
  name: string;
  status: string;
  created_at?: string;
  labels: Record<string, string>;
}

export interface Pod {
  name: string;
  namespace: string;
  status: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown';
  ready: boolean;
  restarts: number;
  age: string;
  node?: string;
  ip?: string;
  containers: string[];
}

export interface Deployment {
  name: string;
  namespace: string;
  replicas: number;
  ready_replicas: number;
  available_replicas: number;
  image?: string;
  age: string;
  labels: Record<string, string>;
}

export interface K8sEvent {
  name: string;
  namespace: string;
  type: string;
  reason: string;
  message: string;
  count: number;
  first_timestamp?: string;
  last_timestamp?: string;
  involved_object: Record<string, string>;
}

export interface ClusterHealth {
  healthy: boolean;
  node_count: number;
  ready_nodes: number;
  total_pods: number;
  running_pods: number;
  namespaces: number;
  warnings: string[];
}

// Incident types
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source?: string;
  namespace?: string;
  affected_services: string[];
  ai_analysis?: string;
  ai_recommendations: string[];
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export interface IncidentAnalysis {
  incident_id: string;
  analysis: string;
  root_cause_hypothesis?: string;
  recommendations: string[];
  related_events: Array<{ event: string; relevance: string }>;
  confidence_score: number;
}

// Timeline types
export type ChangeType = 'deployment' | 'config_change' | 'scale_event' | 'build' | 'incident' | 'rollback' | 'feature_flag' | 'infrastructure';
export type ChangeSource = 'kubernetes' | 'jenkins' | 'manual' | 'github' | 'terraform';

export interface TimelineEvent {
  id: string;
  event_type: ChangeType;
  source: ChangeSource;
  title: string;
  description?: string;
  namespace?: string;
  service_name?: string;
  environment?: string;
  user?: string;
  metadata: Record<string, unknown>;
  event_timestamp: string;
  related_incident_id?: string;
  created_at: string;
}

// GitFlow types
export type ReleaseStatus = 'draft' | 'pending_approval' | 'approved' | 'deploying' | 'deployed' | 'rolled_back' | 'failed';
export type Environment = 'development' | 'staging' | 'uat' | 'production';

export interface Release {
  id: string;
  version: string;
  release_branch: string;
  source_branch: string;
  target_branch: string;
  status: ReleaseStatus;
  commits: Array<{ sha: string; message: string; author: string; date: string }>;
  changelog?: string;
  created_by?: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

export interface DeploymentStatus {
  id: string;
  release_id: string;
  environment: Environment;
  namespace: string;
  status: string;
  services: Array<Record<string, unknown>>;
  started_at: string;
  completed_at?: string;
  deployed_by?: string;
  rollback_available: boolean;
  previous_version?: string;
}

// Self-Service types
export type ActionType = 'deploy' | 'rollback' | 'scale' | 'restart' | 'build' | 'config_update';
export type ActionStatus = 'pending' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';

export interface SelfServiceAction {
  id: string;
  action_type: ActionType;
  target_service: string;
  target_namespace: string;
  target_environment: string;
  parameters: Record<string, unknown>;
  reason: string;
  status: ActionStatus;
  requested_by: string;
  approved_by?: string;
  executed_at?: string;
  result?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

export interface ServiceCatalogItem {
  name: string;
  namespace: string;
  environment: string;
  description?: string;
  owner_team?: string;
  current_version?: string;
  allowed_actions: ActionType[];
  health_status: string;
  last_deployed?: string;
}

// Jenkins types
export interface JenkinsJob {
  name: string;
  url: string;
  color: string;
  buildable: boolean;
  last_build_number?: number;
  last_successful_build?: number;
  last_failed_build?: number;
  health_score: number;
  description?: string;
}

export interface JenkinsBuild {
  number: number;
  url: string;
  result?: 'SUCCESS' | 'FAILURE' | 'UNSTABLE' | 'ABORTED' | 'BUILDING';
  building: boolean;
  duration: number;
  timestamp: string;
  display_name: string;
  triggered_by?: string;
}

// Node types
export interface NodeCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

export interface NodeResources {
  cpu: string;
  memory: string;
  pods: string;
  storage?: string;
}

export interface NodeInfo {
  name: string;
  status: string;
  roles: string[];
  age: string;
  version: string;
  os_image: string;
  kernel_version: string;
  container_runtime: string;
  internal_ip?: string;
  external_ip?: string;
  conditions: NodeCondition[];
  capacity: NodeResources;
  allocatable: NodeResources;
  labels: Record<string, string>;
  taints: Array<{ key: string; value: string; effect: string }>;
}

// Metrics types
export interface ContainerMetrics {
  name: string;
  cpu_usage: string;
  cpu_percent: number;
  memory_usage: string;
  memory_percent: number;
}

export interface PodMetrics {
  name: string;
  namespace: string;
  containers: ContainerMetrics[];
  total_cpu: string;
  total_memory: string;
  timestamp: string;
}

export interface NodeMetrics {
  name: string;
  cpu_usage: string;
  cpu_percent: number;
  memory_usage: string;
  memory_percent: number;
  timestamp: string;
}

export interface ClusterMetrics {
  total_cpu_capacity: string;
  total_cpu_usage: string;
  cpu_percent: number;
  total_memory_capacity: string;
  total_memory_usage: string;
  memory_percent: number;
  nodes: NodeMetrics[];
  timestamp: string;
}

// Pod Logs types
export interface PodLogs {
  namespace: string;
  pod_name: string;
  container: string;
  logs: string;
  truncated: boolean;
}

// Pod Exec types
export interface PodExecResult {
  namespace: string;
  pod_name: string;
  container: string;
  command: string[];
  stdout: string;
  stderr: string;
  exit_code: number;
}

// Service types
export interface K8sService {
  name: string;
  namespace: string;
  type: string;
  cluster_ip?: string;
  external_ip?: string;
  ports: Array<{ port: number; targetPort: number; protocol: string; nodePort?: number }>;
}

// Ingress types
export interface IngressRule {
  host?: string;
  paths: Array<{ path: string; pathType: string; backend: string }>;
}

export interface Ingress {
  name: string;
  namespace: string;
  class_name?: string;
  hosts: string[];
  address?: string;
  rules: IngressRule[];
  tls: Array<{ hosts: string[]; secretName: string }>;
  age: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

// ConfigMap types
export interface ConfigMap {
  name: string;
  namespace: string;
  data_keys: string[];
  data_count: number;
  age: string;
  labels: Record<string, string>;
}

// Secret types
export interface Secret {
  name: string;
  namespace: string;
  type: string;
  data_keys: string[];
  data_count: number;
  age: string;
  labels: Record<string, string>;
}

// PVC types
export interface PVC {
  name: string;
  namespace: string;
  status: string;
  volume?: string;
  capacity?: string;
  access_modes: string[];
  storage_class?: string;
  age: string;
  labels: Record<string, string>;
}

// StatefulSet types
export interface StatefulSet {
  name: string;
  namespace: string;
  replicas: number;
  ready_replicas: number;
  current_replicas: number;
  image?: string;
  service_name?: string;
  age: string;
  labels: Record<string, string>;
}

// DaemonSet types
export interface DaemonSet {
  name: string;
  namespace: string;
  desired: number;
  current: number;
  ready: number;
  available: number;
  node_selector: Record<string, string>;
  image?: string;
  age: string;
  labels: Record<string, string>;
}

// Job types
export interface Job {
  name: string;
  namespace: string;
  completions?: number;
  succeeded: number;
  failed: number;
  active: number;
  duration?: string;
  age: string;
  labels: Record<string, string>;
}

// CronJob types
export interface CronJob {
  name: string;
  namespace: string;
  schedule: string;
  suspend: boolean;
  active: number;
  last_schedule?: string;
  age: string;
  labels: Record<string, string>;
}

// HPA types
export interface HPA {
  name: string;
  namespace: string;
  reference: string;
  min_replicas: number;
  max_replicas: number;
  current_replicas: number;
  target_cpu?: string;
  current_cpu?: string;
  target_memory?: string;
  current_memory?: string;
  age: string;
}

// YAML Apply types
export interface YAMLApplyRequest {
  yaml_content: string;
  namespace?: string;
  dry_run?: boolean;
}

export interface AppliedResource {
  kind: string;
  name: string;
  namespace?: string;
  action: string;
  message?: string;
}

export interface YAMLApplyResponse {
  success: boolean;
  message: string;
  resources: AppliedResource[];
  errors: string[];
  dry_run: boolean;
}

// Kubectl types
export interface KubectlRequest {
  command: string;
  timeout?: number;
}

export interface KubectlResponse {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time: number;
}

// Shell types
export interface ShellRequest {
  command: string;
  timeout?: number;
  working_directory?: string;
}

export interface ShellResponse {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time: number;
  working_directory: string;
}

// Cluster types
export type ClusterStatus = 'connected' | 'disconnected' | 'error' | 'unknown';

export interface ClusterInfo {
  id: string;
  name: string;
  context?: string;
  status: ClusterStatus;
  is_active: boolean;
  is_default: boolean;
  version?: string;
  platform?: string;
  node_count: number;
  namespace_count: number;
}

export interface ClusterListResponse {
  clusters: ClusterInfo[];
  active_cluster_id?: string;
  total: number;
}

export interface ClusterHealthInfo {
  cluster_id: string;
  healthy: boolean;
  status: ClusterStatus;
  node_count: number;
  ready_nodes: number;
  total_pods: number;
  running_pods: number;
  namespaces: number;
  warnings: string[];
  error?: string;
  checked_at: string;
}

// Auth types
export type UserRole = 'viewer' | 'operator' | 'developer' | 'admin';

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  username: string;
  action: string;
  resource_type: string;
  resource_name?: string;
  namespace?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

// Helm types
export type HelmReleaseStatus = 'deployed' | 'failed' | 'pending-install' | 'pending-upgrade' | 'pending-rollback' | 'uninstalling' | 'superseded' | 'unknown';

export interface HelmRelease {
  name: string;
  namespace: string;
  revision: number;
  status: HelmReleaseStatus;
  chart: string;
  chart_version: string;
  app_version?: string;
  updated?: string;
  description?: string;
}

export interface HelmReleaseHistory {
  revision: number;
  status: HelmReleaseStatus;
  chart: string;
  chart_version: string;
  app_version?: string;
  updated: string;
  description?: string;
}

export interface HelmReleaseValues {
  user_supplied: Record<string, unknown>;
  computed: Record<string, unknown>;
}

export interface HelmRepository {
  name: string;
  url: string;
  is_default?: boolean;
}

export interface HelmChartInfo {
  name: string;
  version: string;
  app_version?: string;
  description?: string;
  repository?: string;
  icon?: string;
  home?: string;
  sources: string[];
  keywords: string[];
  maintainers: Array<{ name?: string; email?: string; url?: string }>;
}

export interface HelmChartSearchResult {
  name: string;
  version: string;
  app_version?: string;
  description?: string;
  repository: string;
}

export interface HelmInstallRequest {
  release_name: string;
  chart: string;
  namespace?: string;
  version?: string;
  values?: Record<string, unknown>;
  create_namespace?: boolean;
  wait?: boolean;
  timeout?: number;
  dry_run?: boolean;
  repository?: string;
}

export interface HelmUpgradeRequest {
  chart?: string;
  version?: string;
  values?: Record<string, unknown>;
  reset_values?: boolean;
  reuse_values?: boolean;
  wait?: boolean;
  timeout?: number;
  dry_run?: boolean;
  force?: boolean;
  repository?: string;
}

export interface HelmOperationResult {
  success: boolean;
  message: string;
  release?: HelmRelease;
  manifest?: string;
  notes?: string;
}

export interface HelmReleaseListResponse {
  releases: HelmRelease[];
  total: number;
}

export interface HelmRepositoryListResponse {
  repositories: HelmRepository[];
}

// Cost types
export interface CostBreakdown {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  gpu: number;
  total: number;
}

export interface NamespaceCost {
  namespace: string;
  costs: CostBreakdown;
  pod_count: number;
  deployment_count: number;
  percentage_of_total: number;
}

export interface PodCost {
  name: string;
  namespace: string;
  costs: CostBreakdown;
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
  age: string;
  owner_kind?: string;
  owner_name?: string;
}

export interface CostTrend {
  timestamp: string;
  costs: CostBreakdown;
}

export interface CostRecommendation {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  resource_type: string;
  resource_name: string;
  namespace: string;
  current_cost: number;
  estimated_savings: number;
  percentage_savings: number;
  action: string;
}

export interface ResourceEfficiency {
  name: string;
  namespace: string;
  resource_type: string;
  requested: number;
  used: number;
  limit: number;
  efficiency_percentage: number;
  waste_cost: number;
}

export interface CostDashboardResponse {
  summary: {
    total_cost: CostBreakdown;
    cost_by_namespace: NamespaceCost[];
    cost_trend: CostTrend[];
    recommendations: CostRecommendation[];
    top_costly_pods: PodCost[];
  };
  namespace_breakdown: NamespaceCost[];
  recommendations: CostRecommendation[];
  efficiency_metrics: ResourceEfficiency[];
  total_monthly_estimate: number;
  total_annual_estimate: number;
}
