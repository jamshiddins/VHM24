// Settings command handler
import { getUserData, setUserData } from '../utils/auth.js';

export async function handleSettings(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userData = getUserData(userId);
  
  // Get current settings
  const settings = userData?.settings || {
    notifications: true,
    language: 'en',
    timezone: 'UTC',
    reportFormat: 'excel'
  };
  
  let message = '⚙️ *Settings*\n\n';
  message += `🔔 Notifications: ${settings.notifications ? 'Enabled' : 'Disabled'}\n`;
  message += `🌐 Language: ${getLanguageName(settings.language)}\n`;
  message += `🕐 Timezone: ${settings.timezone}\n`;
  message += `📄 Report Format: ${settings.reportFormat.toUpperCase()}\n`;
  
  const keyboard = [
    [
      { 
        text: settings.notifications ? '🔕 Disable Notifications' : '🔔 Enable Notifications', 
        callback_data: 'settings_toggle_notifications' 
      }
    ],
    [
      { text: '🌐 Change Language', callback_data: 'settings_language' },
      { text: '🕐 Change Timezone', callback_data: 'settings_timezone' }
    ],
    [
      { text: '📄 Report Format', callback_data: 'settings_report_format' },
      { text: '🔐 Security', callback_data: 'settings_security' }
    ],
    [
      { text: '👤 Profile', callback_data: 'settings_profile' },
      { text: '📱 Connected Devices', callback_data: 'settings_devices' }
    ],
    [
      { text: '🔄 Reset Settings', callback_data: 'settings_reset' }
    ],
    [
      { text: '🏠 Main Menu', callback_data: 'main_menu' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

export async function toggleNotifications(bot, chatId) {
  const userId = chatId; // Using chatId as userId
  const userData = getUserData(userId) || {};
  const settings = userData.settings || {};
  
  // Toggle notifications
  settings.notifications = !settings.notifications;
  userData.settings = settings;
  setUserData(userId, userData);
  
  await bot.sendMessage(chatId, 
    settings.notifications 
      ? '🔔 Notifications have been enabled!' 
      : '🔕 Notifications have been disabled!',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '⬅️ Back to Settings', callback_data: 'menu_settings' }
        ]]
      }
    }
  );
}

export async function showLanguageSelection(bot, chatId) {
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uz', name: "O'zbek", flag: '🇺🇿' },
    { code: 'kz', name: 'Қазақ', flag: '🇰🇿' }
  ];
  
  const keyboard = languages.map(lang => [{
    text: `${lang.flag} ${lang.name}`,
    callback_data: `settings_set_language_${lang.code}`
  }]);
  
  keyboard.push([
    { text: '❌ Cancel', callback_data: 'menu_settings' }
  ]);
  
  await bot.sendMessage(chatId, 
    '🌐 *Select Language*\n\n' +
    'Choose your preferred language:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  );
}

export async function showTimezoneSelection(bot, chatId) {
  const timezones = [
    { name: 'UTC', offset: '+00:00' },
    { name: 'Moscow', offset: '+03:00' },
    { name: 'Tashkent', offset: '+05:00' },
    { name: 'Almaty', offset: '+06:00' },
    { name: 'Bangkok', offset: '+07:00' },
    { name: 'Singapore', offset: '+08:00' }
  ];
  
  const keyboard = [];
  for (let i = 0; i < timezones.length; i += 2) {
    const row = [];
    row.push({
      text: `${timezones[i].name} (${timezones[i].offset})`,
      callback_data: `settings_set_timezone_${timezones[i].name}`
    });
    
    if (i + 1 < timezones.length) {
      row.push({
        text: `${timezones[i + 1].name} (${timezones[i + 1].offset})`,
        callback_data: `settings_set_timezone_${timezones[i + 1].name}`
      });
    }
    
    keyboard.push(row);
  }
  
  keyboard.push([
    { text: '❌ Cancel', callback_data: 'menu_settings' }
  ]);
  
  await bot.sendMessage(chatId, 
    '🕐 *Select Timezone*\n\n' +
    'Choose your timezone:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboard
      }
    }
  );
}

