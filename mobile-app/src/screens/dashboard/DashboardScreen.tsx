import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Surface,
  Text,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import { StatsCard } from '../../components/StatsCard';
import { QuickActions } from '../../components/QuickActions';
import { RecentTasks } from '../../components/RecentTasks';
import { MachineStatusGrid } from '../../components/MachineStatusGrid';
import { AlertsList } from '../../components/AlertsList';

// Services
import { ApiService } from '../../services/ApiService';
import { WebSocketService } from '../../services/WebSocketService';

// Types
import { Analytics, Task, Machine } from '../../types/navigation';

interface DashboardData {
  analytics: Analytics;
  recentTasks: Task[];
  machines: Machine[];
  alerts: any[];
}

export default function DashboardScreen() {
  const navigation = useNavigation(
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null
  const [loading, setLoading] = useState(true
  const [refreshing, setRefreshing] = useState(false

  useEffect(() => {
    loadDashboardData(
    setupWebSocketListeners(
    
    return () => {
      WebSocketService.removeAllListeners(
    };
  }, []

  const loadDashboardData = async () => {
    try {
      const [analytics, tasks, machines, alerts] = await Promise.all([
        ApiService.getAnalytics(),
        ApiService.getRecentTasks(),
        ApiService.getMachines(),
        ApiService.getAlerts(),
      ]

      setDashboardData({
        analytics,
        recentTasks: tasks,
        machines,
        alerts,
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить данные'
      console.error('Dashboard load error:', error
    } finally {
      setLoading(false
      setRefreshing(false
    }
  };

  const setupWebSocketListeners = () => {
    WebSocketService.on('analytics_update', (data: Analytics) => {
      setDashboardData(prev => prev ? { ...prev, analytics: data } : null
    }

    WebSocketService.on('task_update', (task: Task) => {
      setDashboardData(prev => {
        if (!prev) return null;
        const updatedTasks = prev.recentTasks.map(t => 
          t.id === task.id ? task : t
        
        return { ...prev, recentTasks: updatedTasks };
      }
    }

    WebSocketService.on('machine_status_update', (machine: Machine) => {
      setDashboardData(prev => {
        if (!prev) return null;
        const updatedMachines = prev.machines.map(m => 
          m.id === machine.id ? machine : m
        
        return { ...prev, machines: updatedMachines };
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true
    loadDashboardData(
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan_qr':
        navigation.navigate('QRScanner', {
          onScan: (data: string) => {
            Alert.alert('QR Сканирован', `Данные: ${data}`
          }
        }
        break;
      case 'new_task':
        Alert.alert('Новая задача', 'Функция в разработке'
        break;
      case 'incassation':
        navigation.navigate('Incassation', { machineId: 'select' }
        break;
      case 'map_view':
        navigation.navigate('Map', { machines: dashboardData?.machines }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    
  }

  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text>Ошибка загрузки данных</Text>
        <Button onPress={loadDashboardData}>Повторить</Button>
      </View>
    
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with user info */}
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Title>Добро пожаловать!</Title>
            <Paragraph>VHM24 Enterprise Dashboard</Paragraph>
          </View>
          <IconButton
            icon="bell"
            size={24}
            onPress={() => Alert.alert('Уведомления', 'Нет новых уведомлений')}
          />
        </View>
      </Surface>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatsCard
          title="Выручка за день"
          value={`${dashboardData.analytics.totalRevenue.toLocaleString()} ₽`}
          icon="cash-multiple"
          color="#27ae60"
          trend={dashboardData.analytics.revenueGrowth}
        />
        <StatsCard
          title="Активные автоматы"
          value={dashboardData.analytics.totalMachines.toString()}
          icon="robot"
          color="#3498db"
          subtitle={`Uptime: ${dashboardData.analytics.machineUptime}%`}
        />
        <StatsCard
          title="Активные задачи"
          value={dashboardData.analytics.activeTasks.toString()}
          icon="format-list-checks"
          color="#f39c12"
          subtitle="В работе"
        />
        <StatsCard
          title="Эффективность"
          value={`${dashboardData.analytics.operatorEfficiency}%`}
          icon="account-clock"
          color="#e74c3c"
          subtitle="Операторы"
        />
      </View>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Быстрые действия</Title>
          <QuickActions onAction={handleQuickAction} />
        </Card.Content>
      </Card>

      {/* Machine Status Grid */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Статус автоматов</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Machines')}
            >
              Все
            </Button>
          </View>
          <MachineStatusGrid 
            machines={dashboardData.machines.slice(0, 6)} 
            onMachinePress={(machine) => 
              navigation.navigate('MachineDetail', { machineId: machine.id }
            }
          />
        </Card.Content>
      </Card>

      {/* Recent Tasks */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Title>Последние задачи</Title>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Tasks')}
            >
              Все
            </Button>
          </View>
          <RecentTasks 
            tasks={dashboardData.recentTasks.slice(0, 5)}
            onTaskPress={(task) => 
              navigation.navigate('TaskDetail', { taskId: task.id }
            }
          />
        </Card.Content>
      </Card>

      {/* Active Alerts */}
      {dashboardData.alerts.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Активные уведомления</Title>
            <AlertsList 
              alerts={dashboardData.alerts.slice(0, 3)}
              onAlertPress={(alert) => {
                if (alert.machineId) {
                  navigation.navigate('MachineDetail', { machineId: alert.machineId }
                }
              }}
            />
          </Card.Content>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="brain" size={24} color="#9b59b6" />
            <Title>AI Рекомендации</Title>
          </View>
          <View style={styles.aiRecommendations}>
            <Chip 
              icon="wrench" 
              style={styles.recommendationChip}
            >
              ТО автомата VM-033 через 3 дня
            </Chip>
            <Chip 
              icon="trending-up" 
              style={styles.recommendationChip}
            >
              Пик спроса в 14:00-16:00
            </Chip>
            <Chip 
              icon="map-marker-path" 
              style={styles.recommendationChip}
            >
              Оптимизировать маршрут #3
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* System Performance */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Производительность системы</Title>
          <View style={styles.performanceMetrics}>
            <View style={styles.metricRow}>
              <Text>API Response Time</Text>
              <Text>95ms</Text>
            </View>
            <ProgressBar progress={0.95} color="#27ae60" style={styles.progressBar} />
            
            <View style={styles.metricRow}>
              <Text>Cache Hit Rate</Text>
              <Text>98%</Text>
            </View>
            <ProgressBar progress={0.98} color="#27ae60" style={styles.progressBar} />
            
            <View style={styles.metricRow}>
              <Text>Blockchain Sync</Text>
              <Text>100%</Text>
            </View>
            <ProgressBar progress={1.0} color="#27ae60" style={styles.progressBar} />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  header: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 8,
  },
  card: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiRecommendations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  recommendationChip: {
    marginBottom: 4,
  },
  performanceMetrics: {
    gap: 12,
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  bottomSpacing: {
    height: 20,
  },
}
