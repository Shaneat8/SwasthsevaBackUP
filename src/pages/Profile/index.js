import React, { useEffect, useState } from "react";
import { Button, Card, Tabs, Tag } from "antd";
import Appointments from "./Appointments";
import Doctor from "../DoctorForm";
import UserForm from "./UserForm";
import { useLocation, useNavigate } from "react-router-dom";
import Records from "./records";
import TicketForm from "../Ticket/TicketForm";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import firestoredb from "../../firebaseConfig";
import BookTest from "../BookTest/BookTest";



function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tab = queryParams.get("tab");
  const navigate=useNavigate();

  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(firestoredb, 'tickets'),
        where('email', '==', user.email)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ticketList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTickets(ticketList);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const key = tab === "appointments" ? "1" : "2";

  const tabItems = [
    {
      key: "1",
      label: "Appointment",
      children: <Appointments />
    },
    {
      key: "2",
      label: "Profile",
      children: user.role === "doctor" ? <Doctor /> : <UserForm />
    },
    {
      key: "3",
      label: "Records",
      children: <Records />
    },
    {
      key: "4",
      label: "Support",
      children: <TicketForm />
    },
    {
      key: "5",
      label: "My Tickets",
      children: (
        <div className="space-y-4">
          {tickets.map(ticket => (
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
          ))}
        </div>
      )
    },
    {
      key: "6",
      label: "Book Lab Test",
      children: <BookTest/>
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultActiveKey={key} items={tabItems} />
    </div>
  );
}

export default Profile;