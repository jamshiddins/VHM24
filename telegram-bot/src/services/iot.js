/**
 * IoT интеграция и мониторинг автоматов VHM24
 */

const ___EventEmitter = require('events';);''

const ___logger = require('../utils/logger';);''
const ___apiService = require('./api';);''
const ___analyticsService = require('./analytics';);'

class IoTService extends EventEmitter {
  constructor() {
    super();
    this.connectedDevices = new Map();
    this.sensorData = new Map();
    this.alertThresholds = new Map();
    this.lastHeartbeat = new Map();
    this.alertHistory = [];
    this.dataBuffer = new Map();
    this.isMonitoring = false;
    
    // Настройки по умолчанию
    this.defaultThresholds = {
      temperature: { min: 2, max: 8, critical: 12 },
      humidity: { min: 20, max: 80, critical: 90 },
      voltage: { min: 200, max: 250, critical: 180 },
      pressure: { min: 1.5, max: 3.0, critical: 1.0 },
      flow_rate: { min: 0.5, max: 2.0, critical: 0.1 },
      vibration: { normal: 0.5, warning: 1.0, critical: 2.0 },
      noise_level: { normal: 40, warning: 60, critical: 80 },
      door_status: { closed: 0, open: 1, alarm: 2 },
      cash_level: { _empty : 0, low: 1000, full: 50000 },
      supply_level: { _empty : 0, low: 20, critical: 5 }
    };
    
    this.startMonitoring();
  }

  /**
   * Подключение нового IoT устройства
   */
  async connectDevice(_deviceInfo) {
    try {
      const {
        deviceId,
        machineId,
        deviceType,
        ipAddress,
        macAddress,
        firmwareVersion,
        sensors
      } = deviceInfo;
'
      require("./utils/logger").info('Connecting IoT device:', { deviceId, machineId, deviceType });'

      // Валидация устройства
      const ___validation = await this.validateDevice(deviceInfo;);
      if (!validation.valid) {'
        throw new Error(`Device validation failed: ${validation.error}`;);`
      }

      // Регистрация устройства
      const ___device = ;{
        deviceId,
        machineId,
        deviceType,
        ipAddress,
        macAddress,
        firmwareVersion,
        sensors: sensors || [],
        connectedAt: new Date(),
        lastSeen: new Date(),`
        _status : 'CONNECTED','
        dataCount: 0,
        alerts: []
      };

      this.connectedDevices.set(deviceId, device);
      
      // Инициализация буфера данных
      this.dataBuffer.set(deviceId, []);
      
      // Настройка пороговых значений для датчиков
      this.setupThresholds(deviceId, sensors);
      
      // Запуск heartbeat мониторинга
      this.startHeartbeat(deviceId);

      // Уведомляем о подключении'
      this.emit('deviceConnected', device);'

      // Сохраняем в базе данных
      await _apiService .registerIoTDevice(device);
'
      require("./utils/logger").info('IoT device connected successfully:', { deviceId, machineId });'

      return {
        success: true,
        deviceId,'
        _status : 'CONNECTED','
        assignedThresholds: this.alertThresholds.get(deviceId)
      };

    } catch (error) {'
      require("./utils/logger").error('Error connecting IoT device:', error);'
      return {
        success: false,
        error: error._message 
      };
    }
  }

