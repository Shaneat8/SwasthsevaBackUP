import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const generateExcelReport = async (data, reportType) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(reportType.charAt(0).toUpperCase() + reportType.slice(1));
  
  // Current date for report
  const currentDate = new Date().toLocaleDateString('en-GB');
  const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;

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

  // Set up columns
  worksheet.columns = columns;
  
  // Determine the last column letter based on the number of columns
  const lastColLetter = String.fromCharCode(64 + columns.length); // A is 65, so we start at 64 and add the column count
  
  // Define row 1 - Swasthya Seva Header
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Swasthya Seva';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Define row 2 - Report Title
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const reportTitleCell = worksheet.getCell('A2');
  reportTitleCell.value = reportTitle;
  reportTitleCell.font = { bold: true, size: 14 };
  reportTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Define row 3 - Generated Date
  worksheet.mergeCells(`A3:${lastColLetter}3`);
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `Generated on: ${currentDate}`;
  dateCell.font = { size: 12 };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Add a blank row for spacing
  // Row 4 is blank
  
  // Add header row at row 5
  const headerRow = worksheet.getRow(5);
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { bold: true, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data rows starting from row 6
  let rowIndex = 6;
  data.forEach(item => {
    const row = worksheet.getRow(rowIndex);
    
    columns.forEach((col, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      let value = item[col.key];
      
      // Fix for medicine expiry dates
      if (reportType === 'medicines' && col.key === 'expiryDate' && value) {
        try {
          if (typeof value === 'string') {
            if (value === 'Invalid Date') {
              value = '';
            }
          } else if (value.toDate && typeof value.toDate === 'function') {
            value = value.toDate().toLocaleDateString('en-GB');
          } else if (value instanceof Date) {
            value = value.toLocaleDateString('en-GB');
          }
        } catch (error) {
          console.warn('Error formatting date:', error);
          value = ''; // Use empty string for invalid dates
        }
      }
      
      // For date fields in other report types
      if ((col.key === 'createdAt' || col.key === 'Created At' || 
           col.key === 'lastUpdated' || col.key === 'Last Updated') && value) {
        try {
          if (typeof value.toDate === 'function') {
            value = value.toDate().toLocaleDateString('en-GB');
          } else if (value instanceof Date) {
            value = value.toLocaleDateString('en-GB');
          }
        } catch (error) {
          console.warn('Error formatting date:', error);
          value = '';
        }
      }
      
      cell.value = value;
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    rowIndex++;
  });
  
  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const downloadExcelFile = (buffer, filename) => {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};

export const generatePDFReport = (data, reportType) => {
  const doc = new jsPDF();
  const currentDate = new Date().toLocaleDateString('en-GB');
  const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;

  // Add Swasth Seva header
  doc.setFontSize(18);
  doc.text('Swasthya Seva', doc.internal.pageSize.width / 2, 20, { align: 'center' });
  
  // Add report type and date
  doc.setFontSize(12);
  doc.text(reportTitle, doc.internal.pageSize.width / 2, 30, { align: 'center' });
  doc.text(`Generated on: ${currentDate}`, doc.internal.pageSize.width / 2, 40, { align: 'center' });

  // Determine columns based on report type
  let columns = [];
  switch(reportType) {
    case 'patients':
      columns = ['id', 'name', 'email', 'role'];
      break;
    case 'doctors':
      columns = ['id', 'firstName', 'lastName', 'email', 'Specialist', 'status'];
      break;
    case 'medicines':
      columns = ['id', 'name', 'stock', 'expiryDate'];
      break;
    case 'complaints':
      columns = [
        'ID', 'Ticket ID', 'Title', 'Description', 'Status', 
        'Priority', 'Created At', 'Last Updated', 'User ID', 
        'Query Type', 'Is Resolved'
      ];
      break;
    default:
      columns = Object.keys(data[0] || {});
  }

  // Prepare data for PDF table
  const tableData = data.map(item => 
    columns.map(col => {
      // Handle potential date conversions
      let value = item[col];
      
      // Handle medicine expiry dates
      if (reportType === 'medicines' && col === 'expiryDate' && value) {
        try {
          if (typeof value === 'string') {
            if (value === 'Invalid Date') {
              value = '';
            }
          } else if (value.toDate && typeof value.toDate === 'function') {
            value = value.toDate().toLocaleDateString('en-GB');
          } else if (value instanceof Date) {
            value = value.toLocaleDateString('en-GB');
          }
        } catch (error) {
          console.warn('Error formatting date:', error);
          value = '';
        }
      } else if (value && (value instanceof Date || (typeof value === 'object' && value.toDate))) {
        try {
          value = value.toDate ? value.toDate().toLocaleDateString('en-GB') : value.toLocaleDateString('en-GB');
        } catch (error) {
          console.warn('Error formatting date:', error);
          value = '';
        }
      }
      
      return value || '';
    })
  );

  // Generate table
  doc.autoTable({
    startY: 50,
    head: [columns.map(col => typeof col === 'string' ? col : col.header)],
    body: tableData,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });

  return doc;
};

export const downloadPDFFile = (doc, filename) => {
  doc.save(filename);
};