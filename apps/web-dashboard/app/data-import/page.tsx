'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, FileText, Calendar, Clock, CheckCircle, AlertCircle, XCircle, Eye, Trash2 } from 'lucide-react';

interface ImportJob {
  id: number;
  fileName: string;
  fileSize: number;
  dataType: 'SALES' | 'INVENTORY' | 'MAINTENANCE' | 'ROUTES' | 'USERS' | 'TASKS';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
  preview?: any[];
}

interface HistoricalData {
  id: number;
  type: string;
  date: string;
  time: string;
  data: any;
  source: string;
  importJobId?: number;
  createdAt: string;
}

export default function DataImportPage() {
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'import' | 'history' | 'templates'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDataType, setSelectedDataType] = useState<ImportJob['dataType']>('SALES');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);

  const dataTypes = [
    { value: 'SALES', label: 'Продажи', description: 'Исторические данные о продажах' },
    { value: 'INVENTORY', label: 'Инвентарь', description: 'Остатки товаров на определённые даты' },
    { value: 'MAINTENANCE', label: 'Обслуживание', description: 'История технического обслуживания' },
    { value: 'ROUTES', label: 'Маршруты', description: 'Исторические маршруты водителей' },
    { value: 'USERS', label: 'Пользователи', description: 'Данные о пользователях системы' },
    { value: 'TASKS', label: 'Задачи', description: 'Выполненные задачи и их история' }
  ];

  useEffect(() => {
    fetchImportJobs();
    fetchHistoricalData();
  }, []);

  const fetchImportJobs = async () => {
    try {
      const response = await fetch('/api/v1/data-import/jobs');
      const data = await response.json();
      if (data.success) {
        setImportJobs(data.data);
      }
    } catch (error) {
      console.error('Error fetching import jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch('/api/v1/data-import/historical');
      const data = await response.json();
      if (data.success) {
        setHistoricalData(data.data);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Предварительный просмотр файла
      previewFile(file);
    }
  };

  const previewFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataType', selectedDataType);

      const response = await fetch('/api/v1/data-import/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setPreviewData(data.preview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('dataType', selectedDataType);
      formData.append('startDate', dateRange.startDate);
      formData.append('endDate', dateRange.endDate);

      const response = await fetch('/api/v1/data-import/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setImportJobs([data.job, ...importJobs]);
        setSelectedFile(null);
        setShowPreview(false);
        setPreviewData([]);
        // Сбросить форму
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error importing file:', error);
    }
  };

  const downloadTemplate = async (dataType: string) => {
    try {
      const response = await fetch(`/api/v1/data-import/template/${dataType}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType.toLowerCase()}_template.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Ожидает';
      case 'PROCESSING': return 'Обрабатывается';
      case 'COMPLETED': return 'Завершено';
      case 'FAILED': return 'Ошибка';
      default: return status;
    }
  };

  const getDataTypeText = (type: string) => {
    const dataType = dataTypes.find(dt => dt.value === type);
    return dataType?.label || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Импорт данных</h1>
          <p className="text-gray-600">Импорт исторических данных с датой и временем</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate(selectedDataType)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Скачать шаблон
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Импорт файлов
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              История импорта ({importJobs.length})
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
              <FileText className="w-4 h-4" />
              Шаблоны
            </div>
          </button>
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Загрузка файла</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип данных
                </label>
                <select
                  value={selectedDataType}
                  onChange={(e) => setSelectedDataType(e.target.value as ImportJob['dataType'])}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {dataTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {dataTypes.find(dt => dt.value === selectedDataType)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Файл данных
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileSelect}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Поддерживаемые форматы: CSV, XLSX, JSON
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата начала периода
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата окончания периода
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">{selectedFile.name}</p>
                    <p className="text-sm text-blue-700">
                      Размер: {formatFileSize(selectedFile.size)} | Тип: {getDataTypeText(selectedDataType)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setShowPreview(false);
                  setPreviewData([]);
                  const fileInput = document.getElementById('file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
              >
                Очистить
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Импортировать данные
              </button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && previewData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Предварительный просмотр</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(previewData[0] || {}).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Показано первые 5 записей из {previewData.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Файл
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Тип данных
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Прогресс
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Период
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.fileName}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(job.fileSize)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getDataTypeText(job.dataType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {job.processedRecords} / {job.totalRecords}
                      </div>
                      {job.status === 'PROCESSING' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(job.processedRecords / job.totalRecords) * 100}%` }}
                          ></div>
                        </div>
                      )}
                      {job.errorRecords > 0 && (
                        <div className="text-xs text-red-500 mt-1">
                          Ошибок: {job.errorRecords}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.startDate && job.endDate ? (
                        <div>
                          <div>{new Date(job.startDate).toLocaleDateString('ru-RU')}</div>
                          <div className="text-xs text-gray-500">
                            до {new Date(job.endDate).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      ) : (
                        'Не указан'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(job.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {job.status === 'FAILED' && (
                          <button className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataTypes.map((dataType) => (
            <div key={dataType.value} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <FileText className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dataType.label}</h3>
                    <p className="text-sm text-gray-500">{dataType.description}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-gray-600">
                    <strong>Обязательные поля:</strong>
                  </div>
                  <div className="text-xs text-gray-500">
                    {dataType.value === 'SALES' && 'date, time, machine_id, product_id, quantity, amount'}
                    {dataType.value === 'INVENTORY' && 'date, time, item_id, quantity, location'}
                    {dataType.value === 'MAINTENANCE' && 'date, time, machine_id, type, description, technician_id'}
                    {dataType.value === 'ROUTES' && 'date, time, driver_id, route_name, start_location, end_location'}
                    {dataType.value === 'USERS' && 'username, first_name, last_name, role, created_date'}
                    {dataType.value === 'TASKS' && 'date, time, title, type, assigned_to, status, description'}
                  </div>
                </div>

                <button
                  onClick={() => downloadTemplate(dataType.value)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Скачать шаблон
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Детали импорта</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Файл</label>
                    <p className="text-sm text-gray-900">{selectedJob.fileName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Размер</label>
                    <p className="text-sm text-gray-900">{formatFileSize(selectedJob.fileSize)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Тип данных</label>
                    <p className="text-sm text-gray-900">{getDataTypeText(selectedJob.dataType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Статус</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                      {getStatusText(selectedJob.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Всего записей</label>
                    <p className="text-sm text-gray-900">{selectedJob.totalRecords}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Обработано</label>
                    <p className="text-sm text-gray-900">{selectedJob.processedRecords}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ошибок</label>
                    <p className="text-sm text-gray-900">{selectedJob.errorRecords}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Создан</label>
                    <p className="text-sm text-gray-900">{new Date(selectedJob.createdAt).toLocaleString('ru-RU')}</p>
                  </div>
                </div>

                {selectedJob.errors && selectedJob.errors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ошибки</label>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {selectedJob.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
