// Configuración de tu proyecto (Copiada de tu imagen)
const firebaseConfig = {
  apiKey: "AIzaSyDTxkPNlA8q6PfD-8KwmVfh12bK6cXT1cg",
  authDomain: "simulador-st.firebaseapp.com",
  projectId: "simulador-st",
  storageBucket: "simulador-st.appspot.com",
  messagingSenderId: "682714171968",
  appId: "1:682714171968:web:38d785d9e1343d3e96ada5",
  measurementId: "G-HMJ2FKMZ9T"
};

// Inicialización (Estilo v8 compat)
// Verificamos si ya existe una instancia para no crear doble
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); 
}

// Exportamos las variables globales para que auth.js y app.js las vean
window.auth = firebase.auth(); // <-- CRUCIAL: Usar window
window.db = firebase.firestore(); // <-- CRUCIAL: Usar window
