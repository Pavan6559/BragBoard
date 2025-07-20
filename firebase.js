// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCSIckFuiXvb_BEmIpIL52d3VqiZtj4Xj0",
    authDomain: "bragboard-73ca2.firebaseapp.com",
    projectId: "bragboard-73ca2",
    storageBucket: "bragboard-73ca2.appspot.com",
    messagingSenderId: "34545851838",
    appId: "1:34545851838:web:760d39b6574529cd16adef",
    measurementId: "G-45NZTN2TLD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
