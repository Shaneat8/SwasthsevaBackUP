import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Select } from 'antd';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import firestoredb from '../../firebaseConfig';

const TicketForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const queryTypes = [
    { value: 'appointment', label: 'Appointment' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'medication', label: 'Medication' },
    { value: 'billing', label: 'Billing' },
    { value: 'reports', label: 'Reports' },
    { value: 'followup', label: 'Follow-up' },
    { value: 'technical', label: 'Technical' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' }
  ];

  const generateTicketId = () => {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  };

  const sendEmail = async (email, ticketId, complaintDetails, queryType, priority) => {
    const TICKET_API_KEY = process.env.REACT_APP_TICKET_API_KEY;
    const WEBSITE_URL = process.env.REACT_APP_BASE_URL;
  
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { email: 'swasthyasevawovv@gmail.com', name: 'Swasthya Seva Support' },
        to: [{ email }],
        subject: `Support Ticket Created - ${ticketId}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .email-container {
                background: linear-gradient(to bottom right, #f0f7ff, #f5f3ff);
                border-radius: 16px;
                padding: 30px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding-bottom: 20px;
                border-bottom: 2px solid #e2e8f0;
                margin-bottom: 25px;
              }
              .title {
                color: #2563eb;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
              }
              .ticket-info {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
              }
              .ticket-id {
                font-size: 18px;
                color: #4f46e5;
                font-weight: 600;
                margin-bottom: 15px;
              }
              .info-label {
                font-weight: 600;
                color: #4b5563;
                margin-bottom: 5px;
              }
              .priority-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-weight: 500;
                margin-top: 10px;
              }
              .priority-low { background: #e9f7ef; color: #27ae60; }
              .priority-medium { background: #fef9e7; color: #f1c40f; }
              .priority-high { background: #fce4e4; color: #e74c3c; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header">
                <h1 class="title">Support Ticket Confirmation</h1>
              </div>
              
              <div class="ticket-info">
                <div class="ticket-id">Ticket ID: ${ticketId}</div>
                
                <div class="info-label">Query Type: ${queryType}</div>

                <div class="info-label">Priority:
                <p class="priority-badge priority-${priority.toLowerCase()}">${priority}</p></div>

                <div class="info-label">Query Details:</div>
                <div style="background: #f8fafc; padding: 15px; margin: 15px 0; border-left: 4px solid #2563eb;">
                  ${complaintDetails}
                </div>
  
                <div style="margin: 20px 0;">
                  <div class="info-label">Response Time:</div>
                  We will respond to your query within 24 hours. For urgent medical concerns, please contact emergency services.
                </div>
              </div>
  
              <div style="text-align: center;">
                <a href="${WEBSITE_URL}/track-ticket/${ticketId}" 
                   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 25px; 
                          border-radius: 8px; text-decoration: none; font-weight: 500;">
                  Track Your Ticket
                </a>
              </div>
  
              <div style="text-align: center; color: #6b7280; margin-top: 30px; padding-top: 20px; 
                          border-top: 1px solid #e2e8f0;">
                <p>This is an automated message. For medical emergencies, please dial your local emergency number.</p>
                <p>© ${new Date().getFullYear()} Swasthya Seva. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }, {
        headers: {
          'api-key': TICKET_API_KEY,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const ticketId = generateTicketId();
      
      await addDoc(collection(firestoredb, 'tickets'), {
        ticketId,
        email: user.email,
        subject: values.subject,
        queryType: values.queryType,
        priority: values.priority,
        description: values.description,
        status: 'open',
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        isResolved: false,
        adminResponse: null
      });

      await sendEmail(user.email, ticketId, values.description, values.queryType, values.priority);

      message.success('Support ticket created successfully!');
      form.resetFields();
      form.setFieldsValue({ email: user.email }); // Reset form but keep email
    } catch (error) {
      console.error('Error creating ticket:', error);
      message.error('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize form with user's email
  React.useEffect(() => {
    form.setFieldsValue({ email: user.email });
  }, [form, user.email]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title="Submit Support Ticket" 
        className="max-w-xl mx-auto"
        extra={
          <span className="text-red-500 text-sm">
            * For emergencies, call emergency services
          </span>
        }
      >
        <Form
          form={form}
          name="support_form"
          onFinish={onFinish}
          layout="vertical"
          requiredMark="optional"
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="email"
              label="Email"
              className="mb-0"
            >
              <Input disabled className="bg-gray-50" />
            </Form.Item>

            <Form.Item
              name="queryType"
              label="Query Type"
              rules={[{ required: true, message: 'Required' }]}
              className="mb-0"
            >
              <Select
                placeholder="Select type"
                options={queryTypes}
                className="w-full"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Required' }]}
              className="mb-0"
            >
              <Input placeholder="Brief description" />
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority"
              initialValue="low"
              rules={[{ required: true, message: 'Required' }]}
              className="mb-0"
            >
              <Select options={priorities} />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe your query' }]}
            className="mb-4"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Please provide details about your query"
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Button 
              type="default" 
              onClick={() => form.resetFields()} 
              className="mr-2"
            >
              Clear
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              Submit Ticket
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  );
};

export default TicketForm;