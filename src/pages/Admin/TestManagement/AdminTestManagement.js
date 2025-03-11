import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  message,
  Tabs,
  Spin,
  Typography,
  Row,
  Col,
  Divider,
  Space,
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import {
  GetAllTestTemplates,
  AddTestTemplate,
  UpdateTestTemplate,
  DeleteTestTemplate,
} from "../../../apicalls/templates";
import { ShowLoader } from "../../../redux/loaderSlice";
import { GetPatientDetails } from "../../../apicalls/users";
import {
  GetAllLabTestsFirebase,
  UploadTestReport,
} from "../../../apicalls/labTests";
import moment from "moment";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const AdminTestManagement = () => {
  // States for template management
  const [templates, setTemplates] = useState([]);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm] = Form.useForm();

  // States for lab test management
  const [labTests, setLabTests] = useState([]);
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [patientInfoVisible, setPatientInfoVisible] = useState(false);
  const [testResultModalVisible, setTestResultModalVisible] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("1");

  // States for test result management
  const [testResultForm] = Form.useForm();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [testParameters, setTestParameters] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const dispatch = useDispatch();

  // Fetch all lab test bookings
  const fetchLabTests = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllLabTestsFirebase();
      dispatch(ShowLoader(false));

      if (response.success) {
        // Ensure each lab test object includes testId and userId
        const labTestsWithRequiredFields = response.data.map((test) => ({
          ...test,
          testId: test.testId || "defaultTestId", // Fallback if testId is missing
          userId: test.userId || "defaultUserId", // Fallback if userId is missing
        }));
        setLabTests(labTestsWithRequiredFields);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch lab tests");
    }
  }, [dispatch]);

  // Fetch test templates
  const fetchTemplates = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetAllTestTemplates();
      dispatch(ShowLoader(false));

      if (response.success) {
        setTemplates(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to fetch templates");
    }
  }, [dispatch]);

  useEffect(() => {
    // Always fetch templates to ensure they're available for both tabs
    fetchTemplates();

    // Only fetch lab tests if on the lab tests tab
    if (activeTab === "1") {
      fetchLabTests();
    }
  }, [activeTab, fetchLabTests, fetchTemplates]);

  // First, add a helper function to calculate age from a date of birth
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    return moment().diff(moment(dob, "YYYY-MM-DD"), "years");
  };

  const fetchPatientInfo = async (labTest) => {
    try {
      const patientId = labTest.userId;

      console.log("Fetching patient with ID:", patientId);

      if (!patientId) {
        message.error("Patient ID is missing from test data");
        return;
      }

      dispatch(ShowLoader(true));
      const response = await GetPatientDetails(patientId);
      console.log("GetPatientDetails response:", response);
      dispatch(ShowLoader(false));

      if (response.success) {
        setPatientInfo(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      console.error("Error in fetchPatientInfo:", error);
      message.error("Failed to fetch patient information");
    }
  };

  // Also update where this function is called:
  const handleShowPatientInfo = async (labTest) => {
    setSelectedLabTest({
      ...labTest,
      testId: labTest.testId || "defaultTestId",
      userId: labTest.userId || "defaultUserId",
    });
    await fetchPatientInfo(labTest);
    setPatientInfoVisible(true);
  };

  // Handle template change for test results
  const handleTemplateChange = (templateId) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setTestParameters(template.parameters);
    }
  };
  const generatePDF = (testData, patientData, template, results, addnote) => {
    const doc = new jsPDF();
    let currentY = 15; // Start position
    const margin = 15;
  
    // Add header
    doc.setFontSize(18);
    doc.text("Lab Test Report", 105, currentY, { align: "center" });
    currentY += 10;
  
    // Add logo or hospital name
    doc.setFontSize(12);
    doc.text("Swasthya Seva HealthCare System", 105, currentY, {
      align: "center",
    });
    currentY += 5;
  
    // Add line
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, 195, currentY);
    currentY += 10;
  
    // Add patient information
    doc.setFontSize(12);
    doc.text("Patient Information:", margin, currentY);
    currentY += 10;
  
    doc.setFontSize(10);
    const age = calculateAge(patientData.DOB);
    const patientName =
      patientData && patientData.FirstName
        ? String(patientData.FirstName) +
          " " +
          String(patientData.LastName || "")
        : "N/A";
    const patientAge = patientData && patientData.DOB ? String(age) : "N/A";
    const patientGender =
      patientData && patientData.gender
        ? String(patientData.gender === 1 ? "Male" : "Female")
        : "N/A";
  
    const testId = testData && testData.id ? String(testData.id) : "N/A";
    const testDate = testData && testData.date ? String(testData.date) : "N/A";
    const testName = template && template.name ? String(template.name) : "N/A";
  
    doc.text(`Name: ${patientName}`, margin, currentY);
    doc.text(`Report ID: ${testId}`, 120, currentY);
    currentY += 6;
  
    doc.text(`Age: ${patientAge}`, margin, currentY);
    doc.text(`Date: ${testDate}`, 120, currentY);
    currentY += 6;
  
    doc.text(`Gender: ${patientGender}`, margin, currentY);
    doc.text(`Test: ${testName}`, 120, currentY);
    currentY += 6;
  
    // Just add a bit of space
    currentY += 1;
  
    // Add line
    doc.line(margin, currentY, 195, currentY);
    currentY += 10;
  
    // Add notes if provided (ABOVE test results)
    if (addnote && addnote.trim().length > 0) {
      doc.setFontSize(12);
      doc.text("Notes:", margin, currentY);
      currentY += 5;
      
      doc.setFontSize(10);
      // Split long notes into multiple lines
      const splitNotes = doc.splitTextToSize(addnote, 180 - 2 * margin);
      doc.text(splitNotes, margin, currentY);
      currentY += splitNotes.length * 5 + 5; // Adjust Y position based on note length
    }
  
    doc.setFontSize(12);
    doc.text("Test Results:", margin, currentY);
    currentY += 5;
  
    // Create table for results
    const tableData = [];
    if (template && template.parameters) {
      template.parameters.forEach((param) => {
        const value =
          results && results[param.name] ? String(results[param.name]) : "N/A";
        let status = "";
  
        // Simple logic to determine if result is normal or abnormal
        if (param.refRange && param.refRange.includes("-")) {
          const [min, max] = param.refRange
            .split("-")
            .map((v) => parseFloat(v.trim()));
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && (numValue < min || numValue > max)) {
            status = "Abnormal";
          } else {
            status = "Normal";
          }
        }
  
        tableData.push([
          param.name || "",
          value,
          param.unit || "",
          param.refRange || "",
          status,
        ]);
      });
    }
  
    // Add the table and store the returned object with the finalY position
    const tableResult = doc.autoTable({
      startY: currentY,
      head: [["Parameter", "Result", "Unit", "Reference Range", "Status"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 144, 255] },
    });
  
    // Get the final Y position directly from the table result
    currentY = tableResult.finalY + 10;
  
    // Add notes if provided (BELOW test results)
    // Uncomment this block if you want notes below the test results
    /*
    if (addnote && addnote.trim().length > 0) {
      // Check if we need a new page
      const pageHeight = doc.internal.pageSize.height;
      const notesHeight = 20; // Estimate base height needed for notes
      
      // Estimate more accurately based on note content
      const splitNotes = doc.splitTextToSize(addnote, 180 - 2 * margin);
      const estimatedNotesHeight = splitNotes.length * 5 + 10; // 5 points per line + 10 for header
      
      if (currentY + estimatedNotesHeight > pageHeight - 30) {
        doc.addPage();
        currentY = 15; // Reset to top of new page
      }
      
      doc.setFontSize(12);
      doc.text("Notes:", margin, currentY);
      currentY += 5;
      
      doc.setFontSize(10);
      doc.text(splitNotes, margin, currentY);
      currentY += splitNotes.length * 5 + 5; // Adjust Y position based on note length
    }
    */
  
    // Add footer with signature
    const pageHeight = doc.internal.pageSize.height;
    doc.text("Electronically verified report", margin, pageHeight - 20);
    doc.text(
      "This is a computer-generated report and does not require signature",
      margin,
      pageHeight - 15
    );
  
    return doc;
  };
  // Handle test result submission
  const handleTestResultSubmit = async () => {
    try {
      // Get all form values first
      const formValues = testResultForm.getFieldsValue();

      // Check if templateId exists
      if (!formValues.templateId) {
        message.error("Please select a test template");
        return;
      }

      // Check if results exist and are filled
      if (!formValues.results) {
        message.error("Test results are required");
        return;
      }

      // Validate that all required result fields have values
      const missingResults = [];
      selectedTemplate.parameters.forEach((param) => {
        if (
          !formValues.results[param.name] &&
          formValues.results[param.name] !== 0
        ) {
          missingResults.push(param.name);
        }
      });

      if (missingResults.length > 0) {
        message.error(
          `Please fill in the following results: ${missingResults.join(", ")}`
        );
        return;
      }

      // Now that we've manually validated, proceed with form submission
      setUploading(true);

      // Notes are optional, so use empty string if not provided
      const notes = String(formValues.notes || "");

      // Generate PDF
      const pdfDoc = generatePDF(
        selectedLabTest,
        patientInfo,
        selectedTemplate,
        formValues.results,
        notes
      );

      // Save PDF data for preview
      setPdfData({
        dataUrl: pdfDoc.output("dataurlstring"),
        blob: pdfDoc.output("blob"),
        testId: selectedLabTest.id,
      });

      // Show PDF preview modal
      setPdfPreviewVisible(true);
      setUploading(false);
    } catch (error) {
      setUploading(false);
      console.error("Form submission error:", error);
      message.error("An error occurred while processing the form");
    }
  };

  // console.log("selectedLabTest:", selectedLabTest);
  const handleUploadPdf = async () => {
    if (!pdfData || !selectedLabTest) {
      message.error("No PDF data or lab test selected");
      return;
    }

    try {
      setUploading(true);

      // Use the testId field from selectedLabTest
      const response = await UploadTestReport(
        selectedLabTest.id, // Use the document ID for the lab test
        pdfData.blob, // PDF file blob
        selectedLabTest.userId // Patient's ID
      );

      if (response && response.success) {
        message.success(response.message);
        setPdfPreviewVisible(false);
        setTestResultModalVisible(false);
        fetchLabTests(); // Refresh the lab tests list
      } else {
        message.error(response?.message || "Failed to upload report");
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      message.error("Failed to upload PDF");
    } finally {
      setUploading(false);
    }
  };
  // Finally, let's also make sure the initial form setup is correct
  // in the part where you open the test result modal:

  const handleAddTestResult = () => {
    if (!selectedLabTest) {
      message.error("No test selected");
      return;
    }

    // Reset the form with explicit default values
    testResultForm.resetFields();
    testResultForm.setFieldsValue({
      notes: "", // Explicitly set notes to empty string
    });

    // If the test has a predefined template, preselect it
    if (selectedLabTest.testId) {
      const matchingTemplate = templates.find(
        (t) => t.id === selectedLabTest.testId
      );
      if (matchingTemplate) {
        testResultForm.setFieldsValue({ templateId: matchingTemplate.id });
        handleTemplateChange(matchingTemplate.id);
      }
    }

    setTestResultModalVisible(true);
  };
  // Template Management functions
  const handleAddNewTemplate = () => {
    setEditingTemplate(null);
    templateForm.resetFields();
    templateForm.setFieldsValue({
      parameters: [{ name: "", unit: "", refRange: "" }],
    });
    setTemplateModalVisible(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      id: template.id,
      name: template.name,
      description: template.description,
      parameters: template.parameters,
    });
    setTemplateModalVisible(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      dispatch(ShowLoader(true));
      const response = await DeleteTestTemplate(templateId);
      dispatch(ShowLoader(false));

      if (response.success) {
        message.success("Template deleted successfully");
        fetchTemplates();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to delete template");
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const values = await templateForm.validateFields();

      dispatch(ShowLoader(true));

      let response;
      if (editingTemplate) {
        response = await UpdateTestTemplate(editingTemplate.id, values);
      } else {
        response = await AddTestTemplate(values);
      }

      dispatch(ShowLoader(false));

      if (response.success) {
        message.success(
          editingTemplate
            ? "Template updated successfully"
            : "Template added successfully"
        );
        setTemplateModalVisible(false);
        fetchTemplates();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Please check the form for errors");
    }
  };

  // Table columns for lab tests
  const labTestColumns = [
    {
      title: "Booking ID",
      dataIndex: "id",
      key: "id",
      width: 90,
    },
    {
      title: "Patient Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Test",
      dataIndex: "testName",
      key: "testName",
    },
    {
      title: "Appointment",
      key: "appointment",
      render: (_, record) => (
        <span>
          {record.date} {record.timeSlot}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          style={{
            color:
              status === "pending"
                ? "#faad14"
                : status === "completed"
                ? "#52c41a"
                : "#ff4d4f",
            fontWeight: "bold",
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => handleShowPatientInfo(record)}
            type="primary"
            size="small"
          >
            View
          </Button>
          {record.status === "pending" && (
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => {
                setSelectedLabTest(record);
                handleAddTestResult();
              }}
              type="default"
              size="small"
            >
              Add Results
            </Button>
          )}
          {record.status === "completed" && record.reportUrl && (
            <Button
              icon={<FilePdfOutlined />}
              onClick={() => window.open(record.reportUrl, "_blank")}
              type="default"
              size="small"
            >
              View Report
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Table columns for templates
  const templateColumns = [
    {
      title: "Template ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Test Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Parameters Count",
      key: "parametersCount",
      render: (_, record) => record.parameters.length,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
            type="primary"
            size="small"
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTemplate(record.id)}
            danger
            size="small"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Patient Test Management" key="1">
          <Card
            title="Patient Lab Tests"
            extra={
              <Button type="primary" onClick={fetchLabTests}>
                Refresh
              </Button>
            }
          >
            <Table
              dataSource={labTests}
              columns={labTestColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          {/* Patient Info Modal */}
          <Modal
            bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
            title="Patient and Test Information"
            visible={patientInfoVisible}
            onCancel={() => setPatientInfoVisible(false)}
            footer={[
              <Button key="close" onClick={() => setPatientInfoVisible(false)}>
                Close
              </Button>,
              selectedLabTest && selectedLabTest.status === "pending" && (
                <Button
                  key="addResults"
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={handleAddTestResult}
                >
                  Add Test Results
                </Button>
              ),
            ]}
            width={700}
          >
            {patientInfo ? (
              <div style={{overflowX:'hidden'}}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Title level={4}>Patient Information</Title>
                  </Col>
                  <Col span={12}>
                    <Text strong>Name:</Text> {patientInfo.FirstName}{" "}
                    {patientInfo.LastName}
                  </Col>
                  <Col span={12}>
                    <Text strong>Email:</Text> {patientInfo.email}
                  </Col>
                  <Col span={12}>
                    <Text strong>Age:</Text> {calculateAge(patientInfo.DOB)}
                  </Col>
                  <Col span={12}>
                    <Text strong>Gender:</Text>{" "}
                    {patientInfo.gender === 1 ? "Male" : "Female"}
                  </Col>
                  <Col span={12}>
                    <Text strong>Phone:</Text> {patientInfo.phone}
                  </Col>
                  <Col span={24}>
                    <Text strong>Address:</Text> {patientInfo.address}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Title level={4}>Test Information</Title>
                  </Col>
                  <Col span={12}>
                    <Text strong>Test:</Text> {selectedLabTest?.testName}
                  </Col>
                  <Col span={12}>
                    <Text strong>Number of Patients:</Text>{" "}
                    {selectedLabTest?.numPatients}
                  </Col>
                  <Col span={12}>
                    <Text strong>Appointment Date:</Text>{" "}
                    {selectedLabTest?.date}
                  </Col>
                  <Col span={12}>
                    <Text strong>Time Slot:</Text> {selectedLabTest?.timeSlot}
                  </Col>
                  <Col span={12}>
                    <Text strong>Status:</Text>
                    <span
                      style={{
                        color:
                          selectedLabTest?.status === "pending"
                            ? "#faad14"
                            : selectedLabTest?.status === "completed"
                            ? "#52c41a"
                            : "#ff4d4f",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedLabTest?.status?.charAt(0).toUpperCase() +
                        selectedLabTest?.status?.slice(1)}
                    </span>
                  </Col>
                  <Col span={12}>
                    <Text strong>Payment Status:</Text>
                    <span
                      style={{
                        color:
                          selectedLabTest?.paymentStatus === "pending"
                            ? "#faad14"
                            : selectedLabTest?.paymentStatus === "completed"
                            ? "#52c41a"
                            : "#ff4d4f",
                        fontWeight: "bold",
                        marginLeft: "8px",
                      }}
                    >
                      {selectedLabTest?.paymentStatus?.charAt(0).toUpperCase() +
                        selectedLabTest?.paymentStatus?.slice(1)}
                    </span>
                  </Col>
                  <Col span={24}>
                    <Text strong>Notes:</Text>{" "}
                    {selectedLabTest?.notes || "No additional notes"}
                  </Col>
                </Row>

                {selectedLabTest?.status === "completed" &&
                  selectedLabTest?.reportUrl && (
                    <>
                      <Divider />
                      <Row>
                        <Col span={24}>
                          <Title level={4}>
                            <CheckCircleOutlined
                              style={{ color: "#52c41a", marginRight: "8px" }}
                            />
                            Report Available
                          </Title>
                          <Button
                            type="primary"
                            icon={<FilePdfOutlined />}
                            onClick={() =>
                              window.open(selectedLabTest.reportUrl, "_blank")
                            }
                          >
                            View Test Report
                          </Button>
                        </Col>
                      </Row>
                    </>
                  )}
              </div>
            ) : (
              <Spin tip="Loading patient information..." />
            )}
          </Modal>

          {/* Test Results Modal */}
          <Modal
            bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
            title="Add Test Results"
            open={testResultModalVisible}
            onCancel={() => setTestResultModalVisible(false)}
            footer={[
              <Button
                key="back"
                onClick={() => setTestResultModalVisible(false)}
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleTestResultSubmit}
                loading={uploading}
                disabled={!selectedTemplate}
              >
                Generate Report Preview
              </Button>,
            ]}
            width={800}
          >
            <Form
              form={testResultForm}
              layout="vertical"
              initialValues={{ notes: "" }}
            >
              <Form.Item
                name="templateId"
                label="Select Test Template"
                rules={[
                  { required: true, message: "Please select a template" },
                ]}
              >
                <Select
                  placeholder="Select a test template"
                  onChange={handleTemplateChange}
                  style={{ width: "100%" }}
                >
                  {templates.map((template) => (
                    <Option key={template.id} value={template.id}>
                      {template.name} ({template.id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedTemplate && (
                <>
                  <Divider orientation="left">Test Results</Divider>

                  {testParameters.map((param, index) => (
                    <Form.Item
                      key={index}
                      label={`${param.name} (${param.unit}) - Reference: ${param.refRange}`}
                      rules={[
                        {
                          required: true,
                          message: `Please enter ${param.name} result`,
                        },
                      ]}
                    >
                      <Form.Item
                        name={["results", param.name]}
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: `Please enter ${param.name} result`,
                          },
                        ]}
                      >
                        <Input placeholder={`Enter value for ${param.name}`} />
                      </Form.Item>
                    </Form.Item>
                  ))}

                  <Form.Item name="notes" label="Additional Notes (Optional)">
                    <TextArea
                      rows={4}
                      placeholder="Enter any additional notes or observations"
                    />
                  </Form.Item>
                </>
              )}
            </Form>
          </Modal>

          {/* PDF Preview Modal */}
          <Modal
            bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflow: 'auto' }}
            title="Test Report Preview"
            visible={pdfPreviewVisible}
            onCancel={() => setPdfPreviewVisible(false)}
            footer={[
              <Button key="back" onClick={() => setPdfPreviewVisible(false)}>
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleUploadPdf}
                loading={uploading}
              >
                Confirm & Upload Report
              </Button>,
            ]}
            width={800}
          >
            {pdfData && (
              <div style={{ height: "70vh", overflow: "auto" }}>
                <iframe
                  src={pdfData.dataUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="PDF Preview"
                />
              </div>
            )}
          </Modal>
        </TabPane>

        <TabPane tab="Test Templates Management" key="2">
          <Card
            title="Test Templates"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNewTemplate}
              >
                Add New Template
              </Button>
            }
          >
            <Table
              dataSource={templates}
              columns={templateColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>

          <Modal
            bodyStyle={{ maxHeight: 'calc(80vh - 110px)', overflowX: 'hidden' }}
            title={
              editingTemplate ? "Edit Test Template" : "Add New Test Template"
            }
            visible={templateModalVisible}
            onCancel={() => setTemplateModalVisible(false)}
            onOk={handleSaveTemplate}
            width={800}
            destroyOnClose
            footer={[
              <Button
                key="cancel"
                onClick={() => setTemplateModalVisible(false)}
              >
                Cancel
              </Button>,
              <Button
                key="save"
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveTemplate}
              >
                Save
              </Button>,
            ]}
          >
            <Form form={templateForm} layout="vertical">
              <Form.Item
                name="id"
                label="Template ID"
                rules={[
                  { required: true, message: "Please enter a template ID" },
                ]}
              >
                <Input
                  placeholder="e.g., cbc, lft, thyroid"
                  disabled={!!editingTemplate}
                />
              </Form.Item>

              <Form.Item
                name="name"
                label="Test Name"
                rules={[
                  { required: true, message: "Please enter the test name" },
                ]}
              >
                <Input placeholder="e.g., Complete Blood Count (CBC)" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
                rules={[
                  { required: true, message: "Please enter a description" },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder="Brief description of the test"
                />
              </Form.Item>

              {/* With this Ant Design approach */}
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Title level={4} style={{ margin: 0 }}>Test Parameters</Typography.Title>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="dashed"
                      onClick={() => {
                        const parameters =
                          templateForm.getFieldValue("parameters") || [];
                        templateForm.setFieldsValue({
                          parameters: [
                            ...parameters,
                            { name: "", unit: "", refRange: "" },
                          ],
                        });
                      }}
                      icon={<PlusCircleOutlined />}
                    >
                      Add Parameter
                    </Button>
                  </Form.Item>
                </div>
              {/* With this Ant Design approach */}
                <Form.List
                  name="parameters"
                  rules={[
                    {
                      required: true,
                      message: "Please add at least one parameter",
                    },
                  ]}
                >
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Row key={key} gutter={8} style={{ marginBottom: 16 }}>
                          <Col span={10}>
                            <Form.Item
                              {...restField}
                              name={[name, "name"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Parameter name required",
                                },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="Parameter Name (e.g., Hemoglobin)" />
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              {...restField}
                              name={[name, "unit"]}
                              rules={[{ required: true, message: "Unit required" }]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="Unit (e.g., g/dL)" />
                            </Form.Item>
                          </Col>
                          <Col span={7}>
                            <Form.Item
                              {...restField}
                              name={[name, "refRange"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Reference range required",
                                },
                              ]}
                              style={{ marginBottom: 0 }}
                            >
                              <Input placeholder="Reference Range (e.g., 13.5 - 17.5)" />
                            </Form.Item>
                          </Col>
                          <Col span={2} style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              onClick={() => remove(name)}
                              icon={<MinusCircleOutlined />}
                              danger
                            />
                          </Col>
                        </Row>
                      ))}
                    </>
                  )}
                </Form.List>
            </Form>
          </Modal>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminTestManagement;