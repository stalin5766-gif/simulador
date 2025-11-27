// ==========================================
// CONFIGURACIÓN Y REFERENCIAS
// ==========================================
const MATERIA_URL = './preguntas/escalabilidad.json'; // Asegúrate de que esta ruta sea correcta
const CANTIDAD_EXAMEN = 30;
const STORAGE_KEY = 'simulador_data_v2'; // Clave única para guardar/cargar

// Referencias DOM
const startScreen = document.getElementById('startScreen');
const quizContainer = document.getElementById('quizContainer');
const preguntaRender = document.getElementById('preguntaRender');
const resultScreen = document.getElementById('resultScreen');
const reviewContainer = document.getElementById('reviewContainer');
const reviewActions = document.getElementById('reviewActions');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerEl = document.getElementById('timer');
const estado = document.getElementById('estado');

// Botones Principales
const btnEmpezar = document.getElementById('btnEmpezar');
const btnReview = document.getElementById('btnReview');
const btnGuardar = document.getElementById('btnGuardar'); 
const btnCargar = document.getElementById('btnCargar'); 
const modoSel = document.getElementById('modo');
const minutosSel = document.getElementById('minutos');

// Variables de Estado
let banco = [];
let ronda = [];
let idx = 0;
let respuestasUsuario = [];
let seleccionTemporal = null;
let interval = null;

// ==========================================
// CONFIGURACIÓN DE AUDIO
// ==========================================
const SOUND_CORRECTA = new Audio('./sonidos/correcta.mp3');
const SOUND_INCORRECTA = new Audio('./sonidos/incorrecta.mp3');
const btnToggleSound = document.getElementById('btnToggleSound');
const iconSound = document.getElementById('iconSound');

let sonidoActivado = localStorage.getItem('sonidoActivado') !== 'false';

function reproducirSonido(tipo) {
    if (!sonidoActivado) return;
    tipo.currentTime = 0;
    tipo.play().catch(e => console.log("Error al reproducir sonido:", e));
}

function actualizarBotonSonido() {
    if (iconSound) {
        iconSound.textContent = sonidoActivado ? '🔊' : '🔇';
    }
}

if (btnToggleSound) {
    actualizarBotonSonido();
    btnToggleSound.onclick = () => {
        sonidoActivado = !sonidoActivado;
        localStorage.setItem('sonidoActivado', sonidoActivado);
        actualizarBotonSonido();
    };
}

// ==========================================
// CONTADOR AL LADO DEL RELOJ
// ==========================================
let divContador = document.getElementById("contadorPreguntas");

if (!divContador) {
    divContador = document.createElement("span");
    divContador.id = "contadorPreguntas";
    divContador.style.marginRight = "15px";
    divContador.style.paddingRight = "15px";
    divContador.style.borderRight = "2px solid #e5e7eb";
    divContador.style.color = "#4b5563";
    divContador.style.fontWeight = "bold";
    divContador.style.fontSize = "1.1rem";
    divContador.style.display = "none";
    divContador.textContent = "Pregunta 1 / --";

    if (timerEl && timerEl.parentNode) {
        timerEl.parentNode.style.display = "flex";
        timerEl.parentNode.style.alignItems = "center";
        timerEl.parentNode.insertBefore(divContador, timerEl);
    } else {
        divContador.style.position = "fixed";
        divContador.style.top = "10px";
        divContador.style.right = "10px";
        document.body.appendChild(divContador);
    }
}

function actualizarContadorPreguntas() {
    if (!ronda.length) return;
    divContador.style.display = "block";
    divContador.textContent = `Pregunta ${idx + 1} / ${ronda.length}`;
}

// ==========================================
// CARGA DE DATOS
// ==========================================
async function cargarMateria() {
    try {
        const res = await fetch(MATERIA_URL);
        if (!res.ok) throw new Error(`No se pudo cargar ${MATERIA_URL}`);
        banco = await res.json();
        return true;
    } catch (e) {
        alert("Error: " + e.message);
        if(estado) estado.textContent = "Fallo al cargar preguntas. Verifica la consola.";
        return false;
    }
}

