import React, { useState, useEffect } from "react";
import { Modal, Tabs, Form, Input, Button, Select, message, Descriptions, Spin } from "antd";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../../redux/loaderSlice";
import { UpdateTestStatus } from "../../../apicalls/booktest";
import TestReport from "./TestReport";
import { GetTestTemplateById } from "../../../apicalls/templates"; // You'll need to create this API call

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const TestResultModal = ({ visible, test, onClose }) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [testResults, setTestResults] = useState({});
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [labId, setLabId] = useState(`LAB${Math.floor(10000 + Math.random() * 90000)}`);
  const dispatch = useDispatch();

  useEffect(() => {
    if (test) {
      // Reset form with test data
      form.setFieldsValue({
        status: test.status,
        remarks: test.remarks || "",
      });
      
      // If test already has results, load them
      if (test.results) {
        setTestResults(test.results);
      }
      
      // Fetch the template for this test type
      fetchTemplate(test.testId);
    }
  }, [test, form]);

  const fetchTemplate = async (testId) => {
    try {
      setLoading(true);
      dispatch(ShowLoader(true));
      
      // Replace with your actual API call to get the test template
      const response = await GetTestTemplateById(testId);
      
      dispatch(ShowLoader(false));
      setLoading(false);
      
      if (response.success) {
        setTemplate(response.data);
      } else {
        message.error("Failed to load test template");
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      setLoading(false);
      message.error("Error loading test template");
    }
  };

  const handleStatusChange = (value) => {
    form.setFieldsValue({ status: value });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      dispatch(ShowLoader(true));
      
      // Combine form values with test results data
      const updatedData = {
        ...values,
        results: testResults,
        labId: labId
      };
      
      const response = await UpdateTestStatus(
        test.id, 
        values.status, 
        values.remarks, 
        testResults,
        labId
      );
      
      dispatch(ShowLoader(false));
      
      if (response.success) {
        message.success("Test results saved successfully");
        onClose(true); // Close modal and refresh data
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Failed to update test results");
    }
  };

  const handleResultsChange = (results) => {
    setTestResults(results);
  };

  return (
    <Modal
      title={`${test?.status === "completed" ? "View" : "Enter"} Test Results`}
      visible={visible}
      onCancel={() => onClose()}
      width={1000}
      footer={[
        <Button key="back" onClick={() => onClose()}>
          Cancel
        </Button>,
        test?.status !== "completed" && (
          <Button key="submit" type="primary" onClick={handleSubmit}>
            Save Results
          </Button>
        ),
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Patient Information" key="1">
          <Descriptions bordered column={2} className="mb-4">
            <Descriptions.Item label="Patient Name">{test?.userName}</Descriptions.Item>
            <Descriptions.Item label="Email">{test?.userEmail}</Descriptions.Item>
            <Descriptions.Item label="Test">{test?.testName}</Descriptions.Item>
            <Descriptions.Item label="Date">{test?.date}</Descriptions.Item>
            <Descriptions.Item label="Time Slot">{test?.timeSlot}</Descriptions.Item>
            <Descriptions.Item label="Number of Patients">{test?.numPatients}</Descriptions.Item>
            <Descriptions.Item label="Payment Status">{test?.paymentStatus?.toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="Booked On">{test?.bookedOn}</Descriptions.Item>
            {test?.notes && <Descriptions.Item label="Notes" span={2}>{test?.notes}</Descriptions.Item>}
          </Descriptions>

          <Form form={form} layout="vertical">
            <Form.Item
              name="status"
              label="Test Status"
              rules={[{ required: true, message: "Please select a status" }]}
              initialValue={test?.status || "pending"}
            >
              <Select onChange={handleStatusChange} disabled={test?.status === "completed"}>
                <Option value="pending">Pending</Option>
                <Option value="processing">Processing</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="remarks"
              label="Remarks"
              initialValue={test?.remarks || ""}
            >
              <TextArea 
                rows={4} 
                placeholder="Add any additional remarks or notes"
                disabled={test?.status === "completed"}
              />
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Test Report" key="2">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Spin tip="Loading template..." />
            </div>
          ) : template ? (
            <TestReport 
              testType={test?.testId}
              existingResults={test?.results}
              onChange={handleResultsChange}
              readOnly={test?.status === "completed"}
              patientData={test}
              templateData={template}
              labId={labId}
            />
          ) : (
            <div className="p-4 text-center">
              No template found for this test. Please create a template first.
            </div>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default TestResultModal;