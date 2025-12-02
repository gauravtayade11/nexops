import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { clustersApi } from '../services/api';
import type { ClusterInfo } from '../types';

interface ClusterContextType {
  clusters: ClusterInfo[];
  activeCluster: ClusterInfo | null;
  loading: boolean;
  error: string | null;
  setActiveCluster: (clusterId: string) => Promise<void>;
  refreshClusters: () => Promise<void>;
}

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

export function ClusterProvider({ children }: { children: ReactNode }) {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [activeCluster, setActiveClusterState] = useState<ClusterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clustersApi.list();
      const data = response.data;
      setClusters(data.clusters);

      // Find and set the active cluster
      const active = data.clusters.find(c => c.is_active);
      if (active) {
        setActiveClusterState(active);
      } else if (data.clusters.length > 0) {
        // If no active cluster, set the first one as active
        setActiveClusterState(data.clusters[0]);
      }
    } catch (err) {
      console.error('Failed to fetch clusters:', err);
      setError('Failed to load clusters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const setActiveCluster = useCallback(async (clusterId: string) => {
    try {
      setError(null);
      await clustersApi.setActive(clusterId);

      // Update local state
      const cluster = clusters.find(c => c.id === clusterId);
      if (cluster) {
        setActiveClusterState(cluster);
        // Update clusters list to reflect new active state
        setClusters(prev => prev.map(c => ({
          ...c,
          is_active: c.id === clusterId
        })));
      }
    } catch (err) {
      console.error('Failed to set active cluster:', err);
      setError('Failed to switch cluster');
      throw err;
    }
  }, [clusters]);

  const refreshClusters = useCallback(async () => {
    await fetchClusters();
  }, [fetchClusters]);

  return (
    <ClusterContext.Provider value={{
      clusters,
      activeCluster,
      loading,
      error,
      setActiveCluster,
      refreshClusters
    }}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useCluster() {
  const context = useContext(ClusterContext);
  if (context === undefined) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
}
