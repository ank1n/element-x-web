# Deployment Guide

Руководство по деплою Element X Web на production сервер.

---

## Prerequisites

- Docker 20.10+
- Kubernetes 1.24+
- Nginx Ingress Controller
- SSL/TLS сертификаты

---

## Build Production Image

### 1. Build Frontend

```bash
# Install dependencies
yarn install

# Build production bundle
yarn build

# Bundle size optimization
yarn analyse:webpack-bundles
```

### 2. Create Docker Image

```dockerfile
# Dockerfile
FROM nginx:alpine

# Copy built files
COPY webapp /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build image
docker build -t element-x-web:v1.11.96-custom .

# Tag for registry
docker tag element-x-web:v1.11.96-custom registry.implica.ru/element-x-web:latest

# Push to registry
docker push registry.implica.ru/element-x-web:latest
```

---

## Kubernetes Deployment

### 1. Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: element-x-web
```

### 2. ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: element-x-web-config
  namespace: element-x-web
data:
  config.json: |
    {
      "default_server_config": {
        "m.homeserver": {
          "base_url": "https://matrix.implica.ru",
          "server_name": "implica.ru"
        }
      },
      "brand": "Element X",
      "recording_api_base_url": "https://api.market.implica.ru/api/recording",
      "enable_call_recording": true,
      "enable_contacts_tab": true,
      "enable_calls_tab": true,
      "enable_apps_tab": true,
      "apps": [
        {
          "id": "security",
          "name": "Security Portal",
          "url": "https://ozzy.implica.ru/security/",
          "icon": "🔒",
          "description": "Monitor security incidents",
          "isPinned": true
        },
        {
          "id": "labeling",
          "name": "Flow Labeling",
          "url": "https://ozzy.implica.ru/labeling/",
          "icon": "🏷️",
          "description": "Label network flows",
          "isPinned": false
        },
        {
          "id": "mlops",
          "name": "MLOps Dashboard",
          "url": "https://ozzy.implica.ru/mlops/",
          "icon": "📊",
          "description": "ML model monitoring",
          "isPinned": false
        }
      ]
    }
```

### 3. Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: element-x-web
  namespace: element-x-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: element-x-web
  template:
    metadata:
      labels:
        app: element-x-web
    spec:
      containers:
      - name: element-x-web
        image: registry.implica.ru/element-x-web:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        volumeMounts:
        - name: config
          mountPath: /usr/share/nginx/html/config.json
          subPath: config.json
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: config
        configMap:
          name: element-x-web-config
```

### 4. Service

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: element-x-web
  namespace: element-x-web
spec:
  selector:
    app: element-x-web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 5. Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: element-x-web
  namespace: element-x-web
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.implica.ru
    secretName: element-x-web-tls
  rules:
  - host: app.implica.ru
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: element-x-web
            port:
              number: 80
```

---

## Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n element-x-web
kubectl get svc -n element-x-web
kubectl get ingress -n element-x-web

# View logs
kubectl logs -f deployment/element-x-web -n element-x-web

# Check pod health
kubectl describe pod <pod-name> -n element-x-web
```

---

## Nginx Configuration

```nginx
# nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass https://api.market.implica.ru/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run tests
        run: yarn test --coverage

      - name: Build production bundle
        run: yarn build

      - name: Build Docker image
        run: |
          docker build -t registry.implica.ru/element-x-web:${{ github.sha }} .
          docker tag registry.implica.ru/element-x-web:${{ github.sha }} \
                     registry.implica.ru/element-x-web:latest

      - name: Push to registry
        run: |
          echo "${{ secrets.REGISTRY_PASSWORD }}" | docker login registry.implica.ru \
            -u "${{ secrets.REGISTRY_USERNAME }}" --password-stdin
          docker push registry.implica.ru/element-x-web:${{ github.sha }}
          docker push registry.implica.ru/element-x-web:latest

      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
          namespace: element-x-web
          manifests: |
            k8s/deployment.yaml
          images: registry.implica.ru/element-x-web:${{ github.sha }}
```

---

## Environment Variables

```bash
# .env.production
PUBLIC_URL=https://app.implica.ru
REACT_APP_MATRIX_HOMESERVER=https://matrix.implica.ru
REACT_APP_RECORDING_API=https://api.market.implica.ru/api/recording
REACT_APP_ENABLE_RECORDING=true
```

---

## Health Checks

```bash
# Check application health
curl https://app.implica.ru/

# Check API connectivity
curl https://api.market.implica.ru/api/recording/health

# Check Matrix homeserver
curl https://matrix.implica.ru/_matrix/client/versions
```

---

## Monitoring

### Prometheus Metrics

```yaml
# prometheus.yaml
scrape_configs:
  - job_name: 'element-x-web'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - element-x-web
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: element-x-web
```

### Grafana Dashboard

Import dashboard: `grafana/element-x-web-dashboard.json`

**Metrics:**
- Request rate
- Response time (p50, p95, p99)
- Error rate
- Active users
- Call recording success rate

---

## Troubleshooting

### Pod not starting

```bash
kubectl describe pod <pod-name> -n element-x-web
kubectl logs <pod-name> -n element-x-web
```

### Ingress issues

```bash
kubectl describe ingress element-x-web -n element-x-web
kubectl get svc -n ingress-nginx
```

### Config issues

```bash
kubectl get configmap element-x-web-config -n element-x-web -o yaml
```

---

## Rollback

```bash
# List deployments
kubectl rollout history deployment/element-x-web -n element-x-web

# Rollback to previous version
kubectl rollout undo deployment/element-x-web -n element-x-web

# Rollback to specific revision
kubectl rollout undo deployment/element-x-web -n element-x-web --to-revision=2
```

---

**Last Updated:** 2026-01-30
