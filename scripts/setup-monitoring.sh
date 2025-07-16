#!/bin/bash
# Скрипт для настройки мониторинга и логирования VHM24
# Этап 2: Настройка мониторинга и логирования

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Проверка наличия необходимых утилит
check_dependencies() {
    log "Проверка наличия необходимых утилит..."
    
    for cmd in docker docker-compose curl wget jq; do
        if ! command -v $cmd &> /dev/null; then
            error "Утилита $cmd не установлена. Пожалуйста, установите ее и запустите скрипт снова."
        fi
    done
    
    log "Все необходимые утилиты установлены."
}

# 2.1. Настройка мониторинга
setup_monitoring() {
    log "Настройка мониторинга..."
    
    # Создание директорий для данных
    mkdir -p ./monitoring/prometheus
    mkdir -p ./monitoring/grafana/data
    mkdir -p ./monitoring/grafana/provisioning/dashboards
    mkdir -p ./monitoring/grafana/provisioning/datasources
    mkdir -p ./monitoring/alertmanager
    
    # Создание docker-compose.yml для мониторинга
    cat > ./monitoring/docker-compose.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring-network

  node-exporter:
    image: prom/node-exporter:latest
    restart: always
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring-network

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    restart: always
    ports:
      - "3001:3000"
    volumes:
      - ./grafana/data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_ADMIN_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - monitoring-network

  alertmanager:
    image: prom/alertmanager:latest
    restart: always
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge
EOF
    
    log "Docker Compose файл для мониторинга создан."
    
    # Создание конфигурации Prometheus
    cat > ./monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'api'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api:3000']

  - job_name: 'bot'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['bot:3001']
EOF
    
    log "Конфигурация Prometheus создана."
    
    # Создание директории для правил Prometheus
    mkdir -p ./monitoring/prometheus/rules
    
    # Создание правил оповещений Prometheus
    cat > ./monitoring/prometheus/rules/alerts.yml << 'EOF'
groups:
  - name: vhm24_alerts
    rules:
      - alert: HighCPULoad
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU load (instance {{ $labels.instance }})"
          description: "CPU load is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

      - alert: HighMemoryLoad
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory load (instance {{ $labels.instance }})"
          description: "Memory load is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes{fstype=~"ext4|xfs"} - node_filesystem_free_bytes{fstype=~"ext4|xfs"}) / node_filesystem_size_bytes{fstype=~"ext4|xfs"} * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High disk usage (instance {{ $labels.instance }})"
          description: "Disk usage is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Instance down (instance {{ $labels.instance }})"
          description: "Instance has been down for more than 5 minutes\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

      - alert: APIHighResponseTime
        expr: http_request_duration_seconds{job="api"} > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "API high response time (instance {{ $labels.instance }})"
          description: "API response time is > 1s\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"
EOF
    
    log "Правила оповещений Prometheus созданы."
    
    # Создание конфигурации Alertmanager
    cat > ./monitoring/alertmanager/alertmanager.yml << 'EOF'
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@vhm24.com'
  smtp_auth_username: 'alertmanager@vhm24.com'
  smtp_auth_password: 'your_password_here'
  smtp_require_tls: true

route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'email'
  routes:
    - match:
        severity: critical
      receiver: 'pager'
      continue: true

receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@vhm24.com'
        send_resolved: true

  - name: 'pager'
    email_configs:
      - to: 'admin@vhm24.com, oncall@vhm24.com'
        send_resolved: true
    webhook_configs:
      - url: 'https://api.telegram.org/bot<your_bot_token>/sendMessage?chat_id=<your_chat_id>&text={{ .CommonAnnotations.summary }}'
        send_resolved: true

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
EOF
    
    log "Конфигурация Alertmanager создана. Пожалуйста, замените значения SMTP и Telegram на реальные."
    
    # Создание источника данных Grafana
    mkdir -p ./monitoring/grafana/provisioning/datasources
    
    cat > ./monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF
    
    log "Источник данных Grafana создан."
    
    # Создание дашбордов Grafana
    mkdir -p ./monitoring/grafana/provisioning/dashboards
    
    cat > ./monitoring/grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'VHM24 Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
    
    # Создание дашборда для системы
    cat > ./monitoring/grafana/provisioning/dashboards/system.json << 'EOF'
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "100 - (avg by(instance) (irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
          "interval": "",
          "legendFormat": "CPU Usage",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "CPU Usage",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percent",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100",
          "interval": "",
          "legendFormat": "Memory Usage",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Memory Usage",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percent",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "hiddenSeries": false,
      "id": 6,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "(node_filesystem_size_bytes{fstype=~\"ext4|xfs\"} - node_filesystem_free_bytes{fstype=~\"ext4|xfs\"}) / node_filesystem_size_bytes{fstype=~\"ext4|xfs\"} * 100",
          "interval": "",
          "legendFormat": "Disk Usage - {{mountpoint}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Disk Usage",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "percent",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 8
      },
      "hiddenSeries": false,
      "id": 8,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "rate(node_network_receive_bytes_total[5m])",
          "interval": "",
          "legendFormat": "Received - {{device}}",
          "refId": "A"
        },
        {
          "expr": "rate(node_network_transmit_bytes_total[5m])",
          "interval": "",
          "legendFormat": "Transmitted - {{device}}",
          "refId": "B"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Network Traffic",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "bytes",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "refresh": "10s",
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "System Monitoring",
  "uid": "system",
  "version": 1
}
EOF
    
    log "Дашборд для системы создан."
    
    # Создание дашборда для API
    cat > ./monitoring/grafana/provisioning/dashboards/api.json << 'EOF'
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 2,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "rate(http_request_duration_seconds_count{job=\"api\"}[5m])",
          "interval": "",
          "legendFormat": "{{method}} {{route}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "API Request Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "reqps",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 4,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "http_request_duration_seconds{job=\"api\", quantile=\"0.5\"}",
          "interval": "",
          "legendFormat": "{{method}} {{route}} (p50)",
          "refId": "A"
        },
        {
          "expr": "http_request_duration_seconds{job=\"api\", quantile=\"0.9\"}",
          "interval": "",
          "legendFormat": "{{method}} {{route}} (p90)",
          "refId": "B"
        },
        {
          "expr": "http_request_duration_seconds{job=\"api\", quantile=\"0.99\"}",
          "interval": "",
          "legendFormat": "{{method}} {{route}} (p99)",
          "refId": "C"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "API Response Time",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "s",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "custom": {}
        },
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 8
      },
      "hiddenSeries": false,
      "id": 6,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.3.7",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "rate(http_request_errors_total{job=\"api\"}[5m])",
          "interval": "",
          "legendFormat": "{{method}} {{route}}",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "API Error Rate",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "refresh": "10s",
  "schemaVersion": 26,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": []
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "API Monitoring",
  "uid": "api",
  "version": 1
}
EOF
    
    log "Дашборд для API создан."
    
    log "Настройка мониторинга завершена."
}

