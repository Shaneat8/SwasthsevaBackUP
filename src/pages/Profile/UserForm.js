import { Button, Col, Form, Input, message, Radio, Row, Upload } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import {
  AddUserData,
  CheckIfDetailsAlreadyFilled,
  UpdateUserData,
} from "../../apicalls/users";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons";

function UserForm() {
  const [userform] = Form.useForm();
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

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
    const isLt2M = file.size / 1024 / 1024 < 1; // Reduced to 1MB since we're storing in Firestore
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

  const handleChange = (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

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
        ...sanitizedValues, // Use sanitized values
        userId: user.id,
        details: alreadyFilled ? "filled" : "not filled",
        photoUrl: imageUrl // This will now be the Base64 string
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
  const fetchUserData = useCallback( async () => {
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
          setImageUrl(response.data.photoUrl || '');
          userform.setFieldsValue(response.data);
        }
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch details. Please try again.");
    }
  },[dispatch,userform])

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return (
    <div className="bg-white p-2">
      <Form
        onFinish={onFinish}
        form={userform}
        layout="vertical"
      >
        <Row gutter={[16, 16]}>
          {/* Header */}
          <Col xs={24}>
            <h4 className="uppercase font-bold mb-4">Personal Details</h4>
          </Col>

          {/* Left Side Fields (First Name, Last Name, Email, DOB) */}
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
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
            <div className="flex justify-center items-start">
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={customRequest}
              >
                {imageUrl ? (
                  <div className="relative w-32 h-38">
                 <img 
                    src={imageUrl} 
                    alt="avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  /> 
                  <p>Click to Change (Max:1MB)</p>
                  </div>     
                ) : (
                  uploadButton
                )}
              </Upload>
            </div>
          </Col>

          {/* Remaining Fields */}
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

          {/* Guardian Details Section */}
          <Col xs={24}>
            <h4 className="uppercase font-bold mt-4 mb-4">Guardian Details</h4>
          </Col>

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

          {/* Submit Buttons */}
          <Col xs={24}>
            <div className="flex justify-end gap-2">
            <Button htmlType="button" color="default" variant="outlined" style={{borderRadius:'0', fontSize:'15px'}}>CANCEL</Button>
            <Button htmlType="submit" color="default" variant="solid" style={{borderRadius:'0', fontSize:'15px'}}>UPDATE DETAILS</Button>
            </div>
          </Col>
        </Row>
      </Form>

      <style jsx>{`
        .avatar-uploader .ant-upload {
          width: 130px !important;
          height: 180px !important;
        }
        .ant-upload-select-picture-card:hover {
          border-color: #1890ff;
        }
        .ant-form-item {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}

export default UserForm;