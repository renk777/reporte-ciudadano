const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");
const inputUbicacion = document.getElementById("ubicacion");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_URL = "https://reporte-ciudadano-production.up.railway.app";
const MONTERIA_LAT = 8.7479;
const MONTERIA_LNG = -75.8814;

// Arreglo con todas las imágenes (archivos + fotos de cámara)
let todasLasImagenes = [];

// ── MAPA ──────────────────────────────────────────
const mapa = L.map('mapa').setView([MONTERIA_LAT, MONTERIA_LNG], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

function ponerMarcador(lat, lng) {
  if (marcador) mapa.removeLayer(marcador);
  marcador = L.marker([lat, lng]).addTo(mapa);
  inputUbicacion.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

mapa.on('click', (e) => ponerMarcador(e.latlng.lat, e.latlng.lng));

btnUbicacion.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }
  btnUbicacion.textContent = "Obteniendo...";
  btnUbicacion.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      mapa.setView([pos.coords.latitude, pos.coords.longitude], 16);
      ponerMarcador(pos.coords.latitude, pos.coords.longitude);
      btnUbicacion.textContent = "📍 Usar mi ubicación";
      btnUbicacion.disabled = false;
    },
    () => {
      alert("No se pudo obtener tu ubicación. Selecciona en el mapa.");
      btnUbicacion.textContent = "📍 Usar mi ubicación";
      btnUbicacion.disabled = false;
    }
  );
});

window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapa.setView([pos.coords.latitude, pos.coords.longitude], 16);
        ponerMarcador(pos.coords.latitude, pos.coords.longitude);
      },
      () => { inputUbicacion.placeholder = "Selecciona en el mapa"; }
    );
  }
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaNacimiento").setAttribute("max", hoy);
});

// ── PREVIEW ───────────────────────────────────────
function agregarAlPreview(file, nombre) {
  const id = Date.now() + Math.random();
  todasLasImagenes.push({ id, file, nombre });

  const wrapper = document.createElement("div");
  wrapper.className = "preview-wrapper";
  wrapper.dataset.id = id;

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);

  const btnEliminar = document.createElement("button");
  btnEliminar.className = "btn-eliminar-foto";
  btnEliminar.textContent = "✕";
  btnEliminar.onclick = () => {
    todasLasImagenes = todasLasImagenes.filter(i => i.id !== id);
    wrapper.remove();
  };

  wrapper.appendChild(img);
  wrapper.appendChild(btnEliminar);
  preview.appendChild(wrapper);
}

// Archivos desde el input
inputImagenes.addEventListener("change", () => {
  const archivos = inputImagenes.files;
  for (let i = 0; i < archivos.length; i++) {
    const file = archivos[i];
    if (!file.type.startsWith("image/")) continue;
    agregarAlPreview(file, file.name);
  }
  inputImagenes.value = ""; // reset para poder subir más
});

// ── CÁMARA ────────────────────────────────────────
let streamCamara = null;
let fotoBlob = null;

async function abrirCamara() {
  fotoBlob = null;
  document.getElementById("modal-camara").classList.add("activo");
  document.getElementById("camara-container").style.display = "block";
  document.getElementById("foto-tomada-container").style.display = "none";
  document.getElementById("btnTomarFoto").style.display = "inline-block";
  document.getElementById("btnRetomar").style.display = "none";
  document.getElementById("btnUsarFoto").style.display = "none";

  try {
    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, // cámara trasera en móvil
      audio: false
    });
    document.getElementById("video").srcObject = streamCamara;
  } catch (err) {
    alert("No se pudo acceder a la cámara. Verifica los permisos del navegador.");
    cerrarCamara();
  }
}

function tomarFoto() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  canvas.toBlob((blob) => {
    fotoBlob = blob;
    const fotoURL = URL.createObjectURL(blob);
    document.getElementById("foto-preview").src = fotoURL;

    // Mostrar vista previa
    document.getElementById("camara-container").style.display = "none";
    document.getElementById("foto-tomada-container").style.display = "block";
    document.getElementById("btnTomarFoto").style.display = "none";
    document.getElementById("btnRetomar").style.display = "inline-block";
    document.getElementById("btnUsarFoto").style.display = "inline-block";

    // Detener cámara
    if (streamCamara) streamCamara.getTracks().forEach(t => t.stop());
  }, "image/jpeg", 0.9);
}

