import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/dashboard/Dashboard';
import KubernetesView from './components/dashboard/KubernetesView';
import IncidentList from './components/incidents/IncidentList';
import IncidentDetail from './components/incidents/IncidentDetail';
import Timeline from './components/timeline/Timeline';
import SelfServicePortal from './components/selfservice/SelfServicePortal';
import ReleaseManager from './components/selfservice/ReleaseManager';
import NodesView from './components/kubernetes/NodesView';
import ClusterMetrics from './components/kubernetes/ClusterMetrics';
import KubernetesResourcesView from './components/kubernetes/KubernetesResourcesView';
import YAMLDeploy from './components/kubernetes/YAMLDeploy';
import KubectlTerminal from './components/kubernetes/KubectlTerminal';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kubernetes" element={<KubernetesView />} />
        <Route path="/kubernetes/nodes" element={<NodesView />} />
        <Route path="/kubernetes/metrics" element={<ClusterMetrics />} />
        <Route path="/kubernetes/resources" element={<KubernetesResourcesView />} />
        <Route path="/kubernetes/deploy" element={<YAMLDeploy />} />
        <Route path="/kubernetes/terminal" element={<KubectlTerminal />} />
        <Route path="/incidents" element={<IncidentList />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/selfservice" element={<SelfServicePortal />} />
        <Route path="/releases" element={<ReleaseManager />} />
      </Routes>
    </Layout>
  );
}

export default App;
