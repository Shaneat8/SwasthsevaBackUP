import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GetAppointmentById, HandleLeaveResponse } from '../../apicalls/appointment';
import { GetDoctorById } from '../../apicalls/doctors';
import { message, Spin } from 'antd';

const RescheduleLeaveHandler = () => {
  const { appointmentId, action } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAppointmentData = async () => {
      try {
        setLoading(true);
        
        // First verify the appointment exists and is affected by leave
        const appointmentResponse = await GetAppointmentById(appointmentId);
        
        if (!appointmentResponse.success) {
          setError('Appointment not found or has already been processed');
          setLoading(false);
          return;
        }
        
        const appointment = appointmentResponse.data;
        
        if (appointment.status !== 'affected-by-leave') {
          setError('This appointment has already been processed');
          setLoading(false);
          return;
        }
        
        // Process the action
        const response = await HandleLeaveResponse(appointmentId, action);
        
        if (!response.success) {
          setError(response.message);
          setLoading(false);
          return;
        }
        
        if (action === 'cancel') {
          // For cancel, show a success message and redirect to home
          message.success('Your appointment has been cancelled');
          navigate('/');
        } else if (action === 'reschedule') {
          // For reschedule, get the doctor data

          const doctorResponse = await GetDoctorById(appointment.doctorId);
          
          if (!doctorResponse.success) {
            setError('Could not retrieve doctor information');
            setLoading(false);
            return;
          }
          
          // For reschedule, redirect to booking page with prefilled data
          navigate(`/book-appointment /${appointment.doctorId}`, { 
            state: { 
              isRescheduling: true,
              fromLeave: true,
              appointmentData: response.appointmentData,
              doctorData: doctorResponse.data 
            } 
          });
        }
        
      } catch (err) {
        console.error('Error handling leave response:', err);
        setError('Something went wrong. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAppointmentData();
  }, [appointmentId, action, navigate]); // Remove appointmentData and doctorData from dependencies

  if (loading) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">Processing Your Request</h2>
        <Spin size="large" />
        <p className="mt-4">Please wait while we process your request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return null; // The component redirects, so we don't need to render anything
};

export default RescheduleLeaveHandler;