export async function showReportFormatSelection(bot, chatId) {
  await bot.sendMessage(chatId, 
    '📄 *Report Format*\n\n' +
    'Choose your preferred format for exported reports:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Excel (.xlsx)', callback_data: 'settings_format_excel' },
            { text: '📄 PDF', callback_data: 'settings_format_pdf' }
          ],
          [
            { text: '📋 CSV', callback_data: 'settings_format_csv' },
            { text: '📝 JSON', callback_data: 'settings_format_json' }
          ],
          [
            { text: '❌ Cancel', callback_data: 'menu_settings' }
          ]
        ]
      }
    }
  );
}

export async function showSecuritySettings(bot, chatId) {
  const userData = getUserData(chatId);
  
  let message = '🔐 *Security Settings*\n\n';
  message += `🔑 Two-Factor Auth: ${userData?.twoFactorEnabled ? 'Enabled ✅' : 'Disabled ❌'}\n`;
  message += `📱 Active Sessions: ${userData?.activeSessions || 1}\n`;
  message += `🕐 Last Login: ${userData?.lastLogin || 'Now'}\n`;
  
  const keyboard = [
    [
      { 
        text: userData?.twoFactorEnabled ? '🔓 Disable 2FA' : '🔐 Enable 2FA', 
        callback_data: 'settings_toggle_2fa' 
      }
    ],
    [
      { text: '🔑 Change Password', callback_data: 'settings_change_password' },
      { text: '📱 Manage Sessions', callback_data: 'settings_sessions' }
    ],
    [
      { text: '📋 Login History', callback_data: 'settings_login_history' },
      { text: '🚫 Blocked Users', callback_data: 'settings_blocked' }
    ],
    [
      { text: '⬅️ Back to Settings', callback_data: 'menu_settings' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

export async function showProfile(bot, chatId) {
  const userData = getUserData(chatId);
  
  if (!userData) {
    await bot.sendMessage(chatId, '❌ Profile data not found.');
    return;
  }
  
  let message = '👤 *Your Profile*\n\n';
  message += `👤 Name: ${userData.name || 'Not set'}\n`;
  message += `📧 Email: ${userData.email || 'Not set'}\n`;
  message += `📱 Phone: ${userData.phone || 'Not set'}\n`;
  message += `👷 Role: ${userData.role || 'User'}\n`;
  message += `🏢 Company: ${userData.company || 'Not set'}\n`;
  message += `📅 Member Since: ${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}\n`;
  
  const keyboard = [
    [
      { text: '✏️ Edit Profile', callback_data: 'settings_edit_profile' }
    ],
    [
      { text: '📸 Change Avatar', callback_data: 'settings_avatar' },
      { text: '📧 Verify Email', callback_data: 'settings_verify_email' }
    ],
    [
      { text: '⬅️ Back to Settings', callback_data: 'menu_settings' }
    ]
  ];
  
  await bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
}

function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'ru': 'Русский',
    'uz': "O'zbek",
    'kz': 'Қазақ'
  };
  
  return languages[code] || code;
}

export async function updateSetting(bot, chatId, setting, value) {
  const userId = chatId;
  const userData = getUserData(userId) || {};
  const settings = userData.settings || {};
  
  settings[setting] = value;
  userData.settings = settings;
  setUserData(userId, userData);
  
  let successMessage = '✅ Setting updated successfully!';
  
  switch (setting) {
    case 'language':
      successMessage = `✅ Language changed to ${getLanguageName(value)}`;
      break;
    case 'timezone':
      successMessage = `✅ Timezone changed to ${value}`;
      break;
    case 'reportFormat':
      successMessage = `✅ Report format changed to ${value.toUpperCase()}`;
      break;
  }
  
  await bot.sendMessage(chatId, successMessage, {
    reply_markup: {
      inline_keyboard: [[
        { text: '⬅️ Back to Settings', callback_data: 'menu_settings' }
      ]]
    }
  });
}
