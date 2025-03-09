import { Button, Col, Form, Input, message, Modal, Radio, Row, Upload } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import {
  AddUserData,
  CheckIfDetailsAlreadyFilled,
  UpdateUserData,
} from "../../apicalls/users";
import { PlusOutlined, LoadingOutlined, UserOutlined, HomeOutlined } from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import styles from './UserForm.module.css';

function UserForm() {
  const [userform] = Form.useForm();
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const dispatch = useDispatch();

  // Keep all the existing functions unchanged
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 1; 
    if (!isLt2M) {
      message.error('Image must be smaller than 1MB!');
      return false;
    }
    return true;
  };

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const handleChange = ({ fileList: newFileList, file }) => {
    setFileList(newFileList);

    if (file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (file.status === 'done') {
      getBase64(file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
        setFileList([
          {
            uid: '-1',
            name: file.name,
            status: 'done',
            url: url,
          }
        ]);
      });
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf('/') + 1));
  };

  const handlePreviewCancel = () => setPreviewOpen(false);

  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // Handle form submission
  const onFinish = async (values) => {
    const user = getUserFromStorage();
    
    if (!user?.id) {
      message.error("Please login to continue");
      return;
    }

    try {
      dispatch(ShowLoader(true));

      // Sanitize the payload to replace undefined fields with null or empty string
      const sanitizedValues = Object.keys(values).reduce((acc, key) => {
        acc[key] = values[key] === undefined ? null : values[key];
        return acc;
      }, {});

      const payload = {
        ...sanitizedValues,
        userId: user.id,
        details: alreadyFilled ? "filled" : "not filled",
        photoUrl: imageUrl
      };

      let response = null;
      if (alreadyFilled) {
        payload.id = user.id;
        payload.details = "filled";
        response = await UpdateUserData(payload);
      } else {
        response = await AddUserData(payload);
      }
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  // Fetch user data on mount
  const fetchUserData = useCallback(async () => {
    const user = getUserFromStorage();
    
    if (!user?.id) {
      message.error("Please login to continue");
      return;
    }

    try {
      dispatch(ShowLoader(true));
      const response = await CheckIfDetailsAlreadyFilled(user.id);

      if (response.success) {
        if (response.data) {
          setAlreadyFilled(true);
          // Set image URL and fileList if photo exists
          if (response.data.photoUrl) {
            setImageUrl(response.data.photoUrl);
            setFileList([
              {
                uid: '-1',
                name: 'image.png',
                status: 'done',
                url: response.data.photoUrl,
              }
            ]);
          }
          userform.setFieldsValue(response.data);
        }
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch details. Please try again.");
    }
  }, [dispatch, userform]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className={styles['user-profile-wrapper']}>
      <div className={styles['user-profile-container']}>
        <h2 className={styles['user-profile-title']}>User Profile</h2>
        
        <Form
          onFinish={onFinish}
          form={userform}
          layout="vertical"
          className={styles['user-form']}
        >
          {/* Personal Details Section */}
          <h4 className={styles['user-form-section-header']}>
            <UserOutlined style={{ marginRight: '8px' }} /> Personal Details
          </h4>
          
          <Row gutter={[24, 16]} className={styles['user-form-row']}>
            {/* Left Side Fields */}
            <Col xs={24} md={16}>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="First Name"
                    name="FirstName"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="Enter your first name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Last Name"
                    name="LastName"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="Enter your last name" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Required" },
                      { type: "email", message: "Enter a valid email" }
                    ]}
                  >
                    <Input placeholder="Enter your email" />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Date of Birth"
                    name="DOB"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input type="date" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            {/* Right Side Image Upload */}
            <Col xs={24} md={8}>
              <div className={styles['user-form-image-upload-container']}>
                <ImgCrop rotationSlider>
                  <Upload
                    name="avatar"
                    listType="picture-card"
                    className={styles['user-form-avatar-uploader']}
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    customRequest={customRequest}
                  >
                    {fileList.length >= 1 ? null : uploadButton}
                  </Upload>
                </ImgCrop>
                
                <Modal
                  open={previewOpen}
                  title={previewTitle}
                  footer={null}
                  onCancel={handlePreviewCancel}
                >
                  <img 
                    alt="preview" 
                    style={{ width: '100%' }} 
                    src={previewImage} 
                  />
                </Modal>
              </div>
            </Col>
          </Row>

          {/* Contact Information */}
          <Row gutter={[24, 16]} className={styles['user-form-row']}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{10}$/, message: "Enter a valid phone number" }
                ]}
              >
                <Input placeholder="Enter your phone number" maxLength={10} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true, message: "Required" }]}
              >
                <Radio.Group>
                  <Radio value={1}>Male</Radio>
                  <Radio value={2}>Female</Radio>
                  <Radio value={3}>Other</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Pincode"
                name="pincode"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^\d{6}$/, message: "Enter a valid pincode" }
                ]}
              >
                <Input placeholder="Enter your pincode" maxLength={6}/>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input.TextArea rows={3} placeholder="Enter your address" />
              </Form.Item>
            </Col>
          </Row>

          {/* Guardian Details Section */}
          <h4 className={styles['user-form-section-header-with-margin']}>
            <HomeOutlined style={{ marginRight: '8px' }} /> Guardian Details
          </h4>
          
          <Row gutter={[24, 16]} className={styles['user-form-row']}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Guardian Name"
                name="gName"
              >
                <Input placeholder="Enter guardian's full name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Guardian Contact"
                name="gPhone"
                rules={[
                  { pattern: /^\d{10,15}$/, message: "Enter a valid phone number" }
                ]}
              >
                <Input placeholder="Enter guardian's phone number" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Guardian Pincode"
                name="gPincode"
                rules={[
                  { pattern: /^\d{6}$/, message: "Enter a valid Pin Code" }
                ]}
              >
                <Input placeholder="Enter guardian's pincode" maxLength={6}/>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                label="Guardian Address"
                name="gAddress"
              >
                <Input.TextArea rows={3} placeholder="Enter guardian's address" />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Buttons */}
          <div className={styles['user-form-button-container']}>
            <Button 
              htmlType="button" 
              className={`${styles['user-form-button']} ${styles['user-form-button-cancel']}`}
            >
              CANCEL
            </Button>
            <Button 
              htmlType="submit" 
              className={`${styles['user-form-button']} ${styles['user-form-button-submit']}`}
            >
              UPDATE DETAILS
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default UserForm;