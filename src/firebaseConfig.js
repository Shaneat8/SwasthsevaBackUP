import { initializeApp } from "firebase/app";
// import { setLogLevel} from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";



const firebaseConfig = {
  apiKey: "AIzaSyDizCIDBCA2DUHGVB_ETgVSRoPJGcJYlmc",
  authDomain: "home-23706.firebaseapp.com",
  projectId: "home-23706",
  storageBucket: "home-23706.appspot.com",
  messagingSenderId: "625893687003",
  appId: "1:625893687003:web:08e3f8e2ca2774467556fe"
};

const app = initializeApp(firebaseConfig);
const firestoredb=getFirestore(app);
//setLogLevel('debug');
export const auth=getAuth(app);
export const googleProvider=new GoogleAuthProvider();
export default firestoredb;
