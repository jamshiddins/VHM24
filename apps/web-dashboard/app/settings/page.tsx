'use client';

import { useState, useEffect } from 'react';
import Logo from '../components/Logo';
import {
  CogIcon,
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  CircleStackIcon,
  ServerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface SystemSettings {
  general: {
    systemName: string;
    timezone: string;
    language: string;
    dateFormat: string;
    currency: string;
  };
  security: {
    sessionTimeout: number;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    twoFactorAuth: boolean;
    auditLogging: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    lowStockAlerts: boolean;
    taskReminders: boolean;
    systemAlerts: boolean;
  };
  audit: {
    retentionDays: number;
    logLevel: string;
    enableRequestLogging: boolean;
    enableResponseLogging: boolean;
    enableDataChangeTracking: boolean;
    enableIncompleteDataTracking: boolean;
  };
  backup: {
    enabled: boolean;
    schedule: string;
    retentionDays: number;
    location: string;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    rateLimitEnabled: boolean;
    maxRequestsPerMinute: number;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    systemName: 'VHM24 Hub Management',
    timezone: 'Asia/Tashkent',
    language: 'ru',
    dateFormat: 'DD.MM.YYYY',
    currency: 'UZS'
  },
  security: {
    sessionTimeout: 3600,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false
    },
    twoFactorAuth: false,
    auditLogging: true
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    lowStockAlerts: true,
    taskReminders: true,
    systemAlerts: true
  },
  audit: {
    retentionDays: 90,
    logLevel: 'info',
    enableRequestLogging: true,
    enableResponseLogging: true,
    enableDataChangeTracking: true,
    enableIncompleteDataTracking: true
  },
  backup: {
    enabled: true,
    schedule: '0 2 * * *',
    retentionDays: 30,
    location: 'local'
  },
  performance: {
    cacheEnabled: true,
    cacheTTL: 3600,
    rateLimitEnabled: true,
    maxRequestsPerMinute: 100
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings
  const [activeTab, setActiveTab] = useState('general'
  const [loading, setLoading] = useState(false
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle'
  const [systemStatus, setSystemStatus] = useState({
    database: 'connected',
    redis: 'connected',
    audit: 'active',
    backup: 'scheduled'
  }

  const tabs = [
    { id: 'general', name: 'Общие', icon: CogIcon },
    { id: 'security', name: 'Безопасность', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Уведомления', icon: BellIcon },
    { id: 'audit', name: 'Аудит', icon: DocumentTextIcon },
    { id: 'backup', name: 'Резервное копирование', icon: CircleStackIcon },
    { id: 'performance', name: 'Производительность', icon: ChartBarIcon },
    { id: 'system', name: 'Система', icon: ServerIcon }
  ];

  useEffect(() => {
    loadSettings(
    checkSystemStatus(
  }, []

  const loadSettings = async () => {
    setLoading(true
    try {
      // Здесь будет загрузка настроек из API
      // const response = await fetch('/api/v1/settings'
      // const data = await response.json(
      // setSettings(data

      // Пока используем локальные настройки
      const savedSettings = localStorage.getItem('vhm24-settings'
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error
    } finally {
      setLoading(false
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving'
    try {
      // Здесь будет сохранение настроек через API
      // await fetch('/api/v1/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings
      // }

      // Пока сохраняем локально
      localStorage.setItem('vhm24-settings', JSON.stringify(settings)

      setSaveStatus('success'
      setTimeout(() => setSaveStatus('idle'), 3000
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error
      setSaveStatus('error'
      setTimeout(() => setSaveStatus('idle'), 3000
    }
  };

  const checkSystemStatus = async () => {
    try {
      // Проверка статуса системы
      const response = await fetch('/health'
      const data = await response.json(

      setSystemStatus({
        database: data.dbStatus === 'connected' ? 'connected' : 'error',
        redis: 'connected', // Будет из API
        audit: 'active',
        backup: 'scheduled'
      }
    } catch (error) {
      console.error('Ошибка проверки статуса системы:', error
    }
  };

  const updateSettings = (
    section: keyof SystemSettings,
    field: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    })
  };

  const updateNestedSettings = (
    section: keyof SystemSettings,
    subsection: string,
    field: string,
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    })
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Название системы
        </label>
        <input
          type="text"
          value={settings.general.systemName}
          onChange={e =>
            updateSettings('general', 'systemName', e.target.value
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Часовой пояс
          </label>
          <select
            value={settings.general.timezone}
            onChange={e =>
              updateSettings('general', 'timezone', e.target.value
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
            <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
            <option value="UTC">UTC (UTC+0)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Язык
          </label>
          <select
            value={settings.general.language}
            onChange={e =>
              updateSettings('general', 'language', e.target.value
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ru">Русский</option>
            <option value="uz">O'zbek</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Формат даты
          </label>
          <select
            value={settings.general.dateFormat}
            onChange={e =>
              updateSettings('general', 'dateFormat', e.target.value
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DD.MM.YYYY">DD.MM.YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Валюта
          </label>
          <select
            value={settings.general.currency}
            onChange={e =>
              updateSettings('general', 'currency', e.target.value
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UZS">UZS (Узбекский сум)</option>
            <option value="USD">USD (Доллар США)</option>
            <option value="EUR">EUR (Евро)</option>
            <option value="RUB">RUB (Российский рубль)</option>
          </select>
        </div>
      </div>
    </div>
  

  const renderAuditSettings = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-sm font-medium text-blue-800">
            Система аудита активна
          </h3>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          Все действия пользователей логируются и отслеживаются
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Период хранения логов (дни
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={settings.audit.retentionDays}
            onChange={e =>
              updateSettings('audit', 'retentionDays', parseInt(e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Уровень логирования
          </label>
          <select
            value={settings.audit.logLevel}
            onChange={e => updateSettings('audit', 'logLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="error">Только ошибки</option>
            <option value="warn">Предупреждения и ошибки</option>
            <option value="info">Информация, предупреждения и ошибки</option>
            <option value="debug">Все события (отладка)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">
          Параметры логирования
        </h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.audit.enableRequestLogging}
              onChange={e =>
                updateSettings(
                  'audit',
                  'enableRequestLogging',
                  e.target.checked
                
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Логировать HTTP запросы
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.audit.enableResponseLogging}
              onChange={e =>
                updateSettings(
                  'audit',
                  'enableResponseLogging',
                  e.target.checked
                
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Логировать HTTP ответы
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.audit.enableDataChangeTracking}
              onChange={e =>
                updateSettings(
                  'audit',
                  'enableDataChangeTracking',
                  e.target.checked
                
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Отслеживать изменения данных
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.audit.enableIncompleteDataTracking}
              onChange={e =>
                updateSettings(
                  'audit',
                  'enableIncompleteDataTracking',
                  e.target.checked
                
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              Отслеживать незаполненные данные
            </span>
          </label>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Статистика аудита
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Записей сегодня</div>
            <div className="text-lg font-semibold text-gray-900">1,247</div>
          </div>
          <div>
            <div className="text-gray-500">Всего записей</div>
            <div className="text-lg font-semibold text-gray-900">45,892</div>
          </div>
          <div>
            <div className="text-gray-500">Активных сессий</div>
            <div className="text-lg font-semibold text-gray-900">23</div>
          </div>
          <div>
            <div className="text-gray-500">Незаполненных полей</div>
            <div className="text-lg font-semibold text-orange-600">156</div>
          </div>
        </div>
      </div>
    </div>
  

  const renderSystemStatus = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Logo size={32} showText={true} />
          </div>
          <div className="text-sm text-gray-500">Версия 1.0.0</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">База данных</div>
                <div className="text-lg font-semibold text-gray-900">
                  PostgreSQL
                </div>
              </div>
              {systemStatus.database === 'connected' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Кэш</div>
                <div className="text-lg font-semibold text-gray-900">Redis</div>
              </div>
              {systemStatus.redis === 'connected' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Аудит</div>
                <div className="text-lg font-semibold text-gray-900">
                  Активен
                </div>
              </div>
              {systemStatus.audit === 'active' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">
                  Резервное копирование
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  Запланировано
                </div>
              </div>
              {systemStatus.backup === 'scheduled' ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
          <h3 className="text-sm font-medium text-yellow-800">
            Системные уведомления
          </h3>
        </div>
        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
          <li>• Рекомендуется обновить зависимости системы</li>
          <li>• Найдено 156 незаполненных полей данных</li>
          <li>• Последнее резервное копирование: 2 часа назад</li>
        </ul>
      </div>
    </div>
  

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings(
      case 'audit':
        return renderAuditSettings(
      case 'system':
        return renderSystemStatus(
      default:
        return (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Раздел в разработке
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Настройки для раздела "{tabs.find(t => t.id === activeTab)?.name}"
              будут добавлены в следующих обновлениях.
            </p>
          </div>
        
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Настройки системы
          </h1>
          <p className="mt-2 text-gray-600">
            Управление конфигурацией и параметрами VHM24
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                
              })}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              renderTabContent(
            )}
          </div>

          {activeTab !== 'system' && (
            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Последнее сохранение: {new Date().toLocaleString('ru-RU')}
              </div>
              <button
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  saveStatus === 'saving'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : saveStatus === 'success'
                      ? 'bg-green-600 text-white'
                      : saveStatus === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saveStatus === 'saving' && 'Сохранение...'}
                {saveStatus === 'success' && 'Сохранено!'}
                {saveStatus === 'error' && 'Ошибка!'}
                {saveStatus === 'idle' && 'Сохранить настройки'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  
}
