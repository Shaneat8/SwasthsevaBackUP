import React, { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form, Input, InputNumber, Space, message, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, PlusCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../../redux/loaderSlice";
import {
  GetAllTestTemplates,
  AddTestTemplate,
  UpdateTestTemplate,
  DeleteTestTemplate
} from "../../../apicalls/templates";

const { TextArea } = Input;

const AdminTemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
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
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({
      parameters: [{ name: "", unit: "", refRange: "" }]
    });
    setModalVisible(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue({
      id: template.id,
      name: template.name,
      description: template.description,
      parameters: template.parameters
    });
    setModalVisible(true);
  };

  const handleDelete = async (templateId) => {
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

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
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
        setModalVisible(false);
        fetchTemplates();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Please check the form for errors");
    }
  };

  const columns = [
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
            onClick={() => handleEdit(record)}
            type="primary"
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this template?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Test Templates Management" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>Add New Template</Button>}>
      <Table
        dataSource={templates}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingTemplate ? "Edit Test Template" : "Add New Test Template"}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        width={800}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="id"
            label="Template ID"
            rules={[{ required: true, message: "Please enter a template ID" }]}
          >
            <Input placeholder="e.g., cbc, lft, thyroid" disabled={!!editingTemplate} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Test Name"
            rules={[{ required: true, message: "Please enter the test name" }]}
          >
            <Input placeholder="e.g., Complete Blood Count (CBC)" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <TextArea rows={2} placeholder="Brief description of the test" />
          </Form.Item>

          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-lg font-medium">Test Parameters</h3>
            <Form.Item>
              <Button
                type="dashed"
                onClick={() => {
                  const parameters = form.getFieldValue("parameters") || [];
                  form.setFieldsValue({
                    parameters: [...parameters, { name: "", unit: "", refRange: "" }],
                  });
                }}
                icon={<PlusCircleOutlined />}
              >
                Add Parameter
              </Button>
            </Form.Item>
          </div>

          <Form.List name="parameters" rules={[{ required: true, message: "Please add at least one parameter" }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-2 mb-2">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Parameter name required" }]}
                      className="w-2/5"
                    >
                      <Input placeholder="Parameter Name (e.g., Hemoglobin)" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "unit"]}
                      rules={[{ required: true, message: "Unit required" }]}
                      className="w-1/5"
                    >
                      <Input placeholder="Unit (e.g., g/dL)" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "refRange"]}
                      rules={[{ required: true, message: "Reference range required" }]}
                      className="w-1/3"
                    >
                      <Input placeholder="Reference Range (e.g., 13.5 - 17.5)" />
                    </Form.Item>
                    <Button
                      onClick={() => remove(name)}
                      icon={<MinusCircleOutlined />}
                      className="mt-1"
                      danger
                    />
                  </div>
                ))}
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Card>
  );
};

export default AdminTemplateManagement;