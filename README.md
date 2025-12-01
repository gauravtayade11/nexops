# NexOps - DevOps Operations Center

A comprehensive Kubernetes management dashboard built with FastAPI and React. Monitor, manage, and interact with your Kubernetes clusters through an intuitive web interface.

## Features

### Kubernetes Management
- **Dashboard**: Real-time cluster health overview with pod, node, and namespace statistics
- **Workloads**: View and manage Pods, Deployments, StatefulSets, DaemonSets, Jobs, and CronJobs
- **Resources**: Browse ConfigMaps, Secrets, PVCs, Services, Ingresses, and HPAs
- **Nodes**: Detailed node information including conditions, capacity, and resource usage
- **Metrics**: Cluster-wide CPU and memory metrics (requires metrics-server)

### Interactive Features
- **Pod Logs**: Real-time log viewer with container selection and filtering
- **Pod Exec**: Execute commands inside running containers
- **YAML Deploy**: Apply Kubernetes manifests with dry-run validation
- **Kubectl Terminal**: Execute kubectl commands directly from the browser
- **Shell Terminal**: Full shell access for advanced operations

## Prerequisites

- Python 3.10+
- Node.js 18+
- Access to a Kubernetes cluster (local or remote)
- kubectl configured with cluster access

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NexOps
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:3000`

## Configuration

### Environment Variables (backend/.env)

```env
# Application
APP_NAME=NexOps Center
APP_VERSION=1.0.0
DEBUG=false
API_PREFIX=/api/v1

# Kubernetes
K8S_CONFIG_PATH=~/.kube/config    # Path to kubeconfig file
K8S_IN_CLUSTER=false              # Set to true when running inside K8s

# AI Provider (optional - for incident analysis)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-api-key
```

### Kubernetes Access

**Local Development:**
- Ensure kubectl is installed and configured
- Set `K8S_CONFIG_PATH` to your kubeconfig location

**Running in Kubernetes:**
- Set `K8S_IN_CLUSTER=true`
- Configure appropriate RBAC permissions for the service account

## Docker Compose (Recommended)

The easiest way to run NexOps:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access at `http://localhost:3000`

## Project Structure

```
NexOps/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # API endpoints
│   │   ├── core/            # Configuration
│   │   ├── schemas/         # Pydantic models
│   │   └── services/        # Business logic
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── k8s/                     # Kubernetes manifests
│   ├── namespace.yaml
│   ├── rbac.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── docker-compose.yml
└── README.md
```

## API Endpoints

### Kubernetes Resources
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/kubernetes/health` | GET | Cluster health status |
| `/api/v1/kubernetes/namespaces` | GET | List namespaces |
| `/api/v1/kubernetes/pods` | GET | List pods |
| `/api/v1/kubernetes/deployments` | GET | List deployments |
| `/api/v1/kubernetes/services` | GET | List services |
| `/api/v1/kubernetes/nodes` | GET | List nodes |
| `/api/v1/kubernetes/metrics` | GET | Cluster metrics |

### Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/kubernetes/scale` | POST | Scale deployment |
| `/api/v1/kubernetes/restart` | POST | Restart deployment |
| `/api/v1/kubernetes/apply` | POST | Apply YAML manifest |
| `/api/v1/kubernetes/kubectl` | POST | Execute kubectl command |
| `/api/v1/kubernetes/shell` | POST | Execute shell command |

### Pod Operations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/kubernetes/pods/{ns}/{pod}/logs` | GET | Get pod logs |
| `/api/v1/kubernetes/pods/{ns}/{pod}/exec` | POST | Execute command in pod |

## Deployment to Kubernetes

### 1. Build Docker Images

```bash
# Backend
docker build -t nexops-backend:1.0.0 ./backend

# Frontend
docker build -t nexops-frontend:1.0.0 ./frontend

# Push to your registry (optional)
docker tag nexops-backend:1.0.0 your-registry/nexops-backend:1.0.0
docker push your-registry/nexops-backend:1.0.0
```

### 2. Deploy to Kubernetes

Apply the manifests in order:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Setup RBAC (required for cluster access)
kubectl apply -f k8s/rbac.yaml

# Deploy services
kubectl apply -f k8s/service.yaml

# Deploy applications
kubectl apply -f k8s/deployment.yaml

# Optional: Create ingress
kubectl apply -f k8s/ingress.yaml
```

Or apply all at once:

```bash
kubectl apply -f k8s/
```

### 3. Access the Application

**Port Forward (for testing):**
```bash
kubectl port-forward -n nexops svc/nexops-frontend 3000:80
```

**Via Ingress:**
- Update `k8s/ingress.yaml` with your domain
- Access via configured hostname

## Security Considerations

- The shell terminal blocks dangerous commands (rm -rf /, sudo, etc.)
- kubectl terminal blocks destructive operations (delete --all, drain, etc.)
- Secrets are displayed as key names only, not values
- Configure appropriate RBAC when deploying to Kubernetes

## Tech Stack

- **Backend**: FastAPI, Python 3.10+, kubernetes-client
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Icons**: Heroicons

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
