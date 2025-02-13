import React, { useEffect } from "react";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  DatePicker,
  message,
  Table,
} from "antd";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import dayjs from "dayjs";
import { addMedicine, getMedicineList } from "../../apicalls/medicine";
import moment from "moment";

const { Item } = Form;

function MedicineList() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const [medicine, setMedicine] = React.useState([]);

  const getData = async () => {
    let response;
    response = await getMedicineList();
    if (response.success) {
      setMedicine(response.data);
    } else {
      message.error(response.message);
    }
  };

  const columns = [
    {
      title: "Date of Modification",
      dataIndex: "DOM",
    },
    {
      title: "Date of Expiry",
      dataIndex: "expiryDate",
    },
    {
      title: "Medicine ID",
      dataIndex: "medicineId",
    },
    {
      title: "Medicine Name",
      dataIndex: "medicineName",
    },
    {
      title: "QTY",
      dataIndex: "quantity",
    },
  ];

  const onFinish = async (values) => {
    try {
      dispatch(ShowLoader(true));
      const payload = {
        ...values,
        quantity: Number(values.quantity),
        adminId: user.id,
        expiryDate: values.expiryDate,
        DOM: moment().format("DD-MM-YY"), // Use current date in preferred format
      };

      const response = await addMedicine(payload);
      if (response.success) {
        message.success(response.message);
        form.resetFields(); // Clear the form after submission
        form.setFieldsValue({ DOM: moment().format("DD-MM-YY") }); // Reset DOM to current date
      } else {
        message.error(response.message);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const onClear = () => {
    form.resetFields(); // Clear the form
    form.setFieldsValue({ DOM: dayjs().format("DD-MM-YY") }); // Reset DOM to current date
  };

  useEffect(() => {
    getData();
  }, []);
  return (
    <div style={{ padding: "20px" }}>
      <h2>Medicine Management</h2>
      <h3>Add Medicine</h3>
      <Form
        onFinish={onFinish}
        form={form} // Fixed form reference
        layout="vertical"
        initialValues={{ DOM: dayjs().format("DD-MM-YY") }} // Set default value for DOM
      >
        <Row gutter={[16, 16]} className="my-1">
          <Col span={8}>
            {/* Medicine Name */}
            <Item
              label="Medicine Name"
              name="medicineName"
              rules={[
                { required: true, message: "Please enter the medicine name!" },
              ]}
            >
              <Input placeholder="Enter medicine name" />
            </Item>
          </Col>
          <Col span={8}>
            {/* Medicine ID */}
            <Item
              label="Medicine ID"
              name="medicineId"
              rules={[
                {
                  required: true,
                  message: "Please enter a unique medicine ID!",
                },
              ]}
            >
              <Input placeholder="Enter unique medicine ID" />
            </Item>
          </Col>
          <Col span={8}>
            {/* Expiry Date */}
            <Item
              label="Expiry Date"
              name="expiryDate"
              rules={[
                { required: true, message: "Please select the expiry date!" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Item>
          </Col>
          <Col span={8}>
            {/* Quantity */}
            <Item
              label="Quantity"
              name="quantity"
              rules={[
                { required: true, message: "Please enter the quantity!" },
              ]}
            >
              <InputNumber
                min={1}
                style={{ width: "100%" }}
                placeholder="Enter quantity"
              />
            </Item>
          </Col>
          <Col span={8}>
            {/* Date of Modification (Auto-filled, Read-only) */}
            <Item
              label="Date of Modification"
              name="DOM"
              rules={[
                {
                  required: true,
                  message: "Date of modification is necessary",
                },
              ]}
            >
              <Input value={dayjs().format("DD-MM-YY")} disabled />
            </Item>
          </Col>
        </Row>
        {/* Submit and Clear Buttons */}
        <Row gutter={16}>
          <Col>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Col>
          <Col>
            <Button type="default" onClick={onClear}>
              Clear
            </Button>
          </Col>
        </Row>
      </Form>

      <h3>Current Medicine List</h3>
      <div>
        {/* Placeholder for displaying the current medicine list */}
        <p>Medicine list will be displayed here.</p>
        <div>
          <Table columns={columns} dataSource={medicine} rowKey="id" />
        </div>
      </div>
    </div>
  );
}

export default MedicineList;
