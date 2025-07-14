/**
 * Экспорт всех сервисов VHM24
 */

const bagService = require('./bag.service');
const expenseService = require('./expense.service');
const incassationService = require('./incassation.service');
const reconciliationService = require('./reconciliation.service');
const revenueService = require('./revenue.service');
const syrupBottleService = require('./syrupBottle.service');
const waterBottleService = require('./waterBottle.service');

module.exports = {
  bagService,
  expenseService,
  incassationService,
  reconciliationService,
  revenueService,
  syrupBottleService,
  waterBottleService
};
