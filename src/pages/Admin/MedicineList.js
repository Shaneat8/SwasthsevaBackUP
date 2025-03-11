import React, { useCallback, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Table,
} from "antd";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import dayjs from "dayjs";
import { addMedicine, getMedicineList } from "../../apicalls/medicine";
import moment from "moment";
import styles from './MedicineList.module.css';
import { PlusOutlined, MedicineBoxOutlined, DatabaseOutlined } from '@ant-design/icons';

const { Item } = Form;

function MedicineList() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem("user"));
  const [medicine, setMedicine] = React.useState([]);

  const getData =useCallback( async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await getMedicineList();
      if (response.success) {
        setMedicine(response.data);
      } else {
        message.error(response.message);
      }
      dispatch(ShowLoader(false));
    } catch (error) {
      dispatch(ShowLoader(false));
      message.error("Error fetching medicine list");
    }
  },[dispatch]);

  const columns = [
    {
      title: "Date of Modification",
      dataIndex: "DOM",
      sorter: (a, b) => moment(a.DOM, "DD-MM-YY").unix() - moment(b.DOM, "DD-MM-YY").unix(),
    },
    {
      title: "Date of Expiry",
      dataIndex: "expiryDate",
      sorter: (a, b) => moment(a.expiryDate).unix() - moment(b.expiryDate).unix(),
    },
    {
      title: "Medicine ID",
      dataIndex: "medicineId",
      sorter: (a, b) => a.medicineId.localeCompare(b.medicineId),
    },
    {
      title: "Medicine Name",
      dataIndex: "medicineName",
      sorter: (a, b) => a.medicineName.localeCompare(b.medicineName),
    },
    {
      title: "QTY",
      dataIndex: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
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
        DOM: moment().format("DD-MM-YY"),
      };

      const response = await addMedicine(payload);
      if (response.success) {
        message.success(response.message);
        form.resetFields();
        form.setFieldsValue({ DOM: moment().format("DD-MM-YY") });
        getData(); // Refresh the medicine list after adding
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
    form.resetFields();
    form.setFieldsValue({ DOM: dayjs().format("DD-MM-YY") });
  };

  useEffect(() => {
    getData();
  }, [getData]);

  return (
    <div className={styles.container}>
      <h2 className={styles.pageTitle}>
        <MedicineBoxOutlined style={{ marginRight: '8px' }} />
        Medicine Management
      </h2>
      
      <h3 className={styles.sectionTitle}>
        <PlusOutlined style={{ marginRight: '8px' }} />
        Add Medicine
      </h3>
      
      <div className={styles.card}>
        <div className={styles.formContainer}>
          <Form
            onFinish={onFinish}
            form={form}
            layout="vertical"
            initialValues={{ DOM: dayjs().format("DD-MM-YY") }}
          >
            <div className={styles.formRow}>
              <div className={styles.formCol}>
                <Item
                  label="Medicine Name"
                  name="medicineName"
                  rules={[
                    { required: true, message: "Please enter the medicine name!" },
                  ]}
                >
                  <Input placeholder="Enter medicine name" className={styles.formInput} />
                </Item>
              </div>
              
              <div className={styles.formCol}>
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
                  <Input placeholder="Enter unique medicine ID" className={styles.formInput} />
                </Item>
              </div>
              
              <div className={styles.formCol}>
                <Item
                  label="Expiry Date"
                  name="expiryDate"
                  rules={[
                    { required: true, message: "Please select the expiry date!" },
                  ]}
                >
                  <DatePicker className={styles.formInput} format="DD-MM-YY" />
                </Item>
              </div>
              
              <div className={styles.formCol}>
                <Item
                  label="Quantity"
                  name="quantity"
                  rules={[
                    { required: true, message: "Please enter the quantity!" },
                  ]}
                >
                  <InputNumber
                    min={1}
                    className={styles.formInput}
                    placeholder="Enter quantity"
                  />
                </Item>
              </div>
              
              <div className={styles.formCol}>
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
                  <Input value={dayjs().format("DD-MM-YY")} disabled className={styles.formInput} />
                </Item>
              </div>
            </div>
            
            <div className={styles.buttonGroup}>
              <Button 
                type="primary" 
                htmlType="submit" 
                className={styles.primaryButton}
                icon={<PlusOutlined />}
              >
                Add Medicine
              </Button>
              <Button 
                type="default" 
                onClick={onClear} 
                className={styles.defaultButton}
              >
                Clear Form
              </Button>
            </div>
          </Form>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>
        <DatabaseOutlined style={{ marginRight: '8px' }} />
        Current Medicine List
      </h3>
      
      <div className={styles.tableContainer}>
        {medicine.length === 0 ? (
          <p className={styles.tablePlaceholder}>No medicines in the inventory yet. Add your first medicine above.</p>
        ) : (
          <Table 
            columns={columns} 
            dataSource={medicine} 
            rowKey="id" 
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`
            }}
          />
        )}
      </div>
    </div>
  );
}

export default MedicineList;