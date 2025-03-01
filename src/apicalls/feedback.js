import {
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
  } from "firebase/firestore";
  import firestoredb from "../firebaseConfig";
  import moment from "moment";
  
  // Add a new feedback entry
  export const addFeedback = async (payload) => {
    try {
      // Validate payload
      if (!payload.userId || !payload.rating) {
        throw new Error("Missing required fields: userId and rating are required");
      }
  
      // Format the payload with timestamp
      const formattedPayload = {
        ...payload,
        createdAt: new Date(),
        formattedDate: moment().format("DD-MM-YY"),
      };
  
      // Add document to feedback collection
      const feedbackRef = collection(firestoredb, "feedback");
      await addDoc(feedbackRef, formattedPayload);
  
      return {
        success: true,
        message: "Feedback submitted successfully!",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };
  
  // Get all feedback entries
  export const getAllFeedback = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestoredb, "feedback"));
      const feedbacks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
  
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate 
            ? moment(data.createdAt.toDate()).format("DD-MM-YY HH:mm") 
            : moment().format("DD-MM-YY HH:mm"),
        };
      });
  
      return {
        success: true,
        data: feedbacks,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };
  
  // Get feedback for a specific user
  export const getUserFeedback = async (userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
  
      const q = query(
        collection(firestoredb, "feedback"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
  
      const querySnapshot = await getDocs(q);
      const feedbacks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
  
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate 
            ? moment(data.createdAt.toDate()).format("DD-MM-YY HH:mm") 
            : moment().format("DD-MM-YY HH:mm"),
        };
      });
  
      return {
        success: true,
        data: feedbacks,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };
  
  // Get recent feedback (limit to specified number)
  export const getRecentFeedback = async (limitCount = 5) => {
    try {
      const q = query(
        collection(firestoredb, "feedback"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
  
      const querySnapshot = await getDocs(q);
      const feedbacks = querySnapshot.docs.map((doc) => {
        const data = doc.data();
  
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate 
            ? moment(data.createdAt.toDate()).format("DD-MM-YY HH:mm") 
            : moment().format("DD-MM-YY HH:mm"),
        };
      });
  
      return {
        success: true,
        data: feedbacks,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };
  
  // Get average rating
  export const getAverageRating = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestoredb, "feedback"));
      let totalRating = 0;
      const count = querySnapshot.docs.length;
      
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalRating += data.rating || 0;
      });
      
      const averageRating = count > 0 ? totalRating / count : 0;
      
      return {
        success: true,
        data: {
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: count
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  };