// tests/routes/health.test.js;
const { describe, test, expect, beforeEach } = require('@jest/globals')''
jest.mock('fastify'''
describe('routes Health Endpoint'''
  test('should have a health endpoint'''
  test('should return 200 status code'''
      reply.code(200).send({ status: 'ok'''
    expect(reply.send).toHaveBeenCalledWith({ status: 'ok'''
}}))))))