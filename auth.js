// LISTA BLANCA
const correosPermitidos = [
  "dpachecog2@unemi.edu.ec", "cnavarretem4@unemi.edu.ec", "htigrer@unemi.edu.ec",
  "gorellanas2@unemi.edu.ec", "iastudillol@unemi.edu.ec", "sgavilanezp2@unemi.edu.ec",
  "jzamoram9@unemi.edu.ec", "fcarrillop@unemi.edu.ec", "naguilarb@unemi.edu.ec",
  "ehidalgoc4@unemi.edu.ec", "lbrionesg3@unemi.edu.ec", "xsalvadorv@unemi.edu.ec",
  "nbravop4@unemi.edu.ec", "jmoreirap6@unemi.edu.ec", "kholguinb2@unemi.edu.ec",
  "jcastrof8@unemi.edu.ec", "cgomezy2@unemi.edu.ec", "mvegaa2@unemi.edu.ec", "earrobas@unemi.edu.ec",
  "ccedenov6@unemi.edu.ec",

  // Gmail añadido
  "apoyochat.trabajosocial@gmail.com"
];

// Referencias
const authPanel = document.getElementById("authPanel");
const appPanel = document.getElementById("appPanel");
const authMsg = document.getElementById("authMsg");
const btnGoogle = document.getElementById("btnGoogle");
const btnLogout = document.getElementById("btnLogoutHeader"); 

// ID Dispositivo
function getDeviceId() {
  let id = localStorage.getItem("deviceId_secure");
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substr(2, 9) + Date.now();
    localStorage.setItem("deviceId_secure", id);
  }
  return id;
}

// Validar Seguridad
async function validarSeguridad(user) {
  try {
    const userRef = db.collection("usuarios_seguros").doc(user.email); 
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

// Botón Google
btnGoogle.onclick = async () => {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    let correo = result.user.email.toLowerCase();

    // Validación final
    if (!correosPermitidos.includes(correo)) {
      await auth.signOut();
      authMsg.textContent = "Correo no autorizado.";
      return;
    }

  } catch (e) {
    authMsg.textContent = e.message;
  }
};

// Botón Logout
if (btnLogout) {
  btnLogout.onclick = () => {
    auth.signOut().then(() => window.location.reload());
  };
}

// MONITOR DE SESIÓN
auth.onAuthStateChanged(async (user) => {
  if (user) {

    // Validación reforzada (solo si está en la lista, sin dominio obligatorio)
    const correo = user.email.toLowerCase();
    const estaEnLista = correosPermitidos.includes(correo);

    if (!estaEnLista) {
      alert("Tu cuenta no está autorizada para acceder al simulador.");
      await auth.signOut();
      return;
    }

    authPanel.classList.add("hidden");
    const validacion = await validarSeguridad(user);

    if (validacion.permitido) {
      appPanel.classList.remove("hidden");
      if(btnLogout) btnLogout.classList.remove("hidden"); 
      
      const userEmailDisplay = document.getElementById("userEmailDisplay");
      const verificationMsg = document.getElementById("verificationMsg");
      
      if(userEmailDisplay) userEmailDisplay.textContent = user.email;
      if(verificationMsg) verificationMsg.classList.remove("hidden"); 

    } else {
      alert(validacion.msg);
      await auth.signOut();
      window.location.reload();
    }
  } else {
    authPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    if(btnLogout) btnLogout.classList.add("hidden"); 
  }
});
