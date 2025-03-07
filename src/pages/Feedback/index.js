import React, { useState, useEffect, useCallback } from 'react';
import { Rate, Input, Button, Card, Form, message, Typography, Spin, Image } from 'antd';
import { SmileOutlined, SendOutlined, StarFilled } from '@ant-design/icons';
import { addFeedback, getUserFeedback } from '../../apicalls/feedback';
import { useDispatch } from 'react-redux';
import { ShowLoader } from '../../redux/loaderSlice';
import feedbackImage from '../images/feedback.jpeg';
import './Feedback.css';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Title, Text } = Typography;

const Feedback = () => {
  const [form] = Form.useForm();
  const [rating, setRating] = useState(0);
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previousFeedback, setPreviousFeedback] = useState([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Get user info from local storage
  const user = JSON.parse(localStorage.getItem("user"));
  
  const fetchUserFeedback = useCallback(async () => {
    try {
      dispatch(ShowLoader(true));
      const response = await getUserFeedback(user.id);
      if (response.success) {
        setPreviousFeedback(response.data);
      }
    } catch (error) {
      console.error("Error fetching user feedback:", error);
    } finally {
      dispatch(ShowLoader(false));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
     if(user.role==="guest"){
            message.error("Please register before accessing");
            navigate('/');
            return;
          }

    if (user?.id) {
      fetchUserFeedback();
    }
  }, [user?.id, fetchUserFeedback,navigate,user.role]);
  
  const handleSubmit = async (values) => {
    try {
      if (!rating) {
        message.warning("Please select a rating");
        return;
      }
      
      setSubmitting(true);
      
      const feedbackData = {
        userId: user.id,
        userName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        rating: rating,
        comment: values.comment,
        userRole: user.role || "patient",
      };
      
      const response = await addFeedback(feedbackData);
      
      if (response.success) {
        message.success(response.message);
        form.resetFields();
        setRating(0);
        fetchUserFeedback(); // Refresh the feedback list
      } else {
        message.error(response.message);
      }
    } catch (error) {
      message.error("Failed to submit feedback. Please try again.");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate tooltip text for rating including half-star ratings
  const ratingText = [
    'Terrible', 
    'Poor', 
    'Average', 
    'Good',
    'Excellent'
  ];
  
  return (
    <div className="feedback">
      <div className="area">
        <ul className="circles">
          {[...Array(10)].map((_, index) => (
            <li key={index}></li>
          ))}
        </ul>
      </div>
      
      <div className="feedback-container">
        <div className="feedback-content">
          <div className="feedback-image-container">
            <Image
              src={feedbackImage}
              alt="Feedback illustration"
              preview={false}
              className="feedback-image"
            />
          </div>
          
          <Card 
            className="feedback-card"
            title={
              <div className="feedback-header">
                <SmileOutlined className="feedback-icon" />
                <Title level={4} className="feedback-title">
                  We Value Your Feedback
                </Title>
              </div>
            }
          >
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              className="feedback-form"
            >
              <div className="rating-container">
                <Text className="rating-label">How would you rate your experience?</Text>
                <Rate
                  character={<StarFilled />}
                  value={rating}
                  onChange={setRating}
                  className="rating-stars"
                  tooltips={ratingText}
                  allowHalf
                />
                {rating > 0 && <Text className="rating-text">{ratingText[Math.floor(rating * 2) - 1]}</Text>}
              </div>
              
              <Form.Item name="comment" className="comment-item">
                <TextArea
                  placeholder="Share your experience with us (optional)"
                  autoSize={{ minRows: 3, maxRows: 6 }}
                  className="comment-input"
                />
              </Form.Item>
              
              <Form.Item className="submit-item">
                <Button
                  type="primary"
                  htmlType="submit"
                  className="submit-button"
                  icon={<SendOutlined />}
                  loading={submitting}
                >
                  Submit Feedback
                </Button>
              </Form.Item>
            </Form>
            
            {previousFeedback.length > 0 && (
              <div className="previous-feedback">
                <div 
                  className="previous-feedback-toggle"
                  onClick={() => setShowPrevious(!showPrevious)}
                >
                  <Text className="toggle-text">
                    {showPrevious ? "Hide" : "Show"} your previous feedback
                  </Text>
                </div>
                
                {showPrevious && (
                  <div className="previous-feedback-list">
                    {loading ? (
                      <div className="loading-container">
                        <Spin size="small" />
                        <Text className="loading-text">Loading your feedback...</Text>
                      </div>
                    ) : (
                      previousFeedback.map(feedback => (
                        <Card 
                          key={feedback.id} 
                          className="previous-feedback-item"
                          size="small"
                        >
                          <div className="previous-feedback-content">
                            <div className="previous-feedback-top">
                              <Rate 
                                disabled 
                                value={feedback.rating} 
                                className="previous-rating" 
                                allowHalf
                              />
                              <Text className="previous-date">{feedback.createdAt}</Text>
                            </div>
                            {feedback.comment && (
                              <Text className="previous-comment">{feedback.comment}</Text>
                            )}
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Feedback;