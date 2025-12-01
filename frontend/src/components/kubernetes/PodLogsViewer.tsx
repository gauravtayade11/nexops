import { useState, useEffect, useRef } from 'react';
import {
  DocumentTextIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { kubernetesApi } from '../../services/api';
import type { Pod, PodLogs } from '../../types';

interface PodLogsViewerProps {
  pod: Pod;
  onClose: () => void;
}

export default function PodLogsViewer({ pod, onClose }: PodLogsViewerProps) {
  const [logs, setLogs] = useState<PodLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContainer, setSelectedContainer] = useState(pod.containers[0] || '');
  const [tailLines, setTailLines] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [showPrevious, setShowPrevious] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLogs();
  }, [selectedContainer, tailLines, showTimestamps, showPrevious]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, selectedContainer, tailLines]);

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const response = await kubernetesApi.getPodLogs(pod.namespace, pod.name, {
        container: selectedContainer || undefined, // Don't send empty string
        tailLines,
        timestamps: showTimestamps,
        previous: showPrevious,
      });
      setLogs(response.data);
    } catch (err: unknown) {
      // Extract error message from axios error response
      let errorMessage = 'Failed to fetch logs';
      if (err && typeof err === 'object') {
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        if (axiosErr.response?.data?.detail) {
          errorMessage = axiosErr.response.data.detail;
        } else if (axiosErr.message) {
          errorMessage = axiosErr.message;
        }
      }
      setError(errorMessage);
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function scrollToBottom() {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function downloadLogs() {
    if (!logs) return;
    const blob = new Blob([logs.logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pod.namespace}-${pod.name}-${selectedContainer}.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getFilteredLogs() {
    if (!logs || !searchTerm) return logs?.logs || '';
    return logs.logs
      .split('\n')
      .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
      .join('\n');
  }

  function highlightSearch(text: string) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
  }

  const filteredLogs = getFilteredLogs();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-6 w-6 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Pod Logs</h2>
              <p className="text-sm text-gray-500">
                {pod.namespace}/{pod.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-100 bg-gray-50">
          {/* Container selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Container:</label>
            <select
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              {pod.containers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tail lines */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Lines:</label>
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={5000}>5000</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {/* Options */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showTimestamps}
              onChange={(e) => setShowTimestamps(e.target.checked)}
              className="rounded"
            />
            Timestamps
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPrevious}
              onChange={(e) => setShowPrevious(e.target.checked)}
              className="rounded"
            />
            Previous
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>

          {/* Actions */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={downloadLogs}
            disabled={!logs}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Logs content */}
        <div className="flex-1 overflow-auto bg-gray-900 p-4">
          {loading && !logs ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading logs...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400">{error}</div>
            </div>
          ) : (
            <pre
              className="text-sm text-gray-100 font-mono whitespace-pre-wrap break-all"
              dangerouslySetInnerHTML={{ __html: highlightSearch(filteredLogs) }}
            />
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          <div>
            {logs?.truncated && (
              <span className="text-warning-600">Logs truncated - showing last {tailLines} lines</span>
            )}
          </div>
          <button onClick={scrollToBottom} className="text-primary-600 hover:underline">
            Scroll to bottom
          </button>
        </div>
      </div>
    </div>
  );
}
