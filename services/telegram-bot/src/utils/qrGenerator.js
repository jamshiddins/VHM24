// QR Code generation utilities
import QRCode from 'qrcode';

export async function generateMachineQR(machine) {
  const qrData = {
    type: 'vhm24_machine',
    id: machine.id,
    name: machine.name,
    location: machine.location,
    timestamp: new Date().toISOString()
  };
  
  const qrString = JSON.stringify(qrData);
  
  // Generate QR code as buffer
  const qrBuffer = await QRCode.toBuffer(qrString, {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 512
  });
  
  return qrBuffer;
}

export async function generateTaskQR(task) {
  const qrData = {
    type: 'vhm24_task',
    id: task.id,
    title: task.title,
    machineId: task.machineId,
    timestamp: new Date().toISOString()
  };
  
  const qrString = JSON.stringify(qrData);
  
  const qrBuffer = await QRCode.toBuffer(qrString, {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    width: 512
  });
  
  return qrBuffer;
}

export async function generateInventoryQR(item) {
  const qrData = {
    type: 'vhm24_inventory',
    id: item.id,
    sku: item.sku,
    name: item.name,
    quantity: item.quantity,
    timestamp: new Date().toISOString()
  };
  
  const qrString = JSON.stringify(qrData);
  
  const qrBuffer = await QRCode.toBuffer(qrString, {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    width: 512
  });
  
  return qrBuffer;
}

export async function generateAuthQR(authToken, userId) {
  const qrData = {
    type: 'vhm24_auth',
    token: authToken,
    userId: userId,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  };
  
  const qrString = JSON.stringify(qrData);
  
  const qrBuffer = await QRCode.toBuffer(qrString, {
    errorCorrectionLevel: 'H', // High error correction for auth
    type: 'png',
    quality: 0.92,
    margin: 1,
    width: 512
  });
  
  return qrBuffer;
}

export function parseQRData(qrString) {
  try {
    const data = JSON.parse(qrString);
    
    // Validate QR data structure
    if (!data.type || !data.type.startsWith('vhm24_')) {
      throw new Error('Invalid QR code format');
    }
    
    if (!data.id && data.type !== 'vhm24_auth') {
      throw new Error('Missing ID in QR data');
    }
    
    if (!data.timestamp) {
      throw new Error('Missing timestamp in QR data');
    }
    
    // Check if QR code is expired (for auth QR codes)
    if (data.type === 'vhm24_auth' && data.expiresAt) {
      if (new Date(data.expiresAt) < new Date()) {
        throw new Error('QR code has expired');
      }
    }
    
    return {
      valid: true,
      data: data
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

export async function generateCustomQR(data, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    width: 512
  };
  
  const qrOptions = { ...defaultOptions, ...options };
  const qrString = typeof data === 'string' ? data : JSON.stringify(data);
  
  return await QRCode.toBuffer(qrString, qrOptions);
}

export async function generateQRWithLogo(data, logoPath, options = {}) {
  // This would require additional image processing libraries
  // For now, return standard QR code
  return await generateCustomQR(data, options);
}