# 2.2. Настройка логирования
setup_logging() {
    log "Настройка логирования..."
    
    # Создание директорий для данных
    mkdir -p ./logging/elasticsearch/data
    mkdir -p ./logging/logstash/config
    mkdir -p ./logging/logstash/pipeline
    mkdir -p ./logging/kibana
    
    # Создание docker-compose.yml для логирования
    cat > ./logging/docker-compose.yml << 'EOF'
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.10.0
    restart: always
    ports:
      - "9200:9200"
      - "9300:9300"
    environment:
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./elasticsearch/data:/usr/share/elasticsearch/data
    networks:
      - logging-network

  logstash:
    image: docker.elastic.co/logstash/logstash:7.10.0
    restart: always
    ports:
      - "5000:5000"
      - "9600:9600"
    environment:
      - "LS_JAVA_OPTS=-Xms256m -Xmx256m"
    volumes:
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    networks:
      - logging-network
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:7.10.0
    restart: always
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - logging-network
    depends_on:
      - elasticsearch

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.10.0
    restart: always
    user: root
    volumes:
      - ./filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ../logs:/logs:ro
    networks:
      - logging-network
    depends_on:
      - elasticsearch
      - logstash

networks:
  logging-network:
    driver: bridge
EOF
    
    log "Docker Compose файл для логирования создан."
    
    # Создание конфигурации Logstash
    mkdir -p ./logging/logstash/config
    
    cat > ./logging/logstash/config/logstash.yml << 'EOF'
http.host: "0.0.0.0"
xpack.monitoring.elasticsearch.hosts: [ "http://elasticsearch:9200" ]
EOF
    
    # Создание пайплайна Logstash
    mkdir -p ./logging/logstash/pipeline
    
    cat > ./logging/logstash/pipeline/logstash.conf << 'EOF'
input {
  beats {
    port => 5000
  }
}

filter {
  if [fields][log_type] == "api" {
    json {
      source => "message"
    }
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
  else if [fields][log_type] == "bot" {
    json {
      source => "message"
    }
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
  else if [fields][log_type] == "nginx" {
    grok {
      match => { "message" => "%{COMBINEDAPACHELOG}" }
    }
    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "%{[fields][log_type]}-%{+YYYY.MM.dd}"
  }
}
EOF
    
    log "Конфигурация Logstash создана."
    
    # Создание конфигурации Filebeat
    mkdir -p ./logging/filebeat
    
    cat > ./logging/filebeat/filebeat.yml << 'EOF'
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /logs/api/*.log
  fields:
    log_type: api
  fields_under_root: true
  json.keys_under_root: true

- type: log
  enabled: true
  paths:
    - /logs/bot/*.log
  fields:
    log_type: bot
  fields_under_root: true
  json.keys_under_root: true

- type: log
  enabled: true
  paths:
    - /logs/nginx/*.log
  fields:
    log_type: nginx
  fields_under_root: true

filebeat.config.modules:
  path: ${path.config}/modules.d/*.yml
  reload.enabled: false

setup.template.settings:
  index.number_of_shards: 1
  index.number_of_replicas: 0

setup.kibana:
  host: "kibana:5601"

output.logstash:
  hosts: ["logstash:5000"]
EOF
    
    log "Конфигурация Filebeat создана."
    
    log "Настройка логирования завершена."
}

# 2.3. Настройка оповещений
setup_alerts() {
    log "Настройка оповещений..."
    
    # Создание директории для скриптов оповещений
    mkdir -p ./scripts/alerts
    
    # Создание скрипта для отправки оповещений по email
    cat > ./scripts/alerts/send-email.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 3 ]; then
    echo "Использование: $0 <получатель> <тема> <сообщение>"
    exit 1
fi

RECIPIENT=$1
SUBJECT=$2
MESSAGE=$3

# Отправка email
echo "$MESSAGE" | mail -s "$SUBJECT" "$RECIPIENT"

echo "Email отправлен на адрес $RECIPIENT"
EOF
    
    chmod +x ./scripts/alerts/send-email.sh
    
    log "Скрипт для отправки оповещений по email создан."
    
    # Создание скрипта для отправки оповещений в Telegram
    cat > ./scripts/alerts/send-telegram.sh << 'EOF'
#!/bin/bash

# Проверка наличия аргументов
if [ $# -ne 3 ]; then
    echo "Использование: $0 <bot_token> <chat_id> <сообщение>"
    exit 1
fi

BOT_TOKEN=$1
CHAT_ID=$2
MESSAGE=$3

# Отправка сообщения в Telegram
curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
    -d chat_id="$CHAT_ID" \
    -d text="$MESSAGE" \
    -d parse_mode="HTML"

echo "Сообщение отправлено в Telegram"
EOF
    
    chmod +x ./scripts/alerts/send-telegram.sh
    
    log "Скрипт для отправки оповещений в Telegram создан."
    
    log "Настройка оповещений завершена."
}

# Основная функция
main() {
    log "Начало настройки мониторинга и логирования VHM24..."
    
    check_dependencies
    setup_monitoring
    setup_logging
    setup_alerts
    
    log "Настройка мониторинга и логирования VHM24 завершена."
    log "Пожалуйста, отредактируйте созданные файлы конфигурации, заменив значения по умолчанию на реальные."
    log "После этого выполните следующие команды для запуска систем мониторинга и логирования:"
    log "1. cd ./monitoring && docker-compose up -d"
    log "2. cd ./logging && docker-compose up -d"
}

# Запуск основной функции
main
