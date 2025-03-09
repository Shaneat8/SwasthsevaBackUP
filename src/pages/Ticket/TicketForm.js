import React, { useState, useEffect } from 'react';
  import { Form, Input, Button, message, Select } from 'antd';
  import { motion } from 'framer-motion';
  import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
  import axios from 'axios';
  import firestoredb from '../../firebaseConfig';
  import styles from './TicketForm.module.css';
  import { SendOutlined, ClockCircleOutlined, BulbOutlined, FileTextOutlined } from '@ant-design/icons';
  import logo from '../images/logo.png';

  const TicketForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [formData, setFormData] = useState({});
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
      { value: 'low', label: 'Low Priority', icon: '🟢' },
      { value: 'medium', label: 'Medium Priority', icon: '🟠' },
      { value: 'high', label: 'High Priority', icon: '🔴' }
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

                  <div class="info-label">Priority: &nbsp;
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
                  <a href="${WEBSITE_URL}track-ticket/${ticketId}" 
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
        throw error;
      }
    };

    const onFinish = async (values) => {
      setLoading(true);
      try {
        const ticketId = generateTicketId();
        const allValues = { ...formData, ...values };
        
        await addDoc(collection(firestoredb, 'tickets'), {
          ticketId,
          email: user.email,
          subject: allValues.subject,
          queryType: allValues.queryType,
          priority: allValues.priority,
          description: allValues.description,
          status: 'open',
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          isResolved: false,
          adminResponse: null
        });

        await sendEmail(user.email, ticketId, allValues.description, allValues.queryType, allValues.priority);

        message.success('Support ticket created successfully!');
        
        form.resetFields();
        form.setFieldsValue({ email: user.email });
        setFormStep(1);
        setFormData({});
      } catch (error) {
        message.error('Failed to create ticket. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const nextStep = async () => {
      try {
        const values = await form.validateFields();
        setFormData({ ...formData, ...values });
        setFormStep(formStep + 1);
      } catch (error) {
        // Validation errors handled by form
      }
    };

    const prevStep = () => {
      setFormStep(formStep - 1);
    };

    // Initialize form with user's email
    useEffect(() => {
      form.setFieldsValue({ email: user.email });
    }, [form, user.email]);

    const renderStepIndicator = () => {
      return (
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${formStep >= 1 ? styles.activeStep : ''}`}>
            <div className={styles.stepCircle}>1</div>
            <span className={styles.stepLabel}>Basic Info</span>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${formStep >= 2 ? styles.activeStep : ''}`}>
            <div className={styles.stepCircle}>2</div>
            <span className={styles.stepLabel}>Details</span>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${formStep >= 3 ? styles.activeStep : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>Review</span>
          </div>
        </div>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.formContainer}
      >
        <div className={styles.formHeader}>
          <img src={logo} alt="Swasthya Seva" className={styles.logo} />
          <h1 className={styles.formTitle}>Support Ticket</h1>
          <p className={styles.formSubtitle}>We're here to help! Tell us what you need assistance with.</p>
        </div>

        {renderStepIndicator()}

        <div className={styles.card}>
          <Form
            form={form}
            name="support_form"
            onFinish={onFinish}
            layout="vertical"
            requiredMark="optional"
            className={styles.form}
          >
            {formStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={styles.formStep}
              >
                <h2 className={styles.stepTitle}><BulbOutlined /> Basic Information</h2>
                
                <Form.Item
                  name="email"
                  label="Email Address"
                  className={styles.formItem}
                >
                  <Input disabled className={styles.disabledInput} />
                </Form.Item>

                <Form.Item
                  name="queryType"
                  label="What type of assistance do you need?"
                  rules={[{ required: true, message: 'Please select the type of query' }]}
                  className={styles.formItem}
                  style={{ height: 'auto' }}
                >
                  <Select
                    placeholder="Select the category that best matches your query"
                    options={queryTypes}
                    className={styles.select}
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="priority"
                  label="How urgent is your request?"
                  initialValue="low"
                  rules={[{ required: true, message: 'Please select priority' }]}
                  className={styles.formItem}
                >
                  <Select 
                    options={priorities} 
                    size="large"
                    optionLabelProp="label"
                    className={styles.prioritySelect}
                    optionRender={(option) => (
                      <div className={styles.priorityOption}>
                        <span className={styles.priorityIcon}>{option.data.icon}</span>
                        <span>{option.data.label}</span>
                      </div>
                    )}
                  />
                </Form.Item>

                <div className={styles.buttonContainer}>
                  <Button 
                    type="primary" 
                    onClick={nextStep}
                    size="large"
                    className={styles.nextButton}
                  >
                    Continue <SendOutlined />
                  </Button>
                </div>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={styles.formStep}
              >
                <h2 className={styles.stepTitle}><FileTextOutlined /> Request Details</h2>
                
                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[{ required: true, message: 'Please provide a subject for your ticket' }]}
                  className={styles.formItem}
                >
                  <Input placeholder="Brief description of your query" size="large" />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: 'Please describe your query in detail' }]}
                  className={styles.textareaItem}
                >
                  <Input.TextArea 
                    rows={5}
                    placeholder="Please provide as much detail as possible about your query so we can assist you better"
                    className={styles.textarea}
                  />
                </Form.Item>

                <div className={styles.buttonContainer}>
                  <Button 
                    onClick={prevStep}
                    size="large"
                    className={styles.backButton}
                  >
                    Back
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={nextStep}
                    size="large"
                    className={styles.nextButton}
                  >
                    Review <SendOutlined />
                  </Button>
                </div>
              </motion.div>
            )}

            {formStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={styles.formStep}
              >
                <h2 className={styles.stepTitle}>Review Your Ticket</h2>
                
                <div className={styles.reviewSection}>
                  <div className={styles.reviewItem}>
                    <div className={styles.reviewLabel}>Email:</div>
                    <div className={styles.reviewValue}>{user.email}</div>
                  </div>
                  
                  <div className={styles.reviewItem}>
                    <div className={styles.reviewLabel}>Query Type:</div>
                    <div className={styles.reviewValue}>
                      {queryTypes.find(q => q.value === formData.queryType)?.label || formData.queryType}
                    </div>
                  </div>
                  
                  <div className={styles.reviewItem}>
                    <div className={styles.reviewLabel}>Priority:</div>
                    <div className={styles.reviewValue}>
                      <span className={`${styles.priorityBadge} ${styles[`priority-${formData.priority}`]}`}>
                        {priorities.find(p => p.value === formData.priority)?.icon} {priorities.find(p => p.value === formData.priority)?.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.reviewItem}>
                    <div className={styles.reviewLabel}>Subject:</div>
                    <div className={styles.reviewValue}>{formData.subject}</div>
                  </div>
                  
                  <div className={styles.reviewItem}>
                    <div className={styles.reviewLabel}>Description:</div>
                    <div className={styles.reviewValue}>
                      <div className={styles.descriptionBox}>{formData.description}</div>
                    </div>
                  </div>
                </div>

                <div className={styles.expectationBox}>
                  <div className={styles.expectationIcon}><ClockCircleOutlined /></div>
                  <div className={styles.expectationText}>
                    <strong>What to expect:</strong> Our team will respond to your ticket within 24 hours. You'll receive an email confirmation with tracking details.
                  </div>
                </div>

                <div className={styles.buttonContainer}>
                  <Button 
                    onClick={prevStep}
                    size="large"
                    className={styles.backButton}
                  >
                    Back
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    size="large"
                    className={styles.submitButton}
                  >
                    Submit Ticket
                  </Button>
                </div>
              </motion.div>
            )}
          </Form>
        </div>
      </motion.div>
    );
  };

  export default TicketForm;