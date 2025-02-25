import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import firestoredb from "../firebaseConfig";
import moment from "moment";


export const addMedicine = async (payload) => {
  try {
    const medicineRef = doc(firestoredb, "medicine", payload.medicineId);
    const medicineSnap = await getDoc(medicineRef);

    // Convert date fields to Firestore-compatible formats (ISO string or Timestamp)
    const formattedPayload = {
      ...payload,
      expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : null,
      DOM: moment(payload.DOM, "DD-MM-YY").toDate(), // Convert to JavaScript Date
    };

    if (medicineSnap.exists()) {
      // Medicine already exists -> Update quantity & date
      const existingData = medicineSnap.data();
      const updatedQuantity = existingData.quantity + payload.quantity;

      await updateDoc(medicineRef, {
        quantity: updatedQuantity,
        DOM: formattedPayload.DOM, // Update the modification date
      });

      return {
        success: true,
        message: "Medicine already existed. Quantity updated successfully!",
      };
    } else {
      // Medicine does not exist -> Add new entry
      await setDoc(medicineRef, formattedPayload);

      return {
        success: true,
        message: "Medicine added successfully!",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const getMedicineList = async () => {
  try {
    const querySnapshot = await getDocs(collection(firestoredb, "medicine"));
    const medicines = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        ...data,
        id: doc.id,
        DOM:
          data.DOM && data.DOM.toDate
            ? moment(data.DOM.toDate()).format("DD-MM-YY")
            : "", // Convert Firestore timestamp
        expiryDate: data.expiryDate?.toDate
          ? moment(data.expiryDate.toDate()).format("DD-MM-YY")
          : "",
      };
    });

    return {
      success: true,
      data: medicines,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const AddMedicineDiagnosis = async (payload) => {
  try {
    const prescriptionsRef = collection(firestoredb, "prescriptions");
    await addDoc(prescriptionsRef, payload);
    return {
      success: true,
      message: "Prescription added successfully!",
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export const updateMedicineQuantity = async (prescribedMedicines) => {
  try {
    // Validate input
    if (!Array.isArray(prescribedMedicines)) {
      throw new Error("Invalid prescribed medicines data");
    }

    const updates = await Promise.all(
      prescribedMedicines.map(async (medicine) => {
        // Calculate total quantity prescribed
        const morning = Number(medicine.morning || 0);
        const afternoon = Number(medicine.afternoon || 0);
        const night = Number(medicine.night || 0);
        const days = Number(medicine.days || 0);
        const totalPrescribed = (morning + afternoon + night) * days;

        // Get current medicine data
        const medicineRef = doc(firestoredb, "medicine", medicine.medicineId);
        const medicineSnap = await getDoc(medicineRef);

        if (!medicineSnap.exists()) {
          throw new Error(`Medicine with ID ${medicine.medicineId} not found`);
        }

        const currentData = medicineSnap.data();
        const currentQuantity = Number(currentData.quantity || 0);

        // Validate if enough quantity is available
        if (currentQuantity < totalPrescribed) {
          throw new Error(
            `Insufficient quantity for medicine ${currentData.medicineName}. Available: ${currentQuantity}, Required: ${totalPrescribed}`
          );
        }

        // Update quantity
        const newQuantity = currentQuantity - totalPrescribed;
        await updateDoc(medicineRef, {
          quantity: newQuantity,
          lastUpdated: new Date().toISOString()
        });

        return {
          medicineId: medicine.medicineId,
          medicineName: currentData.medicineName,
          quantityReduced: totalPrescribed,
          remainingQuantity: newQuantity
        };
      })
    );

    return {
      success: true,
      message: "Medicine quantities updated successfully",
      updates: updates
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
};