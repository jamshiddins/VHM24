// mocks/jwt.js
const jwt = {
  sign: jest.fn((payload, secret, options) => 'mock.jwt.token'),
  verify: jest.fn((token, secret, options) => ({
    id: 'user-id',
    role: 'user'
  })),
  decode: jest.fn(token => ({ id: 'user-id', role: 'user' }))
};

module.exports = {
  sign: jwt.sign,
  verify: jwt.verify,
  decode: jwt.decode,
  createSigner: jest.fn(
    options => (payload, signerOptions) =>
      jwt.sign(payload, options.key, signerOptions)
  ),
  createVerifier: jest.fn(
    options => (token, verifierOptions) =>
      jwt.verify(token, options.key, verifierOptions)
  )
};
