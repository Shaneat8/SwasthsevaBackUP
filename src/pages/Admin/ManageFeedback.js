import React, { useState, useEffect, useCallback } from "react";
import { 
  Table, 
  Rate, 
  Select, 
  DatePicker, 
  message, 
  Button, 
  Input, 
  Card, 
  Statistic, 
  Switch, 
  Row, 
  Col, 
  Typography, 
  Empty, 
  Space 
} from "antd";
import { 
  FilterOutlined, 
  SearchOutlined, 
  StarOutlined, 
  UserOutlined, 
  CalendarOutlined 
} from '@ant-design/icons';
import { 
  getAllFeedback, 
  getAverageRating,
  updateFeedbackDisplayStatus 
} from "../../apicalls/feedback";
import { ShowLoader } from "../../redux/loaderSlice";
import { useDispatch } from "react-redux";
import moment from "moment";
import './FeedbackManagement.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const EmptyState = ({ message }) => (
  <Empty
    className="empty-feedback"
    image={Empty.PRESENTED_IMAGE_SIMPLE}
    description={
      <Space direction="vertical" align="center">
        <Title level={5}>No feedback available</Title>
        <Text type="secondary">{message}</Text>
      </Space>
    }
  />
);

const ManageFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [averageRating, setAverageRating] = useState(4.4);
  const [totalReviews, setTotalReviews] = useState(0);
  const [dateRange, setDateRange] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [searchText, setSearchText] = useState("");
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));

      // Fetch all feedback
      const response = await getAllFeedback();
      if (response.success) {
        setFeedback(response.data || []);
        setFilteredFeedback(response.data || []);
      } else {
        message.error(response.message);
      }
    
      // Fetch average rating
      const ratingResponse = await getAverageRating();
      if (ratingResponse.success) {
        setAverageRating(ratingResponse.data.averageRating);
        setTotalReviews(ratingResponse.data.totalReviews);
      }
    } catch (err) {
      message.error(err.message || "Failed to fetch feedback data");
    } finally {
      dispatch(ShowLoader(false));
    }
  },[dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Apply filters when feedback, dateRange, selectedRating, or searchText changes
    if (feedback.length > 0) {
      let filtered = [...feedback];

      // Filter by date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        const startDate = dateRange[0].startOf('day');
        const endDate = dateRange[1].endOf('day');
        
        filtered = filtered.filter(item => {
          const feedbackDate = moment(item.createdAt, "DD-MM-YY HH:mm");
          return feedbackDate.isBetween(startDate, endDate, null, '[]');
        });
      }

      // Filter by rating
      if (selectedRating !== null) {
        filtered = filtered.filter(item => item.rating === selectedRating);
      }

      // Filter by search text
      if (searchText.trim() !== "") {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(item => 
          (item.userId && item.userId.toLowerCase().includes(searchLower)) || 
          (item.comment && item.comment.toLowerCase().includes(searchLower))
        );
      }

      setFilteredFeedback(filtered);
    }
  }, [feedback, dateRange, selectedRating, searchText]);

  const handleDisplayToggle = async (checked, record) => {
    try {
      const response = await updateFeedbackDisplayStatus(record.id, checked);
      if (response.success) {
        // Update local state to reflect the change
        const updatedFeedback = filteredFeedback.map(item => 
          item.id === record.id ? { ...item, display: checked } : item
        );
        setFilteredFeedback(updatedFeedback);
      }
    } catch (error) {
      console.error("Failed to update display status", error);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleRatingFilter = (value) => {
    setSelectedRating(value !== "all" ? parseFloat(value) : null);
  };

  const resetFilters = () => {
    setDateRange(null);
    setSelectedRating(null);
    setSearchText("");
    setFilteredFeedback(feedback);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => moment(a.createdAt, "DD-MM-YY HH:mm").unix() - moment(b.createdAt, "DD-MM-YY HH:mm").unix(),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => <Rate disabled allowHalf defaultValue={rating} />,
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: "Feedback",
      dataIndex: "comment",
      key: "comment",
      render: (text) => text || "No comment provided",
    },
    {
      title: "Display on Home",
      dataIndex: "display",
      key: "display",
      render: (display, record) => (
        <Switch 
          checked={display || false} 
          onChange={(checked) => handleDisplayToggle(checked, record)}
        />
      ),
    },
  ];

  // Calculate reviews this month
  const reviewsThisMonth = feedback.filter(item => {
    const thisMonth = moment().format('MM-YY');
    return item.createdAt && item.createdAt.includes(thisMonth);
  }).length;

  return (
    <div className="feedback-container">
      {/* Page header with gradient wave background */}
      <div className="page-header1">
        <Title level={2}>Feedback Management</Title>
      </div>

      {/* Stats Cards using Ant Design */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card className="feedback-card">
            <Statistic
              title="Average Rating"
              value={averageRating.toFixed(1)}
              valueStyle={{ color: '#49666c' }}
              precision={1}
              suffix={<Rate disabled allowHalf defaultValue={averageRating} style={{ fontSize: 16 }} />}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="feedback-card">
            <Statistic
              title="Total Reviews"
              value={totalReviews}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
              suffix="All-time feedback"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="feedback-card">
            <Statistic
              title="Reviews This Month"
              value={reviewsThisMonth}
              valueStyle={{ color: '#722ed1' }}
              prefix={<CalendarOutlined />}
              suffix="Current month"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters using Ant Design components */}
      <Card className="feedback-card filter-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Search feedback..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker 
              onChange={handleDateRangeChange} 
              value={dateRange}
              style={{ width: '100%' }}
              placeholder={['Start date', 'End date']}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select 
              style={{ width: '100%' }}
              onChange={handleRatingFilter} 
              value={selectedRating === null ? "all" : selectedRating.toString()}
              placeholder="All Ratings"
            >
              <Option value="all">All Ratings</Option>
              <Option value="1">1 Star</Option>
              <Option value="1.5">1.5 Stars</Option>
              <Option value="2">2 Stars</Option>
              <Option value="2.5">2.5 Stars</Option>
              <Option value="3">3 Stars</Option>
              <Option value="3.5">3.5 Stars</Option>
              <Option value="4">4 Stars</Option>
              <Option value="4.5">4.5 Stars</Option>
              <Option value="5">5 Stars</Option>
            </Select>
          </Col>
          <Col xs={24} md={3}>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={resetFilters}
              style={{ width: '100%' }}
            >
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Feedback Table with Ant Design */}
      <Card
        className="feedback-card"
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Feedback List</Title>
            <Text type="secondary">
              Showing {filteredFeedback.length} of {feedback.length} feedback entries
            </Text>
          </Space>
        }
      >
        {filteredFeedback.length > 0 ? (
          <Table 
            columns={columns} 
            dataSource={filteredFeedback} 
            rowKey="id" 
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <EmptyState message="No feedback entries match your current filters. Try changing your filter criteria or check back later." />
        )}
      </Card>
    </div>
  );
};

export default ManageFeedback;