function retomar() {
  fotoBlob = null;
  document.getElementById("foto-tomada-container").style.display = "none";
  document.getElementById("camara-container").style.display = "block";
  document.getElementById("btnTomarFoto").style.display = "inline-block";
  document.getElementById("btnRetomar").style.display = "none";
  document.getElementById("btnUsarFoto").style.display = "none";

  // Reactivar cámara
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
    .then(stream => {
      streamCamara = stream;
      document.getElementById("video").srcObject = stream;
    });
}

function usarFoto() {
  if (!fotoBlob) return;
  const nombre = `foto-camara-${Date.now()}.jpg`;
  const file = new File([fotoBlob], nombre, { type: "image/jpeg" });
  agregarAlPreview(file, nombre);
  cerrarCamara();
}

function cerrarCamara() {
  if (streamCamara) streamCamara.getTracks().forEach(t => t.stop());
  streamCamara = null;
  fotoBlob = null;
  document.getElementById("modal-camara").classList.remove("activo");
  document.getElementById("video").srcObject = null;
}

// ── VALIDAR EDAD ──────────────────────────────────
function esMayorDeEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const cumpleEsteAno = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
  return edad > 18 || (edad === 18 && hoy >= cumpleEsteAno);
}

// ── ENVIAR REPORTE ────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fechaNacimiento = document.getElementById("fechaNacimiento").value;
  const inputFecha = document.getElementById("fechaNacimiento");

  if (!fechaNacimiento) {
    inputFecha.classList.add("input-error");
    alert("Por favor ingresa tu fecha de nacimiento.");
    return;
  }

  if (!esMayorDeEdad(fechaNacimiento)) {
    inputFecha.classList.add("input-error");
    alert("Lo sentimos, debes ser mayor de 18 años para enviar un reporte.");
    return;
  }

  inputFecha.classList.remove("input-error");

  const descripcion = document.getElementById("descripcion").value;
  const ubicacion = inputUbicacion.value;

  if (!ubicacion) {
    alert("Por favor selecciona una ubicación en el mapa o usa tu ubicación.");
    return;
  }

  const formData = new FormData();
  formData.append("descripcion", descripcion);
  formData.append("ubicacion", ubicacion);

  // Agregar todas las imágenes (de archivo y de cámara)
  todasLasImagenes.forEach(item => {
    formData.append("imagenes", item.file, item.nombre);
  });

  try {
    const res = await fetch(`${API_URL}/reporte`, { method: "POST", body: formData });
    const data = await res.json();

    alert(`${data.message}\n\n📋 Guarda tu número de reporte para consultarlo después:\nReporte #${data.reporteId}`);

    form.reset();
    preview.innerHTML = "";
    todasLasImagenes = [];
    inputUbicacion.value = "";
    if (marcador) { mapa.removeLayer(marcador); marcador = null; }
    mapa.setView([MONTERIA_LAT, MONTERIA_LNG], 13);

  } catch (error) {
    console.error(error);
    alert("Error al enviar el reporte");
  }
});

// ── CONSULTAR ESTADO ──────────────────────────────
async function consultarEstado() {
  const id = document.getElementById("inputReporteId").value.trim();
  const resultadoDiv = document.getElementById("resultado-consulta");
  const errorDiv = document.getElementById("error-consulta");

  resultadoDiv.style.display = "none";
  errorDiv.style.display = "none";

  if (!id) {
    errorDiv.textContent = "Por favor ingresa el número del reporte.";
    errorDiv.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/reporte/estado/${id}`);

    if (res.status === 404) {
      errorDiv.textContent = `No se encontró el reporte #${id}.`;
      errorDiv.style.display = "block";
      return;
    }

    const data = await res.json();

    document.getElementById("res-id").textContent = data.id;
    document.getElementById("res-descripcion").textContent = data.descripcion;
    document.getElementById("res-ubicacion").textContent = data.ubicacion;
    document.getElementById("res-categoria").textContent = data.categoria || "Sin clasificar";
    document.getElementById("res-entidad").textContent = data.entidad_nombre || "Sin asignar";
    document.getElementById("res-fecha").textContent = new Date(data.fecha).toLocaleDateString("es-CO", {
      year: "numeric", month: "long", day: "numeric"
    });

    const badge = document.getElementById("res-estado-badge");
    badge.textContent = data.estado;
    badge.className = `estado-badge estado-${data.estado.replace(" ", "-")}`;

    resultadoDiv.style.display = "block";

  } catch (err) {
    errorDiv.textContent = "Error al consultar. Intenta de nuevo.";
    errorDiv.style.display = "block";
  }
}