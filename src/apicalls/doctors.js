import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import firestoredb from "../firebaseConfig";

export const AddDoctor = async (payload) => {
  try {
    await setDoc(doc(firestoredb, "doctors", payload.userId), payload);
    //update user role
    await updateDoc(doc(firestoredb, "users", payload.userId), {
      role: "doctor(provisional)",
    });
    return {
      success: true,
      message: "Doctor added successfully ,please wait for approval",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


export const CheckIfDoctorApplied = async (id) => {
  try {
    const doctors = await getDocs(
      query(collection(firestoredb, "doctors"), where("userId", "==", id))
    );
    if (doctors.size > 0) {
      return {
        success: true,
        message: "Doctor account already Applied!",
        data: doctors.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          };
        })[0],
      };
    }
    return {
      success: false,
      message: "Doctor account not Applied",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const GetAllDoctors = async () => {
  try {
    const doctors = await getDocs(collection(firestoredb, "doctors"));
    return {
      success: true,
      data: doctors.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      }),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

//updating doctor status i.e. approved, rejected, blocked
export const UpdateDoctor = async (payload) => {
  try {
    await setDoc(doc(firestoredb, "doctors", payload.id), payload);

    // Handle role changes based on status
    if (payload.status === "approved") {
      await updateDoc(doc(firestoredb, "users", payload.userId), {
        role: "doctor",
      });
    } else if (payload.status === "blocked") {
      await updateDoc(doc(firestoredb, "users", payload.userId), {
        role: "doctor(provisional)",
      });
    }

    return {
      success: true,
      message: "Doctor updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};


export const GetDoctorById = async (id) => {
  try {
    const doctor = await getDoc(doc(firestoredb, "doctors", id));
    return {
      success: true,
      data: doctor.data(),
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};