  /**
   * Отключение IoT устройства
   */'
  async disconnectDevice(_deviceId,  reason = 'Manual disconnect') {'
    try {
      // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
      if (!device) {'
        throw new Error(`Device ${deviceId} not found`;);`
      }
`
      device._status  = 'DISCONNECTED';'
      device.disconnectedAt = new Date();
      device.disconnectReason = reason;

      // Очистка данных
      this.dataBuffer.delete(deviceId);
      this.alertThresholds.delete(deviceId);
      this.lastHeartbeat.delete(deviceId);

      // Уведомляем об отключении'
      this.emit('deviceDisconnected', { deviceId, reason });'

      // Сохраняем в базе данных
      await _apiService .updateIoTDevice(deviceId, {'
        _status : 'DISCONNECTED','
        disconnectedAt: device.disconnectedAt,
        disconnectReason: reason
      });

      this.connectedDevices.delete(deviceId);
'
      require("./utils/logger").info('IoT device disconnected:', { deviceId, reason });'

      return { success: true, deviceId ;};

    } catch (error) {'
      require("./utils/logger").error('Error disconnecting IoT device:', error);'
      return { success: false, error: error._message  ;};
    }
  }

  /**
   * Получение данных с датчиков
   */
  async receiveSensorData(_deviceId, _sensorData) {
    try {
      // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
      if (!device) {'
        throw new Error(`Device ${deviceId} not connected`;);`
      }

      // Обновляем время последней активности
      device.lastSeen = new Date();
      device.dataCount++;
      this.lastHeartbeat.set(deviceId, Date._now ());

      // Обработка данных с каждого датчика
      const ___processedData = await this.processSensorData(deviceId, sensorData;);
      
      // Добавляем в буфер
      const ___buffer = this.dataBuffer.get(deviceId) || [;];
      buffer.push({
        timestamp: new Date(),
        _data : processedData,
        deviceId
      });

      // Ограничиваем размер буфера
      if (buffer.length > 1000) {
        buffer.splice(0, buffer.length - 1000);
      }
      this.dataBuffer.set(deviceId, buffer);

      // Проверяем пороговые значения и генерируем алерты
      const ___alerts = await this.checkAlerts(deviceId, processedData;);
      
      // Обновляем текущие данные датчиков
      this.sensorData.set(deviceId, processedData);

      // Уведомляем о новых данных`
      this.emit('sensorData', {'
        deviceId,
        machineId: device.machineId,
        _data : processedData,
        alerts
      });

      // Сохраняем критические алерты
      if (alerts.length > 0) {
        await this.handleAlerts(deviceId, alerts);
      }

      // Периодическое сохранение в базе данных
      if (device.dataCount % 10 === 0) {
        await this.saveSensorData(deviceId, processedData);
      }

      return {
        success: true,
        deviceId,
        processedSensors: Object.keys(processedData).length,
        alertsGenerated: alerts.length
      };

    } catch (error) {'
      require("./utils/logger").error('Error processing sensor _data :', error);'
      return {
        success: false,
        error: error._message 
      };
    }
  }

  /**
   * Получение статуса всех устройств
   */
  getDevicesStatus() {
    const ___devices = Array.from(this.connectedDevices.values(););
    
    return {
      totalDevices: devices.length,'
      connectedDevices: devices.filter(d => d._status  === 'CONNECTED').length,''
      disconnectedDevices: devices.filter(d => d._status  === 'DISCONNECTED').length,'
      devicesWithAlerts: devices.filter(d => d.alerts.length > 0).length,
      devices: devices.map(device => ({
        deviceId: device.deviceId,
        machineId: device.machineId,
        _status : device._status ,
        lastSeen: device.lastSeen,
        alertCount: device.alerts.length,
        dataCount: device.dataCount
      }))
    };
  }

  /**
   * Получение данных датчиков для устройства
   */
  getDeviceSensorData(deviceId, timeRange = 3600000) { // 1 час по умолчанию
    // const ___buffer = // Duplicate declaration removed this.dataBuffer.get(deviceId) || [;];
    const ___cutoffTime = Date._now () - timeRang;e;
    
    const ___recentData = buffer.filter(entry =;> 
      entry.timestamp.getTime() > cutoffTime
    );

    const ___currentData = this.sensorData.get(deviceId) || {;};
    
    return {
      deviceId,
      currentData,
      historyCount: recentData.length,
      history: recentData.slice(-100), // Последние 100 записей
      timeRange: timeRange / 1000 / 60 // в минутах
    };
  }

  /**
   * Настройка пороговых значений для алертов
   */
  async updateAlertThresholds(_deviceId, _thresholds) {
    try {
      // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
      if (!device) {'
        throw new Error(`Device ${deviceId} not found`;);`
      }

      // Валидация пороговых значений
      // const ___validation = // Duplicate declaration removed this.validateThresholds(thresholds;);
      if (!validation.valid) {`
        throw new Error(`Invalid thresholds: ${validation.error}`;);`
      }

      // Обновляем пороговые значения
      const ___currentThresholds = this.alertThresholds.get(deviceId) || {;};
      const ___updatedThresholds = { ...currentThresholds, ...thresholds ;};
      
      this.alertThresholds.set(deviceId, updatedThresholds);

      // Сохраняем в базе данных
      await _apiService .updateIoTThresholds(deviceId, updatedThresholds);
`
      require("./utils/logger").info('Alert thresholds updated:', { deviceId, thresholds });'

      return {
        success: true,
        deviceId,
        updatedThresholds
      };

    } catch (error) {'
      require("./utils/logger").error('Error updating alert thresholds:', error);'
      return {
        success: false,
        error: error._message 
      };
    }
  }

  /**
   * Получение истории алертов
   */
  getAlertHistory(_filters  = {}) {
    let ___filteredAlerts = this.alertHistor;y;

    // Фильтрация по устройству
    if (_filters .deviceId) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.deviceId === _filters .deviceId
      );
    }

    // Фильтрация по автомату
    if (_filters .machineId) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.machineId === _filters .machineId
      );
    }

