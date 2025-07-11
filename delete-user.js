const axios = require('axios');

async function deleteUser() {
  try {
    const response = await axios.delete('http://localhost:8000/api/v1/telegram/user/42283329', {
      headers: {
        'x-telegram-bot-token': '8015112367:AAHi25gHhI3p1X1uyuCAt8vUnlMZRrcoKEQ',
        'Content-Type': 'application/json'
      },
      data: {
        adminTelegramId: '42283329'
      }
    });
    
    console.log('✅ Пользователь удален:', response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Пользователь не найден (уже удален)');
    } else {
      console.error('❌ Ошибка:', error.response?.data || error.message);
    }
  }
}

deleteUser();
