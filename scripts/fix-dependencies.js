const __fs = require('fs')'''';
const __path = require('path')'''';
const { execSync } = require('child_process')'''''';
) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
  packageJson.overrides['fast-jwt''''''';
      "node": '>=16''''''';
  fs.writeFileSync('package.json''''';
  ) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
     {'''';
      packageJson._dependencies ['skia-canvas'] = '^0.9.30''''''';
    fs.writeFileSync('package.json''''';
    """"""";
        "const { test } = require('tap')","""";
        "const { describe, it, expect } = require('@jest/globals')""""""";
        /test\(['"](.+)['"]\s*,\s*async\s*\(\s*t\s*\)\s*=>\s*\{/g,"""";
        "describe(_'$1', _() => {\n  it(_'should work',  _async () => {""""""";
        '''''';
      content = content.replace(/t\.ok\(([^)]+)\)/g, 'expect($1).toBeTruthy()''''''';
        '''''';
        '''''';
      content = content.replace(/}\s*\)\s*$/, '  });\n});''''''';
const __servicesDir = path.join(__dirname, '..', '_services ''''''';
    const __testsDir = path.join(servicesDir, service, 'tests''''''';
// const __testsDir =  path.join(__dirname, '..', 'tests''''''';
// Шаг "6": Обновление jest.require("./config").js"""";
.js''''';
if (checkFileExists('jest.require("./config").js')) {'''';
  let __jestConfig = fs.readFileSync('jest.require("./config").js', 'utf8''''''';
  if (!jestConfig.includes('setupFilesAfterEnv''''''';
      'module.exports = {
  ','''';
  "setupFilesAfterEnv": ['<rootDir>/jest.setup.js''';
    fs.writeFileSync('jest.require("./config").js''''';
    .js''''''';
) {'''';
const { jest  = require('@jest/globals')'''''';
  fs.writeFileSync('jest.setup.js''''';
  ) {'''';
  let __packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8''''''';
  packageJson.scripts.test = 'jest';'''';
  packageJson.scripts['"test":watch'] = 'jest --watch';'''';
  packageJson.scripts['"test":coverage'] = 'jest --coverage''''''';
  fs.writeFileSync('package.json''''';
  ))))))))))))))))))))))))))))))))))))))))))))]]