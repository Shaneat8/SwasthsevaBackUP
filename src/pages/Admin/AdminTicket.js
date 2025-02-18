import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, Timeline, Card, Descriptions, Space, message, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';
import axios from 'axios';

const { TextArea } = Input;

const AdminTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [isResponseModalVisible, setIsResponseModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(firestoredb, 'tickets'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
    });

    return () => unsubscribe();
  }, []);

  const sendResponseEmail = async (email, ticketId, adminResponse, isReopened = false) => {
    const TICKET_API_KEY = process.env.REACT_APP_TICKET_API_KEY;
    const WEBSITE_URL = process.env.REACT_APP_BASE_URL;
    
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { email: 'swasthyasevawovv@gmail.com', name: 'Support Team' },
        to: [{ email }],
        subject: `Response to Your ${isReopened ? 'Reopened' : ''} Ticket - ${ticketId}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Response to Your ${isReopened ? 'Reopened' : ''} Ticket #${ticketId}</h2>
            <p>Our support team has responded to your ticket:</p>
            <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #2563eb;">
              ${adminResponse}
            </div>
            <p>You can view the full ticket details and respond here:</p>
            <a href="${WEBSITE_URL}/track-ticket/${ticketId}" 
               style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; border-radius: 5px;">
              View Ticket
            </a>
          </div>
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

  const handleResponse = async () => {
    try {
      setLoading(true);
      const isReopened = selectedTicket.status === 'reopened';
      
      await updateDoc(doc(firestoredb, 'tickets', selectedTicket.id), {
        adminResponse: response,
        status: 'resolved',
        lastUpdated: new Date(),
        conversationHistory: [
          ...(selectedTicket.conversationHistory || []),
          {
            type: 'admin',
            message: response,
            timestamp: new Date()
          }
        ]
      });
      
      await sendResponseEmail(selectedTicket.email, selectedTicket.ticketId, response, isReopened);
      
      message.success('Response sent successfully');
      setIsResponseModalVisible(false);
      setResponse('');
    } catch (error) {
      console.error('Error sending response:', error);
      message.error('Failed to send response');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(firestoredb, 'tickets', selectedTicket.id), {
        status: 'closed',
        lastUpdated: new Date(),
        closedAt: new Date(), // Add closure timestamp for 48-hour window
        closedBy: 'admin',    // Track who closed the ticket
        conversationHistory: [
          ...(selectedTicket.conversationHistory || []),
          {
            type: 'admin',
            message: 'Ticket closed by admin',
            timestamp: new Date()
          }
        ]
      });

      // Send closure notification email to user
      await sendResponseEmail(
        selectedTicket.email,
        selectedTicket.ticketId,
        `Your ticket has been closed by our support team. If you're not satisfied with the resolution, you can reopen this ticket within the next 48 hours by visiting the ticket tracking page.`,
        false
      );

      message.success('Ticket closed successfully');
      setIsViewModalVisible(false);
    } catch (error) {
      console.error('Error closing ticket:', error);
      message.error('Failed to close ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'blue',
      'in-progress': 'orange',
      resolved: 'green',
      reopened: 'purple',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'ticketId',
      key: 'ticketId',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: priority => (
        <Tag color={priority?.toLowerCase() === 'high' ? 'red' : 
                    priority?.toLowerCase() === 'medium' ? 'orange' : 'green'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => date ? new Date(date.toDate()).toLocaleString() : '-',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setSelectedTicket(record);
              setIsViewModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            type="default"
            onClick={() => {
              setSelectedTicket(record);
              setIsResponseModalVisible(true);
            }}
            disabled={record.status === 'closed'}
          >
            Respond
          </Button>
        </Space>
      ),
    },
  ];

  const getStatusIcon = (status) => {
    const iconStyle = { fontSize: '16px' };
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircleOutlined style={iconStyle} className="text-green-500" />;
      case 'reopened':
        return <CloseCircleOutlined style={iconStyle} className="text-red-500" />;
      default:
        return <ClockCircleOutlined style={iconStyle} className="text-blue-500" />;
    }
  };

  return (
    <div className="p-4">
      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        className="mb-4"
      />

      {/* View Ticket Modal */}
      <Modal
        title={`Ticket Details #${selectedTicket?.ticketId}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
          selectedTicket?.status !== 'closed' && (
            <Button
              key="closeTicket"
              type="primary"
              danger
              onClick={() => {
                Modal.confirm({
                  title: 'Close Ticket',
                  icon: <ExclamationCircleOutlined />,
                  content: 'Are you sure you want to close this ticket?',
                  okText: 'Yes',
                  cancelText: 'No',
                  onOk: handleCloseTicket
                });
              }}
            >
              Close Ticket
            </Button>
          )
        ]}
      >
        {selectedTicket && (
          <div className="max-h-96 overflow-y-auto">
            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="Status" span={1}>
                <Tag color={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority" span={1}>
                <Tag color={selectedTicket.priority?.toLowerCase() === 'high' ? 'red' : 
                          selectedTicket.priority?.toLowerCase() === 'medium' ? 'orange' : 'green'}>
                  {selectedTicket.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Subject" span={2}>
                {selectedTicket.subject}
              </Descriptions.Item>
              <Descriptions.Item label="Query Type" span={2}>
                {selectedTicket.queryType}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {selectedTicket.email}
              </Descriptions.Item>
            </Descriptions>

            <Divider className="my-6" />      

            <Timeline className="mt-4">
              <Timeline.Item dot={getStatusIcon('open')}>
                <Card size="small" className="bg-gray-50">
                  <h4 className="font-medium">Initial Query</h4>
                  <p className="mt-2 whitespace-pre-wrap">{selectedTicket.description}</p>
                  <small className="text-gray-500 block mt-2">
                    {selectedTicket.createdAt && new Date(selectedTicket.createdAt.toDate()).toLocaleString()}
                  </small>
                </Card>
              </Timeline.Item>

              {selectedTicket.conversationHistory?.map((msg, index) => (
                <Timeline.Item
                  key={index}
                  dot={getStatusIcon(msg.type === 'admin' ? 'resolved' : 'reopened')}
                >
                  <Card 
                    size="small" 
                    className={msg.type === 'admin' ? 'bg-blue-50' : 'bg-gray-50'}
                  >
                    <h4 className="font-medium">
                      {msg.type === 'admin' ? 'Admin Response' : 'User Response'}
                    </h4>
                    <p className="mt-2 whitespace-pre-wrap">{msg.message}</p>
                    <small className="text-gray-500 block mt-2">
                      {msg.timestamp && new Date(msg.timestamp.toDate()).toLocaleString()}
                    </small>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal
        title={`Respond to Ticket #${selectedTicket?.ticketId}`}
        open={isResponseModalVisible}
        onOk={handleResponse}
        onCancel={() => {
          setIsResponseModalVisible(false);
          setResponse('');
        }}
        confirmLoading={loading}
      >
        {selectedTicket?.conversationHistory && (
          <div className="mb-4 max-h-60 overflow-y-auto border rounded p-4">
            {selectedTicket.conversationHistory.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.type === 'admin' ? 'text-blue-600' : 'text-gray-600'}`}>
                <strong>{msg.type === 'admin' ? 'Admin' : 'User'}:</strong> {msg.message}
                <div className="text-xs text-gray-400">
                  {msg.timestamp && new Date(msg.timestamp.toDate()).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
        <TextArea
          rows={4}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Type your response..."
        />
      </Modal>
    </div>
  );
};

export default AdminTicket;