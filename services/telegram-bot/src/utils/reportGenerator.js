// Report generation utilities
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { formatDate, formatCurrency, formatNumber } = require('./formatters.js');

export async function generateReportFile(reportType, format) {
  switch (format) {
    case 'excel':
      return await generateExcelReport(reportType);
    case 'pdf':
      return await generatePDFReport(reportType);
    case 'csv':
      return await generateCSVReport(reportType);
    case 'json':
      return await generateJSONReport(reportType);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function generateExcelReport(reportType) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VHM24 Bot';
  workbook.created = new Date();
  
  switch (reportType) {
    case 'sales':
      await createSalesExcelReport(workbook);
      break;
    case 'inventory':
      await createInventoryExcelReport(workbook);
      break;
    case 'machines':
      await createMachinesExcelReport(workbook);
      break;
    case 'tasks':
      await createTasksExcelReport(workbook);
      break;
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

async function createSalesExcelReport(workbook) {
  const sheet = workbook.addWorksheet('Sales Report');
  
  // Add headers
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Machine', key: 'machine', width: 20 },
    { header: 'Product', key: 'product', width: 25 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Unit Price', key: 'unitPrice', width: 12 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 }
  ];
  
  // Style headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  
  // Fetch sales data
  try {
    const response = await global.apiClient.get('/reports/sales/details');
    const sales = response.data.data || [];
    
    // Add data rows
    sales.forEach(sale => {
      sheet.addRow({
        date: formatDate(sale.date, 'DD.MM.YYYY HH:mm'),
        machine: sale.machine?.name || 'Unknown',
        product: sale.product?.name || 'Unknown',
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.total,
        paymentMethod: sale.paymentMethod
      });
    });
    
    // Add summary row
    const lastRow = sheet.lastRow.number + 2;
    sheet.getCell(`A${lastRow}`).value = 'TOTAL';
    sheet.getCell(`A${lastRow}`).font = { bold: true };
    sheet.getCell(`D${lastRow}`).value = { formula: `SUM(D2:D${lastRow - 2})` };
    sheet.getCell(`F${lastRow}`).value = { formula: `SUM(F2:F${lastRow - 2})` };
    
    // Format currency columns
    ['E', 'F'].forEach(col => {
      for (let i = 2; i <= lastRow; i++) {
        sheet.getCell(`${col}${i}`).numFmt = '$#,##0.00';
      }
    });
  } catch (error) {
    sheet.addRow({ date: 'Error loading data', machine: error.message });
  }
  
  // Auto-filter
  sheet.autoFilter = 'A1:G1';
}

async function createInventoryExcelReport(workbook) {
  const sheet = workbook.addWorksheet('Inventory Report');
  
  // Add headers
  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Current Stock', key: 'quantity', width: 12 },
    { header: 'Min Stock', key: 'minQuantity', width: 12 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Unit Price', key: 'price', width: 12 },
    { header: 'Total Value', key: 'totalValue', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  ];
  
  // Style headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF70AD47' }
  };
  
  // Fetch inventory data
  try {
    const response = await global.apiClient.get('/inventory', { params: { limit: 1000 } });
    const items = response.data.data || [];
    
    // Add data rows
    items.forEach(item => {
      const status = item.quantity <= item.minQuantity ? 'Low Stock' : 'OK';
      const row = sheet.addRow({
        sku: item.sku,
        name: item.name,
        category: item.category || 'Uncategorized',
        quantity: item.quantity,
        minQuantity: item.minQuantity || 0,
        unit: item.unit || 'pcs',
        price: item.price || 0,
        totalValue: (item.quantity * (item.price || 0)),
        status: status
      });
      
      // Conditional formatting for low stock
      if (status === 'Low Stock') {
        row.getCell('status').font = { color: { argb: 'FFFF0000' } };
      }
    });
    
    // Format currency columns
    ['G', 'H'].forEach(col => {
      for (let i = 2; i <= sheet.lastRow.number; i++) {
        sheet.getCell(`${col}${i}`).numFmt = '$#,##0.00';
      }
    });
  } catch (error) {
    sheet.addRow({ sku: 'Error', name: error.message });
  }
  
  // Auto-filter
  sheet.autoFilter = 'A1:I1';
}

async function createMachinesExcelReport(workbook) {
  const sheet = workbook.addWorksheet('Machines Report');
  
  // Add headers
  sheet.columns = [
    { header: 'Machine ID', key: 'id', width: 20 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Location', key: 'location', width: 30 },
    { header: 'Model', key: 'model', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Last Service', key: 'lastService', width: 15 },
    { header: 'Next Service', key: 'nextService', width: 15 },
    { header: 'Total Sales', key: 'totalSales', width: 12 },
    { header: 'Revenue', key: 'revenue', width: 15 }
  ];
  
  // Style headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFC000' }
  };
  
  // Fetch machines data
  try {
    const response = await global.apiClient.get('/machines', { params: { limit: 1000 } });
    const machines = response.data.data || [];
    
    // Add data rows
    machines.forEach(machine => {
      const row = sheet.addRow({
        id: machine.id,
        name: machine.name,
        location: machine.location || 'Not specified',
        model: machine.model || 'Unknown',
        status: machine.status,
        lastService: machine.lastServiceDate ? formatDate(machine.lastServiceDate, 'DD.MM.YYYY') : 'N/A',
        nextService: machine.nextServiceDate ? formatDate(machine.nextServiceDate, 'DD.MM.YYYY') : 'N/A',
        totalSales: machine.stats?.totalSales || 0,
        revenue: machine.stats?.revenue || 0
      });
      
      // Conditional formatting for status
      const statusCell = row.getCell('status');
      switch (machine.status) {
        case 'active':
          statusCell.font = { color: { argb: 'FF008000' } };
          break;
        case 'maintenance':
          statusCell.font = { color: { argb: 'FFFF8C00' } };
          break;
        case 'error':
        case 'offline':
          statusCell.font = { color: { argb: 'FFFF0000' } };
          break;
      }
    });
    
    // Format currency column
    for (let i = 2; i <= sheet.lastRow.number; i++) {
      sheet.getCell(`I${i}`).numFmt = '$#,##0.00';
    }
  } catch (error) {
    sheet.addRow({ id: 'Error', name: error.message });
  }
  
  // Auto-filter
  sheet.autoFilter = 'A1:I1';
}

async function createTasksExcelReport(workbook) {
  const sheet = workbook.addWorksheet('Tasks Report');
  
  // Add headers
  sheet.columns = [
    { header: 'Task ID', key: 'id', width: 20 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Assigned To', key: 'assignedTo', width: 20 },
    { header: 'Machine', key: 'machine', width: 20 },
    { header: 'Created', key: 'created', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Completed', key: 'completed', width: 15 }
  ];
  
  // Style headers
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF8B4789' }
  };
  
  // Fetch tasks data
  try {
    const response = await global.apiClient.get('/tasks', { params: { limit: 1000 } });
    const tasks = response.data.data || [];
    
    // Add data rows
    tasks.forEach(task => {
      const row = sheet.addRow({
        id: task.id,
        title: task.title,
        type: task.type || 'general',
        priority: task.priority || 'normal',
        status: task.status,
        assignedTo: task.assignedTo?.name || 'Unassigned',
        machine: task.machine?.name || 'N/A',
        created: formatDate(task.createdAt, 'DD.MM.YYYY'),
        dueDate: task.dueDate ? formatDate(task.dueDate, 'DD.MM.YYYY') : 'N/A',
        completed: task.completedAt ? formatDate(task.completedAt, 'DD.MM.YYYY') : 'N/A'
      });
      
      // Conditional formatting
      const priorityCell = row.getCell('priority');
      switch (task.priority) {
        case 'urgent':
          priorityCell.font = { color: { argb: 'FFFF0000' }, bold: true };
          break;
        case 'high':
          priorityCell.font = { color: { argb: 'FFFF8C00' } };
          break;
      }
      
      const statusCell = row.getCell('status');
      switch (task.status) {
        case 'completed':
          statusCell.font = { color: { argb: 'FF008000' } };
          break;
        case 'in_progress':
          statusCell.font = { color: { argb: 'FF0000FF' } };
          break;
        case 'cancelled':
          statusCell.font = { color: { argb: 'FF808080' } };
          break;
      }
    });
  } catch (error) {
    sheet.addRow({ id: 'Error', title: error.message });
  }
  
  // Auto-filter
  sheet.autoFilter = 'A1:J1';
}

async function generatePDFReport(reportType) {
  // Create a new PDF document
  const doc = new PDFDocument();
  const chunks = [];
  
  doc.on('data', chunk => chunks.push(chunk));
  
  // Add content based on report type
  doc.fontSize(20).text(`VHM24 ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 50, 50);
  doc.fontSize(12).text(`Generated: ${formatDate(new Date())}`, 50, 80);
  
  // Add placeholder content
  doc.moveDown();
  doc.fontSize(10).text('This is a placeholder PDF report. Full implementation pending.', 50, 120);
  
  doc.end();
  
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

async function generateCSVReport(reportType) {
  // Placeholder CSV generation
  let csv = '';
  
  switch (reportType) {
    case 'sales':
      csv = 'Date,Machine,Product,Quantity,Total\n';
      csv += '2024-01-01,Machine 1,Product A,5,50.00\n';
      break;
    case 'inventory':
      csv = 'SKU,Name,Quantity,Price\n';
      csv += 'PROD001,Product A,100,10.00\n';
      break;
    default:
      csv = 'No data available\n';
  }
  
  return Buffer.from(csv, 'utf-8');
}

async function generateJSONReport(reportType) {
  try {
    const response = await global.apiClient.get(`/reports/${reportType}`);
    return Buffer.from(JSON.stringify(response.data, null, 2), 'utf-8');
  } catch (error) {
    return Buffer.from(JSON.stringify({ error: error.message }, null, 2), 'utf-8');
  }
}
