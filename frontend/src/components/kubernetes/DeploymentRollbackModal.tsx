import { useState, useEffect } from 'react';
import {
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi, DeploymentRevision } from '../../services/api';
import type { Deployment } from '../../types';

interface DeploymentRollbackModalProps {
  deployment: Deployment;
  onClose: () => void;
  onRollbackComplete: () => void;
}

export default function DeploymentRollbackModal({
  deployment,
  onClose,
  onRollbackComplete,
}: DeploymentRollbackModalProps) {
  const [revisions, setRevisions] = useState<DeploymentRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollbackResult, setRollbackResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchRevisions();
  }, [deployment]);

  async function fetchRevisions() {
    setLoading(true);
    setError(null);
    try {
      const response = await kubernetesApi.getDeploymentRevisions(
        deployment.namespace,
        deployment.name
      );
      setRevisions(response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch revisions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleRollback() {
    if (selectedRevision === null) return;

    setRolling(true);
    setRollbackResult(null);
    try {
      await kubernetesApi.rollbackDeployment(
        deployment.namespace,
        deployment.name,
        selectedRevision
      );
      setRollbackResult({
        success: true,
        message: `Successfully initiated rollback to revision ${selectedRevision}`,
      });
      setTimeout(() => {
        onRollbackComplete();
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Rollback failed';
      setRollbackResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setRolling(false);
    }
  }

  const currentRevision = revisions.find(r => r.replicas > 0 && r.ready_replicas > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <ArrowPathIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Rollback Deployment
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {deployment.namespace}/{deployment.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500 dark:text-gray-400">Loading revisions...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-red-500">{error}</div>
            </div>
          ) : revisions.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500 dark:text-gray-400">No revision history available</div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Select a revision to rollback to. The current active revision is highlighted.
              </p>
              {revisions.map((revision) => {
                const isCurrent = currentRevision?.revision === revision.revision;
                const isSelected = selectedRevision === revision.revision;

                return (
                  <button
                    key={revision.revision}
                    onClick={() => !isCurrent && setSelectedRevision(revision.revision)}
                    disabled={isCurrent}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 ring-2 ring-primary-500'
                        : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            Revision {revision.revision}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {revision.image && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-mono truncate">
                            {revision.image}
                          </p>
                        )}
                        {revision.change_cause && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {revision.change_cause}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4" />
                        {revision.age}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Replicas: {revision.ready_replicas}/{revision.replicas}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Result message */}
          {rollbackResult && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                rollbackResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}
            >
              {rollbackResult.success ? (
                <CheckCircleIcon className="h-5 w-5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              {rollbackResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRollback}
            disabled={selectedRevision === null || rolling}
            className="px-4 py-2 bg-warning-500 hover:bg-warning-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {rolling ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Rolling back...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4" />
                Rollback to Revision {selectedRevision}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
