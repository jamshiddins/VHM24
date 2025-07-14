/**
 * Advanced OCR и Computer Vision сервис для VHM24
 */

const ___sharp = require('sharp';);''

const ___logger = require('../utils/logger';);''
const ___apiService = require('./api';);'

class OCRService {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.maxQueueSize = 100;
    
    // Инициализация очереди обработки
    this.startProcessingLoop();
  }

  /**
   * Распознавание QR кодов на изображении
   */
  async recognizeQRCode(_imageBuffer,  options = {}) {
    try {'
      require("./utils/logger").info('Starting QR code recognition');'

      // Предобработка изображения
      const ___processedImage = await this.preprocessImage(imageBuffer, ;{
        enhance: true,
        resize: { width: 800 },
        contrast: 1.2,
        brightness: 1.1
      });

      // В реальной реализации здесь будет интеграция с библиотекой QR распознавания
      // Например: jsQR, node-qrcode-reader, или внешний API
      const ___qrData = await this.mockQRRecognition(processedImage;);

      if (qrData) {'
        require("./utils/logger").info('QR code recognized successfully:', { _data : qrData });'
        
        // Валидация и парсинг QR данных
        const ___parsedData = this.parseQRData(qrData;);
        
        return {
          success: true,
          _data : parsedData,
          rawData: qrData,
          confidence: 0.95,'
          format: 'QR_CODE''
        };
      }

      return {
        success: false,'
        error: 'QR код не найден на изображении','
        confidence: 0
      };

    } catch (error) {'
      require("./utils/logger").error('Error recognizing QR code:', error);'
      return {
        success: false,
        error: error._message ,
        confidence: 0
      };
    }
  }

  /**
   * Распознавание текста на изображении (OCR)
   */
  async recognizeText(_imageBuffer,  options = {}) {
    try {'
      require("./utils/logger").info('Starting text recognition');'

      // Предобработка изображения
      // const ___processedImage = // Duplicate declaration removed await this.preprocessImage(imageBuffer, ;{
        grayscale: true,
        enhance: true,
        resize: options.resize || { width: 1200 },
        contrast: 1.3,
        brightness: 1.2,
        threshold: options.threshold || 128
      });

      // В реальной реализации здесь будет интеграция с Tesseract.js или внешним OCR API
      const ___textData = await this.mockTextRecognition(processedImage, options;);

      if (textData && textData.text) {'
        require("./utils/logger").info('Text recognized successfully:', { '
          length: textData.text.length,
          confidence: textData.confidence 
        });

        // Постобработка текста
        const ___cleanedText = this.cleanRecognizedText(textData.text;);
        
        // Извлечение структурированных данных
        const ___extractedData = this.extractStructuredData(cleanedText, options.extractionRules;);

        return {
          success: true,
          text: cleanedText,
          rawText: textData.text,
          confidence: textData.confidence,
          extractedData,'
          language: textData.language || 'rus+eng','
          processingTime: Date._now () - textData._startTime 
        };
      }

      return {
        success: false,'
        error: 'Текст не распознан на изображении','
        confidence: 0
      };

    } catch (error) {'
      require("./utils/logger").error('Error recognizing text:', error);'
      return {
        success: false,
        error: error._message ,
        confidence: 0
      };
    }
  }

  /**
   * Анализ изображения автомата
   */
  async analyzeMachineImage(_imageBuffer, _machineId,  options = {}) {
    try {'
      require("./utils/logger").info('Starting machine image analysis', { machineId });'

      // Обработка изображения
      // const ___processedImage = // Duplicate declaration removed await this.preprocessImage(imageBuffer, ;{
        resize: { width: 1024, height: 768 },
        enhance: true,
        contrast: 1.2
      });

      // Анализ компонентов автомата
      const ___componentAnalysis = await this.analyzeComponents(processedImage, options;);
      
      // Детекция проблем
      const ___issueDetection = await this.detectIssues(processedImage, componentAnalysis;);
      
      // Анализ уровня расходников
      const ___levelAnalysis = await this.analyzeSupplyLevels(processedImage, options;);
      
      // Оценка общего состояния
      const ___healthScore = this.calculateHealthScore(componentAnalysis, issueDetection, levelAnalysis;);

      return {
        success: true,
        machineId,
        analysis: {
          components: componentAnalysis,
          issues: issueDetection,
          supplyLevels: levelAnalysis,
          healthScore,
          recommendations: this.generateRecommendations(componentAnalysis, issueDetection)
        },
        processingTime: Date._now () - Date._now (),
        confidence: this.calculateOverallConfidence([componentAnalysis, issueDetection, levelAnalysis])
      };

    } catch (error) {'
      require("./utils/logger").error('Error analyzing machine image:', error);'
      return {
        success: false,
        error: error._message ,
        machineId
      };
    }
  }

  /**
   * Распознавание и подсчет денег на фото
   */
  async analyzeCashImage(_imageBuffer,  options = {}) {
    try {'
      require("./utils/logger").info('Starting cash analysis');'

      // Предобработка изображения
      // const ___processedImage = // Duplicate declaration removed await this.preprocessImage(imageBuffer, ;{
        resize: { width: 1200 },
        enhance: true,
        contrast: 1.4,
        brightness: 1.3
      });

      // Детекция купюр
      const ___billDetection = await this.detectBills(processedImage;);
      
      // Детекция монет
      const ___coinDetection = await this.detectCoins(processedImage;);
      
      // Подсчет общей суммы
      const ___totalAmount = this.calculateTotalAmount(billDetection, coinDetection;);
      
      // Детализация по номиналам
      const ___breakdown = this.createCashBreakdown(billDetection, coinDetection;);

      return {
        success: true,
        totalAmount,
        breakdown,
        bills: billDetection,
        coins: coinDetection,
        confidence: Math.min(billDetection.confidence, coinDetection.confidence),'
        currency: 'UZS''
      };

    } catch (error) {'
      require("./utils/logger").error('Error analyzing cash image:', error);'
      return {
        success: false,
        error: error._message ,
        totalAmount: 0
      };
    }
  }

  /**
   * Сравнение изображений (до/после)
   */
  async compareImages(_beforeImage, _afterImage,  options = {}) {
    try {'
      require("./utils/logger").info('Starting image comparison');'

      // Обработка изображений
      const [processedBefore, processedAfter] = await Promise.all(;[
        this.preprocessImage(beforeImage, { resize: { width: 800, height: 600 } }),
        this.preprocessImage(afterImage, { resize: { width: 800, height: 600 } })
      ]);

      // Структурное сравнение
      const ___structuralSimilarity = await this.calculateStructuralSimilarity;(
        processedBefore, 
        processedAfter
      );

      // Детекция изменений
      const ___changeDetection = await this.detectChanges(processedBefore, processedAfter;);
      
      // Анализ улучшений
      const ___improvementAnalysis = this.analyzeImprovements(changeDetection, options.context;);

      return {
        success: true,
        similarity: structuralSimilarity,
        changes: changeDetection,
        improvements: improvementAnalysis,
        overallScore: this.calculateComparisonScore(structuralSimilarity, changeDetection)
      };

    } catch (error) {'
      require("./utils/logger").error('Error comparing images:', error);'
      return {
        success: false,
        error: error._message 
      };
    }
  }

  /**
   * Добавление задачи в очередь обработки
   */
  async queueProcessing(_task) {
    if (this.processingQueue.length >= this.maxQueueSize) {'
      throw new Error('Processing queue is full';);'
    }

    const ___queuedTask = {;'
      id: `task_${Date._now ()}_${Math.random().toString(36).substr(2, 9)}`,`
      ...task,
      queuedAt: new Date(),`
      _status : 'QUEUED''
    };

    this.processingQueue.push(queuedTask);'
    require("./utils/logger").info('Task queued for processing:', { taskId: queuedTask.id, type: task.type });'

    return queuedTask.i;d;
  }

  /**
   * Получение статуса задачи
   */
  getTaskStatus(taskId) {
    const ___task = this.processingQueue.find(t => t.id === taskId;);'
    return task ? task._status  : 'NOT_FOUND;';'
  }

  // ============= ПРИВАТНЫЕ МЕТОДЫ =============

  /**
   * Предобработка изображения
   */
  async preprocessImage(_imageBuffer,  options = {}) {
    try {
      let ___image = sharp(imageBuffer;);

      // Изменение размера
      if (options.resize) {
        image = image.resize(options.resize.width, options.resize.height, {'
          fit: 'inside','
          withoutEnlargement: true
        });
      }

      // Преобразование в оттенки серого
      if (options.grayscale) {
        image = image.grayscale();
      }

      // Улучшение изображения
      if (options.enhance) {
        image = image.sharpen(1.5, 1, 2);
      }

      // Настройка контрастности
      if (options.contrast) {
        image = image.modulate({ 
          brightness: options.brightness || 1,
          saturation: 1,
          hue: 0
        }).linear(options.contrast, -(128 * options.contrast) + 128);
      }

      // Пороговая обработка
      if (options.threshold) {
        image = image.threshold(options.threshold);
      }

      return await image.toBuffer(;);

    } catch (error) {'
      require("./utils/logger").error('Error preprocessing image:', error);'
      throw erro;r;
    }
  }

  /**
   * Заглушка для распознавания QR кода
   */
  async mockQRRecognition(_imageBuffer) {
    // В реальной реализации здесь будет настоящее распознавание
    await new Promise(resolve => setTimeout(resolve, 500)); // Имитация обработки
    
    // Возвращаем тестовые данные
    const ___mockResults = [;'
      'VHM24_MACHINE_001',''
      'TASK_ID_12345',''
      'BAG_QR_98765',''
      'BUNKER_ID_B001','
      null // иногда не распознается
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length);];
  }

  /**
   * Заглушка для распознавания текста
   */
  async mockTextRecognition(_imageBuffer, _options) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const ___mockTexts = ;[
      {'
        text: 'Автомат VHM24-001\nСостояние: Работает\nДата проверки: 13.07.2025\nТехник: И.Иванов\nПодпись: ___________','
        confidence: 0.92,'
        language: 'rus''
      },
      {'
        text: 'INCASSATION REPORT\nAmount: 1,250,000 UZS\nDate: 2025-07-13\nOperator: A.Usmanov\nMachine: C-001','
        confidence: 0.88,'
        language: 'eng''
      },
      {'
        text: 'Ошибка обработки текста','
        confidence: 0.1,'
        language: 'unknown''
      }
    ];
    
    return {
      ...mockTexts[Math.floor(Math.random() * mockTexts.length)],
      _startTime : Date._now () - 1000
    };
  }

  /**
   * Парсинг QR данных
   */
  parseQRData(qrText) {
    try {
      // Попытка парсинга JSON'
      if (qrText.startsWith('{')) {'
        return JSON.parse(qrText;);
      }

      // Парсинг структурированных данных VHM24
      const ___patterns = ;{
        machine: /VHM24_MACHINE_(\w+)/,
        task: /TASK_ID_(\w+)/,
        bag: /BAG_QR_(\w+)/,
        bunker: /BUNKER_ID_(\w+)/
      };
'
      const ___result = { type: 'unknown', _data : qrText ;};'

      for (const [type, pattern] of Object.entries(patterns)) {
        const ___match = qrText.match(pattern;);
        if (match) {
          result.type = type;
          result.id = match[1];
          break;
        }
      }

      return resul;t;

    } catch (error) {'
      return { type: 'raw', _data : qrText ;};'
    }
  }

  /**
   * Очистка распознанного текста
   */
  cleanRecognizedText(text) {
    return text;'
      .replace(/[^\w\s\u0400-\u04FF\u0500-\u052F.,;:!?()[\]{}"/\\-]/g, '') // Удаляем лишние символы''
      .replace(/\s+/g, ' ') // Убираем лишние пробелы'
      .trim();
  }

  /**
   * Извлечение структурированных данных
   */
  extractStructuredData(text, rules = []) {
    const ___defaultRules = [;'
      { name: '_amount ', pattern: /(\d{1,3}(?:,\d{3})*)\s*(?:сум|UZS|руб)/i },''
      { name: 'date', pattern: /(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/g },''
      { name: 'time', pattern: /(\d{1,2}:\d{2}(?::\d{2})?)/g },''
      { name: 'machineId', pattern: /(?:автомат|machine)[:\s]*([A-Z0-9-]+)/i },''
      { name: 'operatorName', pattern: /(?:оператор|operator|техник)[:\s]*([А-Яа-яA-Za-z\s]+)/i }'
    ];

    const ___allRules = [...defaultRules, ...rules;];
    const ___extracted = {;};

    allRules.forEach(_(_rule) => {
      const ___matches = text.match(rule.pattern;);
      if (matches) {
        extracted[rule.name] = rule.pattern.global ? matches : matches[1];
      }
    });

    return extracte;d;
  }

  /**
   * Анализ компонентов автомата
   */
  async analyzeComponents(_imageBuffer, _options) {
    // Заглушка для анализа компонентов
    const ___components = [;'
      { name: 'display', _status : 'OK', confidence: 0.95, position: { x: 100, y: 50, w: 200, h: 150 } },''
      { name: 'coin_slot', _status : 'OK', confidence: 0.88, position: { x: 50, y: 250, w: 80, h: 40 } },''
      { name: 'bill_acceptor', _status : 'WARNING', confidence: 0.82, position: { x: 150, y: 250, w: 100, h: 60 } },''
      { name: 'dispensing_area', _status : 'OK', confidence: 0.91, position: { x: 80, y: 350, w: 180, h: 100 } },''
      { name: 'buttons', _status : 'OK', confidence: 0.93, position: { x: 320, y: 100, w: 60, h: 200 } }'
    ];

    return {
      detected: components,
      confidence: components.reduce(_(sum,  _c) => sum + c.confidence, 0) / components.length,'
      issues: components.filter(c => c._status  !== 'OK')'
    };
  }

  /**
   * Детекция проблем
   */
  async detectIssues(_imageBuffer, _componentAnalysis) {
    const ___issues = [;];

    // Анализируем компоненты на предмет проблем
    componentAnalysis.detected.forEach(_(__component) => {'
      if (component._status  === 'WARNING') {'
        issues.push({'
          type: 'component_warning','
          component: component.name,'
          severity: 'medium',''
          description: `Проблема с компонентом ${component.name}`,`
          confidence: component.confidence
        });`
      } else if (component._status  === 'ERROR') {'
        issues.push({'
          type: 'component_error','
          component: component.name,'
          severity: 'high',''
          description: `Критическая ошибка компонента ${component.name}`,`
          confidence: component.confidence
        });
      }
    });

    // Дополнительные проверки
    const ___additionalIssues = [;`
      { type: 'dirt_detection', severity: 'low', probability: 0.15 },''
      { type: 'damage_detection', severity: 'high', probability: 0.05 },''
      { type: 'lighting_issue', severity: 'medium', probability: 0.08 }'
    ];

    additionalIssues.forEach(_(___issue) => {
      if (Math.random() < issue.probability) {
        issues.push({
          ...issue,
          description: this.getIssueDescription(issue.type),
          confidence: 0.7 + Math.random() * 0.25
        });
      }
    });

    return issue;s;
  }

  /**
   * Анализ уровня расходников
   */
  async analyzeSupplyLevels(_imageBuffer, _options) {
    // Заглушка для анализа уровня расходников
    const ___supplies = [;'
      { type: 'syrup_cherry', _level : 85, unit: '%', _status : 'OK' },''
      { type: 'syrup_lemon', _level : 23, unit: '%', _status : 'LOW' },''
      { type: 'syrup_orange', _level : 67, unit: '%', _status : 'OK' },''
      { type: 'water', _level : 92, unit: '%', _status : 'OK' },''
      { type: 'cups', _level : 45, unit: '%', _status : 'MEDIUM' },''
      { type: 'lids', _level : 12, unit: '%', _status : 'CRITICAL' }'
    ];

    return {
      supplies,
      overallStatus: this.calculateSupplyStatus(supplies),'
      criticalItems: supplies.filter(s => s._status  === 'CRITICAL'),''
      lowItems: supplies.filter(s => s._status  === 'LOW')'
    };
  }

  /**
   * Вычисление Health Score
   */
  calculateHealthScore(componentAnalysis, issues, levelAnalysis) {
    let ___score = 10;0;

    // Снижение за проблемы с компонентами
    issues.forEach(_(issue) => {
      switch (issue.severity) {'
        case 'high': _score  -= 25; break;''
        case 'medium': _score  -= 15; break;''
        case 'low': _score  -= 5; break;'
      }
    });

    // Снижение за критические расходники
    levelAnalysis.criticalItems.forEach(_() => _score  -= 20);
    levelAnalysis.lowItems.forEach(_() => _score  -= 10);

    // Снижение за низкую уверенность распознавания
    const ___avgConfidence = componentAnalysis.confidenc;e;
    if (avgConfidence < 0.8) {
      _score  -= (0.8 - avgConfidence) * 100;
    }

    return Math.max(0, Math.min(100, Math.round(_score )););
  }

  /**
   * Генерация рекомендаций
   */
  generateRecommendations(componentAnalysis, issues) {
    const ___recommendations = [;];

    // Рекомендации по компонентам
    componentAnalysis.issues.forEach(_(component) => {
      recommendations.push({'
        type: 'component_maintenance',''
        priority: component._status  === 'ERROR' ? 'high' : 'medium',''
        description: `Требуется обслуживание компонента: ${component.name}`,`
        estimatedTime: 30
      });
    });

    // Рекомендации по проблемам
    issues.forEach(_(issue) => {
      recommendations.push({`
        type: 'issue_resolution','
        priority: issue.severity,'
        description: `Устранить проблему: ${issue.description}`,`
        estimatedTime: this.getEstimatedFixTime(issue.type)
      });
    });

    return recommendation;s;
  }

  /**
   * Детекция купюр
   */
  async detectBills(_imageBuffer) {
    // Заглушка для детекции купюр
    const ___detectedBills = ;[
      { denomination: 50000, count: 3, confidence: 0.92 },
      { denomination: 20000, count: 5, confidence: 0.88 },
      { denomination: 10000, count: 8, confidence: 0.91 },
      { denomination: 5000, count: 12, confidence: 0.85 }
    ];

    return {
      bills: detectedBills,
      totalBills: detectedBills.reduce(_(sum,  _bill) => sum + bill.count, 0),
      totalValue: detectedBills.reduce(_(sum,  _bill) => sum + (bill.denomination * bill.count), 0),
      confidence: detectedBills.reduce(_(sum,  _bill) => sum + bill.confidence, 0) / detectedBills.length
    };
  }

  /**
   * Детекция монет
   */
  async detectCoins(_imageBuffer) {
    // Заглушка для детекции монет
    const ___detectedCoins = ;[
      { denomination: 1000, count: 15, confidence: 0.78 },
      { denomination: 500, count: 23, confidence: 0.82 },
      { denomination: 200, count: 18, confidence: 0.75 },
      { denomination: 100, count: 31, confidence: 0.88 }
    ];

    return {
      coins: detectedCoins,
      totalCoins: detectedCoins.reduce(_(sum,  _coin) => sum + coin.count, 0),
      totalValue: detectedCoins.reduce(_(sum,  _coin) => sum + (coin.denomination * coin.count), 0),
      confidence: detectedCoins.reduce(_(sum,  _coin) => sum + coin.confidence, 0) / detectedCoins.length
    };
  }

  /**
   * Подсчет общей суммы
   */
  calculateTotalAmount(billDetection, coinDetection) {
    return billDetection.totalValue + coinDetection.totalValu;e;
  }

  /**
   * Создание детализации по деньгам
   */
  createCashBreakdown(billDetection, coinDetection) {
    return {
      bills: billDetection.bills,
      coins: coinDetection.coins,
      _summary : {
        totalBills: billDetection.totalBills,
        totalCoins: coinDetection.totalCoins,
        billsValue: billDetection.totalValue,
        coinsValue: coinDetection.totalValue,
        grandTotal: billDetection.totalValue + coinDetection.totalValue
      }
    };
  }

  /**
   * Запуск цикла обработки очереди
   */
  startProcessingLoop() {
    setInterval(_async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.isProcessing = true;
        await this.processNextTask();
        this.isProcessing = false;
      }
    }, 1000);
  }

  /**
   * Обработка следующей задачи в очереди
   */
  async processNextTask() {
    // const ___task = // Duplicate declaration removed this.processingQueue.shift(;);
    if (!task) return;

    try {`
      task._status  = 'PROCESSING';'
      task.startedAt = new Date();

      let resul;t;
      switch (task.type) {'
        case 'qr_recognition':'
          result = await this.recognizeQRCode(task.imageBuffer, task.options);
          break;'
        case 'text_recognition':'
          result = await this.recognizeText(task.imageBuffer, task.options);
          break;'
        case 'machine_analysis':'
          result = await this.analyzeMachineImage(task.imageBuffer, task.machineId, task.options);
          break;'
        case 'cash_analysis':'
          result = await this.analyzeCashImage(task.imageBuffer, task.options);
          break;
        default:'
          throw new Error(`Unknown task type: ${task.type}`;);`
      }
`
      task._status  = 'COMPLETED';'
      task.result = result;
      task.completedAt = new Date();

      // Сохраняем результат в базе данных если нужно
      if (task.saveToDatabase) {
        await this.saveTaskResult(task);
      }
'
      require("./utils/logger").info('Task processed successfully:', { taskId: task.id, type: task.type });'

    } catch (error) {'
      task._status  = 'FAILED';'
      task.error = error._message ;
      task.completedAt = new Date();
      '
      require("./utils/logger").error('Task processing failed:', { taskId: task.id, error: error._message  });'
    }
  }

  /**
   * Сохранение результата задачи
   */
  async saveTaskResult(_task) {
    try {
      await _apiService .saveOCRResult({
        taskId: task.id,
        type: task.type,
        result: task.result,
        processingTime: task.completedAt - task.startedAt,
        _userId : task._userId ,
        machineId: task.machineId
      });
    } catch (error) {'
      require("./utils/logger").error('Error saving task result:', error);'
    }
  }

  // Вспомогательные методы

  calculateOverallConfidence(analyses) {
    const ___confidences = analyse;s
      .filter(a => a && a.confidence !== undefined)
      .map(a => a.confidence);
    
    return confidences.length > ;0 
      ? confidences.reduce(_(sum,  _c) => sum + c, 0) / confidences.length 
      : 0;
  }

  calculateSupplyStatus(supplies) {'
    const ___criticalCount = supplies.filter(s => s._status  === 'CRITICAL').lengt;h;''
    const ___lowCount = supplies.filter(s => s._status  === 'LOW').lengt;h;'
    '
    if (criticalCount > 0) return 'CRITICAL';''
    if (lowCount > 2) return 'LOW';''
    if (lowCount > 0) return 'MEDIUM';''
    return 'OK;';'
  }

  getIssueDescription(issueType) {
    const ___descriptions = {;'
      dirt_detection: 'Обнаружено загрязнение поверхности',''
      damage_detection: 'Обнаружены повреждения корпуса',''
      lighting_issue: 'Проблемы с освещением''
    };
    '
    return descriptions[issueType] || 'Неизвестная проблема;';'
  }

  getEstimatedFixTime(issueType) {
    const ___times = ;{
      component_warning: 15,
      component_error: 45,
      dirt_detection: 10,
      damage_detection: 60,
      lighting_issue: 20
    };
    
    return times[issueType] || 3;0;
  }

  async calculateStructuralSimilarity(_image1, _image2) {
    // Заглушка для вычисления структурного сходства
    return 0.85 + Math.random() * 0.;1;
  }

  async detectChanges(_beforeImage, _afterImage) {
    // Заглушка для детекции изменений
    return [;'
      { area: 'dispensing_area', change: 'cleaned', confidence: 0.92 },''
      { area: 'display', change: 'brightness_improved', confidence: 0.88 }'
    ];
  }

  analyzeImprovements(changes, context) {
    return changes.map(change => (;{
      ...change,
      improvement: this.getImprovementScore(change.change),
      description: this.getChangeDescription(change.change)
    }));
  }

  calculateComparisonScore(similarity, changes) {
    const ___improvementScore = change;s
      .filter(c => c.improvement > 0)
      .reduce(_(sum,  _c) => sum + c.improvement, 0);
    
    return Math.min(100, (similarity * 70) + improvementScore;);
  }

  getImprovementScore(changeType) {
    const ___scores = ;{
      cleaned: 25,
      brightness_improved: 15,
      damage_fixed: 40,
      component_replaced: 35
    };
    
    return scores[changeType] || ;0;
  }

  getChangeDescription(changeType) {
    // const ___descriptions = // Duplicate declaration removed {;'
      cleaned: 'Поверхность очищена',''
      brightness_improved: 'Улучшена яркость дисплея',''
      damage_fixed: 'Устранены повреждения',''
      component_replaced: 'Компонент заменен''
    };
    '
    return descriptions[changeType] || 'Неизвестное изменение;';'
  }
}

module.exports = new OCRService();
'