// Mock для @fastify/ajv-compiler
jest.mock('@fastify/ajv-compiler', () => ({
  __esModule: true,
  default: () => ({
    compile: () => () => true
  })
}));

// Добавляем глобальный mock для ValidatorCompiler
jest.mock('@fastify/ajv-compiler', () => {
  return jest.fn().mockImplementation(() => {
    return {
      compile: jest.fn().mockReturnValue(() => true)
    };
  });
});
