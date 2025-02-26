import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  Input, 
  Button, 
  Divider, 
  message, 
  Spin, 
  Row, 
  Col, 
  Typography 
} from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../redux/loaderSlice';
import { GetAllTestTemplates } from '../apicalls/templates';
import { GenerateLabTestResultPDF } from '../apicalls/labTests';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const LabTestResultModal = ({ visible, onCancel, testData, patientInfo, onSuccess }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [testParameters, setTestParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const dispatch = useDispatch();

  // Fetch test templates when modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchTemplates();
    }
  }, [visible]);

  // Fetch all test templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await GetAllTestTemplates();
      
      if (response.success) {
        setTemplates(response.data);
      } else {
        message.error(response.message || 'Failed to fetch test templates');
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      message.error('An error occurred while fetching templates');
    } finally {
      setLoading(false);
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId) => {
    setSelectedTemplate(templateId);
    
    // Find selected template
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTestParameters(template.parameters || []);
      
      // Initialize form with parameter fields
      const initialValues = {};
      template.parameters.forEach(param => {
        initialValues[param.name] = "";
      });
      form.setFieldsValue(initialValues);
    }
  };

  // Submit form and generate PDF
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!selectedTemplate) {
        message.error('Please select a test template');
        return;
      }
      
      dispatch(ShowLoader(true));
      
      // Generate PDF and update lab test record
      const response = await GenerateLabTestResultPDF(
        testData.id,
        selectedTemplate,
        values
      );
      
      dispatch(ShowLoader(false));
      
      if (response.success) {
        message.success('Test results uploaded successfully');
        form.resetFields();
        onSuccess(response.data);
        onCancel();
      } else {
        message.error(response.message || 'Failed to upload test results');
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error('Please check all required fields');
    }
  };

  return (
    <Modal
      title="Add Test Results"
      visible={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<CloudUploadOutlined />}
          onClick={handleSubmit}
          loading={loading}
          disabled={!selectedTemplate}
        >
          Generate Report & Upload
        </Button>
      ]}
    >
      {loading && !templates.length ? (
        <Spin tip="Loading test templates..." />
      ) : (
        <>
          {/* Patient Information */}
          {patientInfo && (
            <>
              <Title level={5}>Patient Information</Title>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text strong>Name:</Text> {patientInfo.name}
                </Col>
                <Col span={12}>
                  <Text strong>ID:</Text> {patientInfo.id}
                </Col>
                {patientInfo.age && (
                  <Col span={12}>
                    <Text strong>Age:</Text> {patientInfo.age}
                  </Col>
                )}
                {patientInfo.gender && (
                  <Col span={12}>
                    <Text strong>Gender:</Text> {patientInfo.gender}
                  </Col>
                )}
              </Row>
              <Divider />
            </>
          )}

          {/* Test Information */}
          <Title level={5}>Test Information</Title>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text strong>Test ID:</Text> {testData?.id}
            </Col>
            <Col span={12}>
              <Text strong>Date:</Text> {testData?.date}, {testData?.timeSlot}
            </Col>
          </Row>
          <Divider />

          {/* Test Results Form */}
          <Form form={form} layout="vertical">
            <Form.Item
              name="templateId"
              label="Select Test Template"
              rules={[{ required: true, message: 'Please select a test template' }]}
            >
              <Select
                placeholder="Select a test template"
                onChange={handleTemplateChange}
                style={{ width: '100%' }}
              >
                {templates.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedTemplate && testParameters.length > 0 && (
              <>
                <Divider orientation="left">Test Parameters</Divider>
                
                {testParameters.map(param => (
                  <Form.Item
                    key={param.name}
                    name={param.name}
                    label={`${param.name} (${param.unit}) - Reference: ${param.refRange}`}
                    rules={[{ required: true, message: `Please enter ${param.name} result` }]}
                  >
                    <Input placeholder={`Enter value for ${param.name}`} />
                  </Form.Item>
                ))}

                <Form.Item name="notes" label="Additional Notes (Optional)">
                  <TextArea 
                    rows={4} 
                    placeholder="Enter any additional notes, observations, or recommendations" 
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default LabTestResultModal;