import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ServerStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi, incidentsApi, timelineApi } from '../../services/api';
import type { ClusterHealth, Incident, TimelineEvent } from '../../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  status?: 'healthy' | 'warning' | 'danger';
}

function StatCard({ title, value, icon: Icon, trend, status = 'healthy' }: StatCardProps) {
  const statusColors = {
    healthy: 'text-success-500 bg-success-50',
    warning: 'text-warning-500 bg-warning-50',
    danger: 'text-danger-500 bg-danger-50',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <ArrowTrendingUpIcon className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${statusColors[status]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [clusterHealth, setClusterHealth] = useState<ClusterHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, incidentsRes, eventsRes] = await Promise.all([
          kubernetesApi.getHealth().catch(() => null),
          incidentsApi.list({ status: 'open' }).catch(() => ({ data: [] })),
          timelineApi.list({ limit: 10 }).catch(() => ({ data: [] })),
        ]);

        if (healthRes?.data) setClusterHealth(healthRes.data);
        setIncidents(incidentsRes.data);
        setRecentEvents(eventsRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const openIncidents = incidents.filter((i) => i.status === 'open').length;
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <div className="flex gap-3">
          <Link to="/incidents" className="btn-primary">
            View All Incidents
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cluster Health"
          value={clusterHealth?.healthy ? 'Healthy' : 'Degraded'}
          icon={ServerStackIcon}
          status={clusterHealth?.healthy ? 'healthy' : 'danger'}
        />
        <StatCard
          title="Running Pods"
          value={clusterHealth ? `${clusterHealth.running_pods}/${clusterHealth.total_pods}` : '-'}
          icon={CheckCircleIcon}
          status={clusterHealth?.running_pods === clusterHealth?.total_pods ? 'healthy' : 'warning'}
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          icon={ExclamationTriangleIcon}
          status={criticalIncidents > 0 ? 'danger' : openIncidents > 0 ? 'warning' : 'healthy'}
        />
        <StatCard
          title="Recent Changes"
          value={recentEvents.length}
          icon={ClockIcon}
          trend="Last 24 hours"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Open Incidents</h2>
            <Link to="/incidents" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-success-500" />
              No open incidents
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  to={`/incidents/${incident.id}`}
                  className="block p-3 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{incident.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {incident.namespace || 'No namespace'} • {incident.affected_services.length} services
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        incident.severity === 'critical'
                          ? 'bg-danger-50 text-danger-600'
                          : incident.severity === 'high'
                          ? 'bg-warning-50 text-warning-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Timeline Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Changes</h2>
            <Link to="/timeline" className="text-sm text-primary-600 hover:text-primary-700">
              View timeline
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : recentEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent events</div>
          ) : (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
                >
                  <div
                    className={`p-2 rounded-lg ${
                      event.event_type === 'deployment'
                        ? 'bg-primary-50 text-primary-600'
                        : event.event_type === 'incident'
                        ? 'bg-danger-50 text-danger-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <ClockIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {event.source} • {new Date(event.event_timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cluster Warnings */}
      {clusterHealth?.warnings && clusterHealth.warnings.length > 0 && (
        <div className="card bg-warning-50 border-warning-200">
          <h2 className="text-lg font-semibold text-warning-800 mb-3">Cluster Warnings</h2>
          <ul className="space-y-2">
            {clusterHealth.warnings.map((warning, index) => (
              <li key={index} className="flex items-center gap-2 text-warning-700">
                <ExclamationTriangleIcon className="h-5 w-5" />
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
