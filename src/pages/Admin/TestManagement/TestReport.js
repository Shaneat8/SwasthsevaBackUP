import React, { useState, useEffect } from 'react';
import { Button, Typography, Divider, Descriptions, Table, Space, Row, Col, Input, Form } from 'antd';
import { 
  PrinterOutlined, 
  DownloadOutlined, 
  MailOutlined,
  ExperimentOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

// This component handles both the display and editing of test results
const TestReport = ({ testType, existingResults, onChange, readOnly, patientData, templateData, labId }) => {
  const [form] = Form.useForm();
  const [results, setResults] = useState({});
  
  // Initialize the form with existing results if available
  useEffect(() => {
    if (existingResults) {
      setResults(existingResults);
      form.setFieldsValue(existingResults);
    }
  }, [existingResults, form]);

  // When form values change, update parent component
  const handleValuesChange = (_, allValues) => {
    setResults(allValues);
    if (onChange) {
      onChange(allValues);
    }
  };
  
  const getValueStatus = (value, refRange) => {
    // Simple parsing for numeric ranges
    if (!value || !refRange) return 'normal';
    
    // For ranges like "70 - 100"
    if (refRange.includes(' - ')) {
      const [min, max] = refRange.split(' - ').map(num => parseFloat(num));
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) return 'normal';
      if (numValue < min) return 'low';
      if (numValue > max) return 'high';
      return 'normal';
    }
    
    // For ranges like "< 200" or "> 40"
    if (refRange.includes('<') || refRange.includes('>')) {
      const operator = refRange.trim()[0];
      const threshold = parseFloat(refRange.replace(/[<>]/g, '').trim());
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) return 'normal';
      if (operator === '<' && numValue >= threshold) return 'high';
      if (operator === '>' && numValue <= threshold) return 'low';
      return 'normal';
    }
    
    return 'normal';
  };
  
  const getValueColor = (status) => {
    switch (status) {
      case 'high': return 'red';
      case 'low': return 'blue';
      default: return 'black';
    }
  };

  // Format the date for the report
  const formattedDate = moment().format('DD-MM-YYYY');
  
  // If no template data is provided, show a message
  if (!templateData) {
    return <div>No template found for this test type.</div>;
  }

  // Extract patient details
  const { userName, userEmail, date, timeSlot, numPatients, notes } = patientData || {};
  
  const columns = readOnly ? [
    {
      title: 'Test Parameter',
      dataIndex: 'name',
      key: 'name',
      width: '35%',
    },
    {
      title: 'Result',
      dataIndex: 'name',
      key: 'result',
      width: '25%',
      render: (name) => {
        const value = results[name] || '';
        const param = templateData.parameters.find(p => p.name === name);
        const status = getValueStatus(value, param?.refRange);
        return (
          <Text strong style={{ color: getValueColor(status) }}>
            {value}
          </Text>
        );
      }
    },
    {
      title: 'Units',
      dataIndex: 'name',
      key: 'unit',
      width: '15%',
      render: (name) => {
        const param = templateData.parameters.find(p => p.name === name);
        return param?.unit || '';
      }
    },
    {
      title: 'Reference Range',
      dataIndex: 'name',
      key: 'refRange',
      width: '25%',
      render: (name) => {
        const param = templateData.parameters.find(p => p.name === name);
        return param?.refRange || '';
      }
    }
  ] : [
    {
      title: 'Test Parameter',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Result',
      dataIndex: 'name',
      key: 'result',
      width: '25%',
      render: (name) => (
        <Form.Item name={name} noStyle>
          <Input placeholder="Enter result" />
        </Form.Item>
      )
    },
    {
      title: 'Units',
      dataIndex: 'name',
      key: 'unit',
      width: '15%',
      render: (name) => {
        const param = templateData.parameters.find(p => p.name === name);
        return param?.unit || '';
      }
    },
    {
      title: 'Reference Range',
      dataIndex: 'name',
      key: 'refRange',
      width: '30%',
      render: (name) => {
        const param = templateData.parameters.find(p => p.name === name);
        return param?.refRange || '';
      }
    }
  ];
  
  const data = templateData.parameters.map((param, index) => ({
    key: index,
    name: param.name
  }));

  return (
    <div className="test-report" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff' }}>
      <Form 
        form={form} 
        onValuesChange={handleValuesChange}
        initialValues={existingResults}
      >
        <div className="report-header mb-6">
          <Row align="middle">
            <Col span={16}>
              <Title level={3} style={{ margin: 0 }}>
                <ExperimentOutlined /> GUPTA PATHOLOGY
              </Title>
              <Text type="secondary">Mall Godam Road, Near Petrol Pump, Palia Kalan</Text>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Text strong>Survesh Gupta</Text><br />
              <Text type="secondary">BSc, MLT</Text><br />
              <Text type="secondary">Mob: 9120821296, 9415805266</Text>
            </Col>
          </Row>
        </div>
        
        <Divider />
        
        <div className="patient-info mb-4">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="PATIENT NAME">
                  <Text strong><UserOutlined /> {userName || 'Patient Name'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="EMAIL">
                  {userEmail || 'patient@email.com'}
                </Descriptions.Item>
                <Descriptions.Item label="DATE & TIME">
                  {date ? moment(date).format('DD-MM-YYYY') : formattedDate} {timeSlot || ''}
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="LAB NO">
                  <Text strong>{labId || 'LAB0001'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="REPORT DATE">
                  {formattedDate}
                </Descriptions.Item>
                <Descriptions.Item label="TEST NAME">
                  <Text strong>{templateData.name || 'Test Name'}</Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </div>
        
        <div className="test-results mb-4">
          <Title level={4} className="text-center">
            {templateData.name.toUpperCase()}
          </Title>
          
          <Table 
            columns={columns} 
            dataSource={data} 
            pagination={false}
            bordered
            size="small"
          />
        </div>
        
        <div className="report-footer mt-8">
          <Divider orientation="center">NOTE</Divider>
          <Row>
            <Col span={12}>
              {notes && (
                <div>
                  <Text strong>Patient Notes:</Text>
                  <p>{notes}</p>
                </div>
              )}
            </Col>
            <Col span={12} style={{ textAlign: 'right', paddingTop: '40px' }}>
              <Text strong>Authorized Signatory</Text>
            </Col>
          </Row>
        </div>
        
        {readOnly && (
          <div className="report-actions mt-4" style={{ textAlign: 'center' }}>
            <Space>
              <Button icon={<PrinterOutlined />}>Print</Button>
              <Button icon={<DownloadOutlined />} type="primary">Download PDF</Button>
              <Button icon={<MailOutlined />}>Email Report</Button>
            </Space>
          </div>
        )}
      </Form>
    </div>
  );
};

export default TestReport;