import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Modal, Input, Timeline, Card, Descriptions, Space, message, Divider } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig'; // Adjust path if needed

const { TextArea } = Input;

const ResolvedComplaints = () => {
  const [resolvedTickets, setResolvedTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [isResponseModalVisible, setIsResponseModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const ticketsRef = collection(firestoredb, 'tickets');

        // Fetch only tickets where status is "closed"
        const closedTicketsQuery = query(ticketsRef, where("status", "==", "closed"));
        const querySnapshot = await getDocs(closedTicketsQuery);

        const ticketsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched Closed Tickets:", ticketsData);
        
        const sortedTickets = ticketsData.sort((a, b) => {
          const priorityOrder = { high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority?.toLowerCase()] - priorityOrder[b.priority?.toLowerCase()];
        });

        setResolvedTickets(sortedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } 
    };

    fetchTickets();
  }, []);

  const handleResponse = async () => {
    try {
      setLoading(true);
      
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
        dataSource={resolvedTickets}
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
          </Button>
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

            <Timeline style={{ marginLeft: '20px' }} className="mt-4">
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

export default ResolvedComplaints;