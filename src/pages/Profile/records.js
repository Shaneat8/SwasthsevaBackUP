import React, { useState, useEffect } from "react";
import { Tabs, Button, message, Upload } from "antd";
import { 
  UploadOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  MenuOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import moment from 'moment';
import { CheckProfileCompletion, GetUserById } from "../../apicalls/users";
import { 
  fetchUserRecords, 
  fetchPatientUploadedRecords,
  fetchLabRecords, 
  addUserRecord, 
  addLabRecord,
  addPatientUploadedRecord,
  deleteUserRecord, 
  deleteLabRecord 
} from "../../apicalls/recordpdf";
import "./records.css";

const { TabPane } = Tabs;

// File Type Icon Component
const FileTypeIcon = ({ fileName }) => {
  const ext = fileName.split('.').pop().toLowerCase();
  
  if (ext === 'pdf') {
    return <div className="file-icon pdf"><FilePdfOutlined /></div>;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'psd', 'sketch'].includes(ext)) {
    return <div className="file-icon image"><FileImageOutlined /></div>;
  } else {
    return <div className="file-icon default"><FileOutlined /></div>;
  }
};

// File Item Component - Updated to show uploadedBy info
const FileItem = ({ file, onDownload, onDelete }) => {
  return (
    <motion.div 
      className="file-item"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <FileTypeIcon fileName={file.name} />
      
      <div className="file-info">
        <span className="file-name">{file.name}</span>
        <span className="file-date">
          {file.createdAt ? moment(file.createdAt.toDate ? file.createdAt.toDate() : file.createdAt).format('LL') : 'N/A'}
        </span>
        {file.uploadedBy && (
          <span className={`upload-source ${file.uploadedBy === 'user' ? 'user-upload' : 'doctor-upload'}`}>
            {file.uploadedBy === 'user' ? 'Self-uploaded' : 'Doctor-prescribed'}
          </span>
        )}
      </div>
      
      <div className="file-size">
        {file.size ? `${(file.size / (1024 * 1024)).toFixed(1)}mb` : ''}
      </div>
      
      <div className="file-actions">
        <motion.div className="status-indicator">✓</motion.div>
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={() => onDownload(file.url, file.name)}
          className="action-btn download"
          title="Download"
        />
        <Button
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(file.id, file.public_id)}
          className="action-btn delete"
          title="Delete"
        />
      </div>
    </motion.div>
  );
};

