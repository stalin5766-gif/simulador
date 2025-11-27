// --- LAS VARIABLES DE FIREBASE DEBEN VENIR DE FIREBASE-INIT.JS ---
// Ya no definimos auth y db aquí, solo las usamos.

// ==========================================
// 1. LISTA BLANCA (Correos Autorizados)
// ==========================================
const correosPermitidos = [
  "cgomezy2@unemi.edu.ec", "mvegaa2@unemi.edu.ec", "earrobas@unemi.edu.ec",
  "ccedenov6@unemi.edu.ec", "sgavilanezp2@unemi.edu.ec", "dzambranod6@unemi.edu.ec",
  
  // Gmail añadido
  "apoyochat.trabajosocial@gmail.com"
];

// ==========================================
// 2. REFERENCIAS AL DOM
// ==========================================
const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const authMsg = document.getElementById("authMsg");
const btnGoogle = document.getElementById("btnGoogle");
const btnLogoutHeader = document.getElementById("btnLogoutHeader"); 
const userEmailDisplay = document.getElementById("userEmailDisplay");
const verificationMsg = document.getElementById("verificationMsg");

// ==========================================
// 3. SEGURIDAD DE DISPOSITIVO
// ==========================================
function getDeviceId() {
  let id = localStorage.getItem("deviceId_secure");
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("deviceId_secure", id);
  }
  return id;
}

async function validarSeguridad(user) {
  try {
    const userRef = db.collection("autorizados").doc(user.email); 
    const snap = await userRef.get();
    const miDispositivo = getDeviceId();

    if (!snap.exists) {
      await userRef.set({
        uid: user.uid, email: user.email,
        dispositivos: [miDispositivo], ultimoAcceso: new Date()
      });
      return { permitido: true };
    }

    const data = snap.data();
    let dispositivos = data.dispositivos || [];

    if (dispositivos.includes(miDispositivo)) {
      await userRef.update({ ultimoAcceso: new Date() });
      return { permitido: true };
    } else {
      if (dispositivos.length < 2) {
        dispositivos.push(miDispositivo);
        await userRef.update({ dispositivos: dispositivos, ultimoAcceso: new Date() });
        return { permitido: true };
      } else {
        return { permitido: false, msg: "⛔ Límite de dispositivos excedido." };
      }
    }
  } catch (error) {
    console.error("Error seguridad (DB):", error);
    return { permitido: true }; 
  }
}

// ==========================================
// 4. LÓGICA DE REDIRECCIÓN (IMPORTANTE)
// ==========================================
// 1. Intentar iniciar sesión con la redirección
async function handleRedirectResult() {
    try {
        const result = await auth.getRedirectResult();
        if (result.user) {
            // Si hay un usuario, la función onAuthStateChanged lo manejará
            return;
        }
    } catch (error) {
        console.error("Error al obtener resultado de redirección:", error);
        if(authMsg) authMsg.textContent = "Error de autenticación: " + error.message;
    }
}

// 2. Manejar el inicio de sesión del usuario
function handleUser(user) {
    if (user) {
        const correo = user.email.toLowerCase();
        const estaEnLista = correosPermitidos.includes(correo);

        if (!estaEnLista) {
            alert("🚫 Tu cuenta no está autorizada para acceder al simulador.");
            auth.signOut();
            return;
        }

        // Validación de seguridad (asumiendo que authPanel existe)
        if(authPanel) authPanel.classList.add("hidden");
        
        validarSeguridad(user).then((validacion) => {
            if (validacion.permitido) {
                if(appPanel) appPanel.classList.remove("hidden");
                if(btnLogoutHeader) btnLogoutHeader.classList.remove("hidden");
                
                if(userEmailDisplay) userEmailDisplay.textContent = user.email;
                if(verificationMsg) verificationMsg.classList.remove("hidden"); 

            } else {
                alert(validacion.msg);
                auth.signOut();
                window.location.reload();
            }
        });

    } else {
        // No hay usuario, mostrar login
        if(authPanel) authPanel.classList.remove("hidden");
        if(appPanel) appPanel.classList.add("hidden");
        if(btnLogoutHeader) btnLogoutHeader.classList.add("hidden");
    }
}

// ==========================================
// 5. BOTONES Y EVENTOS
// ==========================================

// Botón Google: Inicia el proceso de redirección
if(btnGoogle) {
    btnGoogle.onclick = async () => {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Usamos Redirect para evitar problemas de popups en navegadores
        await auth.signInWithRedirect(provider); 
        
      } catch (e) {
        if(authMsg) authMsg.textContent = "Error de redirección: " + e.message;
        console.error("Error en signInWithRedirect:", e);
      }
    };
}

// Botón Logout
if (btnLogoutHeader) {
  btnLogoutHeader.onclick = () => {
    if(confirm("¿Cerrar sesión?")) {
        auth.signOut().then(() => window.location.reload());
    }
  };
}

// ==========================================
// 6. MONITOR DE SESIÓN
// ==========================================

// 1. Ejecutar el manejo de redirección al cargar la página
handleRedirectResult();

// 2. Establecer el monitor principal
auth.onAuthStateChanged(handleUser);