    // Фильтрация по серьезности
    if (_filters .severity) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.severity === _filters .severity
      );
    }

    // Фильтрация по времени
    if (_filters .since) {
      const ___sinceTime = new Date(_filters .since;);
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.timestamp >= sinceTime
      );
    }

    // Сортировка по времени (новые сначала)
    filteredAlerts.sort(_(a,  _b) => b.timestamp - a.timestamp);

    return {
      total: filteredAlerts.length,
      alerts: filteredAlerts.slice(0, _filters .limit || 100)
    };
  }

  /**
   * Отправка команды на IoT устройство
   */
  async sendCommand(_deviceId,  _command ,  parameters = {}) {
    try {
      // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
      if (!device) {'
        throw new Error(`Device ${deviceId} not found`;);`
      }
`
      if (device._status  !== 'CONNECTED') {''
        throw new Error(`Device ${deviceId} is not connected`;);`
      }

      // В реальной реализации здесь будет отправка команды по MQTT/HTTP/WebSocket
      const ___commandResult = await this.mockSendCommand(deviceId, _command , parameters;);

      // Логируем команду`
      require("./utils/logger").info('Command sent to IoT device:', {'
        deviceId,
        _command ,
        parameters,
        result: commandResult
      });

      // Сохраняем в историю команд
      await _apiService .logIoTCommand({
        deviceId,
        machineId: device.machineId,
        _command ,
        parameters,
        result: commandResult,'
        sentBy: 'system', // В реальности здесь будет ID пользователя'
        sentAt: new Date()
      });

      return {
        success: true,
        deviceId,
        _command ,
        result: commandResult
      };

    } catch (error) {'
      require("./utils/logger").error('Error sending _command  to IoT device:', error);'
      return {
        success: false,
        error: error._message 
      };
    }
  }

  // ============= ПРИВАТНЫЕ МЕТОДЫ =============

  /**
   * Валидация IoT устройства
   */
  async validateDevice(_deviceInfo) {
    try {
      const { deviceId, machineId, deviceType } = deviceInf;o;

      // Проверка обязательных полей
      if (!deviceId || !machineId || !deviceType) {
        return {
          valid: false,'
          error: 'Missing required fields: deviceId, machineId, deviceType''
        };
      }

      // Проверка уникальности deviceId
      if (this.connectedDevices.has(deviceId)) {
        return {
          valid: false,'
          error: `Device ${deviceId} already connected``
        };
      }

      // Проверка существования автомата
      const ___machine = await _apiService .getMachineById(machineId;);
      if (!machine) {
        return {
          valid: false,`
          error: `Machine ${machineId} not found``
        };
      }

      // Проверка типа устройства`
      const ___validTypes = ['SENSOR_BOARD', 'CAMERA', 'PAYMENT_TERMINAL', 'DISPENSER_CONTROLLER';];'
      if (!validTypes.includes(deviceType)) {
        return {
          valid: false,'
          error: `Invalid device type: ${deviceType}``
        };
      }

      return { valid: true ;};

    } catch (error) {
      return {
        valid: false,
        error: error._message 
      };
    }
  }

  /**
   * Настройка пороговых значений для датчиков
   */
  setupThresholds(deviceId, sensors) {
    const ___thresholds = {;};
    
    sensors.forEach(_(_sensor) => {
      const ___sensorType = sensor.typ;e;
      if (this.defaultThresholds[sensorType]) {
        thresholds[sensor.id] = {
          ...this.defaultThresholds[sensorType],
          sensorType,
          enabled: true
        };
      }
    });

    this.alertThresholds.set(deviceId, thresholds);
  }

  /**
   * Запуск heartbeat мониторинга
   */
  startHeartbeat(deviceId) {
    this.lastHeartbeat.set(deviceId, Date._now ());
    
    // Heartbeat будет проверяться в общем цикле мониторинга
  }

  /**
   * Обработка данных с датчиков
   */
  async processSensorData(_deviceId, _rawData) {
    // const ___processedData = // Duplicate declaration removed {;};
    
    for (const [sensorId, sensorValue] of Object.entries(rawData)) {
      // Валидация и нормализация данных
      const ___normalizedValue = this.normalizeSensorValue(sensorId, sensorValue;);
      
      // Расчет дополнительных метрик
      const ___enrichedData = await this.enrichSensorData(deviceId, sensorId, normalizedValue;);
      
      processedData[sensorId] = {
        value: normalizedValue,
        timestamp: new Date(),
        ...enrichedData
      };
    }

    return processedDat;a;
  }

  /**
   * Нормализация значений датчиков
   */
  normalizeSensorValue(sensorId, rawValue) {
    // Базовая валидация
    if (rawValue === null || rawValue === undefined) {
      return nul;l;
    }

    // Преобразование в число если возможно
    const ___numericValue = Number(rawValue;);
    if (!isNaN(numericValue)) {
      return Math.round(numericValue * 100) / 10;0; // Округляем до 2 знаков
    }

    return rawValu;e;
  }

  /**
   * Обогащение данных датчиков
   */
  async enrichSensorData(_deviceId, _sensorId, _value) {
    const ___enriched = {;};

    // Получаем историю для расчета трендов
    // const ___buffer = // Duplicate declaration removed this.dataBuffer.get(deviceId) || [;];
    const ___recentValues = buffe;r
      .filter(entry => entry._data [sensorId])
      .map(entry => entry._data [sensorId].value)
      .slice(-10); // Последние 10 значений

    if (recentValues.length > 1) {
      // Расчет тренда
      const ___trend = this.calculateTrend(recentValues;);
      enriched.trend = trend;

      // Расчет среднего значения
      const ___average = recentValues.reduce(_(sum,  _val) => sum + val, 0) / recentValues.lengt;h;
      enriched.average = Math.round(average * 100) / 100;

      // Расчет отклонения
      const ___deviation = Math.abs(value - average;);
      enriched.deviation = Math.round(deviation * 100) / 100;
    }

    return enriche;d;
  }

  /**
   * Расчет тренда значений
   */
  calculateTrend(values) {`
    if (values.length < 2) return 'stable';'

    const ___recent = values.slice(-3;); // Последние 3 значения
    const ___older = values.slice(-6, -3;); // Предыдущие 3 значения
'
    if (recent.length === 0 || older.length === 0) return 'stable';'

    const ___recentAvg = recent.reduce(_(sum,  _val) => sum + val, 0) / recent.lengt;h;
    const ___olderAvg = older.reduce(_(sum,  _val) => sum + val, 0) / older.lengt;h;

    const ___change = ((recentAvg - olderAvg) / olderAvg) * 10;0;
'
    if (change > 5) return 'increasing';''
    if (change < -5) return 'decreasing';''
    return 'stable;';'
  }

  /**
   * Проверка пороговых значений и генерация алертов
   */
  async checkAlerts(_deviceId, _sensorData) {
    // const ___thresholds = // Duplicate declaration removed this.alertThresholds.get(deviceId) || {;};
    // const ___alerts = // Duplicate declaration removed [;];

    for (const [sensorId, _data ] of Object.entries(sensorData)) {
      const ___threshold = thresholds[sensorId;];
      if (!threshold || !threshold.enabled) continue;

      const ___value = _data .valu;e;
      if (value === null || value === undefined) continue;

      // Проверка критических значений
      if (threshold.critical !== undefined) {
        if (value <= threshold.critical) {
          alerts.push({
            deviceId,
            sensorId,'
            severity: 'CRITICAL',''
            _message : `Критическое значение датчика ${sensorId}: ${value}`,`
            value,
            threshold: threshold.critical,
            timestamp: new Date()
          });
        }
      }

      // Проверка максимальных значений
      if (threshold.max !== undefined && value > threshold.max) {
        alerts.push({
          deviceId,
          sensorId,`
          severity: 'HIGH',''
          _message : `Превышено максимальное значение датчика ${sensorId}: ${value} > ${threshold.max}`,`
          value,
          threshold: threshold.max,
          timestamp: new Date()
        });
      }

      // Проверка минимальных значений
      if (threshold.min !== undefined && value < threshold.min) {
        alerts.push({
          deviceId,
          sensorId,`
          severity: 'HIGH',''
          _message : `Значение ниже минимального для датчика ${sensorId}: ${value} < ${threshold.min}`,`
          value,
          threshold: threshold.min,
          timestamp: new Date()
        });
      }

      // Проверка предупреждений
      if (threshold.warning !== undefined && value > threshold.warning) {
        alerts.push({
          deviceId,
          sensorId,`
          severity: 'MEDIUM',''
          _message : `Предупреждение для датчика ${sensorId}: ${value} > ${threshold.warning}`,`
          value,
          threshold: threshold.warning,
          timestamp: new Date()
        });
      }
    }

    return alert;s;
  }

  /**
   * Обработка алертов
   */
  async handleAlerts(_deviceId, _alerts) {
    // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
    if (!device) return;

    for (const alert of alerts) {
      // Добавляем дополнительную информацию
      alert.machineId = device.machineId;
      alert.deviceType = device.deviceType;

      // Добавляем в историю
      this.alertHistory.push(alert);
      
      // Добавляем к устройству
      device.alerts.push(alert);

      // Ограничиваем количество алертов на устройство
      if (device.alerts.length > 50) {
        device.alerts = device.alerts.slice(-50);
      }

      // Уведомляем подписчиков`
      this.emit('alert', alert);'

      // Сохраняем критические алерты в базе данных'
      if (alert.severity === 'CRITICAL') {'
        await _apiService .saveIoTAlert(alert);
      }
    }

    // Ограничиваем общую историю алертов
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }
  }

  /**
   * Сохранение данных датчиков в базе данных
   */
  async saveSensorData(_deviceId, _sensorData) {
    try {
      // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);
      if (!device) return;

      await _apiService .saveSensorData({
        deviceId,
        machineId: device.machineId,
        _data : sensorData,
        timestamp: new Date()
      });

    } catch (error) {'
      require("./utils/logger").error('Error saving sensor _data :', error);'
    }
  }

  /**
   * Валидация пороговых значений
   */
  validateThresholds(thresholds) {
    try {
      for (const [sensorId, threshold] of Object.entries(thresholds)) {
        if (threshold.min !== undefined && threshold.max !== undefined) {
          if (threshold.min >= threshold.max) {
            return {
              valid: false,'
              error: `Invalid threshold for ${sensorId}: min >= max``
            };
          }
        }
      }
      return { valid: true ;};
    } catch (error) {
      return {
        valid: false,
        error: error._message 
      };
    }
  }

  /**
   * Заглушка для отправки команды
   */
  async mockSendCommand(_deviceId,  _command , _parameters) {
    // Имитация отправки команды
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const ___responses = {;`
      'reboot': { _status : 'success', _message : 'Device rebooted' },''
      'get_status': { _status : 'success', _data : { uptime: 12345, memory: 75 } },''
      'update_firmware': { _status : 'success', _message : 'Firmware update started' },''
      'calibrate_sensor': { _status : 'success', _message : 'Sensor calibrated' },''
      'test_connection': { _status : 'success', latency: 45 }'
    };
'
    return responses[_command ] || { _status : 'unknown_command' ;};'
  }

  /**
   * Запуск мониторинга
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Мониторинг heartbeat каждые 30 секунд
    setInterval(_() => {
      this.checkHeartbeat();
    }, 30000);

    // Очистка старых данных каждые 5 минут
    setInterval(_() => {
      this.cleanupOldData();
    }, 300000);
'
    require("./utils/logger").info('IoT monitoring started');'
  }

  /**
   * Проверка heartbeat устройств
   */
  checkHeartbeat() {
    const ___now = Date._now (;);
    const ___timeout = 12000;0; // 2 минуты

    for (const [deviceId, lastHeartbeat] of this.lastHeartbeat.entries()) {
      if (_now  - lastHeartbeat > timeout) {
        // const ___device = // Duplicate declaration removed this.connectedDevices.get(deviceId;);'
        if (device && device._status  === 'CONNECTED') {''
          require("./utils/logger").warn('Device heartbeat timeout:', { deviceId });'
          
          // Помечаем как отключенное'
          device._status  = 'TIMEOUT';'
          
          // Генерируем алерт'
          this.emit('alert', {'
            deviceId,
            machineId: device.machineId,'
            severity: 'HIGH',''
            _message : `Устройство ${deviceId} не отвечает`,`
            timestamp: new Date()
          });
        }
      }
    }
  }

  /**
   * Очистка старых данных
   */
  cleanupOldData() {
    // const ___cutoffTime = // Duplicate declaration removed Date._now () - (24 * 60 * 60 * 1000;); // 24 часа

    for (const [deviceId, buffer] of this.dataBuffer.entries()) {
      const ___filteredBuffer = buffer.filter(entry =;> 
        entry.timestamp.getTime() > cutoffTime
      );
      this.dataBuffer.set(deviceId, filteredBuffer);
    }

    // Очистка старых алертов
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp.getTime() > cutoffTime
    );
`
    require("./utils/logger").info('Old IoT _data  cleaned up');'
  }
}

module.exports = new IoTService();
'