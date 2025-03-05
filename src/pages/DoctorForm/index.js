import React, { useState, useEffect, useCallback } from "react";
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
  Upload,
  Image
} from "antd";
import ImgCrop from "antd-img-crop";
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  IdcardOutlined, 
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

const { Title } = Typography;
const { TextArea } = Input;

function Doctor() {
  const [form] = Form.useForm();
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [days, setDays] = useState([]);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [loading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [imageUrl, setImageUrl] = useState('');

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

  const getBase64 = (file) => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

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

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    // Update imageUrl for the form submission if there is at least one file
    if (newFileList.length > 0 && newFileList[0]?.originFileObj) {
      // Use getBase64 to convert file to base64 string
      getBase64(newFileList[0].originFileObj).then(base64 => {
        setImageUrl(base64);
      });
    } else if (newFileList.length > 0 && newFileList[0]?.thumbUrl) {
      setImageUrl(newFileList[0].thumbUrl);
    } else if (newFileList.length > 0 && newFileList[0]?.url) {
      setImageUrl(newFileList[0].url);
    } else {
      setImageUrl('');
    }
  };

  const customRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const nextStep = () => {
    const fieldsToValidate = [];
    
    // Determine which fields to validate based on current step
    if (currentStep === 0) {
      fieldsToValidate.push('firstName', 'lastName', 'email', 'phone', 'reg_id', 'address');
    } else if (currentStep === 1) {
      fieldsToValidate.push('Specialist', 'experience', 'Qualification', 'summary');
    }
    
    form.validateFields(fieldsToValidate)
      .then((values) => {
        // Save the current step's data
        setFormData(prevData => ({
          ...prevData,
          ...values
        }));
        setCurrentStep(currentStep + 1);
      })
      .catch((errorInfo) => {
        console.log("Validation failed:", errorInfo);
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
      
      // Explicitly combine all data from all steps
      const completeFormData = {
        ...formData,  // This contains data from previous steps
        ...values,    // This contains data from the current step
        days,
        photoUrl: imageUrl,
        userId: JSON.parse(localStorage.getItem("user"))?.id,
        status: "pending",
        role: "doctor",
      };
      
      // Convert any undefined values to empty strings
      Object.keys(completeFormData).forEach(key => {
        if (completeFormData[key] === undefined) {
          completeFormData[key] = '';
        }
      });
      
      console.log("Submitting complete form data:", completeFormData);
      
      let response = null;
      if (alreadyApproved) {
        completeFormData.id = JSON.parse(localStorage.getItem("user"))?.id;
        completeFormData.status = "approved";
        response = await UpdateDoctor(completeFormData);
      } else {
        response = await AddDoctor(completeFormData);
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
      message.error(error.message || "Something went wrong");
    }
  };
  const handleDayChange = (day) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const CheckAlreadyApplied = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const userId = JSON.parse(localStorage.getItem("user"))?.id;
      if (!userId) {
        throw new Error("User not found");
      }
      
      const response = await CheckIfDoctorApplied(userId);
      if (response.success) {
        setAlreadyApplied(true);
        if (response.data.status === "approved") {
          setAlreadyApproved(true);
          form.setFieldsValue(response.data);
          setFormData(response.data);
          setDays(response.data.days || []);
          
          // Set image data if exists
          if (response.data.photoUrl) {
            setImageUrl(response.data.photoUrl);
            setFileList([{
              uid: '-1',
              name: 'profile-image.jpg',
              status: 'done',
              url: response.data.photoUrl,
            }]);
          }
        }
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message || "Failed to check application status");
    }
  }, [dispatch, form]);

  useEffect(() => {
    CheckAlreadyApplied();
  }, [CheckAlreadyApplied]);

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

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
                    <ImgCrop rotationSlider>
                      <Upload
                        listType="picture-card"
                        fileList={fileList}
                        beforeUpload={beforeUpload}
                        onPreview={handlePreview}
                        onChange={handleChange}
                        customRequest={customRequest}
                        className="avatar"
                      >
                        {fileList.length >= 1 ? null : uploadButton}
                      </Upload>
                    </ImgCrop>
                    <div className="doctor-profile-hint">
                      Upload a professional photo (JPG/PNG/WEBP, max 2MB)
                    </div>
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
            initialValues={formData}
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
      
      {/* Image Preview */}
      {previewImage && (
        <Image
          wrapperStyle={{ display: 'none' }}
          preview={{
            visible: previewOpen,
            onVisibleChange: (visible) => setPreviewOpen(visible),
            afterOpenChange: (visible) => !visible && setPreviewImage(''),
          }}
          src={previewImage}
        />
      )}
    </div>
  );
}

export default Doctor;