'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Package, Scale, Truck, CheckCircle, AlertCircle, Clock, ArrowUpDown } from 'lucide-react';

interface WarehouseItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  maxQuantity: number;
  costPerUnit: number;
  supplier?: string;
  location?: string;
  expiryDate?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';
  lastUpdated: string;
}

interface WarehouseOperation {
  id: number;
  type: 'RECEIVE' | 'DISPATCH' | 'TRANSFER' | 'ADJUSTMENT';
  itemId: number;
  quantity: number;
  unit: string;
  description: string;
  operatorId: number;
  operatorName: string;
  photos?: string[];
  weight?: number;
  createdAt: string;
  item: {
    name: string;
    category: string;
  };
}

interface Bunker {
  id: number;
  name: string;
  machineId?: number;
  capacity: number;
  currentLevel: number;
  itemId?: number;
  status: 'EMPTY' | 'FILLING' | 'FULL' | 'MAINTENANCE';
  lastFilled?: string;
  item?: {
    name: string;
    unit: string;
  };
  machine?: {
    name: string;
    location: string;
  };
}

export default function WarehousePage() {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [operations, setOperations] = useState<WarehouseOperation[]>([]);
  const [bunkers, setBunkers] = useState<Bunker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'operations' | 'bunkers'>('inventory');
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);

  // Form state
  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    minQuantity: 0,
    maxQuantity: 0,
    costPerUnit: 0,
    supplier: '',
    location: '',
    expiryDate: ''
  });

  const [operationFormData, setOperationFormData] = useState({
    type: 'RECEIVE' as 'RECEIVE' | 'DISPATCH' | 'TRANSFER' | 'ADJUSTMENT',
    itemId: 0,
    quantity: 0,
    description: '',
    weight: 0
  });

  const categories = [
    'Напитки',
    'Снеки',
    'Кондитерские изделия',
    'Молочные продукты',
    'Замороженные продукты',
    'Упаковочные материалы',
    'Расходные материалы'
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'IN_STOCK', label: 'В наличии' },
    { value: 'LOW_STOCK', label: 'Мало на складе' },
    { value: 'OUT_OF_STOCK', label: 'Нет в наличии' },
    { value: 'EXPIRED', label: 'Просрочено' }
  ];

  const operationTypes = [
    { value: 'RECEIVE', label: 'Приём товара' },
    { value: 'DISPATCH', label: 'Отгрузка' },
    { value: 'TRANSFER', label: 'Перемещение' },
    { value: 'ADJUSTMENT', label: 'Корректировка' }
  ];

  useEffect(() => {
    fetchItems();
    fetchOperations();
    fetchBunkers();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/v1/warehouse/items');
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching warehouse items:', error);
    }
  };

  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/v1/warehouse/operations');
      const data = await response.json();
      if (data.success) {
        setOperations(data.data);
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBunkers = async () => {
    try {
      const response = await fetch('/api/v1/warehouse/bunkers');
      const data = await response.json();
      if (data.success) {
        setBunkers(data.data);
      }
    } catch (error) {
      console.error('Error fetching bunkers:', error);
    }
  };

  const handleCreateItem = async () => {
    try {
      const response = await fetch('/api/v1/warehouse/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemFormData),
      });

      const data = await response.json();
      if (data.success) {
        setItems([data.data, ...items]);
        setShowCreateItemModal(false);
        resetItemForm();
      }
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleCreateOperation = async () => {
    try {
      const response = await fetch('/api/v1/warehouse/operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operationFormData),
      });

      const data = await response.json();
      if (data.success) {
        setOperations([data.data, ...operations]);
        setShowOperationModal(false);
        resetOperationForm();
        // Refresh items to update quantities
        fetchItems();
      }
    } catch (error) {
      console.error('Error creating operation:', error);
    }
  };

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: '',
      minQuantity: 0,
      maxQuantity: 0,
      costPerUnit: 0,
      supplier: '',
      location: '',
      expiryDate: ''
    });
  };

  const resetOperationForm = () => {
    setOperationFormData({
      type: 'RECEIVE',
      itemId: 0,
      quantity: 0,
      description: '',
      weight: 0
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
      case 'FULL':
        return 'bg-green-100 text-green-800';
      case 'LOW_STOCK':
      case 'FILLING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_STOCK':
      case 'EMPTY':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'MAINTENANCE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IN_STOCK': return 'В наличии';
      case 'LOW_STOCK': return 'Мало';
      case 'OUT_OF_STOCK': return 'Нет в наличии';
      case 'EXPIRED': return 'Просрочено';
      case 'EMPTY': return 'Пустой';
      case 'FILLING': return 'Заполняется';
      case 'FULL': return 'Полный';
      case 'MAINTENANCE': return 'Обслуживание';
      default: return status;
    }
  };

  const getOperationTypeText = (type: string) => {
    switch (type) {
      case 'RECEIVE': return 'Приём';
      case 'DISPATCH': return 'Отгрузка';
      case 'TRANSFER': return 'Перемещение';
      case 'ADJUSTMENT': return 'Корректировка';
      default: return type;
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'RECEIVE': return <Package className="w-4 h-4 text-green-500" />;
      case 'DISPATCH': return <Truck className="w-4 h-4 text-blue-500" />;
      case 'TRANSFER': return <ArrowUpDown className="w-4 h-4 text-purple-500" />;
      case 'ADJUSTMENT': return <Scale className="w-4 h-4 text-orange-500" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredOperations = operations.filter(operation => {
    const matchesSearch = operation.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         operation.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
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
          <h1 className="text-3xl font-bold text-gray-900">Склад</h1>
          <p className="text-gray-600">Управление складскими запасами и операциями</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowOperationModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <ArrowUpDown className="w-4 h-4" />
            Новая операция
          </button>
          <button
            onClick={() => setShowCreateItemModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Добавить товар
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'inventory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Инвентарь ({items.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Операции ({operations.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bunkers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bunkers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Бункеры ({bunkers.length})
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
                placeholder={`Поиск ${activeTab === 'inventory' ? 'товаров' : activeTab === 'operations' ? 'операций' : 'бункеров'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {activeTab === 'inventory' && (
            <>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Товар
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Категория
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Количество
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.location || 'Не указано'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500">
                        Мин: {item.minQuantity} / Макс: {item.maxQuantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.costPerUnit.toFixed(2)} сум/{item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        Редактировать
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Операция
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-4">
              {filteredOperations.map((operation) => (
                <div key={operation.id} className="border-l-4 border-blue-500 pl-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getOperationIcon(operation.type)}
                        <span className="font-medium text-gray-900">
                          {getOperationTypeText(operation.type)} - {operation.item.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Количество: {operation.quantity} {operation.unit}
                      </p>
                      {operation.weight && (
                        <p className="text-sm text-gray-600 mb-1">
                          Вес: {operation.weight} кг
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        Оператор: {operation.operatorName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {operation.description}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(operation.createdAt).toLocaleString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bunkers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bunkers.map((bunker) => (
            <div key={bunker.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bunker.name}</h3>
                    {bunker.machine && (
                      <p className="text-sm text-gray-500">{bunker.machine.name}</p>
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bunker.status)}`}>
                    {getStatusText(bunker.status)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Заполнение</span>
                      <span>{Math.round((bunker.currentLevel / bunker.capacity) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(bunker.currentLevel / bunker.capacity) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{bunker.currentLevel}</span>
                      <span>{bunker.capacity}</span>
                    </div>
                  </div>

                  {bunker.item && (
                    <div className="text-sm text-gray-600">
                      <p>Товар: {bunker.item.name}</p>
                      <p>Единица: {bunker.item.unit}</p>
                    </div>
                  )}

                  {bunker.lastFilled && (
                    <div className="text-xs text-gray-500">
                      Последнее заполнение: {new Date(bunker.lastFilled).toLocaleString('ru-RU')}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Заполнить
                  </button>
                  <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700">
                    Очистить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Item Modal */}
      {showCreateItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Добавить новый товар</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название товара
                  </label>
                  <input
                    type="text"
                    value={itemFormData.name}
                    onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория
                  </label>
                  <select
                    value={itemFormData.category}
                    onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество
                  </label>
                  <input
                    type="number"
                    value={itemFormData.quantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения
                  </label>
                  <input
                    type="text"
                    value={itemFormData.unit}
                    onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="шт, кг, л"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Минимальное количество
                  </label>
                  <input
                    type="number"
                    value={itemFormData.minQuantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, minQuantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Максимальное количество
                  </label>
                  <input
                    type="number"
                    value={itemFormData.maxQuantity}
                    onChange={(e) => setItemFormData({ ...itemFormData, maxQuantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Стоимость за единицу
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemFormData.costPerUnit}
                    onChange={(e) => setItemFormData({ ...itemFormData, costPerUnit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Поставщик
                  </label>
                  <input
                    type="text"
                    value={itemFormData.supplier}
                    onChange={(e) => setItemFormData({ ...itemFormData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Местоположение
                  </label>
                  <input
                    type="text"
                    value={itemFormData.location}
                    onChange={(e) => setItemFormData({ ...itemFormData, location: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Стеллаж А1, Полка 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Срок годности
                  </label>
                  <input
                    type="date"
                    value={itemFormData.expiryDate}
                    onChange={(e) => setItemFormData({ ...itemFormData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateItemModal(false);
                    resetItemForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Operation Modal */}
      {showOperationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Новая складская операция</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип операции
                  </label>
                  <select
                    value={operationFormData.type}
                    onChange={(e) => setOperationFormData({ ...operationFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {operationTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Товар
                  </label>
                  <select
                    value={operationFormData.itemId}
                    onChange={(e) => setOperationFormData({ ...operationFormData, itemId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Выберите товар</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество
                  </label>
                  <input
                    type="number"
                    value={operationFormData.quantity}
                    onChange={(e) => setOperationFormData({ ...operationFormData, quantity: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Вес (кг)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={operationFormData.weight}
                    onChange={(e) => setOperationFormData({ ...operationFormData, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={operationFormData.description}
                    onChange={(e) => setOperationFormData({ ...operationFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Описание операции..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowOperationModal(false);
                    resetOperationForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateOperation}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Создать операцию
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
