// firebase.js

  const firebaseConfig = {
    apiKey: "AIzaSyAwCfiEB3JEUu_6rKR32C2E5whnb6-SgX0",
    authDomain: "sis-eetibkp.firebaseapp.com",
    projectId: "sis-eetibkp",
    storageBucket: "sis-eetibkp.firebasestorage.app",
    messagingSenderId: "524123050144",
    appId: "1:524123050144:web:79fba6107cf073118679c5"
  };

  
  firebase.initializeApp(firebaseConfig);
  
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  