// ==========================================
// INICIAR QUIZ
// ==========================================
btnEmpezar.onclick = async () => {
    btnEmpezar.disabled = true;
    btnEmpezar.innerText = "Cargando...";

    const exito = await cargarMateria();
    if (!exito) {
        btnEmpezar.disabled = false;
        btnEmpezar.innerText = "Reintentar";
        return;
    }

    respuestasUsuario = [];
    idx = 0;

    if (modoSel.value === 'examen') {
        ronda = banco.sort(() => 0.5 - Math.random()).slice(0, CANTIDAD_EXAMEN);
    } else {
        ronda = banco.sort(() => 0.5 - Math.random());
    }

    iniciarInterfazQuiz();
};

function iniciarInterfazQuiz() {
    startScreen.classList.add('hidden');
    quizContainer.classList.remove('hidden');

    btnEmpezar.disabled = false;
    btnEmpezar.innerText = "Empezar";

    iniciarTimer();
    mostrarPregunta();
}

// ==========================================
// CARGAR PROGRESO
// ==========================================
btnCargar.onclick = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (!savedData) {
        alert("No hay ningún progreso guardado.");
        return;
    }

    try {
        const data = JSON.parse(savedData);
        
        ronda = data.ronda || [];
        respuestasUsuario = data.respuestasUsuario || [];
        idx = data.idx || 0;
        
        if (data.modo) modoSel.value = data.modo;

        if (ronda.length === 0) {
            alert("El archivo guardado está vacío o corrupto.");
            return;
        }

        alert(`Progreso cargado. Continuando en la pregunta ${idx + 1}.`);
        iniciarInterfazQuiz();

    } catch (e) {
        alert("Error al leer el archivo de guardado.");
        console.error(e);
    }
};

// ==========================================
// TIMER
// ==========================================
function iniciarTimer() {
    clearInterval(interval);
    let seg = parseInt(minutosSel.value, 10) * 60;

    if (seg <= 0) {
        timerEl.textContent = '∞';
        return;
    }

    timerEl.textContent = fmt(seg);

    interval = setInterval(() => {
        seg--;
        timerEl.textContent = fmt(seg);
        if (seg <= 0) {
            clearInterval(interval);
            finalizarQuiz(true);
        }
    }, 1000);
}

function fmt(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

// ==========================================
// RENDERIZAR PREGUNTA
// ==========================================
function mostrarPregunta() {
    seleccionTemporal = null;

    if (idx >= ronda.length) {
        finalizarQuiz(false);
        return;
    }

    actualizarContadorPreguntas();
    const q = ronda[idx];

    preguntaRender.innerHTML = `
        <h2 class="text-lg font-bold text-gray-800 mb-4">${q.pregunta}</h2>

        ${q.imagen ? `
        <div class="flex justify-center mb-4">
            <img src="${q.imagen}" class="quiz-image" style="max-height: 300px; max-width: 100%;">
        </div>` : ''}

        <div id="opcionesBox" class="flex flex-col gap-2"></div>

        <div id="studyLocalControls" class="mt-4 flex gap-3 hidden">
            <button id="btnGuardarProgreso" class="text-xs text-blue-600 underline cursor-pointer">
                💾 Guardar progreso actual y salir
            </button>
        </div>

        <div class="mt-6 flex justify-end">
            <button id="btnSiguiente" class="btn-start" style="width:auto; padding:8px 25px; opacity:0.5;" disabled>
                ${idx === ronda.length - 1 ? 'Finalizar' : 'Siguiente'}
            </button>
        </div>
    `;

    const opcionesBox = document.getElementById('opcionesBox');
    q.opciones.forEach((op, i) => {
        const btn = document.createElement('button');
        btn.className = "opt";
        btn.textContent = op;
        
        if (respuestasUsuario[idx] !== undefined && respuestasUsuario[idx] === i) {
            btn.classList.add('option-selected');
        }
        
        btn.onclick = () => seleccionar(i, btn);
        opcionesBox.appendChild(btn);
    });

    document.getElementById('btnSiguiente').onclick = avanzar;

    const studyControls = document.getElementById('studyLocalControls');
    if (modoSel.value === "estudio") {
        studyControls.classList.remove('hidden');
        
        document.getElementById('btnGuardarProgreso').onclick = () => {
            const estadoGuardar = {
                ronda: ronda,
                idx: idx,
                respuestasUsuario: respuestasUsuario,
                modo: modoSel.value
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoGuardar));
            alert("✅ Progreso guardado.\n\nPuedes cerrar la página. Cuando vuelvas, usa el botón 'Cargar Progreso' en el inicio.");
        };
    }
}

