'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  User,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role:
    | 'ADMIN'
    | 'MANAGER'
    | 'OPERATOR'
    | 'TECHNICIAN'
    | 'DRIVER'
    | 'WAREHOUSE_WORKER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  telegramId?: string;
  telegramUsername?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
  assignedMachines?: number[];
  assignedRoutes?: number[];
  profile?: {
    avatar?: string;
    bio?: string;
    skills?: string[];
    certifications?: string[];
    emergencyContact?: string;
  };
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  byRole: Record<string, number>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    byRole: {}
  }
  const [loading, setLoading] = useState(true
  const [searchTerm, setSearchTerm] = useState('
  const [selectedRole, setSelectedRole] = useState(''
  const [selectedStatus, setSelectedStatus] = useState('
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>(
    'users'
  
  const [showCreateUserModal, setShowCreateUserModal] = useState(false
  const [showEditUserModal, setShowEditUserModal] = useState(false
  const [selectedUser, setSelectedUser] = useState<User | null>(null

  // Form state
  const [userFormData, setUserFormData] = useState({
    username: ',
    firstName: '',
    lastName: ',
    email: '',
    phone: ',
    role: 'OPERATOR' as User['role'],
    telegramUsername: ',
    password: '',
    confirmPassword: ',
    permissions: [] as string[],
    assignedMachines: [] as number[],
    bio: '',
    skills: [] as string[],
    emergencyContact: '
  }

  const roles = [
    { value: '', label: 'Все роли' },
    { value: 'ADMIN', label: 'Администратор' },
    { value: 'MANAGER', label: 'Менеджер' },
    { value: 'OPERATOR', label: 'Оператор' },
    { value: 'TECHNICIAN', label: 'Техник' },
    { value: 'DRIVER', label: 'Водитель' },
    { value: 'WAREHOUSE_WORKER', label: 'Складской работник' }
  ];

  const statusOptions = [
    { value: ', label: 'Все статусы' },
    { value: 'ACTIVE', label: 'Активный' },
    { value: 'INACTIVE', label: 'Неактивный' },
    { value: 'SUSPENDED', label: 'Заблокирован' },
    { value: 'PENDING', label: 'Ожидает подтверждения' }
  ];

  const permissions = [
    'users.read',
    'users.write',
    'users.delete',
    'machines.read',
    'machines.write',
    'machines.control',
    'inventory.read',
    'inventory.write',
    'tasks.read',
    'tasks.write',
    'tasks.assign',
    'reports.read',
    'reports.generate',
    'settings.read',
    'settings.write'
  ];

  useEffect(() => {
    fetchUsers(
    fetchStats(
  }, []

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/v1/users'
      const data = await response.json(
      if (data.success) {
        setUsers(data.data
      }
    } catch (error) {
      console.error('Error fetching users:', error
    } finally {
      setLoading(false
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/users/stats'
      const data = await response.json(
      if (data.success) {
        setStats(data.data
      }
    } catch (error) {
      console.error('Error fetching user stats:', error
    }
  };

  const handleCreateUser = async () => {
    try {
      if (userFormData.password !== userFormData.confirmPassword) {
        alert('Пароли не совпадают'
        return;
      }

      const response = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userFormData,
          profile: {
            bio: userFormData.bio,
            skills: userFormData.skills,
            emergencyContact: userFormData.emergencyContact
          }
        }
      }

      const data = await response.json(
      if (data.success) {
        setUsers([data.data, ...users]
        setShowCreateUserModal(false
        resetUserForm(
        fetchStats(
      }
    } catch (error) {
      console.error('Error creating user:', error
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...userFormData,
          profile: {
            ...selectedUser.profile,
            bio: userFormData.bio,
            skills: userFormData.skills,
            emergencyContact: userFormData.emergencyContact
          }
        }
      }

      const data = await response.json(
      if (data.success) {
        setUsers(
          users.map(user => (user.id === selectedUser.id ? data.data : user)
        
        setShowEditUserModal(false
        setSelectedUser(null
        resetUserForm(
      }
    } catch (error) {
      console.error('Error updating user:', error
    }
  };

  const handleUpdateUserStatus = async (
    userId: number,
    status: User['status']
  ) => {
    try {
      const response = await fetch(`/api/v1/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }
      }

      const data = await response.json(
      if (data.success) {
        setUsers(
          users.map(user =>
            user.id === userId
              ? { ...user, status, updatedAt: new Date().toISOString() }
              : user
          
        
        fetchStats(
      }
    } catch (error) {
      console.error('Error updating user status:', error
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE'
      }

      const data = await response.json(
      if (data.success) {
        setUsers(users.filter(user => user.id !== userId)
        fetchStats(
      }
    } catch (error) {
      console.error('Error deleting user:', error
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      username: ',
      firstName: '',
      lastName: ',
      email: '',
      phone: ',
      role: 'OPERATOR',
      telegramUsername: ',
      password: '',
      confirmPassword: ',
      permissions: [],
      assignedMachines: [],
      bio: '',
      skills: [],
      emergencyContact: '
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user
    setUserFormData({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email || '',
      phone: user.phone || ',
      role: user.role,
      telegramUsername: user.telegramUsername || '',
      password: ',
      confirmPassword: '',
      permissions: user.permissions || [],
      assignedMachines: user.assignedMachines || [],
      bio: user.profile?.bio || ',
      skills: user.profile?.skills || [],
      emergencyContact: user.profile?.emergencyContact || ''
    }
    setShowEditUserModal(true
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'OPERATOR':
        return 'bg-green-100 text-green-800';
      case 'TECHNICIAN':
        return 'bg-orange-100 text-orange-800';
      case 'DRIVER':
        return 'bg-indigo-100 text-indigo-800';
      case 'WAREHOUSE_WORKER':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активный';
      case 'INACTIVE':
        return 'Неактивный';
      case 'SUSPENDED':
        return 'Заблокирован';
      case 'PENDING':
        return 'Ожидает';
      default:
        return status;
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Администратор';
      case 'MANAGER':
        return 'Менеджер';
      case 'OPERATOR':
        return 'Оператор';
      case 'TECHNICIAN':
        return 'Техник';
      case 'DRIVER':
        return 'Водитель';
      case 'WAREHOUSE_WORKER':
        return 'Складской работник';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesStatus = !selectedStatus || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Пользователи</h1>
          <p className="text-gray-600">
            Управление пользователями и правами доступа
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Добавить пользователя
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Всего пользователей
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.total}
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
              <p className="text-sm font-medium text-gray-500">Активных</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.active}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Неактивных</p>
              <p className="text-2xl font-semibold text-gray-600">
                {stats.inactive}
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
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Пользователи ({users.length}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Роли
            </div>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Права доступа
            </div>
          </button>
        </nav>
      </div>

      {/* Filters */}
      {activeTab === 'users' && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск пользователей..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
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
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последний вход
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}
                      >
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email || 'Не указан'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.phone || 'Не указан'}
                      </div>
                      {user.telegramUsername && (
                        <div className="text-xs text-blue-500">
                          @{user.telegramUsername}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}
                      >
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('ru-RU'
                        : 'Никогда'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() =>
                              handleUpdateUserStatus(user.id, 'INACTIVE'
                            }
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleUpdateUserStatus(user.id, 'ACTIVE'
                            }
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.slice(1).map(role => (
            <div
              key={role.value}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {role.label}
                    </h3>
                    <p className="text-sm text-gray-500">Роль: {role.value}</p>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.value)}`}
                  >
                    {stats.byRole[role.value] || 0} польз.
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    Количество пользователей: {stats.byRole[role.value] || 0}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                    Настроить права
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions.map(permission => (
              <div
                key={permission}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {permission}
                  </div>
                  <div className="text-xs text-gray-500">
                    {permission.includes('read') && 'Чтение'}
                    {permission.includes('write') && 'Запись'}
                    {permission.includes('delete') && 'Удаление'}
                    {permission.includes('control') && 'Управление'}
                    {permission.includes('assign') && 'Назначение'}
                    {permission.includes('generate') && 'Генерация'}
                  </div>
                </div>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Создать нового пользователя
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        username: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Роль
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        role: e.target.value as User['role']
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.slice(1).map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        firstName: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        lastName: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        phone: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram Username
                  </label>
                  <input
                    type="text"
                    value={userFormData.telegramUsername}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        telegramUsername: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль
                  </label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        password: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Подтвердить пароль
                  </label>
                  <input
                    type="password"
                    value={userFormData.confirmPassword}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        confirmPassword: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Биография
                  </label>
                  <textarea
                    value={userFormData.bio}
                    onChange={e =>
                      setUserFormData({ ...userFormData, bio: e.target.value }
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Краткая информация о пользователе..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Экстренный контакт
                  </label>
                  <input
                    type="text"
                    value={userFormData.emergencyContact}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        emergencyContact: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Контакт для экстренных случаев"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateUserModal(false
                    resetUserForm(
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать пользователя
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Редактировать пользователя
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя пользователя
                  </label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        username: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Роль
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        role: e.target.value as User['role']
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.slice(1).map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        firstName: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        lastName: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={userFormData.phone}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        phone: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Биография
                  </label>
                  <textarea
                    value={userFormData.bio}
                    onChange={e =>
                      setUserFormData({ ...userFormData, bio: e.target.value }
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Экстренный контакт
                  </label>
                  <input
                    type="text"
                    value={userFormData.emergencyContact}
                    onChange={e =>
                      setUserFormData({
                        ...userFormData,
                        emergencyContact: e.target.value
                      }
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUserModal(false
                    setSelectedUser(null
                    resetUserForm(
                  }}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Сохранить изменения
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  
}
