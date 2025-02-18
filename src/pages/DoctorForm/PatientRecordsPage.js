import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button, message, Modal, Card, Spin, Tabs, Badge } from "antd";
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
  UploadOutlined
} from "@ant-design/icons";
import { GetPatientDetails } from "../../apicalls/users";
import { fetchUserRecords, fetchPatientUploadedRecords } from "../../apicalls/recordpdf";
import moment from "moment";

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

  // Fetch all patient records
  const fetchAllRecords = useCallback(async () => {
    try {
      if (!patientId) return;
      
      const [prescribed, uploaded] = await Promise.all([
        fetchUserRecords(patientId),
        fetchPatientUploadedRecords(patientId)
      ]);

      if (Array.isArray(prescribed)) {
        setPrescribedRecords(prescribed);
      }
      
      if (Array.isArray(uploaded)) {
        setUploadedRecords(uploaded);
      }
    } catch (error) {
      message.error("Failed to fetch patient records: " + error.message);
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
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {records.map((record, index) => (
        <Card 
          key={index}
          className="hover:shadow-xl transition-all duration-300 border border-gray-200 rounded-lg overflow-hidden transform hover:-translate-y-1"
          bodyStyle={{ padding: '20px' }}
        >
          <div className="flex flex-col h-full">
            <div className="flex-grow">
              <div className="flex items-center mb-3">
                <div className="bg-blue-50 p-2 rounded-lg mr-3">
                  <FileTextOutlined className="text-blue-500 text-xl" />
                </div>
                <h4 className="font-semibold text-lg m-0 text-gray-800 truncate">
                  {record.name}
                </h4>
              </div>
              <div className="space-y-3 mb-4">
                <p className="text-gray-600 text-sm flex items-center bg-gray-50 p-2 rounded-md">
                  <CalendarOutlined className="mr-2 text-blue-400" />
                  {formatDate(record.createdAt)}
                </p>
                <Badge 
                  color={source === "Doctor Prescribed" ? "blue" : "green"} 
                  text={source}
                  className="mb-2"
                />
                {record.type && (
                  <p className="text-gray-600 text-sm flex items-center bg-gray-50 p-2 rounded-md">
                    <FileTextOutlined className="mr-2 text-blue-400" />
                    {record.type}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-gray-100">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handlePreview(record)}
                className="hover:scale-105 transition-transform shadow-sm"
              >
                Preview
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(record.url, record.name)}
                className="hover:scale-105 transition-transform shadow-sm"
              >
                Download
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm backdrop-blur-sm bg-white/80">
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
          <h1 className="text-2xl font-bold m-0 text-gray-800">Patient Records</h1>
        </div>
      </div>

      {/* Patient Information Card */}
      <Card 
        className="mb-6 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm bg-white/80"
        title={
          <div className="flex items-center text-lg font-semibold text-gray-800">
            <div className="bg-blue-50 p-2 rounded-lg mr-3">
              <UserOutlined className="text-blue-500" />
            </div>
            Patient Information
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <UserOutlined />, label: "Name", value: `${patientData?.FirstName} ${patientData?.LastName}` },
            { icon: <CalendarOutlined />, label: "DOB", value: patientData?.DOB ? moment(patientData.DOB).format("DD-MM-YYYY") : "N/A" },
            { icon: <UserOutlined />, label: "Gender", value: patientData?.gender === 1 ? "Male" : "Female" },
            { icon: <PhoneOutlined />, label: "Phone", value: patientData?.phone || "N/A" },
            { icon: <MailOutlined />, label: "Email", value: patientData?.email || "N/A" },
            { icon: <HomeOutlined />, label: "Address", value: patientData?.address || "N/A" }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
              <div className="bg-blue-50 p-2 rounded-lg">
                <span className="text-blue-500">{item.icon}</span>
              </div>
              <span className="font-medium">{item.label}:</span> 
              <span className="truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Records Section */}
      <Card className="shadow-sm backdrop-blur-sm bg-white/80">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading records...</p>
          </div>
        ) : prescribedRecords.length === 0 && uploadedRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FilePdfOutlined style={{ fontSize: '32px', color: '#666' }} />
            </div>
            <p className="mt-4 text-gray-500 text-lg">No records found for this patient</p>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="prescribed"
            items={[
              {
                key: 'prescribed',
                label: (
                  <span className="flex items-center">
                    <FileTextOutlined className="mr-2" />
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
        footer={null}
        bodyStyle={{ height: '80vh', padding: 0 }}
        className="pdf-preview-modal"
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
        }
        
        .pdf-preview-modal .ant-modal-content {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .pdf-preview-modal .ant-modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #f0f0f0;
        }
      `}</style>
    </div>
  );
}

export default PatientRecordsPage;