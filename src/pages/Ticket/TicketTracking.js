import React, { useState, useEffect, useCallback } from "react";
import {Card,Tag,Button,Input,Timeline,Modal,Descriptions,Space,message,Spin,Divider,Empty,DatePicker,Select,List,Typography} from "antd";
import {CheckCircleOutlined,ClockCircleOutlined,CloseCircleOutlined,ExclamationCircleOutlined,ArrowLeftOutlined,FilterOutlined,SearchOutlined,FileTextOutlined,} from "@ant-design/icons";
import {doc,updateDoc,collection,query,where,getDocs,} from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import firestoredb from "../../firebaseConfig";
import styles from "./TicketTracking.module.css";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

const TicketTracking = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userResponse, setUserResponse] = useState("");
  const [isResolutionModalVisible, setIsResolutionModalVisible] =
    useState(false);
  const [viewMode, setViewMode] = useState(ticketId ? "detail" : "list");
  const [allTickets, setAllTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState(null);
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    const colors = {
      open: "blue",
      resolved: "success",
      reopened: "warning",
      closed: "default",
    };
    return colors[status] || "default";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircleOutlined className={styles.ticketStatusIconGreen} />;
      case "reopened":
        return <CloseCircleOutlined className={styles.ticketStatusIconRed} />;
      default:
        return <ClockCircleOutlined className={styles.ticketStatusIconBlue} />;
    }
  };

  const fetchAllTickets = useCallback(async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user"));
      const ticketsRef = collection(firestoredb, "tickets");
      const q = query(ticketsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const tickets = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllTickets(tickets);
        setFilteredTickets(tickets);
      } else {
        setAllTickets([]);
        setFilteredTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      message.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTicketDetails = useCallback(async () => {
    try {
      const ticketsRef = collection(firestoredb, "tickets");
      const q = query(ticketsRef, where("ticketId", "==", ticketId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const ticketDoc = querySnapshot.docs[0];
        setTicket({ id: ticketDoc.id, ...ticketDoc.data() });
      } else {
        setTicket({});
        message.error("Ticket not found");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      message.error("Failed to fetch ticket details");
      setTicket({});
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user.role === "guest") {
      message.error("Please register before accessing");
      navigate("/");
      return;
    }

    if (ticketId) {
      setViewMode("detail");
      fetchTicketDetails();
    } else {
      setViewMode("list");
      fetchAllTickets();
    }
  }, [fetchTicketDetails, fetchAllTickets, navigate, ticketId]);

  const canReopen = (closedDate) => {
    if (!closedDate) return false;
    const closeTime = closedDate.toDate();
    const now = new Date();
    const hoursDifference = (now - closeTime) / (1000 * 60 * 60);
    return hoursDifference <= 48;
  };

  const handleTicketResponse = async (isResolved) => {
    try {
      setLoading(true);
      if (isResolved) {
        await updateDoc(doc(firestoredb, "tickets", ticket.id), {
          status: "closed",
          isResolved: true,
          lastUpdated: new Date(),
          closedAt: new Date(),
          conversationHistory: [
            ...(ticket.conversationHistory || []),
            {
              type: "user",
              message: "Ticket closed by user: Issue resolved",
              timestamp: new Date(),
            },
          ],
        });
        message.success("Ticket closed successfully");
      } else {
        // Only check canReopen if the ticket is already closed
        if (ticket.status === "closed") {
          if (!canReopen(ticket.closedAt)) {
            message.error(
              "This ticket cannot be reopened as it has been more than 48 hours since closure"
            );
            setIsResolutionModalVisible(false);
            return;
          }
          
          // Reopening a closed ticket
          await updateDoc(doc(firestoredb, "tickets", ticket.id), {
            userResponse,
            status: "reopened",
            lastUpdated: new Date(),
            conversationHistory: [
              ...(ticket.conversationHistory || []),
              {
                type: "user",
                message: userResponse,
                timestamp: new Date(),
              },
            ],
          });
          message.info("Ticket reopened for further assistance");
        } else {
          // Responding to an admin message on an active ticket
          await updateDoc(doc(firestoredb, "tickets", ticket.id), {
            userResponse,
            lastUpdated: new Date(),
            conversationHistory: [
              ...(ticket.conversationHistory || []),
              {
                type: "user",
                message: userResponse,
                timestamp: new Date(),
              },
            ],
          });
          message.info("Your response has been submitted");
        }
      }
      setIsResolutionModalVisible(false);
      setUserResponse("");
      await fetchTicketDetails();
    } catch (error) {
      console.error("Error updating ticket:", error);
      message.error("Failed to update ticket");
    } finally {
      setLoading(false);
    }
  };
  

  const sortedConversationHistory = (ticket) => {
    if (!ticket?.conversationHistory) return [];
    return [...ticket.conversationHistory].sort(
      (a, b) => a.timestamp.toDate() - b.timestamp.toDate()
    );
  };

  const handleBackToList = () => {
    setViewMode("list");
    navigate("/profile?tab=tickets");
  };

  const handleViewTicketDetails = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const applyFilters = () => {
    let filtered = [...allTickets];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day").valueOf();
      const endDate = dateRange[1].endOf("day").valueOf();

      filtered = filtered.filter((ticket) => {
        const ticketDate = ticket.createdAt.toDate().getTime();
        return ticketDate >= startDate && ticketDate <= endDate;
      });
    }

    setFilteredTickets(filtered);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDateRange(null);
    setFilteredTickets(allTickets);
  };

  const ReopenButton = () => {
    if (!ticket.closedAt || ticket.status !== "closed") return null;
  
    const isReopenable = canReopen(ticket.closedAt);
    const closeTime = ticket.closedAt.toDate();
    const timeRemaining = 48 - (new Date() - closeTime) / (1000 * 60 * 60);
    const hoursRemaining = Math.floor(timeRemaining);
    const minutesRemaining = Math.floor((timeRemaining - hoursRemaining) * 60);
    const closedByAdmin = ticket.closedBy === "admin";
  
    return (
      <div className={styles.reopenContainer}>
        <h4 className={styles.reopenHeading}>
          {closedByAdmin
            ? "Not satisfied with admin's resolution?"
            : "Not satisfied with the resolution?"}
        </h4>
        {isReopenable ? (
          <>
            <p className={styles.reopenText}>
              You can reopen this ticket for the next{" "}
              {hoursRemaining > 0 ? `${hoursRemaining} hours` : ""}{" "}
              {minutesRemaining > 0 ? `${minutesRemaining} minutes` : ""}
            </p>
            <Button
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => setIsResolutionModalVisible(true)}
            >
              Reopen Ticket
            </Button>
          </>
        ) : (
          <p className={styles.reopenText}>
            This ticket can no longer be reopened as it has been more than 48
            hours since closure
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <p className={styles.loadingText}>Loading ticket information...</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className={styles.ticketTrackingContainer}>
        <Title level={4} className={styles.sectionHeading}>
          Your Support Tickets
        </Title>

        <Card className={styles.ticketCard}>
          <div className={styles.filterContainer}>
            <span className={styles.filterTitle}>
              <FilterOutlined /> Filter Tickets
            </span>

            <Select
              placeholder="Select Status"
              style={{ width: 150 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="all">All Statuses</Option>
              <Option value="open">Open</Option>
              <Option value="resolved">Resolved</Option>
              <Option value="reopened">Reopened</Option>
              <Option value="closed">Closed</Option>
            </Select>

            <RangePicker
              style={{ width: 280 }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />

            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
              <Button onClick={resetFilters}>Reset</Button>
            </Space>
          </div>

          {filteredTickets.length > 0 ? (
            <List
              className={styles.ticketListContainer}
              dataSource={filteredTickets}
              renderItem={(item) => (
                <div
                  className={
                    item.status === "closed"
                      ? styles.ticketItemClosed
                      : styles.ticketItemOpen
                  }
                  onClick={() => handleViewTicketDetails(item.ticketId)}
                >
                  <div className={styles.ticketItemInfo}>
                    <div className={styles.ticketItemId}>
                      #{item.ticketId} - {item.subject}
                    </div>
                    <div className={styles.ticketItemSubject}>
                      {item.description.substring(0, 100)}
                      {item.description.length > 100 ? "..." : ""}
                    </div>
                    <div className={styles.ticketItemDate}>
                      Created:{" "}
                      {item.createdAt &&
                        new Date(item.createdAt.toDate()).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.ticketItemActions}>
                    <Tag
                      icon={getStatusIcon(item.status)}
                      color={getStatusColor(item.status)}
                    >
                      {item.status.toUpperCase()}
                    </Tag>
                    <Button
                      type="text"
                      icon={<FileTextOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewTicketDetails(item.ticketId);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className={styles.emptyTicketContainer}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>No tickets found matching your filters.</span>
                }
              />
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (!ticket || Object.keys(ticket).length === 0) {
    return (
      <div className={styles.ticketTrackingContainer}>
        <Button
          className={styles.backButton}
          icon={<ArrowLeftOutlined />}
          onClick={handleBackToList}
        >
          Back to Tickets
        </Button>
        <Card className={styles.ticketCard}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: "#6b7280" }}>
                No records found for this ticket.
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.ticketTrackingContainer}>
      <Button
        className={styles.backButton}
        icon={<ArrowLeftOutlined />}
        onClick={handleBackToList}
      >
        Back to Tickets
      </Button>

      <Card
        title={
          <Space className={styles.titleContainer}>
            <span className={styles.ticketTitle}>
              Ticket #{ticket.ticketId}
            </span>
            <Tag
              icon={getStatusIcon(ticket.status)}
              color={getStatusColor(ticket.status)}
            >
              {ticket.status.toUpperCase()}
            </Tag>
          </Space>
        }
        className={styles.ticketCard}
      >
        <Descriptions
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}
          className={styles.descriptionContainer}
        >
          <Descriptions.Item label="Subject" span={2}>
            {ticket.subject}
          </Descriptions.Item>
          <Descriptions.Item label="Query Type">
            {ticket.queryType}
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag
              color={
                ticket.priority?.toLowerCase() === "high"
                  ? "red"
                  : ticket.priority?.toLowerCase() === "medium"
                  ? "orange"
                  : "green"
              }
            >
              {ticket.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {ticket.createdAt &&
              new Date(ticket.createdAt.toDate()).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {ticket.lastUpdated
              ? new Date(ticket.lastUpdated.toDate()).toLocaleString()
              : "-"}
          </Descriptions.Item>
        </Descriptions>

        <Divider className={styles.dividerSpacing} />

        <Timeline mode="left" className={styles.timelineContainer}>
          <Timeline.Item dot={getStatusIcon("open")}>
            <Card size="small" className={styles.cardSmallGray}>
              <h4 className={styles.cardTitle}>Initial Query</h4>
              <p className={styles.cardContent}>{ticket.description}</p>
              <small className={styles.cardTimestamp}>
                {ticket.createdAt &&
                  new Date(ticket.createdAt.toDate()).toLocaleString()}
              </small>
            </Card>
          </Timeline.Item>

          {sortedConversationHistory(ticket).map((msg, index) => (
            <Timeline.Item
              key={index}
              dot={getStatusIcon(
                msg.type === "admin" ? "resolved" : "reopened"
              )}
            >
              <Card
                size="small"
                className={
                  msg.type === "admin"
                    ? styles.cardSmallBlue
                    : styles.cardSmallGray
                }
                style={{ marginBottom: "12px" }}
              >
                <h4 className={styles.cardTitle}>
                  {msg.type === "admin" ? "Support Response" : "Your Response"}
                </h4>
                <p className={styles.cardContent}>{msg.message}</p>
                <small className={styles.cardTimestamp}>
                  {msg.timestamp &&
                    new Date(msg.timestamp.toDate()).toLocaleString()}
                </small>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>

        {ticket.status === "closed" && <ReopenButton />}

        {ticket.adminResponse && ticket.status !== "closed" && (
          <div className={styles.resolutionContainer}>
            <h4 className={styles.resolutionHeading}>
              Was your issue resolved?
            </h4>
            <Space>
              <Button
                type="primary"
                className={styles.primaryGreenButton}
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: "Close Ticket",
                    icon: <ExclamationCircleOutlined />,
                    content: "Are you sure your issue has been resolved?",
                    okText: "Yes, Close Ticket",
                    cancelText: "No",
                    onOk: () => handleTicketResponse(true),
                  });
                }}
              >
                Yes, Close Ticket
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => setIsResolutionModalVisible(true)}
              >
                No, Need Further Assistance
              </Button>
            </Space>
          </div>
        )}

      <Modal
        title={ticket.status === "closed" ? "Reopen Ticket" : "Need Further Assistance"}
        open={isResolutionModalVisible}
        onOk={() => handleTicketResponse(false)}
        onCancel={() => {
          setIsResolutionModalVisible(false);
          setUserResponse("");
        }}
        okText="Submit"
        okButtonProps={{
          disabled: !userResponse.trim(),
          loading: loading,
        }}
      >
        <p className={styles.modalText}>
          {ticket.status === "closed" 
            ? "Please explain why you need to reopen this ticket:" 
            : "Please explain why you need further assistance:"}
        </p>
        <TextArea
          rows={4}
          value={userResponse}
          onChange={(e) => setUserResponse(e.target.value)}
          placeholder={ticket.status === "closed" 
            ? "Provide details about why you need to reopen this ticket..." 
            : "Provide details about why you need further assistance..."}
        />
        {ticket.status === "closed" && (
          <p className={styles.noteText} style={{ marginTop: '10px', fontSize: '12px', color: '#ff4d4f' }}>
            Note: Tickets can only be reopened within 48 hours of closure.
          </p>
        )}
      </Modal>
      </Card>
    </div>
  );
};

export default TicketTracking;