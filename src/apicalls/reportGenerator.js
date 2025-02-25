import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateExcelReport = async (data, reportType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType.charAt(0).toUpperCase() + reportType.slice(1));
  
  // Define columns based on report type
  let columns = [];
  
  switch(reportType) {
    case 'patients':
      columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 }
      ];
      break;
      
    case 'doctors':
      columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'First Name', key: 'firstName', width: 20 },
        { header: 'Last Name', key: 'lastName', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Specialty', key: 'Specialist', width: 20 },
        { header: 'Status', key: 'status', width: 15 }
      ];
      break;
      
    case 'medicines':
      columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Stock', key: 'stock', width: 15 },
        { header: 'Expiry Date', key: 'expiryDate', width: 15 }
      ];
      break;
      
    case 'complaints':
      columns = [
        { header: 'ID', key: 'ID', width: 30 },
        { header: 'Ticket ID', key: 'Ticket ID', width: 30 },
        { header: 'Title', key: 'Title', width: 30 },
        { header: 'Description', key: 'Description', width: 40 },
        { header: 'Status', key: 'Status', width: 15 },
        { header: 'Priority', key: 'Priority', width: 15 },
        { header: 'Created At', key: 'Created At', width: 20 },
        { header: 'Last Updated', key: 'Last Updated', width: 20 },
        { header: 'User ID', key: 'User ID', width: 30 },
        { header: 'Query Type', key: 'Query Type', width: 15 },
        { header: 'Is Resolved', key: 'Is Resolved', width: 15 }
      ];
      break;
      
    default:
      columns = Object.keys(data[0] || {}).map(key => ({ header: key, key, width: 20 }));
  }
  
  worksheet.columns = columns;
  
  // Add header row with styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // Add data rows
  data.forEach(item => {
    const row = {};
    columns.forEach(col => {
      // Get the value using the column key
      let value = item[col.key];
      
      // For date fields that need special formatting
      if ((col.key === 'createdAt' || col.key === 'Created At') && value && typeof value.toDate === 'function') {
        value = value.toDate().toLocaleDateString('en-GB');
      }
      
      // Handle different date formats
      if ((col.key === 'createdAt' || col.key === 'Created At') && value instanceof Date) {
        value = value.toLocaleDateString('en-GB');
      }
      
      row[col.key] = value;
    });
    worksheet.addRow(row);
  });
  
  // Apply borders to all cells
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const downloadExcelFile = (buffer, filename) => {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};