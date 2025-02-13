// Prescription.js
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Col, Form, Input, message, Row, Select, Space } from "antd";
import moment from "moment";
import { ShowLoader } from "../../redux/loaderSlice";
import { AddMedicineDiagnosis, getMedicineList } from "../../apicalls/medicine";
import "./Prescription.css";
import { GetPatientDetails } from "../../apicalls/users";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { GetUserAppointments } from "../../apicalls/appointment";
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { addUserRecord } from "../../apicalls/recordpdf";

const { Option } = Select;

function Prescription() {
  const [patientData, setPatientData] = useState();
  const [appointmentData, setAppointmentData] = useState([]);
  const [loading] = useState(false);
  const [medicineList, setMedicineList] = useState([]);
  const [medicineForm] = Form.useForm();
  const dispatch = useDispatch();
  const { patientId } = useParams();
  const componentRef = useRef();

  // Fetch patient data
  const fetchPatientData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await GetPatientDetails(patientId);
      if (response.success) {
        setPatientData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch, patientId]);

  // Fetch medicine list
  const fetchMedicineList = useCallback(async () => {
    try {
      const response = await getMedicineList();
      if (response.success) {
        setMedicineList(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  }, []);

  // Fetch user appointments
  const fetchUserAppointments = useCallback(async () => {
    try {
      const response = await GetUserAppointments(patientId);
      if (response.success) {
        setAppointmentData(response.data);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    }
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
    fetchMedicineList();
    fetchUserAppointments();
  }, [fetchPatientData, fetchMedicineList, fetchUserAppointments]);

     // Add print handler
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Prescription_${patientData?.FirstName || 'Patient'}_${moment().format('DDMMYYYY')}`,
    removeAfterPrint: true,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
    `,
  });

  // Function to convert HTML to PDF and get the file
  const generatePDF = async () => {
    const content = componentRef.current;
    const canvas = await html2canvas(content);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    return pdf.output('blob');
  };

  // Function to upload to Cloudinary
  const uploadToCloudinary = async (pdfBlob) => {
    const formData = new FormData();
    const fileName = `prescription_${patientData?.FirstName || 'Patient'}_${moment().format('DDMMYYYY')}.pdf`;
    
    formData.append("file", pdfBlob, fileName);
    formData.append("upload_preset", "Records");
    formData.append("folder", `patient-records/${patientId}/prescriptions`);

    const uploadResponse = await fetch(
      "https://api.cloudinary.com/v1_1/dagludyhc/raw/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    return await uploadResponse.json();
  };

  // Handle adding diagnosis and medicine
  const onFinish = async (values) => {
    try {
      dispatch(ShowLoader(true));
      const medicines = values.medicines || [];
      let canSubmit = true;
  
      medicines.forEach((medicine) => {
        const selectedMedicine = medicineList.find(
          (m) => m.id === medicine.medicineId
        );
        if (selectedMedicine) {
          const dosage = Number(medicine.dosage || 0);
          const days = Number(medicine.days || 0);
          const instruction = medicine.instruction || "OD";
  
          // Convert instruction to a numeric value
          const instructionsPerDay = {
            OD: 1,
            BD: 2,
            TDS: 3,
            QID: 4,
          }[instruction] || 1; // Default to 1 if instruction is invalid
  
          const totalRequired = dosage * instructionsPerDay * days;
  
          if (totalRequired > selectedMedicine.quantity) {
            message.warning(
              `Warning: The total required quantity (${totalRequired}) exceeds the available stock (${selectedMedicine.quantity}) for medicine: ${selectedMedicine.medicineName}.`
            );
            canSubmit = false;
          }
        }
      });
  
      if (!canSubmit) {
        return; // Prevent form submission
      }
  
      const payload = {
        ...values,
        patientId,
        timestamp: new Date().toISOString(),
      };
      const response = await AddMedicineDiagnosis(payload);
      if (response.success) {

          handlePrint(); // Print after successful submission
         // 2. Generate PDF
         const pdfBlob = await generatePDF();

         // 3. Upload to Cloudinary
         const cloudinaryResponse = await uploadToCloudinary(pdfBlob);
 
         // 4. Save to Firebase
         const recordData = {
           name: `Prescription_${moment().format('DDMMYYYY')}`,
           url: cloudinaryResponse.secure_url,
           public_id: cloudinaryResponse.public_id,
           userId: patientId,
           type: 'prescription',
           diagnosis: values.diagnosis,
           medicines: values.medicines,
           timestamp: new Date().toISOString()
         };
 
         await addUserRecord(patientId, recordData);
 
         // 5. Trigger download
         const downloadUrl = URL.createObjectURL(pdfBlob);
         const link = document.createElement('a');
         link.href = downloadUrl;
         link.download = `Prescription_${patientData?.FirstName || 'Patient'}_${moment().format('DDMMYYYY')}.pdf`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(downloadUrl);

        message.success("Diagnosis and medicine added successfully!");
        medicineForm.resetFields();
        fetchPatientData(); // Refetch patient data to reflect changes
      } else {
        message.error(response.message);
        
      }
    } catch (error) {
      message.error(error.message);
      console.error("Error in prescription submission:", error);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    return moment().diff(moment(dob, "YYYY-MM-DD"), "years");
  };

  const handleMedicineChange = (value, index) => {
    const selectedMedicine = medicineList.find(
      (medicine) => medicine.id === value
    );
    if (selectedMedicine) {
      const currentMedicines = medicineForm.getFieldValue("medicines") || [];
      const dosage = Number(currentMedicines[index]?.dosage || 0);
      const days = Number(currentMedicines[index]?.days || 0);
      const instruction = currentMedicines[index]?.instruction || "OD";
  
      // Convert instruction to a numeric value
      const instructionsPerDay = {
        OD: 1,
        BD: 2,
        TDS: 3,
        QID: 4,
      }[instruction] || 1; // Default to 1 if instruction is invalid
  
      const totalRequired = dosage * instructionsPerDay * days;
  
      if (totalRequired > selectedMedicine.quantity) {
        message.warning(
          `Warning: The total required quantity (${totalRequired}) exceeds the available stock (${selectedMedicine.quantity}) for medicine: ${selectedMedicine.medicineName}.`
        );
      }
  
      currentMedicines[index] = {
        ...currentMedicines[index],
        medicineName: selectedMedicine.medicineName,
        balance: selectedMedicine.quantity,
        medicineId: selectedMedicine.id,
      };
      medicineForm.setFieldsValue({ medicines: currentMedicines });
    }
  };


  return (
    <div className="prescription-container" ref={componentRef}>
      {/* Display Patient Information */}
      <div className="header">
        <h1>Patient Details</h1>
        <h2>OPD Receipt - Polyclinic (City Name)</h2>
      </div>

      <div className="patient-info">
        <h3>PATIENT INFORMATION</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>First Name:</label>
            <span>{patientData?.FirstName || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>Last Name:</label>
            <span>{patientData?.LastName || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>DOB:</label>
            <span>
              {moment(patientData?.DOB).format("DD-MM-YYYY") || "N/A"}
            </span>
          </div>
          <div className="info-item">
            <label>Gender:</label>
            <span>{patientData?.gender === 1 ? "Male" : "Female"}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{patientData?.phone || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{patientData?.email || "N/A"}</span>
          </div>
          <div className="info-item">
            <label>Age:</label>
            <span>{calculateAge(patientData?.DOB) || "N/A"}</span>
          </div>
          <div className="info-item address">
            <label>Address:</label>
            <span>{patientData?.address || "N/A"}</span>
          </div>
          {appointmentData.length > 0 && (
            <div className="info-item" style={{ width: "310%" }}>
              <label>Problem:</label>&nbsp;
              <span>{appointmentData[0].problem || "No problem specified"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Diagnosis and Medicine Form */}
      <div className="prescribed-medicine">
        <h3>Add Diagnosis and Prescribe Medicine</h3>
        <Form onFinish={onFinish} form={medicineForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Form.Item
                label="Diagnosis"
                name="diagnosis"
                rules={[{ required: true, message: "Please enter diagnosis!" }]}
              >
                <Input.TextArea rows={4} placeholder="Enter diagnosis" />
              </Form.Item>
            </Col>
            <Form.List name="medicines">
              {(fields, { add, remove }) => (
                <React.Fragment>
                  {fields.map(({ key, name, fieldKey, ...restField }, index) => (
                    <Space
                      key={fieldKey}
                      style={{ display: "flex", marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[name, "medicineId"]}
                        label="Nomenclature"
                        rules={[{ required: true, message: "Select medicine" }]}
                      >
                        <Select
                          showSearch
                          style={{ width: 200, height: 40 }}
                          placeholder="Select medicine"
                          onChange={(value) => handleMedicineChange(value, index)}
                          filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                        >
                          {medicineList.map((medicine) => (
                            <Option key={medicine.id} value={medicine.id}>
                              {medicine.medicineName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "dosage"]}
                        label="Dosage"
                        rules={[{ required: true, message: "Enter dosage" }]}
                      >
                        <Input type="number" style={{ width: 100, height: 40 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "instruction"]}
                        label="Instruction"
                        rules={[{ required: true, message: "Enter instruction" }]}
                      >
                        <Select style={{ width: 150, height: 40 }}>
                          <Option value="OD">1 time (OD)</Option>
                          <Option value="BD">2 times (BD)</Option>
                          <Option value="TDS">3 times (TDS)</Option>
                          <Option value="QID">4 times (QID)</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "days"]}
                        label="Days"
                        rules={[{ required: true, message: "Enter days" }]}
                      >
                        <Input type="number" style={{ width: 100, height: 40 }} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, "balance"]}
                        label="Balance"
                      >
                        <Input disabled style={{ width: 100, height: 40 }} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ marginLeft: 8, color: "#ff4d4f" }}
                        />
                      )}
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Medicine
                    </Button>
                  </Form.Item>
                </React.Fragment>
              )}
            </Form.List>
            <Col span={24}>
              <Button type="primary" htmlType="submit" loading={loading} onClick={handlePrint}>
                Add Diagnosis & Medicine
              </Button>
            </Col>
            <Col span={24}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
              >
                Save Prescription & Generate PDF
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      {/* Display Previous Prescriptions (if any) */}
      {patientData?.prescriptions?.length > 0 && (
        <div className="prescribed-medicine">
          <h3>Previous Prescriptions</h3>
          <hr />
          {patientData.prescriptions.map((prescription, index) => (
            <div key={index} className="my-1">
              <p>
                <b>Diagnosis:</b> {prescription.diagnosis}
              </p>
              <p>
                <b>Medicine:</b> {prescription.medicine}
              </p>
              <p>
                <b>Date:</b>{" "}
                {moment(prescription.timestamp).format("DD-MM-YYYY hh:mm A")}
              </p>
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Prescription;