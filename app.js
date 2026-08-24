import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// PASTE YOUR FIREBASE CONFIGURATION HERE
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const farmerForm = document.getElementById('farmerForm');
const statusMsg = document.getElementById('statusMessage');
const tableBody = document.getElementById('farmerTableBody');

// 1. Real-Time Listener: Load & updates records automatically on page load or refresh
onSnapshot(collection(db, "farmers"), (snapshot) => {
  tableBody.innerHTML = ""; // Clear table before rendering live data
  snapshot.forEach((docSnap) => {
    const farmer = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>+${docSnap.id}</strong></td>
      <td>${farmer.fullName}</td>
      <td>${farmer.location}</td>
      <td>${farmer.cropType}</td>
      <td><span style="color: #2e7d32; font-weight: bold;">Paid (KES 240)</span></td>
    `;
    tableBody.appendChild(row);
  });
});

// 2. Form Submission & Primary Key Enforcement
farmerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  let rawPhone = document.getElementById('phone').value.trim();
  const fullName = document.getElementById('fullName').value.trim();
  const location = document.getElementById('location').value.trim();
  const cropType = document.getElementById('cropType').value.trim();

  // Format Kenyan phone numbers (e.g. 01... or 07... to 2541...)
  if (rawPhone.startsWith('0')) {
    rawPhone = '254' + rawPhone.substring(1);
  }

  const phoneId = rawPhone; // Primary Key
  statusMsg.style.color = '#0288d1';
  statusMsg.textContent = 'Checking registration status...';

  try {
    const farmerRef = doc(db, "farmers", phoneId);
    const docSnap = await getDoc(farmerRef);

    // Primary Key Check
    if (docSnap.exists()) {
      statusMsg.style.color = '#d32f2f';
      statusMsg.textContent = `Error: Phone number +${phoneId} is already registered!`;
      return;
    }

    // Write new farmer to Firebase Firestore
    await setDoc(farmerRef, {
      fullName: fullName,
      location: location,
      cropType: cropType,
      feePaid: 240,
      registeredAt: serverTimestamp()
    });

    statusMsg.style.color = '#2e7d32';
    statusMsg.textContent = 'Registration successful! Saved to database.';
    farmerForm.reset();

  } catch (error) {
    console.error("Database Error:", error);
    statusMsg.style.color = '#d32f2f';
    statusMsg.textContent = 'Failed to register. Please check internet connection.';
  }
});
