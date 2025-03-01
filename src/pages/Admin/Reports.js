import React, { useState } from 'react';
import { Button, Select, DatePicker, message, Card, Divider } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { GetAllDoctors } from "../../apicalls/doctors";
import { GetAllUsers } from "../../apicalls/users";
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';
import { getMedicineList } from '../../apicalls/medicine';
import { generateExcelReport, downloadExcelFile } from '../../apicalls/reportGenerator';
import { getAllFeedback } from "../../apicalls/feedback";

const { Option } = Select;
const { RangePicker } = DatePicker;

const Reports = () => {
  const [reportType, setReportType] = useState('patients');
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);

  const downloadReport = async () => {
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
            // Transform medicine data to match expected format - make sure all fields are included
            data = medicinesResponse.data.map(medicine => {
              // Safely handle date formatting for expiryDate
              let expiryDateString = '';
              
              try {
                // Add debug logging to see what format the expiryDate is in
                console.log(`Processing medicine: ${medicine.medicineName}, expiryDate: ${medicine.expiryDate}, type: ${typeof medicine.expiryDate}`);
                
                // Handle DD-MM-YY format from getMedicineList function
                if (typeof medicine.expiryDate === 'string' && medicine.expiryDate.match(/^\d{2}-\d{2}-\d{2}$/)) {
                  const [day, month, year] = medicine.expiryDate.split('-');
                  // Convert YY to YYYY by prepending '20'
                  const date = new Date(`20${year}-${month}-${day}`);
                  if (!isNaN(date.getTime())) {
                    expiryDateString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid date after parsing DD-MM-YY format");
                  }
                }
                // Handle Timestamp object from Firestore
                else if (medicine.expiryDate instanceof Timestamp) {
                  expiryDateString = medicine.expiryDate.toDate().toISOString().split('T')[0];
                }
                // Handle when expiryDate has toDate function
                else if (medicine.expiryDate && typeof medicine.expiryDate.toDate === 'function') {
                  expiryDateString = medicine.expiryDate.toDate().toISOString().split('T')[0];
                }
                // Handle Firestore timestamp format with _seconds
                else if (medicine.expiryDate && medicine.expiryDate._seconds) {
                  const date = new Date(medicine.expiryDate._seconds * 1000);
                  expiryDateString = date.toISOString().split('T')[0];
                }
                // Handle Firestore timestamp format with seconds
                else if (medicine.expiryDate && medicine.expiryDate.seconds) {
                  const date = new Date(medicine.expiryDate.seconds * 1000);
                  expiryDateString = date.toISOString().split('T')[0];
                }
                // Handle ISO string or other standard date string
                else if (medicine.expiryDate && typeof medicine.expiryDate === 'string') {
                  const date = new Date(medicine.expiryDate);
                  if (!isNaN(date.getTime())) {
                    expiryDateString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid date string format");
                  }
                }
                // Last resort - try direct date parsing
                else if (medicine.expiryDate) {
                  const date = new Date(medicine.expiryDate);
                  if (!isNaN(date.getTime())) {
                    expiryDateString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid date format");
                  }
                }
              } catch (error) {
                console.error(`Error formatting expiryDate for ${medicine.medicineName}:`, error);
                expiryDateString = "Invalid Date";
              }

              // Safely handle DOM timestamp
              let domString = '';
              try {
                // Handle DD-MM-YY format for DOM
                if (typeof medicine.DOM === 'string' && medicine.DOM.match(/^\d{2}-\d{2}-\d{2}$/)) {
                  const [day, month, year] = medicine.DOM.split('-');
                  const date = new Date(`20${year}-${month}-${day}`);
                  if (!isNaN(date.getTime())) {
                    domString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid date after parsing DD-MM-YY format");
                  }
                }
                // Handle Timestamp object
                else if (medicine.DOM instanceof Timestamp) {
                  domString = medicine.DOM.toDate().toISOString().split('T')[0];
                }
                // Handle when DOM has toDate function
                else if (medicine.DOM && typeof medicine.DOM.toDate === 'function') {
                  domString = medicine.DOM.toDate().toISOString().split('T')[0];
                }
                // Handle Firestore timestamp with _seconds
                else if (medicine.DOM && medicine.DOM._seconds) {
                  const date = new Date(medicine.DOM._seconds * 1000);
                  domString = date.toISOString().split('T')[0];
                }
                // Handle Firestore timestamp with seconds
                else if (medicine.DOM && medicine.DOM.seconds) {
                  const date = new Date(medicine.DOM.seconds * 1000);
                  domString = date.toISOString().split('T')[0];
                }
                // Handle ISO string or other standard date string
                else if (medicine.DOM && typeof medicine.DOM === 'string') {
                  const date = new Date(medicine.DOM);
                  if (!isNaN(date.getTime())) {
                    domString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid DOM string format");
                  }
                }
                // Last resort
                else if (medicine.DOM) {
                  const date = new Date(medicine.DOM);
                  if (!isNaN(date.getTime())) {
                    domString = date.toISOString().split('T')[0];
                  } else {
                    throw new Error("Invalid DOM format");
                  }
                }
              } catch (error) {
                console.error(`Error formatting DOM for ${medicine.medicineName}:`, error);
                domString = "Invalid Date";
              }

              // Safely handle timestamp
              let timestampString = null;
              try {
                if (medicine.timestamp instanceof Timestamp) {
                  timestampString = medicine.timestamp.toDate().toISOString();
                } else if (medicine.timestamp && typeof medicine.timestamp.toDate === 'function') {
                  timestampString = medicine.timestamp.toDate().toISOString();
                } else if (medicine.timestamp && medicine.timestamp._seconds) {
                  const date = new Date(medicine.timestamp._seconds * 1000);
                  timestampString = date.toISOString();
                } else if (medicine.timestamp && medicine.timestamp.seconds) {
                  const date = new Date(medicine.timestamp.seconds * 1000);
                  timestampString = date.toISOString();
                } else if (medicine.timestamp) {
                  const date = new Date(medicine.timestamp);
                  if (!isNaN(date.getTime())) {
                    timestampString = date.toISOString();
                  }
                }
              } catch (error) {
                console.error(`Error formatting timestamp for ${medicine.medicineName}:`, error);
                timestampString = "Invalid Date";
              }

              return {
                // All fields for Excel report
                id: medicine.medicineId || '',
                name: medicine.medicineName || '',
                description: medicine.description || '',
                price: medicine.price || 0,
                stock: medicine.quantity || 0,
                quantity: medicine.quantity || 0,
                expiryDate: expiryDateString,
                dom: domString,
                adminId: medicine.adminId || '',
                timestamp: timestampString
              };
            });
          } else {
            throw new Error("Failed to fetch medicines data");
          }
          break;
          
        case 'complaints':
          let ticketsQuery = query(collection(firestoredb, 'tickets'));
          
          // Apply date filter if present
          if (startDate && endDate) {
            ticketsQuery = query(
              collection(firestoredb, 'tickets'),
              where('createdAt', '>=', Timestamp.fromDate(startDate.toDate())),
              where('createdAt', '<=', Timestamp.fromDate(endDate.toDate()))
            );
          }
          
          const ticketsSnapshot = await getDocs(ticketsQuery);
          data = ticketsSnapshot.docs.map(doc => {
            const ticketData = doc.data();
            
            // Safely handle date conversions
            let createdAtDate = new Date();
            let lastUpdatedDate = new Date();
            
            try {
              if (ticketData.createdAt instanceof Timestamp) {
                createdAtDate = ticketData.createdAt.toDate();
              } else if (ticketData.createdAt && typeof ticketData.createdAt.toDate === 'function') {
                createdAtDate = ticketData.createdAt.toDate();
              } else if (ticketData.createdAt && ticketData.createdAt._seconds) {
                createdAtDate = new Date(ticketData.createdAt._seconds * 1000);
              } else if (ticketData.createdAt && ticketData.createdAt.seconds) {
                createdAtDate = new Date(ticketData.createdAt.seconds * 1000);
              } else if (ticketData.createdAt) {
                createdAtDate = new Date(ticketData.createdAt);
              }
              
              if (ticketData.lastUpdated instanceof Timestamp) {
                lastUpdatedDate = ticketData.lastUpdated.toDate();
              } else if (ticketData.lastUpdated && typeof ticketData.lastUpdated.toDate === 'function') {
                lastUpdatedDate = ticketData.lastUpdated.toDate();
              } else if (ticketData.lastUpdated && ticketData.lastUpdated._seconds) {
                lastUpdatedDate = new Date(ticketData.lastUpdated._seconds * 1000);
              } else if (ticketData.lastUpdated && ticketData.lastUpdated.seconds) {
                lastUpdatedDate = new Date(ticketData.lastUpdated.seconds * 1000);
              } else if (ticketData.lastUpdated) {
                lastUpdatedDate = new Date(ticketData.lastUpdated);
              }
            } catch (error) {
              console.error(`Error formatting dates for ticket ${doc.id}:`, error);
            }
            
            return {
              // Fields for Excel report
              ID: doc.id || '',
              "Ticket ID": ticketData.ticketId || doc.id || '',  // Use doc.id as fallback
              "Title": ticketData.title || ticketData.subject || '',
              "Description": ticketData.description || '',
              "Status": ticketData.status || '',
              "Priority": ticketData.priority || 'Normal',  // Provide default value
              "Created At": createdAtDate.toLocaleDateString('en-GB'),  // Format date as DD-MM-YYYY
              "Last Updated": lastUpdatedDate.toLocaleDateString('en-GB'),
              "User ID": ticketData.userId || ticketData.email || '',
              "Query Type": ticketData.queryType || '',
              "Is Resolved": ticketData.isResolved ? 'Yes' : 'No',
              "Admin Response": ticketData.adminResponse || '',
              "User Response": ticketData.userResponse || ''
            };
          });
          break;
          
        case 'feedback':
          const feedbackResponse = await getAllFeedback();
          if (feedbackResponse.success) {
            data = feedbackResponse.data.map(feedback => {
              // Process date if needed
              let createdDate = new Date();
              try {
                if (typeof feedback.createdAt === 'string') {
                  // Handle DD-MM-YY HH:mm format
                  if (feedback.createdAt.match(/^\d{2}-\d{2}-\d{2}\s\d{2}:\d{2}$/)) {
                    const [datePart, timePart] = feedback.createdAt.split(' ');
                    const [day, month, year] = datePart.split('-');
                    const [hours, minutes] = timePart.split(':');
                    createdDate = new Date(`20${year}-${month}-${day}T${hours}:${minutes}:00`);
                  } else {
                    createdDate = new Date(feedback.createdAt);
                  }
                } else if (feedback.createdAt instanceof Timestamp) {
                  createdDate = feedback.createdAt.toDate();
                } else if (feedback.createdAt && typeof feedback.createdAt.toDate === 'function') {
                  createdDate = feedback.createdAt.toDate();
                } else if (feedback.createdAt && feedback.createdAt._seconds) {
                  createdDate = new Date(feedback.createdAt._seconds * 1000);
                } else if (feedback.createdAt && feedback.createdAt.seconds) {
                  createdDate = new Date(feedback.createdAt.seconds * 1000);
                } else if (feedback.createdAt) {
                  createdDate = new Date(feedback.createdAt);
                }
              } catch (error) {
                console.error(`Error formatting date for feedback:`, error);
              }
              
              return {
                "ID": feedback.id || '',
                "User ID": feedback.userId || '',
                "Rating": feedback.rating || 0,
                "Comment": feedback.comment || '',
                "Date": createdDate.toLocaleDateString('en-GB'),
                "Time": createdDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              };
            });
          } else {
            throw new Error("Failed to fetch feedback data");
          }
          break;
          
        default:
          throw new Error("Invalid report type");
      }
      
      // Generate and download Excel file
      const buffer = await generateExcelReport(data, reportType);
      downloadExcelFile(buffer, `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      message.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully`);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Generate Reports</h2>
      
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Report Type</h3>
            <Select
              style={{ width: '100%' }}
              placeholder="Select report type"
              value={reportType}
              onChange={setReportType}
              className="mb-4"
            >
              <Option value="patients">Patients Report</Option>
              <Option value="doctors">Doctors Report</Option>
              <Option value="medicines">Medicines Report</Option>
              <Option value="complaints">Complaints Report</Option>
              <Option value="feedback">Feedback Report</Option>
            </Select>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Date Range (Optional)</h3>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={setDateRange}
              className="mb-4"
            />
          </div>
        </div>
        
        <Divider />
        
        <div className="flex justify-end">
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            loading={loading}
            onClick={downloadReport}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Generate Excel Report
          </Button>
        </div>
      </Card>
      
      <div className="text-gray-600">
        <h3 className="text-lg font-medium mb-2">Report Details</h3>
        <p className="mb-1">
          <strong>Patients Report:</strong> Includes user information (name, email) for all patients.
        </p>
        <p className="mb-1">
          <strong>Doctors Report:</strong> Includes all doctor information (name, specialty, status).
        </p>
        <p className="mb-1">
          <strong>Medicines Report:</strong> Includes medicine details (ID, name, description, price, stock, expiry date).
        </p>
        <p className="mb-1">
          <strong>Complaints Report:</strong> Includes all tickets with ID, title, description, status, priority, and dates.
        </p>
        <p className="mb-1">
          <strong>Feedback Report:</strong> Includes all user feedback with ratings, comments, and submission dates.
        </p>
      </div>
    </div>
  );
};

export default Reports;