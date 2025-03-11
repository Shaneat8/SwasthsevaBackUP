import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Tag, Button, Modal, Input, Timeline, Card, Descriptions, Space, message, Divider, DatePicker, Select } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { collection, query, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';
import axios from 'axios';
import Fuse from 'fuse.js';
import styles from './AdminTicket.module.css';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminTicket = () => {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [isResponseModalVisible, setIsResponseModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [queryTypeFilter, setQueryTypeFilter] = useState('all');
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  // Fuse.js instance
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        'ticketId',
        'email',
        'subject',
        'description',
        'queryType'
      ],
      threshold: 0.3, // Adjust this value to control fuzzy matching sensitivity
      includeScore: true
    };
    return new Fuse(tickets, fuseOptions);
  }, [tickets]);

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
      resolved: 'green',
      reopened: 'purple',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

  // Enhanced filter and search functions
  const applyFilters = useCallback(() => {
    let filtered = [...tickets];

    // Use Fuse.js for search if there's search text
    if (searchText) {
      const searchResults = fuse.search(searchText);
      filtered = searchResults.map(result => result.item);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.status === statusFilter
      );
    }

    // Query Type filter
    if (queryTypeFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.queryType === queryTypeFilter
      );
    }

    // Date range filter
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(ticket => {
        const ticketDate = ticket.createdAt.toDate();
        return ticketDate >= startDate && ticketDate <= endDate;
      });
    }

    setFilteredTickets(filtered);
  }, [dateRange, fuse, priorityFilter, queryTypeFilter, searchText, statusFilter, tickets]);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [tickets, searchText, priorityFilter, statusFilter, dateRange, applyFilters]);

  const resetFilters = () => {
    setSearchText('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setQueryTypeFilter('all');
    setDateRange(null);
  };

  // Enhanced SearchBar component with debounce
  const SearchBar = () => {
    const [localSearch, setLocalSearch] = useState(searchText);

    useEffect(() => {
      const timer = setTimeout(() => {
        setSearchText(localSearch);
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }, [localSearch]);

    return (
      <Input
        placeholder="Search tickets..."
        allowClear
        value={localSearch}
        onChange={e => setLocalSearch(e.target.value)}
        className={styles.searchInput}
        suffix={<SearchOutlined/>}
      />
    );
  };

  // Filter section with search suggestions
  const FilterSection = () => {
    // Get unique values for quick filters
    const uniquePriorities = [...new Set(tickets.map(t => t.priority))];
    const uniqueQueryTypes = [...new Set(tickets.map(t => t.queryType))].filter(Boolean);
  
    return (
      <div className={styles.filterSection}>
        <div className={styles.filterControls}>
          {/* Enhanced Search */}
          <div className={styles.searchInput}>
            <SearchBar/>
          </div>
  
          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            className={styles.filterSelect}
            placeholder="Filter by Priority"
            style={{ height: '40px' }}
          >
            <Option value="all">All Priorities</Option>
            {uniquePriorities.map(priority => (
              <Option key={priority} value={priority.toLowerCase()}>
                {priority}
              </Option>
            ))}
          </Select>
  
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className={styles.filterSelect}
            placeholder="Filter by Status"
            style={{ height: '40px' }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="open">Open</Option>
            <Option value="reopened">Reopened</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="closed">Closed</Option>
          </Select>
          
          {/* Query Type Filter */}
          <Select
            value={queryTypeFilter}
            onChange={setQueryTypeFilter}
            className={styles.queryTypeSelect}
            placeholder="Query Type"
            style={{ height: '40px' }}
          >
            <Option value="all">All Types</Option>
            {uniqueQueryTypes.map(type => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
          </Select>
  
          {/* Date Range Filter */}
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            className={styles.dateRangePicker}
            style={{ height: '40px' }}
          />
  
          {/* Reset Filters */}
          <Button 
            onClick={resetFilters}
            icon={<FilterOutlined />}
            className={styles.resetButton}
            style={{ height: '40px' }}
          >
            Reset
          </Button>
        </div>
  
        {/* Quick Stats */}
        <div className={styles.statsContainer}>
          <Card size="small" className={styles.statsCardBlue}>
            <p className={styles.statsLabel}>Open Tickets</p>
            <p className={styles.statsValue}>{tickets.filter(t => t.status === 'open').length}</p>
          </Card>
          <Card size="small" className={styles.statsCardYellow}>
            <p className={styles.statsLabel}>High Priority</p>
            <p className={styles.statsValue}>{tickets.filter(t => t.priority?.toLowerCase() === 'high').length}</p>
          </Card>
          <Card size="small" className={styles.statsCardGreen}>
            <p className={styles.statsLabel}>Resolved Today</p>
            <p className={styles.statsValue}>
              {tickets.filter(t => {
                if (!t.lastUpdated) return false;
                const today = new Date();
                const updateDate = t.lastUpdated.toDate();
                return t.status === 'resolved' && 
                       updateDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </Card>
          <Card size="small" className={styles.statsCardPurple}>
            <p className={styles.statsLabel}>Total Tickets</p>
            <p className={styles.statsValue}>{tickets.length}</p>
          </Card>
        </div>
      </div>
    );
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
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircleOutlined className={styles.statusIconGreen} />;
      case 'reopened':
        return <CloseCircleOutlined className={styles.statusIconRed} />;
      default:
        return <ClockCircleOutlined className={styles.statusIconBlue} />;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.pageTitle}>Ticket Management</h1>
        
        {/* Filter Section */}
        <FilterSection />

        {/* Tickets Table */}
        <div className={styles.tableContainer}>
          <Table
            columns={columns}
            dataSource={filteredTickets}
            rowKey="id"
          />
        </div>

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
            <div className={styles.modalContent}>
              <Descriptions bordered column={2} className={styles.descriptions}>
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

              <Divider className={styles.divider} />      

              <Timeline className={styles.timeline}>
                <Timeline.Item dot={getStatusIcon('open')}>
                  <Card size="small" className={styles.timelineCard}>
                    <h4 className={styles.timelineCardTitle}>Initial Query</h4>
                    <p className={styles.timelineCardText}>{selectedTicket.description}</p>
                    <small className={styles.timelineCardTime}>
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
                      className={msg.type === 'admin' ? styles.timelineCardAdmin : styles.timelineCard}
                    >
                      <h4 className={styles.timelineCardTitle}>
                        {msg.type === 'admin' ? 'Admin Response' : 'User Response'}
                      </h4>
                      <p className={styles.timelineCardText}>{msg.message}</p>
                      <small className={styles.timelineCardTime}>
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
            <div className={styles.conversationHistory}>
              {selectedTicket.conversationHistory.map((msg, index) => (
                <div key={index} className={msg.type === 'admin' ? styles.messageAdmin : styles.messageUser}>
                  <strong className={styles.messageInfo}>{msg.type === 'admin' ? 'Admin' : 'User'}:</strong> {msg.message}
                  <div className={styles.messageTime}>
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
    </div>
  );
};

export default AdminTicket;