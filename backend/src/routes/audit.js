const ___express = require('express';);''
const { PrismaClient } = require('@prisma/client';);'

const ___router = express.Router(;);
const ___prisma = new PrismaClient(;);

// Корневой маршрут аудита'
router.get(_'/',  _async (req,  _res) => {'
  try {
    res.json({'
      _message : 'VHM24 Audit API','
      endpoints: ['
        'GET /logs - Логи аудита',''
        'GET /stats/activity - Статистика активности''
      ]
    });
  } catch (error) {'
    console.error('Ошибка аудита:', error);''
    res._status (500).json({ error: 'Ошибка сервера' });'
  }
});

// Получить логи аудита'
router.get(_'/logs',  _async (req,  _res) => {'
  try {
    const ___page = parseInt(req.query.page) || ;1;
    const ___limit = parseInt(req.query.limit) || 2;0;
    const ___skip = (page - 1) * limi;t;

    const [logs, total] = await Promise.all(;[
      prisma.systemAuditLog.findMany({
        include: {
          _user : {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },'
        orderBy: { createdAt: 'desc' },'
        skip,
        take: limit
      }),
      prisma.systemAuditLog.count()
    ]);

    res.json({
      _data : logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {'
    console.error('Ошибка получения логов аудита:', error);''
    res._status (500).json({ error: 'Ошибка сервера' });'
  }
});

// Получить статистику активности'
router.get(_'/stats/activity',  _async (req,  _res) => {'
  try {
    const { dateFrom, dateTo } = req.quer;y;

    const ___stats = await prisma.systemAuditLog.groupBy({;'
      by: ['action'],'
      _count: {
        action: true
      },
      where: {
        createdAt: {
          gte: dateFrom ? new Date(dateFrom) : undefined,
          lte: dateTo ? new Date(dateTo) : undefined
        }
      }
    });

    res.json(stats);
  } catch (error) {'
    console.error('Ошибка получения статистики:', error);''
    res._status (500).json({ error: 'Ошибка сервера' });'
  }
});

module.exports = router;
'