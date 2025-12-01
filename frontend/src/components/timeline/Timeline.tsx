import { useEffect, useState } from 'react';
import {
  ClockIcon,
  RocketLaunchIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ServerStackIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { timelineApi } from '../../services/api';
import type { TimelineEvent, ChangeType, ChangeSource } from '../../types';

const eventIcons: Record<ChangeType, React.ElementType> = {
  deployment: RocketLaunchIcon,
  config_change: CogIcon,
  scale_event: ServerStackIcon,
  build: CogIcon,
  incident: ExclamationTriangleIcon,
  rollback: ArrowPathIcon,
  feature_flag: CogIcon,
  infrastructure: ServerStackIcon,
};

const eventColors: Record<ChangeType, string> = {
  deployment: 'bg-primary-50 text-primary-600 border-primary-200',
  config_change: 'bg-warning-50 text-warning-600 border-warning-200',
  scale_event: 'bg-success-50 text-success-600 border-success-200',
  build: 'bg-gray-50 text-gray-600 border-gray-200',
  incident: 'bg-danger-50 text-danger-600 border-danger-200',
  rollback: 'bg-warning-50 text-warning-600 border-warning-200',
  feature_flag: 'bg-primary-50 text-primary-600 border-primary-200',
  infrastructure: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [filters, setFilters] = useState({
    sources: [] as ChangeSource[],
    types: [] as ChangeType[],
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  async function fetchData() {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        timelineApi.list({
          sources: filters.sources.length > 0 ? filters.sources : undefined,
          event_types: filters.types.length > 0 ? filters.types : undefined,
          limit: 100,
        }),
        timelineApi.getStats(24),
      ]);

      setEvents(eventsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  }

  function groupEventsByDate(events: TimelineEvent[]) {
    const groups: Record<string, TimelineEvent[]> = {};

    events.forEach((event) => {
      const date = new Date(event.event_timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    return groups;
  }

  const groupedEvents = groupEventsByDate(events);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Change Timeline</h1>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <ArrowPathIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-gray-500">Total Events (24h)</p>
            <p className="text-2xl font-bold text-gray-900">{(stats as { total_events?: number }).total_events || 0}</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Deployments</p>
            <p className="text-2xl font-bold text-primary-600">
              {((stats as { by_type?: Record<string, number> }).by_type?.deployment) || 0}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Config Changes</p>
            <p className="text-2xl font-bold text-warning-600">
              {((stats as { by_type?: Record<string, number> }).by_type?.config_change) || 0}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-gray-500">Incidents</p>
            <p className="text-2xl font-bold text-danger-600">
              {((stats as { by_type?: Record<string, number> }).by_type?.incident) || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <div className="flex flex-wrap gap-2">
          {(['kubernetes', 'jenkins', 'github', 'manual'] as ChangeSource[]).map((source) => (
            <button
              key={source}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  sources: prev.sources.includes(source)
                    ? prev.sources.filter((s) => s !== source)
                    : [...prev.sources, source],
                }))
              }
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.sources.includes(source)
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
        <div className="border-l border-gray-200 h-6 mx-2"></div>
        <div className="flex flex-wrap gap-2">
          {(['deployment', 'config_change', 'incident', 'rollback'] as ChangeType[]).map((type) => (
            <button
              key={type}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  types: prev.types.includes(type)
                    ? prev.types.filter((t) => t !== type)
                    : [...prev.types, type],
                }))
              }
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filters.types.includes(type)
                  ? 'bg-primary-100 text-primary-700 border border-primary-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No events found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-gray-500 mb-4">{date}</h3>
                <div className="space-y-4">
                  {dateEvents.map((event) => {
                    const Icon = eventIcons[event.event_type] || ClockIcon;
                    const colorClass = eventColors[event.event_type] || 'bg-gray-50 text-gray-600';

                    return (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`p-2 rounded-lg border ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {event.source}
                                </span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                  {event.event_type.replace('_', ' ')}
                                </span>
                                {event.namespace && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {event.namespace}
                                  </span>
                                )}
                                {event.service_name && (
                                  <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded">
                                    {event.service_name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {new Date(event.event_timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
