import React, { useState, useEffect, useCallback } from "react";
import { Table, Rate, Card, Statistic, Row, Col, Select, DatePicker } from "antd";
import { 
  getAllFeedback,
  getAverageRating, 
} from "../../apicalls/feedback";
import { ShowLoader } from "../../redux/loaderSlice";
import { useDispatch } from "react-redux";
import moment from "moment";

const { Option } = Select;
const { RangePicker } = DatePicker;

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
    <div className="w-12 h-12 text-gray-400 mb-3 flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900">No feedback available</h3>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

const ManageFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [dateRange, setDateRange] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchData = useCallback( async () => {
    try {
      dispatch(ShowLoader(true));
      setLoading(true);
      setError(null);

      // Fetch all feedback
      const response = await getAllFeedback();
      if (response.success) {
        setFeedback(response.data || []);
        setFilteredFeedback(response.data || []);
      } else {
        setError(response.message);
      }

      // Fetch average rating
      const ratingResponse = await getAverageRating();
      if (ratingResponse.success) {
        setAverageRating(ratingResponse.data.averageRating);
        setTotalReviews(ratingResponse.data.totalReviews);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch feedback data");
    } finally {
      setLoading(false);
      dispatch(ShowLoader(false));
    }
  },[dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Apply filters when feedback, dateRange, or selectedRating changes
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

      setFilteredFeedback(filtered);
    }
  }, [feedback, dateRange, selectedRating]);

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleRatingFilter = (value) => {
    setSelectedRating(value !== "all" ? parseInt(value) : null);
  };

  const resetFilters = () => {
    setDateRange(null);
    setSelectedRating(null);
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
      render: (rating) => <Rate disabled defaultValue={rating} />,
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: "Feedback",
      dataIndex: "comment",
      key: "comment",
      render: (text) => text || "No comment provided",
    },
  ];

  if (loading) {
    return <div>Loading feedback data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Feedback Management</h1>
      
      {/* Stats Cards */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Average Rating"
              value={averageRating}
              precision={1}
              suffix={<Rate disabled allowHalf defaultValue={averageRating} style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Reviews"
              value={totalReviews}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Reviews This Month"
              value={
                feedback.filter(item => {
                  const thisMonth = moment().format('MM-YY');
                  return item.createdAt && item.createdAt.includes(thisMonth);
                }).length
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <RangePicker onChange={handleDateRangeChange} value={dateRange} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
            <Select 
              style={{ width: 120 }} 
              onChange={handleRatingFilter} 
              value={selectedRating === null ? "all" : selectedRating.toString()}
            >
              <Option value="all">All Ratings</Option>
              <Option value="1">1 Star</Option>
              <Option value="2">2 Stars</Option>
              <Option value="3">3 Stars</Option>
              <Option value="4">4 Stars</Option>
              <Option value="5">5 Stars</Option>
            </Select>
          </div>
          <div className="self-end">
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Feedback List</h2>
          <span className="text-gray-500">
            Showing {filteredFeedback.length} of {feedback.length} feedback entries
          </span>
        </div>
        
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
      </div>
    </div>
  );
};

export default ManageFeedback;