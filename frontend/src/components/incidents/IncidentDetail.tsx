import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { incidentsApi } from '../../services/api';
import type { Incident, IncidentAnalysis, IncidentStatus } from '../../types';

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [analysis, setAnalysis] = useState<IncidentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchIncident();
  }, [id]);

  async function fetchIncident() {
    try {
      const res = await incidentsApi.get(id!);
      setIncident(res.data);
    } catch (error) {
      console.error('Failed to fetch incident:', error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    if (!incident) return;
    setAnalyzing(true);
    try {
      const res = await incidentsApi.analyze(incident.id, {
        include_k8s_context: true,
      });
      setAnalysis(res.data);
      await fetchIncident();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function updateStatus(status: IncidentStatus) {
    if (!incident) return;
    setUpdating(true);
    try {
      await incidentsApi.update(incident.id, { status });
      await fetchIncident();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Incident not found</p>
      </div>
    );
  }

  const severityColors = {
    critical: 'bg-danger-50 text-danger-600 border-danger-200',
    high: 'bg-warning-50 text-warning-600 border-warning-200',
    medium: 'bg-primary-50 text-primary-600 border-primary-200',
    low: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  const statusColors = {
    open: 'bg-danger-50 text-danger-600',
    investigating: 'bg-warning-50 text-warning-600',
    identified: 'bg-primary-50 text-primary-600',
    monitoring: 'bg-success-50 text-success-600',
    resolved: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/incidents')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Incidents
          </button>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium border ${severityColors[incident.severity]}`}>
              {incident.severity.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="btn-primary flex items-center gap-2"
          >
            <SparklesIcon className="h-4 w-4" />
            {analyzing ? 'Analyzing...' : 'AI Analysis'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600">{incident.description || 'No description provided.'}</p>
          </div>

          {/* AI Analysis */}
          {(incident.ai_analysis || analysis) && (
            <div className="card border-primary-200 bg-primary-50/30">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary-600" />
                AI Analysis
              </h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {analysis?.analysis || incident.ai_analysis}
                </p>
              </div>

              {(analysis?.root_cause_hypothesis || incident.ai_recommendations.length > 0) && (
                <div className="mt-4 pt-4 border-t border-primary-200">
                  {analysis?.root_cause_hypothesis && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">Root Cause Hypothesis</h3>
                      <p className="text-gray-700">{analysis.root_cause_hypothesis}</p>
                    </div>
                  )}

                  {(analysis?.recommendations || incident.ai_recommendations).length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {(analysis?.recommendations || incident.ai_recommendations).map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700">
                            <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis?.confidence_score !== undefined && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <p className="text-sm text-gray-500">
                        Confidence Score: {Math.round(analysis.confidence_score * 100)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Timeline placeholder */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Incident Timeline
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-danger-500"></div>
                <div>
                  <p className="font-medium text-gray-900">Incident Created</p>
                  <p className="text-sm text-gray-500">{new Date(incident.created_at).toLocaleString()}</p>
                </div>
              </div>
              {incident.resolved_at && (
                <div className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-success-500"></div>
                  <div>
                    <p className="font-medium text-gray-900">Incident Resolved</p>
                    <p className="text-sm text-gray-500">{new Date(incident.resolved_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['investigating', 'identified', 'monitoring', 'resolved'] as IncidentStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={updating || incident.status === status}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    incident.status === status
                      ? 'bg-primary-100 text-primary-700 border border-primary-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Namespace</dt>
                <dd className="font-medium text-gray-900">{incident.namespace || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Source</dt>
                <dd className="font-medium text-gray-900">{incident.source || 'Manual'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Assigned To</dt>
                <dd className="font-medium text-gray-900">{incident.assigned_to || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(incident.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(incident.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Affected Services */}
          {incident.affected_services.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Affected Services</h2>
              <div className="flex flex-wrap gap-2">
                {incident.affected_services.map((service) => (
                  <span
                    key={service}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {incident.tags.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {incident.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
