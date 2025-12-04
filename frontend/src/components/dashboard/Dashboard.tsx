import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ServerStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi, incidentsApi, timelineApi } from '../../services/api';
import type { ClusterHealth, Incident, TimelineEvent } from '../../types';
import GlassCard, { StatCard, GlassCardSkeleton } from '../common/GlassCard';

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
            Operations Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Real-time cluster health and incident monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/incidents"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
              View All Incidents
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {loading ? (
          <>
            <GlassCardSkeleton />
            <GlassCardSkeleton />
            <GlassCardSkeleton />
            <GlassCardSkeleton />
          </>
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Cluster Health"
                value={clusterHealth?.healthy ? 'Healthy' : 'Degraded'}
                icon={ServerStackIcon}
                color={clusterHealth?.healthy ? 'success' : 'danger'}
                subtitle="All systems operational"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Running Pods"
                value={clusterHealth ? `${clusterHealth.running_pods}/${clusterHealth.total_pods}` : '-'}
                icon={CheckCircleIcon}
                color={clusterHealth?.running_pods === clusterHealth?.total_pods ? 'success' : 'warning'}
                subtitle="Active workloads"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Open Incidents"
                value={openIncidents}
                icon={ExclamationTriangleIcon}
                color={criticalIncidents > 0 ? 'danger' : openIncidents > 0 ? 'warning' : 'success'}
                subtitle={criticalIncidents > 0 ? `${criticalIncidents} critical` : 'No critical issues'}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                title="Recent Changes"
                value={recentEvents.length}
                icon={ClockIcon}
                color="primary"
                subtitle="Last 24 hours"
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Open Incidents */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="hover" className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-danger-500/10">
                  <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Open Incidents</h2>
              </div>
              <Link
                to="/incidents"
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors group"
              >
                View all
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 rounded-xl bg-gray-100/50 dark:bg-slate-700/50">
                      <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
                    </div>
                  ))}
                </motion.div>
              ) : incidents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-success-500/10 flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-success-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">All clear! No open incidents</p>
                </motion.div>
              ) : (
                <motion.div key="list" className="space-y-3">
                  {incidents.slice(0, 5).map((incident, index) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/incidents/${incident.id}`}
                        className="block p-4 rounded-xl border border-gray-100/50 dark:border-slate-600/50 hover:border-primary-200 dark:hover:border-primary-700/50 hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent dark:hover:from-primary-900/20 transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {incident.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {incident.namespace || 'No namespace'} • {incident.affected_services.length} services
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              incident.severity === 'critical'
                                ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400 ring-1 ring-danger-500/20'
                                : incident.severity === 'high'
                                ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400 ring-1 ring-warning-500/20'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {incident.severity}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* Recent Timeline Events */}
        <motion.div variants={itemVariants}>
          <GlassCard variant="hover" className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-500/10">
                  <ClockIcon className="h-5 w-5 text-primary-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Changes</h2>
              </div>
              <Link
                to="/timeline"
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors group"
              >
                View timeline
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-start gap-3 p-4 rounded-xl bg-gray-100/50 dark:bg-slate-700/50">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-slate-600 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : recentEvents.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                    <ClockIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No recent events</p>
                </motion.div>
              ) : (
                <motion.div key="list" className="space-y-3">
                  {recentEvents.slice(0, 5).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-4 rounded-xl border border-gray-100/50 dark:border-slate-600/50 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-all duration-200"
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          event.event_type === 'deployment'
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            : event.event_type === 'incident'
                            ? 'bg-danger-500/10 text-danger-600 dark:text-danger-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {event.event_type === 'deployment' ? (
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                        ) : (
                          <ClockIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {event.source} • {new Date(event.event_timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>

      {/* Cluster Warnings */}
      <AnimatePresence>
        {clusterHealth?.warnings && clusterHealth.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="bg-gradient-to-r from-warning-50/80 to-warning-100/50 dark:from-warning-500/10 dark:to-warning-600/5 border-warning-200/50 dark:border-warning-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-warning-500/20">
                  <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 dark:text-warning-400" />
                </div>
                <h2 className="text-lg font-semibold text-warning-800 dark:text-warning-400">Cluster Warnings</h2>
              </div>
              <ul className="space-y-3">
                {clusterHealth.warnings.map((warning, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-warning-100/50 dark:bg-warning-500/10 text-warning-700 dark:text-warning-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-warning-500" />
                    {warning}
                  </motion.li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions Hint */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500"
      >
        <SparklesIcon className="h-4 w-4" />
        <span>Press <kbd className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 font-mono text-xs">Cmd+K</kbd> for quick actions</span>
      </motion.div>
    </motion.div>
  );
}
