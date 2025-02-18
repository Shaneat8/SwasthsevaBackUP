import { Button, Col, Form, Input, message, Row, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import { Option } from "antd/es/mentions";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { AddDoctor, CheckIfDoctorApplied, UpdateDoctor } from "../../apicalls/doctors";
import { useNavigate } from "react-router-dom";

function Doctor() {
  const [form]=Form.useForm();
  const [alreadyApproved,setAlreadyApproved]=React.useState(false);
  const [days, setDays] = React.useState([]);
  const [alreadyApplied,setAlreadyApplied]=React.useState(false);
  const dispatch=useDispatch();
  const nav=useNavigate();
  const [error, setError] = useState('');

  const onFinish = async(values) => {
    if (days.length === 0) {
      setError('At least one day must be selected.');
      return; // Prevent form submission
    }
    setError(''); // Clear error if validation passes  
    try {
      dispatch(ShowLoader(true));
      const payload={
        ...values,
        days,
        userId: JSON.parse(localStorage.getItem("user")).id,
        status:"pending",
        role:"doctor",
      }
      let response=null;
      if(alreadyApproved){
        payload.id=JSON.parse(localStorage.getItem("user")).id;
        payload.status="approved";
        response=await UpdateDoctor(payload);
      }
      else{
        response=await AddDoctor(payload);
      }
      dispatch(ShowLoader(false));
      if(response.success)
      {
          message.success(response.message);
          nav("/profile");
      }
      else{
        message.error(response.message);
      }

    } 
    catch (error) {
      dispatch(ShowLoader(false));
      message.error(error.message);
    }
  };

  const CheckAlreadyApplied=async()=>
  {
      try {
        dispatch(ShowLoader(true));
        const response=await CheckIfDoctorApplied(JSON.parse(localStorage.getItem("user")).id);
        if(response.success)
        {
          setAlreadyApplied(true);
          if(response.data.status === "approved")
          {
            setAlreadyApproved(true);
            form.setFieldsValue(response.data);
            setDays(response.data.days);
          }
        }
        dispatch(ShowLoader(false));
      } catch (error) {
        dispatch(ShowLoader(false));
        message.error(error.message);
      }
  }

  useState(()=>{
    CheckAlreadyApplied();
  },[]);
  return (
    <div className="bg-white p-2">
      {(!alreadyApplied || alreadyApproved) && (<>
        <h3 className="uppercase my-1">
          {alreadyApproved? "Update your Information":"Apply for a Doctor Account"}
        </h3>
      <hr />

      <Form layout="vertical" className="my-1" onFinish={onFinish}
        form={form}
      >
        <Row gutter={[16, 16]}>
          {/* Personal Information */}
          <Col span={24}>
            <h4 className="uppercase">
              <b>Personal Information</b>
            </h4>
          </Col>
          <Col span={8}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="text" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="text" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="email" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Required"},
                { pattern: /^[0-9]{10}$/,message: "Enter a valid 10-digit phone number"},
              ]}
            >
              <Input type="text" maxLength={10}/>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Registration Id"
              name="reg_id"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
                { pattern: /^[0-9]{10}$/,message: "Enter a valid 10-digit phone number"},
              ]}
            >
              <Input type="text" maxLength={5}/>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Address"
              name="address"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <TextArea
                type="number"
                style={{ height: "100px", paddingTop: "10px" }}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <hr />
          </Col>
          {/* Professional Information */}
          <Col span={24}>
            <h4 className="uppercase">
              <b>Professional Information</b>
            </h4>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Specialist"
              name="Specialist"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Select style={{ height: "45px" }}>
                <Option value="Dermatologist">Dermatologist</Option>
                <Option value="Cardiologist">Cardiologist</Option>
                <Option value="Surgeon">Surgeon</Option>
                <Option value="Radiologist">Radiologist</Option>
                <Option value="Orthopedics">Orthopedics</Option>
                <Option value="Neurologist">Neurologist</Option>
                <Option value="Urologist">Urologist</Option>
                <Option value="Gynecologist">Gynecologist</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Experience"
              name="experience"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Qualification"
              name="Qualification"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Select style={{ height: "45px" }}>
                <Option value="MBBS">MBBS</Option>
                <Option value="BAMS">BAMS</Option>
                <Option value="BHMS">BHMS</Option>
                <Option value="BDS">BDS</Option>
                <Option value="MD">MD</Option>
                <Option value="MS">MS</Option>
                <Option value="DM">DM</Option>
                <Option value="MCh">MCh</Option>
                <Option value="DGO">DGO</Option>
                <Option value="DNB">DNB</Option>
              </Select>
            </Form.Item>
          </Col>

          <hr />

          <Col span={24}>
            <hr />
            <h4 className="uppercase my-1_5">
              <b>Work Hours</b>
            </h4>
          </Col>
          {/* Work hours */}
          <Col span={8}>
            <Form.Item
              label="Start Time"
              name="startTime"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="End Time"
              name="endTime"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="time" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="Fee"
              name="Fee"
              rules={[
                {
                  required: true,
                  message: "Required",
                },
              ]}
            >
              <Input type="number" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <div className="flex gap-2">
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, index) => (
                <div className="flex gap-0_5 items-center">
                  <input
                    type="checkbox"
                    key={index}
                    checked={days.includes(day)}
                    value={day}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDays([...days, e.target.value]);
                      } else {
                        setDays(days.filter((item) => item !== e.target.value));
                      }
                    }}
                  />
                  <label>{day}</label>
                </div>
              ))}
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
          </Col>
        </Row>

        <div className="flex justify-end gap-2">
          <Button htmlType="button" color="default" variant="outlined" style={{borderRadius:'0', fontSize:'15px'}}>CANCEL</Button>
          <Button htmlType="submit" color="default" variant="solid" style={{borderRadius:'0', fontSize:'15px'}}>SUBMIT</Button>
        </div>
      </Form>
      </>)}


      {alreadyApplied && !alreadyApproved &&
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-secondary">
            <span style={{color:'red'}}>You have already applied for this doctor account, 
            Please wait for Admin to approve your request
            </span>
          </h3>
        </div>

      }
    </div>
  );
}

export default Doctor;
