'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Clock, Fuel, Navigation, CheckCircle, AlertCircle, Truck } from 'lucide-react';

interface Driver {
  id: number;
  telegramId: string;
  firstName: string;
  lastName: string;
  username?: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_ROUTE';
  currentRoute?: Route;
  totalRoutes: number;
  completedRoutes: number;
  createdAt: string;
}

interface Route {
  id: number;
  name: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driverId: number;
  startTime?: string;
  endTime?: string;
  startMileage?: number;
  endMileage?: number;
  totalStops: number;
  completedStops: number;
  stops: RouteStop[];
  createdAt: string;
}

interface RouteStop {
  id: number;
  routeId: number;
  machineId: number;
  order: number;
  status: 'PENDING' | 'ARRIVED' | 'COMPLETED';
  arrivalTime?: string;
  departureTime?: string;
  machine: {
    id: number;
    name: string;
    location?: {
      address: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

interface DriverLog {
  id: number;
  driverId: number;
  type: 'MILEAGE' | 'FUEL_CHECK' | 'ARRIVAL' | 'DEPARTURE';
  description: string;
  mileage?: number;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  metadata?: any;
  createdAt: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [driverLogs, setDriverLogs] = useState<DriverLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showCreateRouteModal, setShowCreateRouteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'drivers' | 'routes' | 'logs'>('drivers');

  // Form state for creating routes
  const [routeFormData, setRouteFormData] = useState({
    name: '',
    driverId: 0,
    stops: [] as { machineId: number; order: number }[]
  });

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'ACTIVE', label: 'Активные' },
    { value: 'ON_ROUTE', label: 'В пути' },
    { value: 'INACTIVE', label: 'Неактивные' }
  ];

  const routeStatusOptions = [
    { value: '', label: 'Все маршруты' },
    { value: 'PLANNED', label: 'Запланированные' },
    { value: 'IN_PROGRESS', label: 'В процессе' },
    { value: 'COMPLETED', label: 'Завершённые' },
    { value: 'CANCELLED', label: 'Отменённые' }
  ];

  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
    fetchDriverLogs();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/v1/auth/users?role=DRIVER');
      const data = await response.json();
      if (data.success) {
        setDrivers(data.data);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/v1/routes');
      const data = await response.json();
      if (data.success) {
        setRoutes(data.data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverLogs = async () => {
    try {
      const response = await fetch('/api/v1/routes/driver-logs');
      const data = await response.json();
      if (data.success) {
        setDriverLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching driver logs:', error);
    }
  };

  const handleCreateRoute = async () => {
    try {
      const response = await fetch('/api/v1/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeFormData),
      });

      const data = await response.json();
      if (data.success) {
        setRoutes([data.data, ...routes]);
        setShowCreateRouteModal(false);
        resetRouteForm();
      }
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const resetRouteForm = () => {
    setRouteFormData({
      name: '',
      driverId: 0,
      stops: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'ON_ROUTE':
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PLANNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Активен';
      case 'ON_ROUTE': return 'В пути';
      case 'INACTIVE': return 'Неактивен';
      case 'PLANNED': return 'Запланирован';
      case 'IN_PROGRESS': return 'В процессе';
      case 'COMPLETED': return 'Завершён';
      case 'CANCELLED': return 'Отменён';
      default: return status;
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || driver.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || route.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Водители и маршруты</h1>
          <p className="text-gray-600">Управление водителями, маршрутами и логистикой</p>
        </div>
        <button
          onClick={() => setShowCreateRouteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Новый маршрут
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'drivers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Водители ({drivers.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'routes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Маршруты ({routes.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Логи ({driverLogs.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={`Поиск ${activeTab === 'drivers' ? 'водителей' : activeTab === 'routes' ? 'маршрутов' : 'логов'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {(activeTab === 'routes' ? routeStatusOptions : statusOptions).map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {driver.firstName} {driver.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">@{driver.username}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                    {getStatusText(driver.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4" />
                    Всего маршрутов: {driver.totalRoutes}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    Завершено: {driver.completedRoutes}
                  </div>
                  {driver.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      📞 {driver.phone}
                    </div>
                  )}
                </div>

                {driver.currentRoute && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500 mb-2">Текущий маршрут:</p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-900">{driver.currentRoute.name}</p>
                      <p className="text-sm text-blue-700">
                        {driver.currentRoute.completedStops}/{driver.currentRoute.totalStops} остановок
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedDriver(driver)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'routes' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Маршрут
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Водитель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Остановки
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRoutes.map((route) => {
                  const driver = drivers.find(d => d.id === route.driverId);
                  return (
                    <tr key={route.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{route.name}</div>
                          <div className="text-sm text-gray-500">ID: {route.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {driver ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{driver.username}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Не назначен</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(route.status)}`}>
                          {getStatusText(route.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {route.completedStops}/{route.totalStops}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {route.startTime ? new Date(route.startTime).toLocaleString('ru-RU') : 'Не начат'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Просмотр
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          Редактировать
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-4">
              {driverLogs.map((log) => {
                const driver = drivers.find(d => d.id === log.driverId);
                return (
                  <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {log.type === 'FUEL_CHECK' && <Fuel className="w-4 h-4 text-orange-500" />}
                          {log.type === 'ARRIVAL' && <MapPin className="w-4 h-4 text-green-500" />}
                          {log.type === 'DEPARTURE' && <Navigation className="w-4 h-4 text-blue-500" />}
                          {log.type === 'MILEAGE' && <Clock className="w-4 h-4 text-purple-500" />}
                          <span className="font-medium text-gray-900">{log.description}</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Водитель: {driver ? `${driver.firstName} ${driver.lastName}` : 'Неизвестен'}
                        </p>
                        {log.mileage && (
                          <p className="text-sm text-gray-600">Пробег: {log.mileage} км</p>
                        )}
                        {log.latitude && log.longitude && (
                          <p className="text-sm text-gray-600">
                            GPS: {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Route Modal */}
      {showCreateRouteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Создать новый маршрут</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название маршрута
                  </label>
                  <input
                    type="text"
                    value={routeFormData.name}
                    onChange={(e) => setRouteFormData({ ...routeFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Например: Маршрут №1 - Центр"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Водитель
                  </label>
                  <select
                    value={routeFormData.driverId}
                    onChange={(e) => setRouteFormData({ ...routeFormData, driverId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Выберите водителя</option>
                    {drivers.filter(d => d.status === 'ACTIVE').map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateRouteModal(false);
                    resetRouteForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateRoute}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
