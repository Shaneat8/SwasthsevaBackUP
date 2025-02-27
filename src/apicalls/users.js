import firestoredb from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import CryptoJS from "crypto-js";

export const CreateUser = async (payload) => {
  try {
    //if the user already exist or not
    const que = query(
      collection(firestoredb, "users"),
      where("email", "==", payload.email)
    );
    const ResSnap = await getDocs(que);
    //if user already exists
    if (ResSnap.size > 0) {
      throw new Error("Email Already Exists!");
    }

    //if not converted to string it will return cipher
    const encryptedPass = CryptoJS.AES.encrypt(
      payload.password,
      "project-ss"
    ).toString();
    payload.password = encryptedPass;

    // Add profileComplete field
    payload.profileComplete = false;

    const docRef = collection(firestoredb, "users");
    await addDoc(docRef, payload);
    return {
      success: true,
      message: "User Created Successfully",
    };
  } catch (error) {
    return error;
  }
};

export const LoginUser = async (payload, isGoogleLogin = false) => {
  try {
    const quelog = query(
      collection(firestoredb, "users"),
      where("email", "==", payload.email)
    );
    const resLogin = await getDocs(quelog);

    if (resLogin.size === 0) throw new Error("User does not Exist!");

    const user = resLogin.docs[0].data();
    user.id = resLogin.docs[0].id;
    if (!isGoogleLogin) {
      const UserPass = CryptoJS.AES.decrypt(
        user.password,
        "project-ss"
      ).toString(CryptoJS.enc.Utf8);
      if (UserPass !== payload.password) {
        throw new Error("Incorrect password");
      }
    }

    return {
      success: true,
      message: "User Logged in Successfully",
      data: user,
    };
  } catch (error) {
    return error;
  }
};

// Function to fetch all users
export const GetAllUsers = async () => {
  const users = await getDocs(collection(firestoredb, "users"));
  try {
    return {
      success: true,
      data: users.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      }),
    };
  } catch (error) {
    return error;
  }
};

export const GetUserById = async (id) => {
  try {
    const user = await getDoc(doc(firestoredb, "users", id));
    return {
      success: true,
      data: {
        ...user.data(),
        id: user.id,
      },
    };
  } catch (error) {
    return error;
  }
};

// Function to update user data
export const AddUserData = async (payload) => {
  try {
    // Update user record to indicate details are filled
    await updateDoc(doc(firestoredb, "users", payload.userId), {
      profileComplete: true,
    });

    // Add user details - use userId as document ID
    const userDetailsData = {
      ...payload,
      userId: payload.userId,
      createdAt: new Date(),
      details: "filled",
    };

    await setDoc(
      doc(firestoredb, "userDetails", payload.userId),
      userDetailsData
    );

    return {
      success: true,
      message: "User details added successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const UpdateUserData = async (payload) => {
  try {
    // Update user details - use userId for consistency
    const userDetailsData = {
      ...payload,
      updatedAt: new Date(),
      details: "filled",
    };

    await setDoc(
      doc(firestoredb, "userDetails", payload.userId),
      userDetailsData
    );

    // Ensure profileComplete is true
    await updateDoc(doc(firestoredb, "users", payload.userId), {
      profileComplete: true,
    });

    return {
      success: true,
      message: "User data updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const CheckIfDetailsAlreadyFilled = async (userId) => {
  try {
    // Directly fetch the document using userId as the document ID
    const userDoc = await getDoc(doc(firestoredb, "userDetails", userId));

    if (userDoc.exists()) {
       // Fetch user profile completion status
       const userProfile = await getDoc(doc(firestoredb, "users", userId));
       const profileComplete = userProfile.data().profileComplete;

      return {
        success: true,
        message: "User has already filled details",
        data: {
          ...userDoc.data(),
          id: userDoc.id,
          profileComplete,
        },
      };
    } else {
      return {
        success: false,
        message: "User details not filled",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const CheckProfileCompletion = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestoredb, "users", userId));
    if (userDoc.exists()) {
      const profileComplete = userDoc.data().profileComplete;
      return {
        success: true,
        profileComplete,
      };
    } else {
      return {
        success: false,
        message: "User not found in Firestore.",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to check profile completion. Please try again.",
    };
  }
};

export const GetPatientDetails = async (patientId) => {
  try {
    if (!patientId) {
      throw new Error("Patient ID is required");
    }

    const userDocs = await getDocs(
      query(
        collection(firestoredb, "userDetails"),
        where("userId", "==", patientId)
      )
    );

    const userData = [];
    userDocs.forEach((doc) => {
      userData.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    if (userData.length > 0) {
      return {
        success: true,
        message: "User details found",
        data: userData[0],
      };
    }

    return {
      success: false,
      message: "User details not found",
    };

  } catch (error) {
    console.error("Error fetching patient details:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch patient details",
    };
  }
};

export const LoginAsGuest = () => {
  // Create a guest user object with limited permissions
  const guestUser = {
    id: "guest-" + Date.now(), // Unique guest ID
    name: "Guest User",
    email: "guest@example.com",
    role: "guest",
    isGuest: true,
    profileComplete: true // So they don't get redirected to complete profile
  };
  
  // Store in localStorage
  localStorage.setItem("user", JSON.stringify(guestUser));
  
  return {
    success: true,
    message: "Logged in as guest",
    data: guestUser
  };
};

export const createGuestPopup = (RegistrationPopup, setShowPopup, showPopup) => {
  return showPopup ? (
    <RegistrationPopup onClose={() => setShowPopup(false)} />
  ) : null;
};

export const isGuestUser = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user && user.isGuest;
};