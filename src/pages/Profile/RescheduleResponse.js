import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin, Card, Timeline, Result, Button } from 'antd';
import { LoadingOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { UpdateRescheduleResponse } from "../../apicalls/appointment";
import { useDispatch } from "react-redux";
import { ShowLoader } from "../../redux/loaderSlice";
import { doc, getDoc } from 'firebase/firestore';
import firestoredb from '../../firebaseConfig';

function RescheduleResponse() {
  const { id, response } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [appointmentData, setAppointmentData] = useState(null);
  const [processStatus, setProcessStatus] = useState('processing'); // 'processing', 'success', 'error'
  const antIcon = <LoadingOutlined className="text-blue-500 text-3xl" spin />;

  useEffect(() => {
    const user =JSON.parse(localStorage.getItem("user"))
     if(user.role==="guest"){
            message.error("Please register before accessing");
            navigate('/');
            return;
          }

    const handleResponse = async () => {
      dispatch(ShowLoader(true));
      try {
        if (!['accept', 'reject'].includes(response)) {
          setProcessStatus('error');
          message.error('Invalid response type');
          return;
        }

        if (!id) {
          setProcessStatus('error');
          message.error('Invalid appointment ID');
          return;
        }

        const appointmentRef = doc(firestoredb, "appointments", id);
        const appointmentSnap = await getDoc(appointmentRef);

        if (!appointmentSnap.exists()) {
          setProcessStatus('error');
          message.error('Appointment not found');
          return;
        }

        const appointmentData = appointmentSnap.data();
        setAppointmentData(appointmentData);

        const result = await UpdateRescheduleResponse(id, response);

        if (result.success) {
          setProcessStatus('success');
          message.success(result.message || `Appointment ${response === 'accept' ? 'rescheduled' : 'cancelled'} successfully`);
        } else {
          setProcessStatus('error');
          message.error(result.message || 'Failed to process your response');
        }
      } catch (error) {
        console.error('Error in RescheduleResponse:', error);
        setProcessStatus('error');
        message.error(error.message || 'An error occurred while processing your response');
      } finally {
        dispatch(ShowLoader(false));
        setTimeout(() => {
          navigate('/appointments');
        }, 10000);
      }
    };

    handleResponse();
  }, [id, response, navigate, dispatch]);

  const getStatusDisplay = () => {
    switch (processStatus) {
      case 'processing':
        return (
          <div className="text-center animate-fade-in">
            <Spin indicator={antIcon} />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">Processing your response</h2>
            <p className="mt-2 text-gray-500">Please wait while we update your appointment.</p>
          </div>
        );
      case 'success':
        return (
          <Result
            status="success"
            title="Response Processed Successfully!"
            subTitle="You will be redirected to appointments page shortly"
            className="animate-slide-up"
          />
        );
      case 'error':
        return (
          <Result
            status="error"
            title="Processing Failed"
            subTitle="There was an error processing your response"
            extra={[
              <Button type="primary" onClick={() => navigate('/appointments')} key="console">
                Go to Appointments
              </Button>
            ]}
            className="animate-slide-up"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6" style={{ paddingTop:'100px'}}>
      <div className="max-w-2xl mx-auto">
        <Card 
          className="shadow-lg hover:shadow-xl transition-all duration-300"
          bordered={false}
          style={{ borderRadius: '16px'}}
        >
          {getStatusDisplay()}

          {appointmentData && processStatus !== 'error' && (
            <div className="mt-8 animate-fade-in">
              <Timeline
                className="p-4"
                items={[
                  {
                    dot: <UserOutlined className="text-blue-500" />,
                    children: (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Doctor</span>
                        <span className="text-gray-700">{appointmentData.doctorName}</span>
                      </div>
                    ),
                  },
                  {
                    dot: <CalendarOutlined className="text-green-500" />,
                    children: (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Date</span>
                        <span className="text-gray-700">{appointmentData.date}</span>
                      </div>
                    ),
                  },
                  {
                    dot: <ClockCircleOutlined className="text-purple-500" />,
                    children: (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Time</span>
                        <span className="text-gray-700">{appointmentData.timeSlot}</span>
                      </div>
                    ),
                  },
                  {
                    dot: appointmentData.cancellationReason && <InfoCircleOutlined className="text-orange-500" />,
                    children: appointmentData.cancellationReason && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Cancellation Reason</span>
                        <span className="text-gray-700">{appointmentData.cancellationReason}</span>
                      </div>
                    ),
                  },
                ].filter(item => item.children)}
              />
            </div>
          )}
        </Card>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        .animate-slide-up {
          animation: slideUp 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default RescheduleResponse;