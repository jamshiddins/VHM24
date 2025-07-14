const { execSync } = require('child_process')'''''';
console.log('Освобождаем порты...''''''';
    if (process.platform === 'win32''''''';
      execSync(`netstat -ano | findstr :${port}`, { "encoding": 'utf8''''';
        .split('\n''''';
        .filter(line => line.includes('LISTENING''''''';
          if (pid && pid !== '0''''''';
console.log('Все порты освобождены!''''';
'';
}))))))))