// src/components/Records/Records.jsx
import React, { useState, useEffect } from "react";
import { Button, message, Upload } from "antd";
import { 
  UploadOutlined, 
  DownloadOutlined, 
  DeleteOutlined 
} from "@ant-design/icons";
import moment from 'moment';
import { CheckProfileCompletion, GetUserById } from "../../apicalls/users"; // Import your existing user functions
import { fetchUserRecords, addUserRecord, deleteUserRecord } from "../../apicalls/recordpdf";
import "./records.css";


const Records = () => {
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

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

        const recordsData = await fetchUserRecords(user.id);
        setRecords(recordsData);
      } catch (error) {
        message.error("Error loading user data");
        console.error("Initialization error:", error);
      }
    };

    initialize();
  }, [user?.id]);

  const handleDownload = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      };

      const docRef = await addUserRecord(user.id, recordData);
      
      // Create a new record object with the current timestamp
      const newRecord = {
        id: docRef.id,
        ...recordData,
        createdAt: {
          toDate: () => new Date() // Create a compatible timestamp object
        }
      };

      // Update the records state by adding the new record
      setRecords(prevRecords => [...prevRecords, newRecord]);
      message.success(`${file.name} uploaded successfully`);
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
      const response = await fetch('/.netlify/functions/deleteFile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          publicId,
          userId: user.id,
          email: user.email 
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Delete failed');
      }

      await deleteUserRecord(user.id, id);
      setRecords(prev => prev.filter(record => record.id !== id));
      message.success('File deleted successfully');
    } catch (error) {
      message.error(`Delete failed: ${error.message}`);
      console.error("Delete error:", error);
    } finally {
      hide();
    }
  };

  if (!user?.id) {
    return (
      <div className="records-container">
        <h2>Medical Records</h2>
        <p>Please log in to view your records.</p>
      </div>
    );
  }

  if (!userProfile?.profileComplete) {
    return (
      <div className="records-container">
        <h2>Medical Records</h2>
        <p>Please complete your profile to access records.</p>
      </div>
    );
  }

  return (
    <div className="records-container">
      <h2>Your Medical Records</h2>
      
      <Upload
        customRequest={handleUpload}
        showUploadList={false}
        accept=".pdf"
        className="upload-section"
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={uploading}
          className="upload-button"
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </Button>
      </Upload>

      <div className="records-table-container">
        <h3>Uploaded Files</h3>
        {records.length === 0 ? (
          <p>No records uploaded yet.</p>
        ) : (
          <table className="records-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>
                    <a 
                      href={record.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {record.name}
                    </a>
                  </td>
                  <td>
                    {record.createdAt ? 
                      moment(record.createdAt.toDate()).format('LL') : 
                      'N/A'
                    }
                  </td>
                  <td className="action-buttons">
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(record.url, record.name)}
                    >
                      Download
                    </Button>
                    <Button
                      type="default"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id, record.public_id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Records;