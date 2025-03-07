import React, { useState, useCallback, useRef } from "react";
import { Button, Card, message, Tag } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

// Import components lazily to improve initial load time
const Appointments = React.lazy(() => import("./Appointments"));
const Doctor = React.lazy(() => import("../DoctorForm"));
const UserForm = React.lazy(() => import("./UserForm"));
const Records = React.lazy(() => import("./records"));
const TicketForm = React.lazy(() => import("../Ticket/TicketForm"));
const BookTest = React.lazy(() => import("../BookTest/BookTest"));

function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get("tab") || "profile";
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const unsubscribeRef = useRef(null);

  // Lazy load tickets data only when the tickets tab is active
  const loadTicketsData = useCallback(() => {
    if (!ticketsLoaded && user) {
      import("firebase/firestore").then(({ collection, onSnapshot, query, where }) => {
        import("../../firebaseConfig").then((module) => {
          const firestoredb = module.default;
          
          const q = query(
            collection(firestoredb, 'tickets'),
            where('email', '==', user.email)
          );
          
          // Store the unsubscribe function in the ref for cleanup
          unsubscribeRef.current = onSnapshot(q, (querySnapshot) => {
            const ticketList = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTickets(ticketList);
            setTicketsLoaded(true);
          });
        });
      });
    }
  }, [user, ticketsLoaded]);

  // Call loadTicketsData only when the tickets tab is active
  React.useEffect(() => {
    if (tab === "tickets") {
      loadTicketsData();
    }
    
    // Cleanup function for when component unmounts or tab changes
    return () => {
      if (unsubscribeRef.current && tab !== "tickets") {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [tab, loadTicketsData]);

  // Cleanup on component unmount
  React.useEffect(() => {
    if(user.role==="guest"){
      message.error("Please register before accessing");
      navigate('/');
      return;
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [navigate,user.role]);

  // Render content based on the current tab
  const renderContent = () => {
    // Use React.Suspense to handle the lazy loaded components
    return (
      <React.Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        {getTabContent()}
      </React.Suspense>
    );
  };

  const getTabContent = () => {
    switch(tab) {
      case "appointments":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Appointment Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card 
                title="Book Doctor Appointment" 
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/")}
              >
                <p>Schedule an appointment with one of our qualified doctors</p>
                <Button type="primary" className="mt-4">Book Now</Button>
              </Card>
              
              <Card 
                title="Book Lab Test" 
                className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate("/profile?tab=booktest")}
              >
                <p>Schedule laboratory tests and diagnostics</p>
                <Button type="primary" className="mt-4">Book Lab Test</Button>
              </Card>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Your Upcoming Appointments</h3>
            <Appointments />
          </div>
        );
      case "profile":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
            {user.role === "doctor" ? <Doctor /> : <UserForm />}
          </div>
        );
      case "records":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Medical Records</h2>
            <Records />
          </div>
        );
      case "support":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Customer Support</h2>
            <TicketForm />
          </div>
        );
      case "tickets":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Support Tickets</h2>
            <div className="space-y-4">
              {tickets.length > 0 ? (
                tickets.map(ticket => (
                  <Card key={ticket.id} className="shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">#{ticket.ticketId} - {ticket.subject}</h3>
                        <p className="text-gray-600">{ticket.description}</p>
                        {ticket.adminResponse && (
                          <div className="mt-2 p-3 bg-blue-50 rounded">
                            <p className="font-medium">Admin Response:</p>
                            <p>{ticket.adminResponse}</p>
                          </div>
                        )}
                      </div>
                      <Tag color={
                        ticket.status === 'open' ? 'blue' :
                        ticket.status === 'resolved' ? 'green' :
                        ticket.status === 'reopened' ? 'purple' : 'default'
                      }>
                        {ticket.status.toUpperCase()}
                      </Tag>
                    </div>
                    <div className="mt-3">
                      <Button 
                        type="link"
                        onClick={() => navigate(`/track-ticket/${ticket.ticketId}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded">
                  <p>You have no support tickets yet.</p>
                  <Button 
                    type="primary" 
                    className="mt-3"
                    onClick={() => navigate("/profile?tab=support")}
                  >
                    Create New Ticket
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      case "booktest":
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Book Laboratory Tests</h2>
            <BookTest />
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
            {user.role === "doctor" ? <Doctor /> : <UserForm />}
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      {renderContent()}
    </div>
  );
}

export default Profile;