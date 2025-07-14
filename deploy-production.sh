#!/bin/bash

# VHM24 Production Deployment Script
# Enterprise-grade automated deployment for VHM24 platform

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="vhm24-production"
CLUSTER_NAME="vhm24-production-cluster"
REGION="us-west-2"
DOMAIN="vhm24.com"
BACKUP_BUCKET="vhm24-production-backups"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if running as root
check_permissions() {
    log "Checking deployment permissions..."
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
    log_success "Permission check passed"
}

# Check prerequisites
check_prerequisites() {
    log_header "🔍 CHECKING PREREQUISITES"
    
    local missing_tools=()
    
    # Check required tools
    for tool in kubectl helm docker kustomize; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=($tool)
        else
            log_success "$tool is installed"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log "Please install missing tools and run again"
        exit 1
    fi
    
    # Check environment variables
    local required_vars=(
        "DB_PASSWORD"
        "REDIS_PASSWORD" 
        "JWT_SECRET"
        "TELEGRAM_BOT_TOKEN"
        "GRAFANA_PASSWORD"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Environment variable $var is not set"
            exit 1
        else
            log_success "Environment variable $var is set"
        fi
    done
}

# Setup Kubernetes cluster
setup_cluster() {
    log_header "☸️ SETTING UP KUBERNETES CLUSTER"
    
    log "Configuring kubectl context..."
    if kubectl config current-context | grep -q "$CLUSTER_NAME"; then
        log_success "Already connected to $CLUSTER_NAME"
    else
        log "Updating kubeconfig..."
        aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
        log_success "Kubeconfig updated"
    fi
    
    # Verify cluster connectivity
    log "Verifying cluster connectivity..."
    if kubectl cluster-info &> /dev/null; then
        log_success "Cluster connectivity verified"
    else
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    # Create namespace if it doesn't exist
    log "Creating namespace if needed..."
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    log_success "Namespace $NAMESPACE ready"
}

# Install Helm charts
install_helm_charts() {
    log_header "📦 INSTALLING HELM CHARTS"
    
    # Add Helm repositories
    log "Adding Helm repositories..."
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    log_success "Helm repositories updated"
    
    # Install NGINX Ingress Controller
    log "Installing NGINX Ingress Controller..."
    helm upgrade --install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --set controller.replicaCount=3 \
        --set controller.service.type=LoadBalancer \
        --set controller.metrics.enabled=true \
        --wait
    log_success "NGINX Ingress Controller installed"
    
    # Install Cert Manager
    log "Installing Cert Manager..."
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.2 \
        --set installCRDs=true \
        --wait
    log_success "Cert Manager installed"
}

# Deploy database
deploy_database() {
    log_header "🗄️ DEPLOYING DATABASE"
    
    log "Applying database configuration..."
    kubectl apply -f k8s/production/database.yaml
    
    log "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
    
    log "Running database migrations..."
    kubectl exec -n $NAMESPACE deployment/backend -- npm run migrate:deploy
    
    log_success "Database deployed and migrated"
}

# Deploy Redis
deploy_redis() {
    log_header "🔴 DEPLOYING REDIS"
    
    log "Applying Redis configuration..."
    kubectl apply -f k8s/production/redis.yaml
    
    log "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=180s
    
    log_success "Redis deployed successfully"
}

# Deploy backend services
deploy_backend() {
    log_header "🖥️ DEPLOYING BACKEND SERVICES"
    
    log "Applying backend configuration..."
    kubectl apply -f k8s/production/backend.yaml
    
    log "Waiting for backend to be ready..."
    kubectl wait --for=condition=ready pod -l app=backend -n $NAMESPACE --timeout=300s
    
    log "Applying WebSocket server configuration..."
    kubectl apply -f k8s/production/websocket.yaml
    
    log "Waiting for WebSocket server to be ready..."
    kubectl wait --for=condition=ready pod -l app=websocket -n $NAMESPACE --timeout=180s
    
    log_success "Backend services deployed"
}

# Deploy monitoring
deploy_monitoring() {
    log_header "📊 DEPLOYING MONITORING STACK"
    
    log "Applying monitoring configuration..."
    kubectl apply -f k8s/production/monitoring.yaml
    
    log "Waiting for Prometheus to be ready..."
    kubectl wait --for=condition=ready pod -l app=prometheus -n $NAMESPACE --timeout=300s
    
    log "Waiting for Grafana to be ready..."
    kubectl wait --for=condition=ready pod -l app=grafana -n $NAMESPACE --timeout=300s
    
    log_success "Monitoring stack deployed"
}

# Deploy applications
deploy_applications() {
    log_header "📱 DEPLOYING APPLICATIONS"
    
    # Deploy Telegram Bot
    log "Deploying Telegram Bot..."
    kubectl apply -f k8s/production/telegram-bot.yaml
    kubectl wait --for=condition=ready pod -l app=telegram-bot -n $NAMESPACE --timeout=180s
    
    # Deploy Dashboard
    log "Deploying Web Dashboard..."
    kubectl apply -f k8s/production/dashboard.yaml
    kubectl wait --for=condition=ready pod -l app=dashboard -n $NAMESPACE --timeout=180s
    
    log_success "Applications deployed"
}

# Setup SSL certificates
setup_ssl() {
    log_header "🔒 SETTING UP SSL CERTIFICATES"
    
    log "Creating ClusterIssuer for Let's Encrypt..."
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@${DOMAIN}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

    log "Creating Ingress with SSL..."
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vhm24-ingress
  namespace: $NAMESPACE
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - ${DOMAIN}
    - api.${DOMAIN}
    - ws.${DOMAIN}
    - grafana.${DOMAIN}
    secretName: vhm24-tls
  rules:
  - host: ${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dashboard-service
            port:
              number: 80
  - host: api.${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
  - host: ws.${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: websocket-service
            port:
              number: 8080
  - host: grafana.${DOMAIN}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grafana-service
            port:
              number: 80
EOF

    log_success "SSL certificates configured"
}

# Setup backups
setup_backups() {
    log_header "💾 SETTING UP BACKUP SYSTEM"
    
    log "Creating backup CronJob..."
    cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: $NAMESPACE
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/bash
            - -c
            - |
              export PGPASSWORD="\$DB_PASSWORD"
              BACKUP_FILE="/backup/vhm24-\$(date +%Y%m%d-%H%M%S).sql"
              pg_dump -h postgres-service -U vhm24_admin -d vhm24_production > \$BACKUP_FILE
              gzip \$BACKUP_FILE
              aws s3 cp \${BACKUP_FILE}.gz s3://${BACKUP_BUCKET}/database/
              find /backup -name "*.sql.gz" -mtime +7 -delete
            env:
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: aws-credentials
                  key: secret-access-key
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
EOF

    log_success "Backup system configured"
}

# Run health checks
run_health_checks() {
    log_header "🏥 RUNNING HEALTH CHECKS"
    
    # Check API health
    log "Checking API health..."
    for i in {1..30}; do
        if kubectl exec -n $NAMESPACE deployment/backend -- curl -f http://localhost:3000/health &> /dev/null; then
            log_success "API health check passed"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "API health check failed"
            exit 1
        fi
        sleep 10
    done
    
    # Check WebSocket health
    log "Checking WebSocket health..."
    for i in {1..30}; do
        if kubectl exec -n $NAMESPACE deployment/websocket -- curl -f http://localhost:8080/health &> /dev/null; then
            log_success "WebSocket health check passed"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "WebSocket health check failed"
            exit 1
        fi
        sleep 10
    done
    
    # Check database connectivity
    log "Checking database connectivity..."
    if kubectl exec -n $NAMESPACE statefulset/postgres -- pg_isready -U vhm24_admin &> /dev/null; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        exit 1
    fi
    
    # Check Redis connectivity
    log "Checking Redis connectivity..."
    if kubectl exec -n $NAMESPACE deployment/redis -- redis-cli ping | grep -q "PONG"; then
        log_success "Redis connectivity check passed"
    else
        log_error "Redis connectivity check failed"
        exit 1
    fi
}

# Setup monitoring alerts
setup_alerts() {
    log_header "🚨 SETTING UP MONITORING ALERTS"
    
    log "Configuring Prometheus alerts..."
    # Alerts are already configured in monitoring.yaml
    
    log "Testing alert rules..."
    kubectl exec -n $NAMESPACE deployment/prometheus -- promtool check rules /etc/prometheus/rules/vhm24-alerts.yml
    
    log_success "Monitoring alerts configured"
}

# Performance testing
run_performance_tests() {
    log_header "⚡ RUNNING PERFORMANCE TESTS"
    
    log "Running basic load test..."
    kubectl run loadtest --image=nginx --rm -it --restart=Never -- \
        sh -c "for i in \$(seq 1 100); do curl -s http://backend-service.$NAMESPACE.svc.cluster.local/health > /dev/null && echo -n .; done; echo"
    
    log_success "Performance tests completed"
}

# Deployment summary
deployment_summary() {
    log_header "📋 DEPLOYMENT SUMMARY"
    
    echo -e "${CYAN}VHM24 Enterprise Platform - Production Deployment Complete!${NC}\n"
    
    # Get service URLs
    DASHBOARD_URL="https://${DOMAIN}"
    API_URL="https://api.${DOMAIN}"
    WEBSOCKET_URL="wss://ws.${DOMAIN}"
    GRAFANA_URL="https://grafana.${DOMAIN}"
    
    echo -e "${GREEN}🌐 Service URLs:${NC}"
    echo -e "   Dashboard:  $DASHBOARD_URL"
    echo -e "   API:        $API_URL"
    echo -e "   WebSocket:  $WEBSOCKET_URL"
    echo -e "   Grafana:    $GRAFANA_URL"
    echo ""
    
    echo -e "${GREEN}📊 Deployed Components:${NC}"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""
    
    echo -e "${GREEN}🔧 Useful Commands:${NC}"
    echo -e "   View logs:           kubectl logs -f deployment/backend -n $NAMESPACE"
    echo -e "   Scale backend:       kubectl scale deployment backend --replicas=5 -n $NAMESPACE"
    echo -e "   Check health:        kubectl get pods -n $NAMESPACE"
    echo -e "   Access Grafana:      kubectl port-forward svc/grafana-service 3000:80 -n $NAMESPACE"
    echo ""
    
    echo -e "${GREEN}📈 Monitoring:${NC}"
    echo -e "   Prometheus: kubectl port-forward svc/prometheus-service 9090:9090 -n $NAMESPACE"
    echo -e "   Grafana:    kubectl port-forward svc/grafana-service 3001:80 -n $NAMESPACE"
    echo ""
    
    log_success "VHM24 Enterprise Platform is now running in production! 🚀"
}

# Rollback function
rollback_deployment() {
    log_error "Deployment failed, initiating rollback..."
    
    kubectl rollout undo deployment/backend -n $NAMESPACE
    kubectl rollout undo deployment/websocket -n $NAMESPACE
    kubectl rollout undo deployment/telegram-bot -n $NAMESPACE
    kubectl rollout undo deployment/dashboard -n $NAMESPACE
    
    log_warning "Rollback completed"
    exit 1
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Error handling
trap rollback_deployment ERR
trap cleanup EXIT

# Main deployment function
main() {
    log_header "🚀 VHM24 ENTERPRISE PLATFORM - PRODUCTION DEPLOYMENT"
    
    echo -e "${CYAN}Starting production deployment of VHM24 Enterprise Platform...${NC}"
    echo -e "${CYAN}Target: $CLUSTER_NAME in $REGION${NC}"
    echo -e "${CYAN}Domain: $DOMAIN${NC}\n"
    
    # Confirm deployment
    read -p "Are you sure you want to deploy to production? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Deployment cancelled by user"
        exit 0
    fi
    
    # Run deployment steps
    check_permissions
    check_prerequisites
    setup_cluster
    install_helm_charts
    deploy_database
    deploy_redis
    deploy_backend
    deploy_monitoring
    deploy_applications
    setup_ssl
    setup_backups
    run_health_checks
    setup_alerts
    run_performance_tests
    deployment_summary
    
    log_success "🎉 VHM24 Enterprise Platform deployed successfully!"
}

# Run main function
main "$@"
