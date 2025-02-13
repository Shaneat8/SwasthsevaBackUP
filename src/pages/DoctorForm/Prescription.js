// Prescription.js
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, Col, Form, Input, message, Row, Select } from "antd";
import moment from "moment";
import { ShowLoader } from "../../redux/loaderSlice";
import { AddMedicineDiagnosis, getMedicineList } from "../../apicalls/medicine";
import "./Prescription.css";
import { GetPatientDetails } from "../../apicalls/users";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import {
  GetAppointmentById,
  UpdateAppointmentStatus,
} from "../../apicalls/appointment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { addUserRecord } from "../../apicalls/recordpdf";
import { doc, getDoc, setDoc } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";

const { Option } = Select;

function Prescription() {
  const [patientData, setPatientData] = useState();
  const [appointmentData, setAppointmentData] = useState(null);
  const [loading] = useState(false);
  const [medicineList, setMedicineList] = useState([]);
  const [medicineForm] = Form.useForm();
  const dispatch = useDispatch();
  const { appointmentId } = useParams();

  const componentRef = useRef();
  const [existingPrescription, setExistingPrescription] = useState(null);

  const fetchExistingPrescription = async () => {
    try {
      const prescriptionRef = doc(firestoredb, "prescriptions", appointmentId);
      const prescriptionSnap = await getDoc(prescriptionRef);

      if (prescriptionSnap.exists()) {
        const data = prescriptionSnap.data();
        setExistingPrescription(data);
        // Pre-fill the form with existing data
        medicineForm.setFieldsValue({
          diagnosis: data.diagnosis,
          medicines: data.medicines,
        });
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
    }
  };

  // Function to fetch appointment and patient data
  const fetchAppointmentData = useCallback(async () => {
    console.log("appt id :", appointmentId);
    try {
      dispatch(ShowLoader(true));
      const response = await GetAppointmentById(appointmentId);
      if (response.success) {
        setAppointmentData(response.data);
        // Fetch patient details using the userId from appointment
        console.log("patient id ", response.data.userId);
        const patientResponse = await GetPatientDetails(response.data.userId);
        if (patientResponse.success) {
          setPatientData(patientResponse.data);
        } else {
          message.error("Failed to fetch patient details");
        }
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch, appointmentId]);

  // Function to fetch medicine list
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

  useEffect(() => {
    fetchAppointmentData();
    fetchMedicineList();
    fetchExistingPrescription();
  }, [fetchAppointmentData, fetchMedicineList]);

  const storePrescriptionData = async (prescriptionData) => {
    try {
      const prescriptionRef = doc(firestoredb, "prescriptions", appointmentId);
      await setDoc(
        prescriptionRef,
        {
          ...prescriptionData,
          updatedAt: new Date().toISOString(),
          createdAt:
            existingPrescription?.createdAt || new Date().toISOString(),
          doctorId: appointmentData.doctorId,
          patientId: appointmentData.userId,
          appointmentId: appointmentId,
        },
        { merge: true }
      );
    } catch (error) {
      throw new Error("Failed to store prescription data: " + error.message);
    }
  };

  // Function to generate PDF
  const generatePDF = async () => {
    const content = componentRef.current;

    const canvas = await html2canvas(content, {
      scale: 3,
      useCORS: true,
      logging: false,
      letterRendering: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: content.offsetWidth,
      height: content.offsetHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const containerWidth = content.offsetWidth;
    const containerHeight = content.offsetHeight;

    const mmWidth = (containerWidth * 25.4) / 96;
    const mmHeight = (containerHeight * 25.4) / 96;

    const pdf = new jsPDF({
      orientation: mmWidth > mmHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [mmWidth + 10, mmHeight + 10],
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 5;
    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      margin,
      pdfWidth - margin * 2,
      pdfHeight - margin * 2
    );

    return pdf.output("blob");
  };

  // Function to upload to Cloudinary
  const uploadToCloudinary = async (pdfBlob) => {
    const formData = new FormData();
    const fileName = `prescription_${
      patientData?.FirstName || "Patient"
    }_${moment().format("DDMMYYYY")}.pdf`;

    formData.append("file", pdfBlob, fileName);
    formData.append("upload_preset", "Records");
    formData.append(
      "folder",
      `patient-records/${appointmentData.userId}/prescriptions`
    );

    const uploadResponse = await fetch(
      "https://api.cloudinary.com/v1_1/dagludyhc/raw/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    return await uploadResponse.json();
  };

  // Calculate age function
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    return moment().diff(moment(dob, "YYYY-MM-DD"), "years");
  };

  // Handle medicine change
  const handleMedicineChange = (value, index) => {
    const selectedMedicine = medicineList.find(
      (medicine) => medicine.id === value
    );
    if (selectedMedicine) {
      const currentMedicines = medicineForm.getFieldValue("medicines") || [];
      const morning = Number(currentMedicines[index]?.morning || 0);
      const afternoon = Number(currentMedicines[index]?.afternoon || 0);
      const night = Number(currentMedicines[index]?.night || 0);
      const days = Number(currentMedicines[index]?.days || 0);

      const totalRequired = (morning + afternoon + night) * days;

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

  // Handle form submission
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
          const morning = Number(medicine.morning || 0);
          const afternoon = Number(medicine.afternoon || 0);
          const night = Number(medicine.night || 0);
          const days = Number(medicine.days || 0);

          const totalRequired = (morning + afternoon + night) * days;

          if (totalRequired > selectedMedicine.quantity) {
            message.warning(
              `Warning: The total required quantity (${totalRequired}) exceeds the available stock (${selectedMedicine.quantity}) for medicine: ${selectedMedicine.medicineName}.`
            );
            canSubmit = false;
          }
        }
      });

      if (!canSubmit) return;

      const prescriptionData = {
        ...values,
        patientId: appointmentData.userId,
        appointmentId: appointmentId,
        timestamp: new Date().toISOString(),
      };

      const payload = {
        ...values,
        patientId: appointmentData.userId,
        appointmentId: appointmentId,
        timestamp: new Date().toISOString(),
      };

      // Store prescription data in Firebase
      await storePrescriptionData(prescriptionData);

      // Update appointment status to seen
      await UpdateAppointmentStatus(appointmentId, "seen");

      const response = await AddMedicineDiagnosis(payload);
      if (response.success) {
        // Generate and upload PDF
        const pdfBlob = await generatePDF();
        console.log("PDF generated:", pdfBlob);
        const cloudinaryResponse = await uploadToCloudinary(pdfBlob);
        console.log("Cloudinary response:", cloudinaryResponse);
        // Save record to Firebase
        const recordData = {
          name: `Prescription_${moment().format("DDMMYYYY")}`,
          url: cloudinaryResponse.secure_url,
          public_id: cloudinaryResponse.public_id,
          userId: appointmentData.userId,
          type: "prescription",
          diagnosis: values.diagnosis,
          medicines: values.medicines,
          timestamp: new Date().toISOString(),
        };

        await addUserRecord(appointmentData.userId, recordData);

        // Download PDF
        const downloadUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `Prescription_${
          patientData?.FirstName || "Patient"
        }_${moment().format("DDMMYYYY")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);

        message.success("Prescription saved successfully!");
        medicineForm.resetFields();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      dispatch(ShowLoader(false));
    }
  };

  return (
    <div className="prescription-container" ref={componentRef}>
      {/* Header */}
      <div className="header">
        <h1>Patient Details</h1>
        <h2>OPD Receipt - Polyclinic</h2>
      </div>

      {/* Patient Information */}
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
              {patientData?.DOB
                ? moment(patientData.DOB).format("DD-MM-YYYY")
                : "N/A"}
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
            <span>{calculateAge(patientData?.DOB)}</span>
          </div>
          <div className="info-item address">
            <label>Address:</label>
            <span>{patientData?.address || "N/A"}</span>
          </div>
          {appointmentData && (
            <div className="info-item" style={{ width: "310%" }}>
              <label>Problem:</label>&nbsp;
              <span>{appointmentData.problem || "No problem specified"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Form */}
      <div className="prescribed-medicine">
        <h3>
          {existingPrescription
            ? "Update Diagnosis and Prescribed Medicine"
            : "Add Diagnosis and Prescribe Medicine"}
        </h3>
        {existingPrescription && (
          <div className="update-notice">
            <p>
              You are updating an existing prescription created on{" "}
              {moment(existingPrescription.createdAt).format(
                "DD-MM-YYYY HH:mm"
              )}
            </p>
          </div>
        )}
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
                  <div className="medicine-table">
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th>Medication Name</th>
                          <th>Morning</th>
                          <th>Afternoon</th>
                          <th>Night</th>
                          <th>Duration</th>
                          <th>Balance</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map(
                          ({ key, name, fieldKey, ...restField }, index) => (
                            <tr key={key}>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "medicineId"]}
                                  rules={[
                                    {
                                      required: true,
                                      message: "Select medicine",
                                    },
                                  ]}
                                >
                                  <Select
                                    showSearch
                                    style={{ width: "100%" }}
                                    placeholder="Select medicine"
                                    onChange={(value) =>
                                      handleMedicineChange(value, index)
                                    }
                                    filterOption={(input, option) =>
                                      option.children
                                        .toLowerCase()
                                        .indexOf(input.toLowerCase()) >= 0
                                    }
                                  >
                                    {medicineList.map((medicine) => (
                                      <Option
                                        key={medicine.id}
                                        value={medicine.id}
                                      >
                                        {medicine.medicineName}
                                      </Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "morning"]}
                                >
                                  <Input type="number" min={0} max={1} />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "afternoon"]}
                                >
                                  <Input type="number" min={0} max={1} />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "night"]}
                                >
                                  <Input type="number" min={0} max={1} />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "days"]}
                                  rules={[
                                    { required: true, message: "Enter days" },
                                  ]}
                                >
                                  <Input type="number" />
                                </Form.Item>
                              </td>
                              <td>
                                <Form.Item
                                  {...restField}
                                  name={[name, "balance"]}
                                >
                                  <Input disabled />
                                </Form.Item>
                              </td>
                              <td>
                                {fields.length > 1 && (
                                  <MinusCircleOutlined
                                    onClick={() => remove(name)}
                                    style={{ color: "#ff4d4f" }}
                                  />
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
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
              <Button type="primary" htmlType="submit" loading={loading}>
                {existingPrescription
                  ? "Update Prescription"
                  : "Save Prescription & Generate PDF"}
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
