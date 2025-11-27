/* ================================
   Variables globales
================================ */
let preguntas = [];
let preguntaActual = 0;
let respuestasUsuario = [];
let tiempoRestante = 0;
let timerInterval = null;

let usuarioEmail = "";
let usuarioVerificado = false;

// ← CAMBIO #1 (const → let)
let MATERIA_URL = './preguntas/escalabilidad.json';

/* ============================================
   Referencias del DOM
============================================ */
const btnEmpezar = document.getElementById("btnEmpezar");
const modoSel = document.getElementById("modo");
const minutosSel = document.getElementById("minutos");
const quizContainer = document.getElementById("quizContainer");
const preguntaRender = document.getElementById("preguntaRender");
const indicadores = document.getElementById("indicadores");
const indicadorNumero = document.getElementById("indicadorNumero");
const indicadorRestantes = document.getElementById("indicadorRestantes");
const resultScreen = document.getElementById("resultScreen");
const scoreDisplay = document.getElementById("scoreDisplay");
const reviewContainer = document.getElementById("reviewContainer");
const reviewActions = document.getElementById("reviewActions");
const startScreen = document.getElementById("startScreen");
const timerDisplay = document.getElementById("timerDisplay");
const timer = document.getElementById("timer");

const btnGuardar = document.getElementById("btnGuardar");
const btnCargar = document.getElementById("btnCargar");
const estado = document.getElementById("estado");

/* ============================================
   CAMBIO #2
   Detectar MATERIA seleccionada
============================================ */
const materiaSel = document.getElementById("materia");

if (materiaSel) {
    materiaSel.onchange = function () {
        MATERIA_URL = this.value;  
        console.log("Materia seleccionada:", MATERIA_URL);
    };
}

/* ============================================
   Cargar Preguntas
============================================ */
async function cargarMateria() {
    try {
        const res = await fetch(MATERIA_URL);
        preguntas = await res.json();
        console.log("Preguntas cargadas:", preguntas.length);
    } catch (error) {
        console.error("Error cargando JSON:", error);
        alert("Error al cargar las preguntas.");
    }
}

/* ============================================
   Iniciar Quiz
============================================ */
btnEmpezar.onclick = async () => {
    await cargarMateria();

    const modo = modoSel.value;
    const minutos = parseInt(minutosSel.value);

    if (modo === "examen") {
        preguntas = preguntas.sort(() => Math.random() - 0.5).slice(0, 30);
    }

    preguntaActual = 0;
    respuestasUsuario = new Array(preguntas.length).fill(null);

    startScreen.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    renderPregunta();
    actualizarIndicadores();

    if (minutos > 0) iniciarTimer(minutos * 60);
};

/* ============================================
   Renderizar Pregunta
============================================ */
function renderPregunta() {
    const p = preguntas[preguntaActual];

    let html = `
        <h2 class="font-bold text-lg mb-2">${p.pregunta}</h2>
        <div class="flex flex-col gap-2">
    `;

    p.opciones.forEach((op, i) => {
        html += `
        <button class="opcion-btn" onclick="seleccionarOpcion(${i})">
            ${op}
        </button>`;
    });

    html += `</div>`;

    preguntaRender.innerHTML = html;
}

/* ============================================
   Seleccionar Opción
============================================ */
function seleccionarOpcion(i) {
    respuestasUsuario[preguntaActual] = i;

    if (preguntaActual < preguntas.length - 1) {
        preguntaActual++;
        renderPregunta();
        actualizarIndicadores();
    } else {
        terminarQuiz();
    }
}

/* ============================================
   Indicadores
============================================ */
function actualizarIndicadores() {
    indicadorNumero.textContent = `Pregunta ${preguntaActual + 1} de ${preguntas.length}`;
    indicadorRestantes.textContent = `${preguntas.length - preguntaActual - 1} restantes`;
}

/* ============================================
   Timer
============================================ */
function iniciarTimer(segundos) {
    tiempoRestante = segundos;

    timerInterval = setInterval(() => {
        tiempoRestante--;

        timer.textContent = formatearTiempo(tiempoRestante);

        if (tiempoRestante <= 0) {
            clearInterval(timerInterval);
            terminarQuiz();
        }
    }, 1000);
}

function formatearTiempo(s) {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
}

/* ============================================
   Terminar
============================================ */
function terminarQuiz() {
    quizContainer.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    let correctas = 0;

    preguntas.forEach((p, i) => {
        if (respuestasUsuario[i] === p.correcta) correctas++;
    });

    scoreDisplay.textContent = `${correctas} / ${preguntas.length}`;
}

/* ============================================
   Revisar Respuestas
============================================ */
document.getElementById("btnReview").onclick = () => {
    resultScreen.classList.add("hidden");
    reviewContainer.classList.remove("hidden");
    reviewActions.classList.remove("hidden");

    reviewContainer.innerHTML = "";

    preguntas.forEach((p, i) => {
        const esCorrecta = respuestasUsuario[i] === p.correcta;

        reviewContainer.innerHTML += `
            <div class="border p-2 mb-2 rounded ${esCorrecta ? "bg-green-100" : "bg-red-100"}">
                <p class="font-bold">${p.pregunta}</p>
                <p><b>Tu respuesta:</b> ${p.opciones[respuestasUsuario[i]] || "Sin respuesta"}</p>
                <p><b>Correcta:</b> ${p.opciones[p.correcta]}</p>
            </div>
        `;
    });
};

/* ============================================
   Guardar / Cargar progreso
============================================ */
btnGuardar.onclick = () => {
    const datos = {
        preguntas,
        respuestasUsuario,
        preguntaActual,
        tiempoRestante,
    };

    localStorage.setItem("progresoSimulador", JSON.stringify(datos));
    estado.textContent = "Progreso guardado ✔";
};

btnCargar.onclick = () => {
    const datos = JSON.parse(localStorage.getItem("progresoSimulador"));

    if (!datos) {
        estado.textContent = "No hay progreso guardado.";
        return;
    }

    preguntas = datos.preguntas;
    respuestasUsuario = datos.respuestasUsuario;
    preguntaActual = datos.preguntaActual;
    tiempoRestante = datos.tiempoRestante;

    startScreen.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    renderPregunta();
    actualizarIndicadores();

    if (tiempoRestante > 0) iniciarTimer(tiempoRestante);
};

/* ============================================
   FIN
============================================ */
