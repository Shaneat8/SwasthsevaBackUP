import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, message, Modal, Card, Spin, Tabs, Badge, Typography } from "antd";
import { 
  EyeOutlined, 
  DownloadOutlined, 
  ArrowLeftOutlined,
  FilePdfOutlined,
  UserOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  FileTextOutlined,
  UploadOutlined,
  MedicineBoxOutlined
} from "@ant-design/icons";
import { GetPatientDetails } from "../../apicalls/users";
import { fetchUserRecords, fetchPatientUploadedRecords } from "../../apicalls/recordpdf";
import moment from "moment";

const { Title, Text } = Typography;

function PatientRecordsPage() {
  const [patientData, setPatientData] = useState(null);
  const [prescribedRecords, setPrescribedRecords] = useState([]);
  const [uploadedRecords, setUploadedRecords] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch patient data
  const fetchPatientData = useCallback(async () => {
    try {
      const response = await GetPatientDetails(patientId);
      if (response.success) {
        setPatientData(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch patient details");
      }
    } catch (error) {
      message.error(error.message);
      navigate("/");
    }
  }, [patientId, navigate]);

  // Fetch all patient records separately
  const fetchAllRecords = useCallback(async () => {
    setLoading(true);
    try {
      if (!patientId) return;
      
      // Fetch prescribed records
      const prescribedResponse = await fetchUserRecords(patientId);
      if (Array.isArray(prescribedResponse)) {
        console.log("Prescribed records:", prescribedResponse);
        setPrescribedRecords(prescribedResponse);
      } else {
        console.error("Prescribed records not an array:", prescribedResponse);
        setPrescribedRecords([]);
      }
      
      // Fetch patient uploaded records with correct parameter handling
      // This is likely where the issue is occurring
      const uploadedResponse = await fetchPatientUploadedRecords(patientId);
      if (Array.isArray(uploadedResponse)) {
        console.log("Uploaded records:", uploadedResponse);
        setUploadedRecords(uploadedResponse);
      } else {
        console.error("Uploaded records not an array:", uploadedResponse);
        setUploadedRecords([]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      message.error("Failed to fetch patient records: " + error.message);
      setPrescribedRecords([]);
      setUploadedRecords([]);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchAllRecords();
    }
  }, [patientId, fetchPatientData, fetchAllRecords]);

  const handleBack = () => {
    const returnPath = location.state?.returnPath || "/";
    navigate(returnPath);
  };

  const handlePreview = (record) => {
    setSelectedRecord(record);
    setPreviewVisible(true);
  };

  const handleDownload = (fileUrl, fileName) => {
    // Clean the URL by removing any trailing spaces
    const cleanUrl = fileUrl.trim();
    
    // Fetch the file as a blob to ensure it downloads as a PDF
    fetch(cleanUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create an object URL from the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download.pdf';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after download
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      })
      .catch(error => {
        console.error("Download failed:", error);
        message.error("Failed to download file");
        
        // Fallback to direct link if blob download fails
        const link = document.createElement('a');
        link.href = cleanUrl;
        link.download = fileName || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return moment(date).format("DD-MM-YYYY hh:mm A");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const RecordsList = ({ records, source }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {records.length === 0 ? (
        <div className="col-span-3 text-center py-12">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FilePdfOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          </div>
          <Text className="text-gray-500 text-lg">No {source.toLowerCase()} records found</Text>
        </div>
      ) : (
        records.map((record, index) => (
          <Card 
            key={index}
            className="hover:shadow-xl transition-all duration-300 border border-blue-100 rounded-lg overflow-hidden transform hover:-translate-y-1"
            bodyStyle={{ padding: '20px' }}
            headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex-grow">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FileTextOutlined className="text-blue-500 text-xl" />
                  </div>
                  <h4 className="font-semibold text-lg m-0 text-blue-800 truncate">
                    {record.name}
                  </h4>
                </div>
                <div className="space-y-3 mb-4">
                  <p className="text-gray-600 text-sm flex items-center bg-blue-50 p-2 rounded-md">
                    <CalendarOutlined className="mr-2 text-blue-400" />
                    {formatDate(record.createdAt)}
                  </p>
                  <Badge 
                    color={source === "Doctor Prescribed" ? "blue" : "green"} 
                    text={source}
                    className="mb-2"
                  />
                  {record.type && (
                    <p className="text-gray-600 text-sm flex items-center bg-blue-50 p-2 rounded-md">
                      <FileTextOutlined className="mr-2 text-blue-400" />
                      {record.type}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-blue-100">
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(record)}
                  className="hover:scale-105 transition-transform shadow-sm"
                  style={{ backgroundColor: "#1890ff" }}
                >
                  Preview
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(record.url, record.name)}
                  className="hover:scale-105 transition-transform shadow-sm"
                  style={{ borderColor: "#1890ff", color: "#1890ff" }}
                >
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm backdrop-blur-sm bg-white/80 border-l-4 border-blue-400">
        <div className="flex items-center space-x-4">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            type="default"
            size="large"
            className="hover:scale-105 transition-transform shadow-sm"
          >
            Back
          </Button>
          <Title level={3} className="m-0 text-blue-800">Patient Medical Records</Title>
        </div>
      </div>

      {/* Patient Information Card */}
      <Card 
        className="mb-6 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/90 border-blue-200"
        title={
          <div className="flex items-center text-lg font-semibold text-blue-800">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <UserOutlined className="text-blue-500" />
            </div>
            Patient Information
          </div>
        }
        headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patientData ? [
            { icon: <UserOutlined />, label: "Name", value: `${patientData?.FirstName} ${patientData?.LastName}` },
            { icon: <CalendarOutlined />, label: "DOB", value: patientData?.DOB ? moment(patientData.DOB).format("DD-MM-YYYY") : "N/A" },
            { icon: <UserOutlined />, label: "Gender", value: patientData?.gender === 1 ? "Male" : "Female" },
            { icon: <PhoneOutlined />, label: "Phone", value: patientData?.phone || "N/A" },
            { icon: <MailOutlined />, label: "Email", value: patientData?.email || "N/A" },
            { icon: <HomeOutlined />, label: "Address", value: patientData?.address || "N/A" }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-blue-500">{item.icon}</span>
              </div>
              <span className="font-medium text-blue-700">{item.label}:</span> 
              <span className="truncate text-gray-700">{item.value}</span>
            </div>
          )) : (
            <div className="col-span-3 flex justify-center py-6">
              <Spin size="large" />
            </div>
          )}
        </div>
      </Card>

      {/* Records Section */}
      <Card 
        className="shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm bg-white/90 border-blue-200"
        headStyle={{ backgroundColor: '#e6f7ff', borderBottom: '1px solid #91d5ff' }}
      >
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading records...</p>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="prescribed"
            items={[
              {
                key: 'prescribed',
                label: (
                  <span className="flex items-center">
                    <MedicineBoxOutlined className="mr-2" />
                    Prescribed Records ({prescribedRecords.length})
                  </span>
                ),
                children: <RecordsList records={prescribedRecords} source="Doctor Prescribed" />
              },
              {
                key: 'uploaded',
                label: (
                  <span className="flex items-center">
                    <UploadOutlined className="mr-2" />
                    Patient Uploaded Records ({uploadedRecords.length})
                  </span>
                ),
                children: <RecordsList records={uploadedRecords} source="Patient Uploaded" />
              }
            ]}
            className="custom-tabs"
          />
        )}
      </Card>

      {/* PDF Preview Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <div className="bg-red-50 p-2 rounded-lg">
              <FilePdfOutlined className="text-red-500" />
            </div>
            <span className="font-medium">{selectedRecord?.name}</span>
          </div>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        footer={[
          <Button 
            key="download" 
            icon={<DownloadOutlined />} 
            onClick={() => handleDownload(selectedRecord?.url, selectedRecord?.name)}
            style={{ borderColor: "#1890ff", color: "#1890ff" }}
          >
            Download
          </Button>,
          <Button 
            key="close" 
            onClick={() => setPreviewVisible(false)}
          >
            Close
          </Button>
        ]}
        bodyStyle={{ height: '80vh', padding: 0 }}
        className="pdf-preview-modal"
        maskStyle={{ backdropFilter: 'blur(8px)' }}
      >
        <iframe
          src={selectedRecord?.url}
          title="PDF Preview"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </Modal>

      <style jsx>{`
        .custom-tabs .ant-tabs-nav {
          margin-bottom: 20px;
        }
        
        .custom-tabs .ant-tabs-tab {
          padding: 12px 16px;
          transition: all 0.3s;
        }
        
        .custom-tabs .ant-tabs-tab:hover {
          color: #1890ff;
        }
        
        .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
          background: #e6f7ff;
          border-radius: 4px;
          border-bottom: 2px solid #1890ff;
        }
        
        .pdf-preview-modal .ant-modal-content {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #91d5ff;
        }
        
        .pdf-preview-modal .ant-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e6f7ff;
          background-color: #f0f9ff;
        }
        
        .pdf-preview-modal .ant-modal-footer {
          border-top: 1px solid #e6f7ff;
          background-color: #f0f9ff;
        }
      `}</style>
    </div>
  );
}

export default PatientRecordsPage;