
// Пример использования VendHub API

const VendHubAPI = require('./vendhub-api');
const api = new VendHubAPI('https://api.vendhub.uz');

// Авторизация
await api.auth.login({
  phoneNumber: '+998901234567',
  code: '1234'
});

// Получение списка автоматов
const machines = await api.machines.list({
  status: 'ACTIVE',
  groupName: 'Центр'
});

// Операция заполнения бункера
const bunkerOperation = await api.bunkers.fill({
  bunkerCode: 'SET-005-1CO',
  emptyWeight: 450,
  fullWeight: 1450,
  batchCode: 'PARTY-2024-COFF-10',
  photos: ['photo1.jpg', 'photo2.jpg']
});

// Сбор выручки
const revenue = await api.revenue.collect({
  machineCode: 'VM-015-TASH-WEST',
  cashAmount: 45000,
  qrAmount: 125000, // автоматически из платежной системы
  photos: ['z-report.jpg']
});

// Получение отчета
const report = await api.reports.getPnL({
  period: 'month',
  groupBy: 'machine'
});

console.log('Прибыль за месяц:', report.summary.netProfit);
