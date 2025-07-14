'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalMachines: number;
  onlineMachines: number;
  totalTasks: number;
  pendingTasks: number;
  totalUsers: number;
  activeUsers: number;
  inventoryItems: number;
  lowStockItems: number;
  todayRevenue: number;
  totalRevenue: number;
  recentTransactions: any[];
}

interface Machine {
  id: string;
  code: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  location?: {
    name: string;
    address: string;
  };
  lastPing?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null
  const [machines, setMachines] = useState<Machine[]>([]
  const [loading, setLoading] = useState(true
  const [error, setError] = useState<string | null>(null

  useEffect(() => {
    fetchDashboardData(
    // Обновляем данные каждые 30 секунд
    const interval = setInterval(fetchDashboardData, 30000
    return () => clearInterval(interval
  }, []

  const fetchDashboardData = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          : 'http://localhost:8000';

      const [statsResponse, machinesResponse] = await Promise.all([
        fetch(`${baseUrl}/api/v1/dashboard/stats`),
        fetch(`${baseUrl}/api/v1/machines?take=10`
      ]

      if (!statsResponse.ok || !machinesResponse.ok) {
        throw new Error('Failed to fetch data'
      }

      const statsData = await statsResponse.json(
      const machinesData = await machinesResponse.json(

      setStats(statsData.data
      setMachines(machinesData.data.items
      setError(null
    } catch (err) {
      setError('Ошибка загрузки данных'
      console.error('Dashboard fetch error:', err
    } finally {
      setLoading(false
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-600 bg-green-100';
      case 'OFFLINE':
        return 'text-gray-600 bg-gray-100';
      case 'MAINTENANCE':
        return 'text-yellow-600 bg-yellow-100';
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'OFFLINE':
        return <ClockIcon className="h-5 w-5" />;
      case 'MAINTENANCE':
        return <CogIcon className="h-5 w-5" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ошибка загрузки
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              VHM24 Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Система управления вендинговыми автоматами
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CogIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Автоматы онлайн
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.onlineMachines || 0} / {stats?.totalMachines || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">
                  {stats?.totalMachines
                    ? Math.round(
                        (stats.onlineMachines / stats.totalMachines) * 100
                      
                    : 0}
                  %
                </span>
                <span className="text-gray-500"> работают</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Активные задачи
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.pendingTasks || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-600">
                  {stats?.totalTasks || 0}
                </span>
                <span className="text-gray-500"> всего задач</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Выручка сегодня
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${(stats?.todayRevenue || 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600">
                  ${(stats?.totalRevenue || 0).toLocaleString()}
                </span>
                <span className="text-gray-500"> всего</span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Низкий запас
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats?.lowStockItems || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className="font-medium text-orange-600">
                  {stats?.inventoryItems || 0}
                </span>
                <span className="text-gray-500"> товаров</span>
              </div>
            </div>
          </div>
        </div>

        {/* Machines Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Последние автоматы
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Статус и информация о вендинговых автоматах
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {machines.map(machine => (
              <li key={machine.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(machine.status)}`}
                        >
                          {getStatusIcon(machine.status)}
                          <span className="ml-1">{machine.status}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {machine.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {machine.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {machine.location?.name || 'Не указано'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {machine.lastPing
                          ? `Последний пинг: ${new Date(machine.lastPing).toLocaleTimeString()}`
                          : 'Нет данных'}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <div className="flex justify-between">
              <button className="text-sm text-blue-600 hover:text-blue-500">
                Показать все автоматы
              </button>
              <button
                onClick={fetchDashboardData}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Обновить
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Последние транзакции
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {stats.recentTransactions
                .slice(0, 5
                .map((transaction, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Транзакция #{transaction.id?.slice(-8) || index}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${transaction.amount?.toFixed(2) || '0.00'}
                        </div>
                        <div
                          className={`text-sm ${transaction.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {transaction.status || 'UNKNOWN'}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  
}
