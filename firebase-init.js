// Configuración de tu proyecto (Copiada de tu imagen)
const firebaseConfig = {
  apiKey: "AIzaSyBU1oaDdq6qD4fTiLN41SAeQg6Kp06gDXk",
  authDomain: "simulador-tics.firebaseapp.com",
  projectId: "simulador-tics",
  storageBucket: "simulador-tics.firebasestorage.app", // Corregido (a veces la consola pone .appspot.com, pero firebasestorage es más seguro para v8)
  messagingSenderId: "501091859008",
  appId: "1:501091859008:web:80e4596d2adcb5adbf7da5",
  measurementId: "G-5LFLE4MBPH"
};

// Inicialización (Estilo v8 compat)
// Verificamos si ya existe una instancia para no crear doble
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); 
}

// Exportamos las variables globales para que auth.js y app.js las vean
const auth = firebase.auth();
const db = firebase.firestore();
