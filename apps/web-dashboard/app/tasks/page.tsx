'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  Filter
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string;
  type:
    | 'MAINTENANCE'
    | 'REFILL'
    | 'REPAIR'
    | 'INSPECTION'
    | 'DELIVERY'
    | 'CLEANING';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
  assignedToId?: number;
  assignedTo?: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    role: string;
  };
  machineId?: number;
  machine?: {
    id: number;
    name: string;
    location: string;
  };
  dueDate: string;
  completedAt?: string;
  estimatedDuration: number; // в минутах
  actualDuration?: number;
  notes?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TaskTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  estimatedDuration: number;
  priority: string;
  instructions: string;
  requiredTools?: string[];
  checklistItems?: string[];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [activeTab, setActiveTab] = useState<
    'tasks' | 'templates' | 'calendar'
  >('tasks');
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form state
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    type: 'MAINTENANCE' as Task['type'],
    priority: 'MEDIUM' as Task['priority'],
    assignedToId: 0,
    machineId: 0,
    dueDate: '',
    estimatedDuration: 60,
    notes: ''
  });

  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    type: 'MAINTENANCE',
    estimatedDuration: 60,
    priority: 'MEDIUM',
    instructions: '',
    requiredTools: [] as string[],
    checklistItems: [] as string[]
  });

  const taskTypes = [
    { value: '', label: 'Все типы' },
    { value: 'MAINTENANCE', label: 'Техобслуживание' },
    { value: 'REFILL', label: 'Заправка' },
    { value: 'REPAIR', label: 'Ремонт' },
    { value: 'INSPECTION', label: 'Инспекция' },
    { value: 'DELIVERY', label: 'Доставка' },
    { value: 'CLEANING', label: 'Уборка' }
  ];

  const statusOptions = [
    { value: '', label: 'Все статусы' },
    { value: 'PENDING', label: 'Ожидает' },
    { value: 'IN_PROGRESS', label: 'В работе' },
    { value: 'COMPLETED', label: 'Завершено' },
    { value: 'CANCELLED', label: 'Отменено' },
    { value: 'OVERDUE', label: 'Просрочено' }
  ];

  const priorityOptions = [
    { value: '', label: 'Все приоритеты' },
    { value: 'LOW', label: 'Низкий' },
    { value: 'MEDIUM', label: 'Средний' },
    { value: 'HIGH', label: 'Высокий' },
    { value: 'URGENT', label: 'Срочный' }
  ];

  useEffect(() => {
    fetchTasks();
    fetchTemplates();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/v1/tasks');
      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/v1/tasks/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskFormData)
      });

      const data = await response.json();
      if (data.success) {
        setTasks([data.data, ...tasks]);
        setShowCreateTaskModal(false);
        resetTaskForm();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/v1/tasks/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateFormData)
      });

      const data = await response.json();
      if (data.success) {
        setTemplates([data.data, ...templates]);
        setShowCreateTemplateModal(false);
        resetTemplateForm();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTaskStatus = async (
    taskId: number,
    status: Task['status']
  ) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        setTasks(
          tasks.map(task =>
            task.id === taskId
              ? { ...task, status, updatedAt: new Date().toISOString() }
              : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: '',
      description: '',
      type: 'MAINTENANCE',
      priority: 'MEDIUM',
      assignedToId: 0,
      machineId: 0,
      dueDate: '',
      estimatedDuration: 60,
      notes: ''
    });
  };

  const resetTemplateForm = () => {
    setTemplateFormData({
      name: '',
      description: '',
      type: 'MAINTENANCE',
      estimatedDuration: 60,
      priority: 'MEDIUM',
      instructions: '',
      requiredTools: [],
      checklistItems: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      case 'OVERDUE':
        return 'Просрочено';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Низкий';
      case 'MEDIUM':
        return 'Средний';
      case 'HIGH':
        return 'Высокий';
      case 'URGENT':
        return 'Срочный';
      default:
        return priority;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'MAINTENANCE':
        return 'ТО';
      case 'REFILL':
        return 'Заправка';
      case 'REPAIR':
        return 'Ремонт';
      case 'INSPECTION':
        return 'Инспекция';
      case 'DELIVERY':
        return 'Доставка';
      case 'CLEANING':
        return 'Уборка';
      default:
        return type;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || task.type === selectedType;
    const matchesStatus = !selectedStatus || task.status === selectedStatus;
    const matchesPriority =
      !selectedPriority || task.priority === selectedPriority;
    const matchesAssignee =
      !selectedAssignee || task.assignedToId?.toString() === selectedAssignee;

    return (
      matchesSearch &&
      matchesType &&
      matchesStatus &&
      matchesPriority &&
      matchesAssignee
    );
  });

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => t.status === 'OVERDUE').length;

    return { total, pending, inProgress, completed, overdue };
  };

  const stats = getTaskStats();

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
          <h1 className="text-3xl font-bold text-gray-900">Задачи</h1>
          <p className="text-gray-600">Управление задачами и шаблонами</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateTemplateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Шаблон
          </button>
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Новая задача
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Всего</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Ожидают</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">В работе</p>
              <p className="text-2xl font-semibold text-blue-600">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Завершено</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Просрочено</p>
              <p className="text-2xl font-semibold text-red-600">
                {stats.overdue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Задачи ({tasks.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Шаблоны ({templates.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Календарь
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      {activeTab === 'tasks' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск задач..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {taskTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {priorityOptions.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('');
                setSelectedStatus('');
                setSelectedPriority('');
                setSelectedAssignee('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Сбросить
            </button>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Задача
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Приоритет
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Исполнитель
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Срок
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {task.description}
                        </div>
                        {task.machine && (
                          <div className="text-xs text-gray-400">
                            {task.machine.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTypeText(task.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}
                      >
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.assignedTo ? (
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {task.assignedTo.firstName}{' '}
                              {task.assignedTo.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {task.assignedTo.role}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Не назначен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
                      >
                        {getStatusText(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() =>
                              handleUpdateTaskStatus(task.id, 'IN_PROGRESS')
                            }
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Начать
                          </button>
                        )}
                        {task.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() =>
                              handleUpdateTaskStatus(task.id, 'COMPLETED')
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            Завершить
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedTask(task)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Просмотр
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getTypeText(template.type)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}
                  >
                    {getPriorityText(template.priority)}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Время: {template.estimatedDuration} мин
                  </div>
                  {template.requiredTools &&
                    template.requiredTools.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Инструменты: {template.requiredTools.join(', ')}
                      </div>
                    )}
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Создать задачу
                  </button>
                  <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700">
                    Редактировать
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center text-gray-500">
            <Calendar className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Календарь задач</h3>
            <p>
              Календарное представление задач будет реализовано в следующей
              версии
            </p>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Создать новую задачу
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название задачи
                  </label>
                  <input
                    type="text"
                    value={taskFormData.title}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        title: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={taskFormData.description}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        description: e.target.value
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип задачи
                  </label>
                  <select
                    value={taskFormData.type}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        type: e.target.value as Task['type']
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {taskTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Приоритет
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        priority: e.target.value as Task['priority']
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {priorityOptions.slice(1).map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Срок выполнения
                  </label>
                  <input
                    type="datetime-local"
                    value={taskFormData.dueDate}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        dueDate: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время выполнения (мин)
                  </label>
                  <input
                    type="number"
                    value={taskFormData.estimatedDuration}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        estimatedDuration: parseInt(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Заметки
                  </label>
                  <textarea
                    value={taskFormData.notes}
                    onChange={e =>
                      setTaskFormData({
                        ...taskFormData,
                        notes: e.target.value
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Дополнительные заметки..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateTaskModal(false);
                    resetTaskForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать задачу
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Создать шаблон задачи
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название шаблона
                  </label>
                  <input
                    type="text"
                    value={templateFormData.name}
                    onChange={e =>
                      setTemplateFormData({
                        ...templateFormData,
                        name: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={templateFormData.description}
                    onChange={e =>
                      setTemplateFormData({
                        ...templateFormData,
                        description: e.target.value
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип
                  </label>
                  <select
                    value={templateFormData.type}
                    onChange={e =>
                      setTemplateFormData({
                        ...templateFormData,
                        type: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {taskTypes.slice(1).map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время выполнения (мин)
                  </label>
                  <input
                    type="number"
                    value={templateFormData.estimatedDuration}
                    onChange={e =>
                      setTemplateFormData({
                        ...templateFormData,
                        estimatedDuration: parseInt(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Инструкции
                  </label>
                  <textarea
                    value={templateFormData.instructions}
                    onChange={e =>
                      setTemplateFormData({
                        ...templateFormData,
                        instructions: e.target.value
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Подробные инструкции по выполнению..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateTemplateModal(false);
                    resetTemplateForm();
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Создать шаблон
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
