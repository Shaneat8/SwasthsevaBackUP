import React, { useState } from 'react';
import { Button, Select, DatePicker, message, Card, Divider } from 'antd';
import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { GetAllDoctors } from "../../apicalls/doctors";
import { GetAllUsers } from "../../apicalls/users";
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';
import { getMedicineList } from '../../apicalls/medicine';
import { getAllFeedback } from "../../apicalls/feedback";
import { generateExcelReport, downloadExcelFile, generatePDFReport, downloadPDFFile } from '../../apicalls/reportGenerator'; 
import styles from './Reports.module.css'; // Import CSS Module

const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const [reportType, setReportType] = useState('patients');
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async (format = 'excel') => {
    try {
      setLoading(true);
      let data = [];
      
      // Date filtering
      const startDate = dateRange ? dateRange[0].startOf('day') : null;
      const endDate = dateRange ? dateRange[1].endOf('day') : null;
      
      switch(reportType) {
        case 'patients':
          const usersResponse = await GetAllUsers();
          if (usersResponse.success) {
            data = usersResponse.data.filter(user => user.role === 'user');
          } else {
            throw new Error("Failed to fetch patients data");
          }
          break;
          
        case 'doctors':
          const doctorsResponse = await GetAllDoctors();
          if (doctorsResponse.success) {
            data = doctorsResponse.data;
          } else {
            throw new Error("Failed to fetch doctors data");
          }
          break;
          
        case 'medicines':
          const medicinesResponse = await getMedicineList();
          if (medicinesResponse.success) {
            data = medicinesResponse.data.map(medicine => {
              let expiryDateString = '';
              try {
                if (typeof medicine.expiryDate === 'string' && medicine.expiryDate.match(/^\d{2}-\d{2}-\d{2}$/)) {
                  const [day, month, year] = medicine.expiryDate.split('-');
                  const date = new Date(`20${year}-${month}-${day}`);
                  if (!isNaN(date.getTime())) {
                    expiryDateString = date.toISOString().split('T')[0];
                  }
                } else if (medicine.expiryDate instanceof Timestamp) {
                  expiryDateString = medicine.expiryDate.toDate().toISOString().split('T')[0];
                }
              } catch (error) {
                console.error(`Error formatting expiryDate for ${medicine.medicineName}:`, error);
                expiryDateString = "Invalid Date";
              }

              return {
                id: medicine.medicineId || '',
                name: medicine.medicineName || '',
                description: medicine.description || '',
                price: medicine.price || 0,
                stock: medicine.quantity || 0,
                quantity: medicine.quantity || 0,
                expiryDate: expiryDateString,
              };
            });
          } else {
            throw new Error("Failed to fetch medicines data");
          }
          break;
          
        case 'complaints':
          let ticketsQuery = query(collection(firestoredb, 'tickets'));
          if (startDate && endDate) {
            ticketsQuery = query(
              collection(firestoredb, 'tickets'),
              where('createdAt', '>=', Timestamp.fromDate(startDate.toDate())),
              where('createdAt', '<=', Timestamp.fromDate(endDate.toDate()))
            );
          }
          const ticketsSnapshot = await getDocs(ticketsQuery);
          data = ticketsSnapshot.docs.map(doc => ({
            ID: doc.id || '',
            "Ticket ID": doc.data().ticketId || doc.id || '',
            "Title": doc.data().title || doc.data().subject || '',
            "Description": doc.data().description || '',
            "Status": doc.data().status || '',
            "Priority": doc.data().priority || 'Normal',
            "Created At": doc.data().createdAt ? 
              (doc.data().createdAt.toDate ? 
                doc.data().createdAt.toDate().toLocaleDateString('en-GB') : 
                new Date(doc.data().createdAt).toLocaleDateString('en-GB')
              ) : '',
            "Last Updated": doc.data().lastUpdated ? 
              (doc.data().lastUpdated.toDate ? 
                doc.data().lastUpdated.toDate().toLocaleDateString('en-GB') : 
                new Date(doc.data().lastUpdated).toLocaleDateString('en-GB')
              ) : '',
            "User ID": doc.data().userId || doc.data().email || '',
            "Query Type": doc.data().queryType || '',
            "Is Resolved": doc.data().isResolved ? 'Yes' : 'No'
          }));
          break;
          
        case 'feedback':
          const feedbackResponse = await getAllFeedback();
          if (feedbackResponse.success) {
            data = feedbackResponse.data.map(feedback => ({
              "ID": feedback.id || '',
              "User ID": feedback.userId || '',
              "Rating": feedback.rating || 0,
              "Comment": feedback.comment || '',
              "Date": feedback.createdAt ? 
                (feedback.createdAt.toDate ? 
                  feedback.createdAt.toDate().toLocaleDateString('en-GB') : 
                  new Date(feedback.createdAt).toLocaleDateString('en-GB')
                ) : ''
            }));
          } else {
            throw new Error("Failed to fetch feedback data");
          }
          break;
          
        default:
          throw new Error("Invalid report type");
      }

      const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      const filename = `Swasthya_Seva_${reportType.charAt(0).toUpperCase() + reportType.slice(1)}_Report_${currentDate}`;

      if (format === 'excel') {
        const buffer = await generateExcelReport(data, reportType);
        downloadExcelFile(buffer, `${filename}.xlsx`);
      } else if (format === 'pdf') {
        const doc = generatePDFReport(data, reportType);
        downloadPDFFile(doc, `${filename}.pdf`);
      } 
      message.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully`);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Generate Reports</h2>
      
      <Card className={styles.card}>
        <div className={`${styles.grid} ${styles.gridCols1} ${styles.mdGridCols2}`}>
          <div>
            <h3 className={styles.label}>Report Type</h3>
            <Select
              className={styles.select}
              placeholder="Select report type"
              value={reportType}
              onChange={setReportType}
            >
              <Option value="patients">Patients Report</Option>
              <Option value="doctors">Doctors Report</Option>
              <Option value="medicines">Medicines Report</Option>
              <Option value="complaints">Complaints Report</Option>
              <Option value="feedback">Feedback Report</Option>
            </Select>
          </div>
          
          <div>
            <h3 className={styles.label}>Date Range (Optional)</h3>
            <RangePicker 
              className={styles.datePicker}
              onChange={setDateRange}
            />
          </div>
        </div>
        
        <Divider className={styles.divider} />
        
        <div className={styles.buttonGroup}>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={() => generateReport('excel')}
            className={`${styles.button} ${styles.buttonExcel}`}
          >
            Generate Excel Report
          </Button>
          <Button 
            type="primary"
            icon={<FilePdfOutlined />}
            loading={loading}
            onClick={() => generateReport('pdf')}
            className={`${styles.button} ${styles.buttonPDF}`}
          >
            Generate PDF Report
          </Button>
        </div>
      </Card>
      
      <div className={styles.details}>
        <h3 className={styles.detailsHeading}>Report Details</h3>
        <p className={styles.detailsText}>
          <strong>Patients Report:</strong> Includes user information (name, email) for all patients.
        </p>
        <p className={styles.detailsText}>
          <strong>Doctors Report:</strong> Includes all doctor information (name, specialty, status).
        </p>
        <p className={styles.detailsText}>
          <strong>Medicines Report:</strong> Includes medicine details (ID, name, stock, expiry date).
        </p>
        <p className={styles.detailsText}>
          <strong>Complaints Report:</strong> Includes all tickets with ID, title, description, status, priority, and dates.
        </p>
        <p className={styles.detailsText}>
          <strong>Feedback Report:</strong> Includes all user feedback with ratings, comments, and submission dates.
        </p>
      </div>
    </div>
  );
};

export default Reports;