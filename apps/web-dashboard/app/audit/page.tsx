'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  UserCheck,
  Database,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface IncompleteData {
  id: string;
  userId?: string;
  entity: string;
  entityId: string;
  requiredFields: string[];
  missingFields: string[];
  completionRate: number;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityStats {
  totalActions: number;
  userActions: Array<{
    userId: string;
    _count: { id: number };
    user?: { name: string; email: string };
  }>;
  topActions: Array<{
    action: string;
    _count: { id: number };
  }>;
  topEntities: Array<{
    entity: string;
    _count: { id: number };
  }>;
}

interface IncompleteDataStats {
  totalIncomplete: number;
  avgCompletionRate: number;
  byEntity: Array<{
    entity: string;
    _count: { id: number };
    _avg: { completionRate: number };
  }>;
  byStatus: Array<{
    status: string;
    _count: { id: number };
  }>;
}

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]
  const [incompleteData, setIncompleteData] = useState<IncompleteData[]>([]
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(
    null
  
  const [incompleteStats, setIncompleteStats] =
    useState<IncompleteDataStats | null>(null
  const [loading, setLoading] = useState(true
  const [error, setError] = useState<string | null>(null

  // Фильтры
  const [auditFilters, setAuditFilters] = useState({
    action: ',
    entity: '',
    userId: ',
    dateFrom: '',
    dateTo: '
  }

  const [incompleteFilters, setIncompleteFilters] = useState({
    entity: '',
    status: ',
    completionRateMin: '',
    completionRateMax: '
  }

  const [currentPage, setCurrentPage] = useState(1
  const [totalPages, setTotalPages] = useState(1

  useEffect(() => {
    loadData(
  }, []

  const loadData = async () => {
    setLoading(true
    setError(null

    try {
      await Promise.all([
        loadAuditLogs(),
        loadIncompleteData(),
        loadActivityStats(),
        loadIncompleteStats(
      ]
    } catch (err) {
      setError('Ошибка при загрузке данных'
      console.error('Error loading audit data:', err
    } finally {
      setLoading(false
    }
  };

  const loadAuditLogs = async () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: '20',
      ...Object.fromEntries(Object.entries(auditFilters).filter(([_, v]) => v)
    }

    const response = await fetch(`/api/audit/logs?${params}`
    if (!response.ok) throw new Error('Failed to load audit logs'

    const data = await response.json(
    setAuditLogs(data.logs
    setTotalPages(data.pagination.pages
  };

  const loadIncompleteData = async () => {
    const params = new URLSearchParams({
      page: '1',
      limit: '20',
      ...Object.fromEntries(
        Object.entries(incompleteFilters).filter(([_, v]) => v
      
    }

    const response = await fetch(`/api/incomplete-data?${params}`
    if (!response.ok) throw new Error('Failed to load incomplete data'

    const data = await response.json(
    setIncompleteData(data.incompleteData
  };

  const loadActivityStats = async () => {
    const dateFrom =
      auditFilters.dateFrom ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(
    const dateTo = auditFilters.dateTo || new Date().toISOString(

    const response = await fetch(
      `/api/audit/stats/activity?dateFrom=${dateFrom}&dateTo=${dateTo}`
    
    if (!response.ok) throw new Error('Failed to load activity stats'

    const data = await response.json(
    setActivityStats(data
  };

  const loadIncompleteStats = async () => {
    const response = await fetch('/api/incomplete-data/stats'
    if (!response.ok) throw new Error('Failed to load incomplete data stats'

    const data = await response.json(
    setIncompleteStats(data
  };

  const handleExport = async (reportType: string, format: string = 'csv') => {
    try {
      const params = new URLSearchParams({ format }
      if (auditFilters.dateFrom
        params.append('dateFrom', auditFilters.dateFrom
      if (auditFilters.dateTo) params.append('dateTo', auditFilters.dateTo

      const response = await fetch(
        `/api/reports/export/${reportType}?${params}`
      
      if (!response.ok) throw new Error('Failed to export data'

      const blob = await response.blob(
      const url = window.URL.createObjectURL(blob
      const a = document.createElement('a'
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a
      a.click(
      window.URL.revokeObjectURL(url
      document.body.removeChild(a
    } catch (err) {
      setError('Ошибка при экспорте данных'
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      IGNORED: { color: 'bg-gray-100 text-gray-800', icon: Eye },
      EXPIRED: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    
  };

  const getActionBadge = (action: string) => {
    const actionColors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      READ: 'bg-gray-100 text-gray-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-purple-100 text-purple-800',
      ERROR: 'bg-red-100 text-red-800'
    };

    return (
      <Badge
        className={
          actionColors[action as keyof typeof actionColors] ||
          'bg-gray-100 text-gray-800'
        }
      >
        {action}
      </Badge>
    
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Загрузка данных аудита...</span>
      </div>
    
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Аудит системы</h1>
          <p className="text-gray-600">
            Мониторинг активности пользователей и незаполненных данных
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего действий
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityStats?.totalActions || 0}
            </div>
            <p className="text-xs text-muted-foreground">За последние 7 дней</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Активных пользователей
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activityStats?.userActions.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Уникальных пользователей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Незаполненные данные
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incompleteStats?.totalIncomplete || 0}
            </div>
            <p className="text-xs text-muted-foreground">Требуют внимания</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Средний % заполнения
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incompleteStats?.avgCompletionRate
                ? `${incompleteStats.avgCompletionRate.toFixed(1)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">По всем записям</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-logs">Логи аудита</TabsTrigger>
          <TabsTrigger value="incomplete-data">
            Незаполненные данные
          </TabsTrigger>
          <TabsTrigger value="reports">Отчеты</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select
                  value={auditFilters.action}
                  onValueChange={value =>
                    setAuditFilters({ ...auditFilters, action: value }
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Действие" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все действия</SelectItem>
                    <SelectItem value="CREATE">Создание</SelectItem>
                    <SelectItem value="UPDATE">Обновление</SelectItem>
                    <SelectItem value="DELETE">Удаление</SelectItem>
                    <SelectItem value="LOGIN">Вход</SelectItem>
                    <SelectItem value="LOGOUT">Выход</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Сущность"
                  value={auditFilters.entity}
                  onChange={e =>
                    setAuditFilters({ ...auditFilters, entity: e.target.value }
                  }
                />

                <Input
                  type="datetime-local"
                  placeholder="Дата от"
                  value={auditFilters.dateFrom}
                  onChange={e =>
                    setAuditFilters({
                      ...auditFilters,
                      dateFrom: e.target.value
                    }
                  }
                />

                <Input
                  type="datetime-local"
                  placeholder="Дата до"
                  value={auditFilters.dateTo}
                  onChange={e =>
                    setAuditFilters({ ...auditFilters, dateTo: e.target.value }
                  }
                />

                <Button onClick={loadAuditLogs}>
                  <Search className="w-4 h-4 mr-2" />
                  Поиск
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Логи активности</CardTitle>
                <Button
                  onClick={() => handleExport('audit-logs')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Время</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Действие</TableHead>
                    <TableHead>Сущность</TableHead>
                    <TableHead>Описание</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-sm text-gray-500">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Система</span>
                        )}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entity}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incomplete-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Сущность"
                  value={incompleteFilters.entity}
                  onChange={e =>
                    setIncompleteFilters({
                      ...incompleteFilters,
                      entity: e.target.value
                    }
                  }
                />

                <Select
                  value={incompleteFilters.status}
                  onValueChange={value =>
                    setIncompleteFilters({
                      ...incompleteFilters,
                      status: value
                    }
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все статусы</SelectItem>
                    <SelectItem value="PENDING">Ожидает</SelectItem>
                    <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                    <SelectItem value="COMPLETED">Завершено</SelectItem>
                    <SelectItem value="IGNORED">Игнорируется</SelectItem>
                    <SelectItem value="EXPIRED">Просрочено</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="Мин. % заполнения"
                  value={incompleteFilters.completionRateMin}
                  onChange={e =>
                    setIncompleteFilters({
                      ...incompleteFilters,
                      completionRateMin: e.target.value
                    }
                  }
                />

                <Button onClick={loadIncompleteData}>
                  <Filter className="w-4 h-4 mr-2" />
                  Применить
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Незаполненные данные</CardTitle>
                <Button
                  onClick={() => handleExport('incomplete-data')}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Экспорт
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сущность</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>% заполнения</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Недостающие поля</TableHead>
                    <TableHead>Создано</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incompleteData.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="outline">{item.entity}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.user ? (
                          <div>
                            <div className="font-medium">{item.user.name}</div>
                            <div className="text-sm text-gray-500">
                              {item.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Не указан</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">
                            {item.completionRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.missingFields.slice(0, 3).map(field => (
                            <Badge
                              key={field}
                              variant="secondary"
                              className="text-xs"
                            >
                              {field}
                            </Badge>
                          ))}
                          {item.missingFields.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{item.missingFields.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Отчет по активности
                </CardTitle>
                <CardDescription>
                  Экспорт данных о действиях пользователей
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => handleExport('audit-logs', 'csv')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать CSV
                </Button>
                <Button
                  onClick={() => handleExport('audit-logs', 'json')}
                  className="w-full"
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Скачать JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Отчет по незаполненным данным
                </CardTitle>
                <CardDescription>
                  Экспорт информации о недостающих полях
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => handleExport('incomplete-data', 'csv')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать CSV
                </Button>
                <Button
                  onClick={() => handleExport('incomplete-data', 'json')}
                  className="w-full"
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Скачать JSON
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Отчет по пользователям
                </CardTitle>
                <CardDescription>
                  Статистика активности пользователей
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => handleExport('user-activity', 'csv')}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать CSV
                </Button>
                <Button
                  onClick={() => handleExport('user-activity', 'json')}
                  className="w-full"
                  variant="outline"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Скачать JSON
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  
}