// ==========================================
// SELECCIÓN DE RESPUESTA
// ==========================================
function seleccionar(index, btnRef) {
    const q = ronda[idx];
    const all = document.querySelectorAll('#opcionesBox button');
    const btnNext = document.getElementById('btnSiguiente');

    all.forEach(b => b.classList.remove('option-selected', 'ans-correct', 'ans-wrong'));

    seleccionTemporal = index;

    if (modoSel.value === "estudio") {
        if (index === q.respuesta) {
            btnRef.classList.add("ans-correct");
            reproducirSonido(SOUND_CORRECTA);
        } else {
            btnRef.classList.add("ans-wrong");
            if (all[q.respuesta]) all[q.respuesta].classList.add("ans-correct");
            reproducirSonido(SOUND_INCORRECTA);
        }

        if (q.explicacion) {
            if (!preguntaRender.querySelector('.explanation-box')) {
                const box = document.createElement("div");
                box.className = "explanation-box bg-blue-50 border border-blue-200 p-3 rounded mt-3 text-sm text-blue-800";
                box.innerHTML = `<b>Explicación:</b> ${q.explicacion}`;
                preguntaRender.appendChild(box);
            }
        }
    } else {
        btnRef.classList.add('option-selected');
    }

    btnNext.disabled = false;
    btnNext.style.opacity = "1";
}

function avanzar() {
    if (seleccionTemporal === null) return;

    if (modoSel.value === "examen") {
        const preguntaActual = ronda[idx];
        if (seleccionTemporal === preguntaActual.respuesta) {
            reproducirSonido(SOUND_CORRECTA);
        } else {
            reproducirSonido(SOUND_INCORRECTA);
        }
    }

    respuestasUsuario[idx] = seleccionTemporal;

    idx++;
    mostrarPregunta();
}

// ==========================================
// FINALIZAR QUIZ
// ==========================================
function finalizarQuiz(tiempoTerminado) {
    clearInterval(interval);
    quizContainer.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    divContador.style.display = "none";

    localStorage.removeItem(STORAGE_KEY);

    let aciertos = 0;
    ronda.forEach((p, i) => {
        if (respuestasUsuario[i] === p.respuesta) aciertos++;
    });

    scoreDisplay.textContent = `${aciertos} / ${ronda.length}`;

    if (tiempoTerminado) alert("¡Se acabó el tiempo!");
}

btnReview.onclick = () => {
    resultScreen.classList.add('hidden');
    reviewContainer.classList.remove('hidden');
    reviewActions.classList.remove('hidden');

    reviewContainer.innerHTML = '';

    ronda.forEach((p, i) => {
        const userAns = respuestasUsuario[i];
        const isCorrect = (userAns === p.respuesta);

        const card = document.createElement('div');
        card.className = "bg-white p-4 rounded border shadow-sm mb-4";

        let html = `<p class="font-bold mb-2 text-gray-800">${i + 1}. ${p.pregunta}</p>`;

        if (p.imagen) {
            html += `<img src="${p.imagen}" class="quiz-image mb-2" style="max-height:150px;">`;
        }

        p.opciones.forEach((op, k) => {
            let cls = "border border-gray-200 text-gray-700";
            
            if (k === p.respuesta) {
                cls = "bg-green-100 border-green-500 text-green-800 font-semibold";
            } else if (k === userAns && !isCorrect) {
                cls = "bg-red-100 border-red-500 text-red-800";
            } else if (k === userAns && isCorrect) {
                cls = "bg-green-100 border-green-500 text-green-800 font-semibold";
            }

            html += `<div class="p-2 rounded mb-1 ${cls}">${op}</div>`;
        });

        if (p.explicacion) {
            html += `<div class="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded">Nota: ${p.explicacion}</div>`;
        }

        card.innerHTML = html;
        reviewContainer.appendChild(card);
    });
};

// Guardado manual
if (btnGuardar) {
    btnGuardar.onclick = () => {
        if(ronda.length === 0) {
            alert("No hay un examen activo para guardar.");
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
            ronda, 
            respuestasUsuario, 
            idx,
            modo: modoSel.value 
        }));
        alert("Guardado global exitoso.");
    };
}
