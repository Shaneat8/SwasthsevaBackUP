import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, DatePicker, Select, Radio, Input, Empty, Divider, Space, Spin, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  SortAscendingOutlined, 
  SortDescendingOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CalendarOutlined,
  DoubleRightOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import moment from 'moment';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';

const { RangePicker } = DatePicker;
const { Option } = Select;

function TicketList({ userEmail }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [sortDirection, setSortDirection] = useState('descending');
  const [sortField, setSortField] = useState('createdAt');
  const [loading, setLoading] = useState(true);

  // Fetch tickets data from Firestore
  useEffect(() => {
    if (!userEmail) return;

    setLoading(true);
    
    const q = query(
      collection(firestoredb, 'tickets'),
      where('email', '==', userEmail)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ticketList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketList);
      setFilteredTickets(ticketList);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [userEmail]);

  // Initialize Fuse.js for searching when tickets change
  const fuse = React.useMemo(() => new Fuse(tickets, {
    keys: ['subject', 'description', 'ticketId'],
    threshold: 0.4,
  }), [tickets]);

  // Format date function with proper handling
  const formatDate = (dateString) => {
    // Check if dateString is a valid Firestore timestamp
    if (dateString && dateString.seconds) {
      return moment.unix(dateString.seconds).format('DD MMM YYYY, h:mm A');
    }
    // Handle ISO string or other string date formats
    else if (dateString) {
      const date = moment(dateString);
      if (date.isValid()) {
        return date.format('DD MMM YYYY, h:mm A');
      }
    }
    return 'Invalid date';
  };

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tickets];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ticket => ticket.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      result = result.filter(ticket => {
        // Handle both timestamp and string date formats
        let ticketDate;
        if (ticket.createdAt && ticket.createdAt.seconds) {
          ticketDate = moment.unix(ticket.createdAt.seconds);
        } else {
          ticketDate = moment(ticket.createdAt);
        }
        
        if (!ticketDate.isValid()) return false;
        return ticketDate.isBetween(startDate, endDate, null, '[]');
      });
    }

    // Apply search term
    if (searchTerm.trim()) {
      const searchResults = fuse.search(searchTerm);
      result = searchResults.map(result => result.item);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'ticketId') {
        comparison = a.ticketId - b.ticketId;
      } else if (sortField === 'subject') {
        comparison = a.subject.localeCompare(b.subject);
      } else if (sortField === 'createdAt') {
        // Handle timestamp objects and string dates
        let dateA = a.createdAt;
        let dateB = b.createdAt;
        
        if (dateA && dateA.seconds) dateA = new Date(dateA.seconds * 1000);
        else dateA = new Date(dateA);
        
        if (dateB && dateB.seconds) dateB = new Date(dateB.seconds * 1000);
        else dateB = new Date(dateB);
        
        comparison = dateA - dateB;
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortDirection === 'ascending' ? comparison : -comparison;
    });

    setFilteredTickets(result);
  }, [tickets, searchTerm, statusFilter, dateRange, sortDirection, sortField, fuse]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange(null);
    setSortDirection('descending');
    setSortField('createdAt');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'reopened': return '#8b5cf6';
      case 'closed': return '#9ca3af';
      default: return '#9ca3af';
    }
  };

  // Get status badge background color (lighter version)
  const getStatusBgColor = (status) => {
    switch (status) {
      case 'open': return '#eff6ff';
      case 'resolved': return '#ecfdf5';
      case 'reopened': return '#f5f3ff';
      case 'closed': return '#f3f4f6';
      default: return '#f3f4f6';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateRange || sortField !== 'createdAt' || sortDirection !== 'descending';

  return (
    <div className="ticket-list-container">
      <style jsx>{`
        .ticket-list-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1c1e21;
        }
        
        .list-header {
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .list-header h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 0;
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .filter-container {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: box-shadow 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .filter-container:hover {
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
        }
        
        .filters-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .sort-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
        }
        
        .sort-label {
          margin-right: 8px;
          font-weight: 500;
          color: #4b5563;
          white-space: nowrap;
        }
        
        .tickets-wrapper {
          margin-top: 24px;
        }
        
        .ticket-card {
          transition: all 0.3s ease;
          border-radius: 12px !important;
          border: 1px solid #e5e7eb !important;
          overflow: hidden;
          background-color: #ffffff;
          margin-bottom: 16px;
        }
        
        .ticket-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
        }
        
        .ticket-card.open {
          border-left: 4px solid #3b82f6 !important;
        }
        
        .ticket-card.resolved {
          border-left: 4px solid #10b981 !important;
        }
        
        .ticket-card.reopened {
          border-left: 4px solid #8b5cf6 !important;
        }
        
        .ticket-card.closed {
          border-left: 4px solid #9ca3af !important;
        }
        
        .card-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        
        .ticket-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .ticket-id {
          color: #6b7280;
          font-size: 15px;
          font-weight: 500;
        }
        
        .ticket-description {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 12px;
        }
        
        .meta-info {
          color: #6b7280;
          font-size: 13px;
          margin-top: 12px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .admin-response {
          background-color: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 16px;
          border-radius: 8px;
          margin-top: 16px;
          position: relative;
        }
        
        .admin-response-header {
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 15px;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .admin-response-text {
          color: #1f2937;
          line-height: 1.6;
        }
        
        .empty-state {
          padding: 64px 32px;
          text-align: center;
          background-color: #f9fafb;
          border-radius: 12px;
          margin-top: 32px;
          border: 1px dashed #d1d5db;
        }
        
        .ticket-count {
          font-size: 15px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .active-filters {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .btn-create {
          background: linear-gradient(90deg, #2563eb, #4f46e5);
          border: none;
          height: 40px;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }
        
        .btn-view {
          height: 36px;
          border-radius: 6px;
          font-weight: 500;
        }
        
        .btn-clear {
          background-color: #f3f4f6;
          color: #4b5563;
          border: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .btn-clear:hover {
          background-color: #e5e7eb;
          color: #374151;
        }
        
        .status-tag {
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: 500;
          font-size: 12px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .loading-container {
          text-align: center;
          padding: 64px 32px;
          background-color: #f9fafb;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }
        
        @media (max-width: 992px) {
          .filter-container {
            flex-direction: column;
            align-items: stretch;
            padding: 16px;
          }
          
          .filters-group, .sort-group {
            width: 100%;
            justify-content: space-between;
          }
        }
        
        @media (max-width: 768px) {
          .ticket-list-container {
            padding: 16px;
          }
          
          .filters-group, .sort-group {
            flex-wrap: wrap;
          }
          
          .list-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="list-header">
        <h2>Your Support Tickets</h2>
        <Button 
          className="btn-create"
          type="primary" 
          onClick={() => navigate("/profile?tab=support")}
        >
          Create New Ticket
        </Button>
      </div>

      <div className="filter-container">
        <div className="filters-group">
          <Input 
            prefix={<SearchOutlined />} 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          
          <Select
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Status"
            dropdownMatchSelectWidth={false}
          >
            <Option value="all">All Status</Option>
            <Option value="open">Open</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="reopened">Reopened</Option>
            <Option value="closed">Closed</Option>
          </Select>
          
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            placeholder={['Start', 'End']}
            format="DD MMM YYYY"
            style={{ width: 220 }}
          />
        </div>
        
        <div className="sort-group">
          <span className="sort-label"><FilterOutlined /> Sort:</span>
          <Select
            style={{ width: 100 }}
            value={sortField}
            onChange={setSortField}
            dropdownMatchSelectWidth={false}
          >
            <Option value="createdAt">Date</Option>
            <Option value="ticketId">ID</Option>
            <Option value="subject">Subject</Option>
            <Option value="status">Status</Option>
          </Select>
          
          <Radio.Group 
            value={sortDirection}
            onChange={e => setSortDirection(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="ascending"><SortAscendingOutlined /></Radio.Button>
            <Radio.Button value="descending"><SortDescendingOutlined /></Radio.Button>
          </Radio.Group>
          
          {hasActiveFilters && (
            <Tooltip title="Clear all filters">
              <Button 
                className="btn-clear" 
                onClick={clearFilters} 
                icon={<ClearOutlined />} 
                size="small"
              >
                Clear
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
      
      <div className="ticket-count">
        <span>{filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'} found</span>
        
        {hasActiveFilters && (
          <div className="active-filters">
            {statusFilter !== 'all' && (
              <Tag closable onClose={() => setStatusFilter('all')}>
                Status: {statusFilter}
              </Tag>
            )}
            
            {dateRange && (
              <Tag closable onClose={() => setDateRange(null)}>
                Date Filter
              </Tag>
            )}
            
            {searchTerm && (
              <Tag closable onClose={() => setSearchTerm('')}>
                Search: "{searchTerm}"
              </Tag>
            )}
          </div>
        )}
      </div>
      
      <div className="tickets-wrapper">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div>Loading your tickets...</div>
          </div>
        ) : filteredTickets.length > 0 ? (
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            {filteredTickets.map(ticket => (
              <Card 
                key={ticket.id} 
                className={`ticket-card ${ticket.status}`}
                hoverable
              >
                <div className="card-content">
                  <div>
                    <h3 className="ticket-title">
                      <span className="ticket-id">#{ticket.ticketId}</span> {ticket.subject}
                    </h3>
                    <p className="ticket-description">{ticket.description}</p>
                    <div className="meta-info">
                      <span className="meta-item">
                        <CalendarOutlined /> Created: {formatDate(ticket.createdAt)}
                      </span>
                      {ticket.updatedAt && (
                        <span className="meta-item">
                          <ClockCircleOutlined /> Updated: {formatDate(ticket.updatedAt)}
                        </span>
                      )}
                    </div>
                    
                    {ticket.adminResponse && (
                      <div className="admin-response">
                        <div className="admin-response-header">
                          <MessageOutlined /> Admin Response
                        </div>
                        <p className="admin-response-text">{ticket.adminResponse}</p>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ 
                    backgroundColor: getStatusBgColor(ticket.status),
                    color: getStatusColor(ticket.status),
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '12px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {ticket.status}
                  </div>
                </div>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="primary"
                    ghost
                    className="btn-view"
                    onClick={() => navigate(`/track-ticket/${ticket.ticketId}`)}
                    icon={<DoubleRightOutlined />}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </Space>
        ) : (
          <div className="empty-state">
            <Empty 
              description={
                searchTerm || statusFilter !== 'all' || dateRange
                  ? "No tickets match your filters"
                  : "You have no support tickets yet"
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            {(searchTerm || statusFilter !== 'all' || dateRange) && (
              <Button className="btn-clear" style={{ marginTop: 16 }} onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            
            {(!searchTerm && statusFilter === 'all' && !dateRange) && (
              <Button 
                className="btn-create"
                type="primary" 
                style={{ marginTop: 16 }}
                onClick={() => navigate("/profile?tab=support")}
              >
                Create New Ticket
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TicketList;