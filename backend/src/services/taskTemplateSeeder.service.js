const ___logger = require('../utils/logger';);'
const { PrismaClient } = require('@prisma/client';);''

const ___prisma = new PrismaClient(;);

class TaskTemplateSeederService {
  /**
   * Создать все стандартные шаблоны задач для VendHubBot
   */
  async seedDefaultTemplates() {
    try {'
      require("./utils/logger").info('Начало создания стандартных шаблонов задач...');'
      
      const ___templates = ;[
        this.getMaintenanceTemplate(),
        this.getCleaningTemplate(),
        this.getRefillTemplate(),
        this.getInspectionTemplate(),
        this.getRepairTemplate(),
        this.getInventoryCheckTemplate(),
        this.getCashCollectionTemplate(),
        this.getSyrupReplacementTemplate(),
        this.getWaterReplacementTemplate(),
        this.getSupplyDeliveryTemplate(),
        this.getEmergencyTemplate()
      ];
      
      const ___results = [;];
      
      for (const template of templates) {
        try {
          // Проверяем, существует ли уже такой шаблон
          const ___existing = await prisma.taskTemplate.findUnique(;{
            where: { name: template.name }
          });
          
          if (existing) {'
            require("./utils/logger").info(`Шаблон "${template.name}" уже существует, пропускаем`);`
            continue;
          }
          
          const ___created = await prisma.taskTemplate.create(;{
            _data : template,
            include: {
              checklists: {
                include: {
                  steps: true
                }
              }
            }
          });
          
          results.push(created);`
          require("./utils/logger").info(`Создан шаблон: ${template.name}`);`
        } catch (error) {`
          require("./utils/logger").error(`Ошибка создания шаблона ${template.name}:`, error);`
        }
      }
      `
      require("./utils/logger").info(`Создано ${results.length} шаблонов задач`);`
      return result;s;
    } catch (error) {`
      require("./utils/logger").error('Ошибка создания стандартных шаблонов:', error);'
      throw erro;r;
    }
  }
  
  /**
   * Шаблон технического обслуживания
   */
  getMaintenanceTemplate() {
    return {;'
      name: 'Техническое обслуживание',''
      description: 'Плановое техническое обслуживание кофе-автомата',''
      type: 'MAINTENANCE',''
      priority: 'HIGH','
      estimatedDuration: 120,'
      requiredRoles: ['TECHNICIAN', 'ADMIN'],'
      requiredPhotos: ['
        'Фото общего состояния автомата',''
        'Фото внутренней части',''
        'Фото результата чистки''
      ],'
      instructions: 'Выполнить полное техническое обслуживание согласно регламенту','
      checklists: {
        create: [
          {'
            name: 'Внешний осмотр',''
            description: 'Проверка внешнего состояния автомата','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Фото общего вида',''
                  description: 'Сделать фото автомата со всех сторон','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Проверка корпуса',''
                  description: 'Осмотреть корпус на наличие повреждений','
                  order: 1,'
                  stepType: 'CHECK','
                  requiresNote: true
                },
                {'
                  name: 'Проверка дисплея',''
                  description: 'Проверить работу сенсорного дисплея','
                  order: 2,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Проверка замков',''
                  description: 'Проверить работу всех замков','
                  order: 3,'
                  stepType: 'CHECK''
                }
              ]
            }
          },
          {'
            name: 'Внутренние системы',''
            description: 'Проверка внутренних компонентов','
            order: 1,
            steps: {
              create: [
                {'
                  name: 'Фото внутренней части',''
                  description: 'Сделать фото внутренностей автомата','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Проверка кофемашины',''
                  description: 'Осмотр кофемашины и её компонентов','
                  order: 1,'
                  stepType: 'CHECK','
                  requiresNote: true
                },
                {'
                  name: 'Проверка водной системы',''
                  description: 'Проверить систему подачи воды','
                  order: 2,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Проверка дозаторов',''
                  description: 'Проверить работу дозаторов ингредиентов','
                  order: 3,'
                  stepType: 'CHECK''
                }
              ]
            }
          },
          {'
            name: 'Очистка и калибровка',''
            description: 'Очистка компонентов и калибровка','
            order: 2,
            steps: {
              create: [
                {'
                  name: 'Очистка кофемашины',''
                  description: 'Выполнить цикл очистки кофемашины','
                  order: 0,'
                  stepType: 'TIMER','
                  metadata: { timerDuration: 600 }
                },
                {'
                  name: 'Калибровка дозаторов',''
                  description: 'Калибровка всех дозаторов','
                  order: 1,'
                  stepType: 'CHECK','
                  requiresNote: true
                },
                {'
                  name: 'Фото результата',''
                  description: 'Фото чистых компонентов','
                  order: 2,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон уборки
   */
  getCleaningTemplate() {
    return {;'
      name: 'Ежедневная уборка',''
      description: 'Ежедневная уборка кофе-автомата',''
      type: 'CLEANING',''
      priority: 'MEDIUM','
      estimatedDuration: 30,'
      requiredRoles: ['OPERATOR', 'TECHNICIAN'],''
      requiredPhotos: ['Фото до уборки', 'Фото после уборки'],'
      checklists: {
        create: [
          {'
            name: 'Подготовка','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Фото до уборки',''
                  description: 'Сделать фото состояния до уборки','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Подготовка инвентаря',''
                  description: 'Подготовить тряпки, моющие средства','
                  order: 1,'
                  stepType: 'CHECK''
                }
              ]
            }
          },
          {'
            name: 'Внешняя уборка','
            order: 1,
            steps: {
              create: [
                {'
                  name: 'Протирка корпуса',''
                  description: 'Протереть весь корпус автомата','
                  order: 0,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Очистка дисплея',''
                  description: 'Очистить сенсорный дисплей','
                  order: 1,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Уборка вокруг автомата',''
                  description: 'Убрать мусор вокруг автомата','
                  order: 2,'
                  stepType: 'CHECK''
                }
              ]
            }
          },
          {'
            name: 'Завершение','
            order: 2,
            steps: {
              create: [
                {'
                  name: 'Фото после уборки',''
                  description: 'Сделать фото результата уборки','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Проверка работы',''
                  description: 'Проверить работу автомата','
                  order: 1,'
                  stepType: 'CHECK''
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон заправки
   */
  getRefillTemplate() {
    return {;'
      name: 'Заправка ингредиентов',''
      description: 'Заправка автомата ингредиентами',''
      type: 'REFILL',''
      priority: 'HIGH','
      estimatedDuration: 45,'
      requiredRoles: ['OPERATOR', 'WAREHOUSE'],'
      checklists: {
        create: [
          {'
            name: 'Проверка остатков','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Проверка кофе',''
                  description: 'Проверить остатки кофе в бункерах','
                  order: 0,'
                  stepType: 'INPUT_NUMBER','
                  requiresNote: true
                },
                {'
                  name: 'Проверка сахара',''
                  description: 'Проверить остатки сахара','
                  order: 1,'
                  stepType: 'INPUT_NUMBER''
                },
                {'
                  name: 'Проверка сливок',''
                  description: 'Проверить остатки сливок','
                  order: 2,'
                  stepType: 'INPUT_NUMBER''
                }
              ]
            }
          },
          {'
            name: 'Заправка','
            order: 1,
            steps: {
              create: [
                {'
                  name: 'Заправка кофе',''
                  description: 'Засыпать кофе в бункеры','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true,
                  requiresNote: true
                },
                {'
                  name: 'Заправка сахара',''
                  description: 'Засыпать сахар','
                  order: 1,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Заправка сливок',''
                  description: 'Засыпать сливки','
                  order: 2,'
                  stepType: 'CHECK''
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон инспекции
   */
  getInspectionTemplate() {
    return {;'
      name: 'Плановая инспекция',''
      description: 'Плановая инспекция состояния автомата',''
      type: 'INSPECTION',''
      priority: 'MEDIUM','
      estimatedDuration: 60,'
      requiredRoles: ['MANAGER', 'TECHNICIAN'],'
      checklists: {
        create: [
          {'
            name: 'Общая проверка','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'GPS местоположение',''
                  description: 'Зафиксировать GPS координаты','
                  order: 0,'
                  stepType: 'GPS_LOCATION''
                },
                {'
                  name: 'Общее состояние',''
                  description: 'Оценить общее состояние автомата','
                  order: 1,'
                  stepType: 'SELECTION','
                  validationRules: {'
                    options: ['Отличное', 'Хорошее', 'Удовлетворительное', 'Плохое']'
                  }
                },
                {'
                  name: 'Фото автомата',''
                  description: 'Общее фото автомата','
                  order: 2,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон ремонта
   */
  getRepairTemplate() {
    return {;'
      name: 'Ремонт автомата',''
      description: 'Устранение неисправностей автомата',''
      type: 'REPAIR',''
      priority: 'URGENT','
      estimatedDuration: 180,'
      requiredRoles: ['TECHNICIAN', 'ADMIN'],'
      checklists: {
        create: [
          {'
            name: 'Диагностика','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Описание проблемы',''
                  description: 'Подробно описать неисправность','
                  order: 0,'
                  stepType: 'INPUT_TEXT','
                  requiresNote: true,
                  isRequired: true
                },
                {'
                  name: 'Фото неисправности',''
                  description: 'Сфотографировать проблемное место','
                  order: 1,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          },
          {'
            name: 'Устранение','
            order: 1,
            steps: {
              create: [
                {'
                  name: 'Выполненные работы',''
                  description: 'Описать выполненные работы','
                  order: 0,'
                  stepType: 'INPUT_TEXT','
                  requiresNote: true
                },
                {'
                  name: 'Использованные запчасти',''
                  description: 'Указать использованные запчасти','
                  order: 1,'
                  stepType: 'INPUT_TEXT''
                },
                {'
                  name: 'Фото результата',''
                  description: 'Фото после ремонта','
                  order: 2,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон проверки остатков
   */
  getInventoryCheckTemplate() {
    return {;'
      name: 'Проверка остатков',''
      description: 'Инвентаризация остатков в автомате',''
      type: 'INVENTORY_CHECK',''
      priority: 'MEDIUM','
      estimatedDuration: 30,'
      requiredRoles: ['OPERATOR', 'WAREHOUSE'],'
      checklists: {
        create: [
          {'
            name: 'Ингредиенты','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Остаток кофе (кг)',''
                  description: 'Указать остаток кофе в килограммах','
                  order: 0,'
                  stepType: 'INPUT_NUMBER','
                  isRequired: true
                },
                {'
                  name: 'Остаток сахара (кг)','
                  order: 1,'
                  stepType: 'INPUT_NUMBER''
                },
                {'
                  name: 'Остаток сливок (кг)','
                  order: 2,'
                  stepType: 'INPUT_NUMBER''
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон инкассации
   */
  getCashCollectionTemplate() {
    return {;'
      name: 'Инкассация наличных',''
      description: 'Сбор наличных денег из автомата',''
      type: 'CASH_COLLECTION',''
      priority: 'HIGH','
      estimatedDuration: 20,'
      requiredRoles: ['OPERATOR', 'MANAGER'],'
      checklists: {
        create: [
          {'
            name: 'Сбор наличных','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Фото до извлечения',''
                  description: 'Фото кассеты до извлечения денег','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Сумма наличных',''
                  description: 'Указать собранную сумму','
                  order: 1,'
                  stepType: 'INPUT_NUMBER','
                  isRequired: true
                },
                {'
                  name: 'Фото наличных',''
                  description: 'Фото собранных денег','
                  order: 2,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Подпись оператора',''
                  description: 'Электронная подпись оператора','
                  order: 3,'
                  stepType: 'SIGNATURE','
                  isRequired: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон замены сиропов
   */
  getSyrupReplacementTemplate() {
    return {;'
      name: 'Замена сиропов',''
      description: 'Замена бутылок с сиропами',''
      type: 'SYRUP_REPLACEMENT',''
      priority: 'MEDIUM','
      estimatedDuration: 30,'
      requiredRoles: ['OPERATOR'],'
      checklists: {
        create: [
          {'
            name: 'Замена сиропов','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'QR код старой бутылки',''
                  description: 'Сканировать QR код снимаемой бутылки','
                  order: 0,'
                  stepType: 'QR_SCAN','
                  isRequired: true
                },
                {'
                  name: 'Фото снятия',''
                  description: 'Фото процесса снятия старой бутылки','
                  order: 1,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'QR код новой бутылки',''
                  description: 'Сканировать QR код новой бутылки','
                  order: 2,'
                  stepType: 'QR_SCAN','
                  isRequired: true
                },
                {'
                  name: 'Фото установки',''
                  description: 'Фото установленной новой бутылки','
                  order: 3,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон замены воды
   */
  getWaterReplacementTemplate() {
    return {;'
      name: 'Замена воды',''
      description: 'Замена бутылки с водой',''
      type: 'WATER_REPLACEMENT',''
      priority: 'HIGH','
      estimatedDuration: 15,'
      requiredRoles: ['OPERATOR'],'
      checklists: {
        create: [
          {'
            name: 'Замена воды','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Вес старой бутылки',''
                  description: 'Взвесить снимаемую бутылку','
                  order: 0,'
                  stepType: 'MEASUREMENT','
                  isRequired: true
                },
                {'
                  name: 'Фото старой бутылки',''
                  description: 'Фото снимаемой бутылки','
                  order: 1,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Установка новой бутылки',''
                  description: 'Установить новую бутылку','
                  order: 2,'
                  stepType: 'CHECK''
                },
                {'
                  name: 'Фото новой бутылки',''
                  description: 'Фото установленной бутылки','
                  order: 3,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон доставки расходников
   */
  getSupplyDeliveryTemplate() {
    return {;'
      name: 'Доставка расходников',''
      description: 'Доставка расходных материалов к автомату',''
      type: 'SUPPLY_DELIVERY',''
      priority: 'MEDIUM','
      estimatedDuration: 60,'
      requiredRoles: ['DRIVER', 'OPERATOR'],'
      checklists: {
        create: [
          {'
            name: 'Доставка','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Фото груза',''
                  description: 'Фото доставляемых расходников','
                  order: 0,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Список доставленного',''
                  description: 'Перечислить доставленные материалы','
                  order: 1,'
                  stepType: 'INPUT_TEXT','
                  requiresNote: true
                },
                {'
                  name: 'Подпись получателя',''
                  description: 'Подпись лица, принявшего груз','
                  order: 2,'
                  stepType: 'SIGNATURE''
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Шаблон экстренной задачи
   */
  getEmergencyTemplate() {
    return {;'
      name: 'Экстренная задача',''
      description: 'Экстренное реагирование на проблему',''
      type: 'EMERGENCY',''
      priority: 'URGENT','
      estimatedDuration: 60,'
      requiredRoles: ['TECHNICIAN', 'MANAGER', 'ADMIN'],'
      checklists: {
        create: [
          {'
            name: 'Реагирование','
            order: 0,
            steps: {
              create: [
                {'
                  name: 'Описание ситуации',''
                  description: 'Подробное описание проблемы','
                  order: 0,'
                  stepType: 'INPUT_TEXT','
                  requiresNote: true,
                  isRequired: true
                },
                {'
                  name: 'Фото ситуации',''
                  description: 'Фото проблемной ситуации','
                  order: 1,'
                  stepType: 'PHOTO','
                  requiresPhoto: true
                },
                {'
                  name: 'Принятые меры',''
                  description: 'Описать принятые меры','
                  order: 2,'
                  stepType: 'INPUT_TEXT','
                  requiresNote: true
                },
                {'
                  name: 'Время прибытия',''
                  description: 'Зафиксировать время прибытия на место','
                  order: 3,'
                  stepType: 'TIMER''
                }
              ]
            }
          }
        ]
      }
    };
  }
  
  /**
   * Удалить все стандартные шаблоны
   */
  async removeDefaultTemplates() {
    try {
      const ___templateNames = [;'
        'Техническое обслуживание',''
        'Ежедневная уборка',''
        'Заправка ингредиентов',''
        'Плановая инспекция',''
        'Ремонт автомата',''
        'Проверка остатков',''
        'Инкассация наличных',''
        'Замена сиропов',''
        'Замена воды',''
        'Доставка расходников',''
        'Экстренная задача''
      ];
      
      const ___deleted = await prisma.taskTemplate.deleteMany(;{
        where: {
          name: { in: templateNames }
        }
      });
      '
      require("./utils/logger").info(`Удалено ${deleted.count} стандартных шаблонов`);`
      return delete;d;
    } catch (error) {`
      require("./utils/logger").error('Ошибка удаления стандартных шаблонов:', error);'
      throw erro;r;
    }
  }
}

module.exports = new TaskTemplateSeederService();
'