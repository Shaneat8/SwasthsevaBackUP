import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tag, Button, Input, Timeline, Modal, Descriptions, Space, message, Spin, Divider, Empty } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import firestoredb from '../../firebaseConfig';

const { TextArea } = Input;

const TicketTracking = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userResponse, setUserResponse] = useState('');
  const [isResolutionModalVisible, setIsResolutionModalVisible] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      open: 'blue',
      'in-progress': 'processing',
      resolved: 'success',
      reopened: 'warning',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

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

  const fetchTicketDetails = useCallback(async () => {
    try {
      const ticketsRef = collection(firestoredb, 'tickets');
      const q = query(ticketsRef, where('ticketId', '==', ticketId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const ticketDoc = querySnapshot.docs[0];
        setTicket({ id: ticketDoc.id, ...ticketDoc.data() });
      } else {
        setTicket({});
        message.error('Ticket not found');
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
      message.error('Failed to fetch ticket details');
      setTicket({});
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const canReopen = (closedDate) => {
    if (!closedDate) return false;
    const closeTime = closedDate.toDate();
    const now = new Date();
    const hoursDifference = (now - closeTime) / (1000 * 60 * 60);
    return hoursDifference <= 48;
  };

  const handleTicketResponse = async (isResolved) => {
    try {
      setLoading(true);
      if (isResolved) {
        await updateDoc(doc(firestoredb, 'tickets', ticket.id), {
          status: 'closed',
          isResolved: true,
          lastUpdated: new Date(),
          closedAt: new Date(),
          conversationHistory: [
            ...(ticket.conversationHistory || []),
            {
              type: 'user',
              message: 'Ticket closed by user: Issue resolved',
              timestamp: new Date()
            }
          ]
        });
        message.success('Ticket closed successfully');
      } else {
        if (!canReopen(ticket.closedAt)) {
          message.error('This ticket cannot be reopened as it has been more than 48 hours since closure');
          setIsResolutionModalVisible(false);
          return;
        }

        await updateDoc(doc(firestoredb, 'tickets', ticket.id), {
          userResponse,
          status: 'reopened',
          lastUpdated: new Date(),
          conversationHistory: [
            ...(ticket.conversationHistory || []),
            {
              type: 'user',
              message: userResponse,
              timestamp: new Date()
            }
          ]
        });
        message.info('Ticket reopened for further assistance');
      }
      setIsResolutionModalVisible(false);
      setUserResponse('');
      await fetchTicketDetails();
    } catch (error) {
      console.error('Error updating ticket:', error);
      message.error('Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const sortedConversationHistory = (ticket) => {
    if (!ticket?.conversationHistory) return [];
    return [...ticket.conversationHistory].sort((a, b) => 
      a.timestamp.toDate() - b.timestamp.toDate()  // Changed to ascending order
    );
  };

  const ReopenButton = () => {
    if (!ticket.closedAt || ticket.status !== 'closed') return null;

    const isReopenable = canReopen(ticket.closedAt);
    const closeTime = ticket.closedAt.toDate();
    const timeRemaining = 48 - ((new Date() - closeTime) / (1000 * 60 * 60));
    const closedByAdmin = ticket.closedBy === 'admin';

    return (
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">
          {closedByAdmin 
            ? "Not satisfied with admin's resolution?" 
            : "Not satisfied with the resolution?"}
        </h4>
        {isReopenable ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              You can reopen this ticket for the next {Math.round(timeRemaining)} hours
            </p>
            <Button
              type="primary"
              danger
              onClick={() => setIsResolutionModalVisible(true)}
            >
              Reopen Ticket
            </Button>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            This ticket can no longer be reopened as it has been more than 48 hours since closure
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  
  if (!ticket || Object.keys(ticket).length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="shadow-md">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span className="text-gray-600">No records found for this ticket.</span>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card 
        title={
          <Space className="w-full justify-between">
            <span className="text-lg">Ticket #{ticket.ticketId}</span>
            <Tag icon={getStatusIcon(ticket.status)} color={getStatusColor(ticket.status)}>
              {ticket.status.toUpperCase()}
            </Tag>
          </Space>
        }
        className="shadow-md"
      >
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
          className="mb-6"
        >
          <Descriptions.Item label="Subject" span={2}>
            {ticket.subject}
          </Descriptions.Item>
          <Descriptions.Item label="Query Type">
            {ticket.queryType}
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={ticket.priority?.toLowerCase() === 'high' ? 'red' : 
                       ticket.priority?.toLowerCase() === 'medium' ? 'orange' : 'green'}>
              {ticket.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {ticket.createdAt && new Date(ticket.createdAt.toDate()).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {ticket.lastUpdated ? new Date(ticket.lastUpdated.toDate()).toLocaleString() : '-'}
          </Descriptions.Item>
        </Descriptions>

        <Divider className="my-6" />  

        <Timeline mode="left" className="mt-8">
          <Timeline.Item dot={getStatusIcon('open')}>
            <Card size="small" className="bg-gray-50">
              <h4 className="font-medium">Initial Query</h4>
              <p className="mt-2 whitespace-pre-wrap">{ticket.description}</p>
              <small className="text-gray-500 block mt-2">
                {ticket.createdAt && new Date(ticket.createdAt.toDate()).toLocaleString()}
              </small>
            </Card>
          </Timeline.Item>

          {sortedConversationHistory(ticket).map((msg, index) => (
            <Timeline.Item
              key={index}
              dot={getStatusIcon(msg.type === 'admin' ? 'resolved' : 'reopened')}
            >
              <Card 
                size="small" 
                className={msg.type === 'admin' ? 'bg-blue-50' : 'bg-gray-50'}
                style={{ marginBottom: '12px' }}
              >
                <h4 className="font-medium">
                  {msg.type === 'admin' ? 'Support Response' : 'Your Response'}
                </h4>
                <p className="mt-2 whitespace-pre-wrap">{msg.message}</p>
                <small className="text-gray-500 block mt-2">
                  {msg.timestamp && new Date(msg.timestamp.toDate()).toLocaleString()}
                </small>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>

        {ticket.status === 'closed' && <ReopenButton />}

        {ticket.adminResponse && ticket.status !== 'closed' && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Was your issue resolved?</h4>
            <Space>
              <Button
                type="primary"
                className="bg-green-500"
                onClick={() => {
                  Modal.confirm({
                    title: 'Close Ticket',
                    icon: <ExclamationCircleOutlined />,
                    content: 'Are you sure your issue has been resolved?',
                    okText: 'Yes, Close Ticket',
                    cancelText: 'No',
                    onOk: () => handleTicketResponse(true)
                  });
                }}
              >
                Yes, Close Ticket
              </Button>
              <Button
                onClick={() => setIsResolutionModalVisible(true)}
              >
                No, Need Further Assistance
              </Button>
            </Space>
          </div>
        )}

        <Modal
          title="Need Further Assistance"
          open={isResolutionModalVisible}
          onOk={() => handleTicketResponse(false)}
          onCancel={() => {
            setIsResolutionModalVisible(false);
            setUserResponse('');
          }}
          okText="Submit"
          okButtonProps={{ 
            disabled: !userResponse.trim(),
            loading: loading
          }}
        >
          <p className="mb-4">Please explain why you need further assistance:</p>
          <TextArea
            rows={4}
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Provide details about why you need further assistance..."
          />
        </Modal>
      </Card>
    </div>
  );
};

export default TicketTracking;