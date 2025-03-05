import React, { useState, useEffect } from "react";
import { 
  Button, 
  Col, 
  Form, 
  Input, 
  message, 
  Row, 
  Select, 
  Typography, 
  Card, 
  Divider, 
  Steps, 
  Checkbox,
  Alert,
  Upload
} from "antd";
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  IdcardOutlined, 
  HomeOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BookOutlined,
  PlusOutlined,
  LoadingOutlined
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { AddDoctor, CheckIfDoctorApplied, UpdateDoctor } from "../../apicalls/doctors";
import { useNavigate } from "react-router-dom";
import "./DoctorForm.module.css";

const { Title, Text } = Typography;
const { TextArea } = Input;

function Doctor() {
  const [form] = Form.useForm();
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [days, setDays] = useState([]);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const specialistOptions = [
    { value: "Dermatologist", label: "Dermatologist" },
    { value: "Cardiologist", label: "Cardiologist" },
    { value: "Surgeon", label: "Surgeon" },
    { value: "Radiologist", label: "Radiologist" },
    { value: "Orthopedics", label: "Orthopedics" },
    { value: "Neurologist", label: "Neurologist" },
    { value: "Urologist", label: "Urologist" },
    { value: "Gynecologist", label: "Gynecologist" }
  ];

  const qualificationOptions = [
    { value: "MBBS", label: "MBBS" },
    { value: "BAMS", label: "BAMS" },
    { value: "BHMS", label: "BHMS" },
    { value: "BDS", label: "BDS" },
    { value: "MD", label: "MD" },
    { value: "MS", label: "MS" },
    { value: "DM", label: "DM" },
    { value: "MCh", label: "MCh" },
    { value: "DGO", label: "DGO" },
    { value: "DNB", label: "DNB" }
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const isValidFormat = validTypes.includes(file.type);
    if (!isValidFormat) {
      message.error('You can only upload JPG/PNG/WEBP files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    return isValidFormat && isLt2M;
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

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload Photo</div>
    </div>
  );

  const nextStep = () => {
    form.validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch(() => {
        message.error("Please fill all required fields before proceeding");
      });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onFinish = async (values) => {
    if (days.length === 0) {
      setError('At least one day must be selected.');
      return;
    }
    setError('');
    
    try {
      dispatch(ShowLoader(true));
      const payload = {
        ...values,
        days,
        photoUrl: imageUrl,
        userId: JSON.parse(localStorage.getItem("user")).id,
        status: "pending",
        role: "doctor",
      };
      
      let response = null;
      if (alreadyApproved) {
        payload.id = JSON.parse(localStorage.getItem("user")).id;
        payload.status = "approved";
        response = await UpdateDoctor(payload);
      } else {
        response = await AddDoctor(payload);
      }
      
      dispatch(ShowLoader(false));
      if (response.success) {
        message.success(response.message);
        navigate("/profile");
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const handleDayChange = (day) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const CheckAlreadyApplied = async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await CheckIfDoctorApplied(JSON.parse(localStorage.getItem("user")).id);
      if (response.success) {
        setAlreadyApplied(true);
        if (response.data.status === "approved") {
          setAlreadyApproved(true);
          form.setFieldsValue(response.data);
          setDays(response.data.days);
          setImageUrl(response.data.photoUrl || '');
        }
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  useEffect(() => {
    CheckAlreadyApplied();
  }, []);

  const steps = [
    {
      title: 'Personal Information',
      content: (
        <Row gutter={[24, 24]} align="top">
          {/* First column with personal details */}
          <Col xs={24} md={12}>
            <Card className="info-card" bordered={false}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: "First name is required" }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Enter your first name" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: "Last name is required" }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Enter your last name" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Email is required" },
                      { type: "email", message: "Please enter a valid email" }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Enter your email" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Phone"
                    name="phone"
                    rules={[
                      { required: true, message: "Phone number is required" },
                      { pattern: /^[0-9]{10}$/, message: "Enter a valid 10-digit phone number" }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" maxLength={10} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Second column with photo and registration ID */}
          <Col xs={24} md={12}>
            <Card className="info-card" bordered={false}>
              <Row gutter={[16, 16]} justify="center">
              <Col span={24} className="text-center">
                  <Form.Item
                    label="Doctor's Photo"
                    name="photo"
                    className="doctor-profile-uploader"
                  >
                    <Upload
                      name="avatar"
                      listType="picture-card"
                      className="doctor-profile-container"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      onChange={handleChange}
                      customRequest={customRequest}
                    >
                      {imageUrl ? (
                        <div className="doctor-profile-preview">
                          <img src={imageUrl} alt="doctor" />
                          <div className="doctor-profile-overlay">Click to Change (Max: 2MB)</div>
                        </div>
                      ) : (
                        <div className="doctor-profile-upload-box">
                          {loading ? <LoadingOutlined /> : <PlusOutlined />}
                          <div style={{ marginTop: 8 }}>Upload Photo</div>
                        </div>
                      )}
                    </Upload>
                    <Text type="secondary" className="doctor-profile-hint">
                      Upload a professional photo (JPG/PNG/WEBP, max 2MB)
                    </Text>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Registration ID"
                    name="reg_id"
                    rules={[
                      { required: true, message: "Registration ID is required" },
                      { pattern: /^[0-9]{5}$/, message: "Enter a valid 5-digit registration ID" }
                    ]}
                  >
                    <Input prefix={<IdcardOutlined />} placeholder="Enter your registration ID" maxLength={5} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Full width for address */}
          <Col span={24}>
            <Card className="info-card" bordered={false}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Address is required" }]}
              >
                <TextArea
                  placeholder="Enter your complete address"
                  autoSize={{ minRows: 3, maxRows: 5 }}
                  prefix={<HomeOutlined />}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      title: 'Professional Information',
      content: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="info-card" bordered={false}>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Specialization"
                    name="Specialist"
                    rules={[{ required: true, message: "Specialization is required" }]}
                  >
                    <Select
                      placeholder="Select your specialization"
                      suffixIcon={<MedicineBoxOutlined />}
                      options={specialistOptions}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Experience (Years)"
                    name="experience"
                    rules={[{ required: true, message: "Experience is required" }]}
                  >
                    <Input
                      type="number"
                      prefix={<TrophyOutlined />}
                      placeholder="Years of experience"
                      min={0}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Qualification"
                    name="Qualification"
                    rules={[{ required: true, message: "Qualification is required" }]}
                  >
                    <Select
                      placeholder="Select your highest qualification"
                      suffixIcon={<BookOutlined />}
                      options={qualificationOptions}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label="Professional Summary"
                    name="summary"
                    rules={[{ required: true, message: "Professional summary is required" }]}
                  >
                    <TextArea
                      placeholder="Briefly describe your professional background, expertise, and approach to patient care"
                      autoSize={{ minRows: 3, maxRows: 5 }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      title: 'Work Hours',
      content: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="info-card" bordered={false}>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Start Time"
                    name="startTime"
                    rules={[{ required: true, message: "Start time is required" }]}
                  >
                    <Input
                      type="time"
                      prefix={<ClockCircleOutlined />}
                      placeholder="Select start time"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="End Time"
                    name="endTime"
                    rules={[{ required: true, message: "End time is required" }]}
                  >
                    <Input
                      type="time"
                      prefix={<ClockCircleOutlined />}
                      placeholder="Select end time"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Consultation Fee"
                    name="Fee"
                    rules={[{ required: true, message: "Fee is required" }]}
                  >
                    <Input
                      type="number"
                      prefix="₹"
                      suffix="/-"
                      placeholder="Consultation fee"
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card className="days-card" bordered={false}>
              <Form.Item
                label="Working Days"
                required
              >
                <div className="days-selection">
                  {daysOfWeek.map((day) => (
                    <Checkbox
                      key={day}
                      checked={days.includes(day)}
                      onChange={() => handleDayChange(day)}
                      className="day-checkbox"
                    >
                      {day}
                    </Checkbox>
                  ))}
                </div>
                {error && <div className="error-message">{error}</div>}
              </Form.Item>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="doctor-registration-container">
      {(!alreadyApplied || alreadyApproved) ? (
        <Card 
          className="registration-card"
          title={
            <div className="card-title">
              <MedicineBoxOutlined className="title-icon" />
              <Title level={4}>
                {alreadyApproved 
                  ? "Update Your Doctor Profile" 
                  : "Doctor Registration Application"}
              </Title>
            </div>
          }
        >
          <Steps 
            current={currentStep} 
            className="registration-steps"
            items={steps.map(item => ({ title: item.title }))}
          />
          
          <Divider />
          
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="registration-form"
          >
            <div className="steps-content">
              {steps[currentStep].content}
            </div>
            
            <div className="steps-action">
              {currentStep > 0 && (
                <Button 
                  style={{ margin: '0 8px' }} 
                  onClick={prevStep}
                  className="prev-button"
                >
                  Previous
                </Button>
              )}
              
              {currentStep < steps.length - 1 && (
                <Button 
                  type="primary" 
                  onClick={nextStep}
                  className="next-button"
                >
                  Next
                </Button>
              )}
              
              {currentStep === steps.length - 1 && (
                <Button 
                  type="primary" 
                  htmlType="submit"
                  className="submit-button"
                >
                  {alreadyApproved ? "Update Profile" : "Submit Application"}
                </Button>
              )}
            </div>
          </Form>
        </Card>
      ) : (
        <Card className="pending-card">
          <Alert
            message="Application In Review"
            description="You have already applied for a doctor account. Please wait for admin approval of your request."
            type="info"
            showIcon
          />
        </Card>
      )}
    </div>
  );
}

export default Doctor;