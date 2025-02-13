import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { UpdateRescheduleResponse } from "../../apicalls/appointment";

function RescheduleResponse() {
  const { id, response } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResponse = async () => {
      try {
        const accepted = response === 'accept';
        const result = await UpdateRescheduleResponse(id, accepted);
        
        if (result.success) {
          message.success(`You have ${accepted ? 'accepted' : 'rejected'} the new appointment time.`);
        } else {
          message.error('Failed to process your response. Please try again.');
        }
      } catch (error) {
        message.error('An error occurred. Please try again.');
      } finally {
        navigate('/appointments');
      }
    };

    handleResponse();
  }, [id, response, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div>Processing your response...</div>
    </div>
  );
}

export default RescheduleResponse;