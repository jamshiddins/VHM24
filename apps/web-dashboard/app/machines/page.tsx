'use client';

import { useState, useEffect } from 'react';
import {
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface Machine {
  id: string;
  code: string;
  name: string;
  serialNumber: string;
  type: 'COFFEE' | 'SNACK' | 'COMBO' | 'OTHER';
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  location?: {
    id: string;
    name: string;
    address: string;
  };
  lastPing?: string;
  stats?: {
    totalTasks: number;
    activeTasks: number;
    completedToday: number;
  };
  lastTelemetry?: {
    temperature?: number;
    humidity?: number;
    sales?: number;
    errors?: string[];
  };
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMachines();
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchMachines = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'production'
          ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
          : 'http://localhost:8000';

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('take', '50');

      const response = await fetch(`${baseUrl}/api/v1/machines?${params}`);
      if (!response.ok) throw new Error('Failed to fetch machines');

      const data = await response.json();
      setMachines(data.data.items);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки автоматов');
      console.error('Machines fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'text-green-700 bg-green-50 ring-green-600/20';
      case 'OFFLINE':
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
      case 'MAINTENANCE':
        return 'text-yellow-700 bg-yellow-50 ring-yellow-600/20';
      case 'ERROR':
        return 'text-red-700 bg-red-50 ring-red-600/20';
      default:
        return 'text-gray-700 bg-gray-50 ring-gray-600/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'OFFLINE':
        return <ClockIcon className="h-4 w-4" />;
      case 'MAINTENANCE':
        return <CogIcon className="h-4 w-4" />;
      case 'ERROR':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'COFFEE':
        return 'Кофе';
      case 'SNACK':
        return 'Снеки';
      case 'COMBO':
        return 'Комбо';
      case 'OTHER':
        return 'Другое';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'Онлайн';
      case 'OFFLINE':
        return 'Офлайн';
      case 'MAINTENANCE':
        return 'Обслуживание';
      case 'ERROR':
        return 'Ошибка';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Вендинговые автоматы
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Управление и мониторинг всех автоматов в системе
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Добавить автомат
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по коду, названию или серийному номеру..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Фильтры
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все статусы</option>
                  <option value="ONLINE">Онлайн</option>
                  <option value="OFFLINE">Офлайн</option>
                  <option value="MAINTENANCE">Обслуживание</option>
                  <option value="ERROR">Ошибка</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип
                </label>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все типы</option>
                  <option value="COFFEE">Кофе</option>
                  <option value="SNACK">Снеки</option>
                  <option value="COMBO">Комбо</option>
                  <option value="OTHER">Другое</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Ошибка</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Machines Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {machines.map(machine => (
          <div
            key={machine.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(machine.status)}`}
                  >
                    {getStatusIcon(machine.status)}
                    <span className="ml-1">
                      {getStatusLabel(machine.status)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {getTypeLabel(machine.type)}
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {machine.name}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  Код: {machine.code}
                </p>
                <p className="text-sm text-gray-500">
                  S/N: {machine.serialNumber}
                </p>
              </div>

              {machine.location && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    {machine.location.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {machine.location.address}
                  </p>
                </div>
              )}

              {machine.stats && (
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {machine.stats.activeTasks}
                      </p>
                      <p className="text-xs text-gray-500">Активные</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {machine.stats.completedToday}
                      </p>
                      <p className="text-xs text-gray-500">Сегодня</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {machine.stats.totalTasks}
                      </p>
                      <p className="text-xs text-gray-500">Всего</p>
                    </div>
                  </div>
                </div>
              )}

              {machine.lastTelemetry && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Последняя телеметрия:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {machine.lastTelemetry.temperature && (
                      <div>
                        <span className="text-gray-500">Температура:</span>
                        <span className="ml-1 font-medium">
                          {machine.lastTelemetry.temperature}°C
                        </span>
                      </div>
                    )}
                    {machine.lastTelemetry.humidity && (
                      <div>
                        <span className="text-gray-500">Влажность:</span>
                        <span className="ml-1 font-medium">
                          {machine.lastTelemetry.humidity}%
                        </span>
                      </div>
                    )}
                    {machine.lastTelemetry.sales !== undefined && (
                      <div>
                        <span className="text-gray-500">Продажи:</span>
                        <span className="ml-1 font-medium">
                          {machine.lastTelemetry.sales}
                        </span>
                      </div>
                    )}
                    {machine.lastTelemetry.errors &&
                      machine.lastTelemetry.errors.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-red-500">Ошибки:</span>
                          <span className="ml-1 text-red-600">
                            {machine.lastTelemetry.errors.length}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {machine.lastPing
                    ? `Последний пинг: ${new Date(machine.lastPing).toLocaleString()}`
                    : 'Нет данных о пинге'}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3">
              <div className="flex justify-between">
                <button className="text-sm text-blue-600 hover:text-blue-500">
                  Подробнее
                </button>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                  Настройки
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && machines.length === 0 && (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Автоматы не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter || typeFilter
              ? 'Попробуйте изменить параметры поиска или фильтры.'
              : 'Начните с добавления первого автомата.'}
          </p>
          {!searchTerm && !statusFilter && !typeFilter && (
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Добавить автомат
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