// Storage Usage Component with purple theme - horizontal layout
const StorageUsage = ({ percentage = "3.8%", usedValue = 3.8, total = "1 GB" }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  
  // Convert percentage string to number
  const numericPercentage = typeof percentage === 'string' ? 
    parseFloat(percentage.replace('%', '')) : percentage;
  
  // Animation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(numericPercentage);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [numericPercentage]);

  return (
    <div className="storage-container">
      <div className="storage-bar">
        <motion.div 
          className="storage-used"
          initial={{ width: 0 }}
          animate={{ width: `${animatedPercentage}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ backgroundColor: '#8a2be2' }} // Purple color
        />
      </div>
      <div className="storage-info">
        <span className="used-percentage">{usedValue} MB</span>
        <span className="total-space">OF {total}</span>
      </div>
      
      <style jsx>{`
        .storage-container {
          margin-top: 30px;
          padding: 20px;
          background-color: #f9f6fd;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(138, 43, 226, 0.1);
        }
        
        .storage-bar {
          position: relative;
          width: 100%;
          height: 12px;
          background-color: #f0e6ff;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 10px;
        }
        
        .storage-used {
          position: absolute;
          left: 0;
          height: 100%;
          background-color: #8a2be2;
          border-radius: 6px;
        }
        
        .storage-info {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-weight: 500;
        }
        
        .used-percentage {
          color: #8a2be2;
          font-size: 16px;
        }
        
        .total-space {
          color: #666;
          font-size: 14px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

const Records = () => {
  const [doctorPrescribedRecords, setDoctorPrescribedRecords] = useState([]);
  const [patientUploadedRecords, setPatientUploadedRecords] = useState([]);
  const [labRecords, setLabRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const [activeTab, setActiveTab] = useState('all-records');
  const [activeRecordsSubTab, setActiveRecordsSubTab] = useState('doctor-prescribed');

  useEffect(() => {
    const initialize = async () => {
      if (!user?.id) {
        message.error("Please log in to view your records");
        return;
      }

      try {
        const profileResponse = await CheckProfileCompletion(user.id);
        if (!profileResponse.success) {
          message.error("Please complete your profile first");
          return;
        }

        const userResponse = await GetUserById(user.id);
        if (userResponse.success) {
          setUserProfile(userResponse.data);
        }

        // Fetch both types of records
        const [prescribed, uploaded, lab] = await Promise.all([
          fetchUserRecords(user.id),
          fetchPatientUploadedRecords(user.id),
          fetchLabRecords(user.id)
        ]);

        // Filter doctor-prescribed records (removing patient uploads)
        const doctorRecords = Array.isArray(prescribed) ? 
          prescribed.filter(record => record.uploadedBy === 'doctor') : [];
          
        const processedUploaded = Array.isArray(uploaded) ? 
          uploaded.map(record => ({
            ...record,
            uploadedBy: 'user' // Ensure all patient records have uploadedBy set to 'user'
          })) : [];

        // Find patient uploads in the user_records that might have been missed
        const userUploadsInRecords = Array.isArray(prescribed) ? 
          prescribed.filter(record => record.uploadedBy === 'user') : [];
          
        // Combine all patient uploads from both collections
        const allPatientUploads = [...processedUploaded, ...userUploadsInRecords];
        
        // Remove duplicates by checking for same public_id or URL
        const uniquePatientUploads = allPatientUploads.filter((record, index, self) => 
          index === self.findIndex(r => 
            (r.public_id && r.public_id === record.public_id) || 
            (r.url && r.url === record.url)
          )
        );
          
        const processedLabRecords = Array.isArray(lab) ? 
          lab.map(record => ({
            ...record,
            uploadedBy: record.uploadedBy || 'doctor' // Default to doctor if not specified
          })) : [];

        setDoctorPrescribedRecords(doctorRecords);
        setPatientUploadedRecords(uniquePatientUploads);
        setLabRecords(processedLabRecords);
      } catch (error) {
        message.error("Error loading user data");
        console.error("Initialization error:", error);
      }
    };

    initialize();
  }, [user?.id]);

  // Enhanced download function to handle PDFs correctly
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

  const handleUpload = async ({ file }) => {
    if (!user?.id) {
      message.error("Please log in to upload files");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Records");
    formData.append("folder", `patient-records/${user.id}/files`);

    try {
      const uploadResponse = await fetch(
        "https://api.cloudinary.com/v1_1/dagludyhc/raw/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      const recordData = {
        name: file.name,
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        userId: user.id,
        email: user.email,
        size: file.size || 0,
        uploadedBy: 'user', // Add uploadedBy parameter to mark as user-uploaded
      };

      // Always add to patientUploads collection first
      const patientUploadId = await addPatientUploadedRecord(recordData);
      
      // Create a new record object with the ID from patientUploads
      const newPatientRecord = {
        id: patientUploadId,
        ...recordData,
        createdAt: new Date() // Use a plain Date object
      };
      
      // Add to the patient uploaded records state
      setPatientUploadedRecords(prevRecords => [...prevRecords, newPatientRecord]);

      // Also add to the appropriate tab's collection based on active tab
      let docRef;
      if (activeTab === 'all-records') {
        // Store in user_records but maintain the uploadedBy='user' field
        docRef = await addUserRecord(user.id, recordData);
      } else if (activeTab === 'lab-records') {
        docRef = await addLabRecord(user.id, recordData);
        
        // Create a new record object with the current timestamp
        const newLabRecord = {
          id: docRef.id,
          ...recordData,
          createdAt: new Date() // Use a plain Date object
        };
        
        // Add to lab records
        setLabRecords(prevRecords => [...prevRecords, newLabRecord]);
      }

      message.success(`${file.name} uploaded successfully`);
      
      // Automatically switch to the Patient Uploaded tab to show the new file
      if (activeTab === 'all-records') {
        setActiveRecordsSubTab('patient-uploaded');
      }
      
    } catch (error) {
      message.error(`Upload failed: ${error.message}`);
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, publicId) => {
    if (!user?.id) {
      message.error("Please log in to delete files");
      return;
    }
  
    const hide = message.loading('Deleting file...', 0);
  
    try {
      // First, try to delete the file from Cloudinary
      try {
        const response = await fetch('/.netlify/functions/deleteFile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            publicId,
            userId: user.id,
            email: user.email 
          }),
        });
        
        // Check if the response is JSON before trying to parse it
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          
          if (!response.ok) {
            console.warn("Cloudinary deletion warning:", result.message);
            // Continue with database deletion even if Cloudinary fails
          }
        } else {
          // Log the error but continue with database deletion
          console.warn("Cloudinary deletion returned non-JSON response");
        }
      } catch (cloudinaryError) {
        // Log the Cloudinary error but continue with database deletion
        console.warn("Cloudinary deletion failed:", cloudinaryError.message);
      }
  
      // Find the record to be deleted in all collections
      const recordInDoctorPrescribed = doctorPrescribedRecords.find(record => record.id === id);
      const recordInPatientUploaded = patientUploadedRecords.find(record => record.id === id);
      const recordInLabRecords = labRecords.find(record => record.id === id);
      
      // Delete the record from the appropriate collection(s)
      if (recordInDoctorPrescribed) {
        await deleteUserRecord(user.id, id);
        setDoctorPrescribedRecords(prev => prev.filter(record => record.id !== id));
      }
      
      if (recordInPatientUploaded) {
        // Note: We need to check if this ID is from patientUploads collection or user_records
        // If it's from user_records, we need to delete it from there
        if (recordInPatientUploaded.source === 'patient') {
          // This is from patientUploads collection - we need to handle deletion differently
          // Since we don't have a direct delete function for patientUploads, we'll handle UI only
          setPatientUploadedRecords(prev => prev.filter(record => record.id !== id));
          // We'd need to implement a server function to delete from patientUploads collection
        } else {
          // This is from user_records collection
          await deleteUserRecord(user.id, id);
          setPatientUploadedRecords(prev => prev.filter(record => record.id !== id));
        }
      }
      
      if (recordInLabRecords) {
        await deleteLabRecord(user.id, id);
        setLabRecords(prev => prev.filter(record => record.id !== id));
      }
  
      message.success('File deleted successfully');
    } catch (error) {
      message.error(`Delete failed: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      hide();
    }
  };

  const handleMainTabChange = (key) => {
    setActiveTab(key);
  };

  const handleRecordsSubTabChange = (key) => {
    setActiveRecordsSubTab(key);
  };

  if (!user?.id) {
    return (
      <div className="records-page">
        <div className="records-container">
          <h2>Medical Records</h2>
          <p>Please log in to view your records.</p>
        </div>
      </div>
    );
  }

  if (!userProfile?.profileComplete) {
    return (
      <div className="records-page">
        <div className="records-container">
          <h2>Medical Records</h2>
          <p>Please complete your profile to access records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="custom">
    <div className="records-page">
      <div className="records-container">
        <div className="records-header">
          <div className="header-left">
            <button className="menu-button">
              <MenuOutlined />
            </button>
            <h2>Your Records</h2>
          </div>
          <div className="header-right">
            <Upload customRequest={handleUpload}>
            <button className="browse-button">BROWSE</button>
            </Upload>
          </div>
        </div>
        
        <div className="records-tabs">
          <Tabs defaultActiveKey={activeTab} onChange={handleMainTabChange}>
            <TabPane tab="Medical Records" key="all-records">
              <div className="tab-content">
                <div className="upload-section">
                  <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    accept=".pdf"
                    className="upload-area"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploading}
                      disabled={uploading}
                      className="upload-button"
                    >
                      {uploading ? "Uploading..." : "Upload New File"}
                    </Button>
                  </Upload>
                </div>
                
                {/* Sub-tabs for Medical Records */}
                <Tabs 
                  activeKey={activeRecordsSubTab}
                  onChange={handleRecordsSubTabChange}
                  className="sub-tabs"
                >
                  <TabPane 
                    tab={
                      <span className="flex items-center">
                        <FileTextOutlined className="mr-2" />
                        Doctor Prescribed ({doctorPrescribedRecords.length})
                      </span>
                    } 
                    key="doctor-prescribed"
                  >
                    <div className="files-section">
                      <div className="files-header">
                        <div className="file-header-col type">Type</div>
                        <div className="file-header-col info">File Information</div>
                        <div className="file-header-col size">Size</div>
                        <div className="file-header-col actions">Actions</div>
                      </div>
                      
                      <div className="files-list">
                        <AnimatePresence>
                          {doctorPrescribedRecords.map(record => (
                            <FileItem
                              key={record.id}
                              file={record}
                              onDownload={handleDownload}
                              onDelete={handleDelete}
                            />
                          ))}
                        </AnimatePresence>
                        
                        {doctorPrescribedRecords.length === 0 && (
                          <div className="no-files">
                            <p>No doctor prescribed records available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabPane>
                  
                  <TabPane 
                    tab={
                      <span className="flex items-center">
                        <UploadOutlined className="mr-2" />
                        Patient Uploaded ({patientUploadedRecords.length})
                      </span>
                    } 
                    key="patient-uploaded"
                  >
                    <div className="files-section">
                      <div className="files-header">
                        <div className="file-header-col type">Type</div>
                        <div className="file-header-col info">File Information</div>
                        <div className="file-header-col size">Size</div>
                        <div className="file-header-col actions">Actions</div>
                      </div>
                      
                      <div className="files-list">
                        <AnimatePresence>
                          {patientUploadedRecords.map(record => (
                            <FileItem
                              key={record.id}
                              file={record}
                              onDownload={handleDownload}
                              onDelete={handleDelete}
                            />
                          ))}
                        </AnimatePresence>
                        
                        {patientUploadedRecords.length === 0 && (
                          <div className="no-files">
                            <p>No patient uploaded records available.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabPane>
                </Tabs>
                
                <StorageUsage percentage="3.8%" total="1 TB" />
              </div>
            </TabPane>
            
            <TabPane tab="Lab Records" key="lab-records">
              <div className="tab-content">
                <div className="upload-section">
                  <Upload
                    customRequest={handleUpload}
                    showUploadList={false}
                    accept=".pdf"
                    className="upload-area"
                  >
                    <Button
                      icon={<UploadOutlined />}
                      loading={uploading}
                      disabled={uploading}
                      className="upload-button"
                    >
                      {uploading ? "Uploading..." : "Upload New File"}
                    </Button>
                  </Upload>
                </div>
                
                <div className="files-section">
                  <div className="files-header">
                    <div className="file-header-col type">Type</div>
                    <div className="file-header-col info">File Information</div>
                    <div className="file-header-col size">Size</div>
                    <div className="file-header-col actions">Actions</div>
                  </div>
                  
                  <div className="files-list">
                    <AnimatePresence>
                      {labRecords.map(record => (
                        <FileItem
                          key={record.id}
                          file={record}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                    
                    {labRecords.length === 0 && (
                      <div className="no-files">
                        <p>No lab records uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <StorageUsage percentage="3.8%" total="1 TB" />
              </div>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
      <style jsx>{`
        .sub-tabs {
          margin-bottom: 20px;
        }
        
        .sub-tabs .ant-tabs-nav {
          margin-bottom: 16px;
        }
        
        .sub-tabs .ant-tabs-tab {
          padding: 10px 14px;
          transition: all 0.3s;
        }
        
        .sub-tabs .ant-tabs-tab:hover {
          color: #1890ff;
        }
        
        .sub-tabs .ant-tabs-tab.ant-tabs-tab-active {
          background: #e6f7ff;
          border-radius: 4px;
        }
        
        /* Added styles for upload source indicator */
        .upload-source {
          display: inline-block;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
          vertical-align: middle;
        }
        
        .user-upload {
          background-color: #e6f7ff;
          color: #1890ff;
        }
        
        .doctor-upload {
          background-color: #f6ffed;
          color: #52c41a;
        }
      `}</style>
    </div>
  );
};

export default Records;