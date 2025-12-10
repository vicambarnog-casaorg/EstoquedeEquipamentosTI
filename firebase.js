// firebase.js
// Inicializa Firebase (compat) e expõe auth, db, storage globalmente
(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyAwCfiEB3JEUu_6rKR32C2E5whnb6-SgX0",
    authDomain: "sis-eetibkp.firebaseapp.com",
    projectId: "sis-eetibkp",
    storageBucket: "sis-eetibkp.firebasestorage.app",
    messagingSenderId: "524123050144",
    appId: "1:524123050144:web:79fba6107cf073118679c5"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.firebase = firebase;
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  window.storage = firebase.storage();

  // dicas: se quiser usar regras de segurança, ajuste no console do Firebase
})();
