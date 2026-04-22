const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");
const inputUbicacion = document.getElementById("ubicacion");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_URL = "https://reporte-ciudadano-production.up.railway.app";

const MONTERIA_LAT = 8.7479;
const MONTERIA_LNG = -75.8814;
// Radio aproximado de Montería en km
const MONTERIA_RADIO_KM = 15;

let todasLasImagenes = [];

// ── MAPA ──────────────────────────────────────────
const mapa = L.map('mapa').setView([MONTERIA_LAT, MONTERIA_LNG], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

// ── VERIFICAR SI ESTÁ EN MONTERÍA ─────────────────
function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function estaEnMonteria(lat, lng) {
  return distanciaKm(lat, lng, MONTERIA_LAT, MONTERIA_LNG) <= MONTERIA_RADIO_KM;
}

// ── GEOCODIFICACIÓN INVERSA ───────────────────────
async function obtenerDireccion(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const partes = [];
    if (a.road) partes.push(a.road);
    if (a.house_number) partes.push('#' + a.house_number);
    if (a.neighbourhood || a.suburb || a.quarter)
      partes.push('Barrio ' + (a.neighbourhood || a.suburb || a.quarter));
    if (a.city || a.town || a.village || a.municipality)
      partes.push(a.city || a.town || a.village || a.municipality);
    return partes.length > 0 ? partes.join(', ') : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (e) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

async function ponerMarcador(lat, lng) {
  if (!estaEnMonteria(lat, lng)) {
    alert("Solo se pueden reportar problemas dentro de la ciudad de Montería, Córdoba.");
    if (marcador) { mapa.removeLayer(marcador); marcador = null; }
    inputUbicacion.value = "";
    mapa.setView([MONTERIA_LAT, MONTERIA_LNG], 13);
    return;
  }
  if (marcador) mapa.removeLayer(marcador);
  marcador = L.marker([lat, lng]).addTo(mapa);
  inputUbicacion.value = "Obteniendo dirección...";
  const direccion = await obtenerDireccion(lat, lng);
  inputUbicacion.value = direccion;
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
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!estaEnMonteria(lat, lng)) {
        alert("Tu ubicación está fuera de Montería. Solo se permiten reportes dentro de la ciudad.");
        btnUbicacion.textContent = "📍 Usar mi ubicación";
        btnUbicacion.disabled = false;
        return;
      }
      mapa.setView([lat, lng], 16);
      ponerMarcador(lat, lng);
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (estaEnMonteria(lat, lng)) {
          mapa.setView([lat, lng], 16);
          ponerMarcador(lat, lng);
        } else {
          inputUbicacion.placeholder = "Selecciona en el mapa (solo Montería)";
        }
      },
      () => { inputUbicacion.placeholder = "Selecciona en el mapa"; }
    );
  }
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

inputImagenes.addEventListener("change", () => {
  const archivos = inputImagenes.files;
  for (let i = 0; i < archivos.length; i++) {
    if (!archivos[i].type.startsWith("image/")) continue;
    agregarAlPreview(archivos[i], archivos[i].name);
  }
  inputImagenes.value = "";
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
    streamCamara = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    document.getElementById("video").srcObject = streamCamara;
  } catch (err) {
    alert("No se pudo acceder a la cámara.");
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
    document.getElementById("foto-preview").src = URL.createObjectURL(blob);
    document.getElementById("camara-container").style.display = "none";
    document.getElementById("foto-tomada-container").style.display = "block";
    document.getElementById("btnTomarFoto").style.display = "none";
    document.getElementById("btnRetomar").style.display = "inline-block";
    document.getElementById("btnUsarFoto").style.display = "inline-block";
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
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
    .then(stream => { streamCamara = stream; document.getElementById("video").srcObject = stream; });
}

function usarFoto() {
  if (!fotoBlob) return;
  const nombre = `foto-camara-${Date.now()}.jpg`;
  agregarAlPreview(new File([fotoBlob], nombre, { type: "image/jpeg" }), nombre);
  cerrarCamara();
}

function cerrarCamara() {
  if (streamCamara) streamCamara.getTracks().forEach(t => t.stop());
  streamCamara = null; fotoBlob = null;
  document.getElementById("modal-camara").classList.remove("activo");
  document.getElementById("video").srcObject = null;
}

// ── ENVIAR REPORTE ────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const checkbox = document.getElementById("esMayor");
  if (!checkbox || !checkbox.checked) {
    alert("Debes confirmar que eres mayor de 18 años.");
    return;
  }
  const descripcion = document.getElementById("descripcion").value;
  const ubicacion = inputUbicacion.value;
  if (!ubicacion || ubicacion === "Obteniendo dirección...") {
    alert("Por favor selecciona una ubicación en el mapa.");
    return;
  }
  const formData = new FormData();
  formData.append("descripcion", descripcion);
  formData.append("ubicacion", ubicacion);
  todasLasImagenes.forEach(item => formData.append("imagenes", item.file, item.nombre));
  try {
    const res = await fetch(`${API_URL}/reporte`, { method: "POST", body: formData });
    const data = await res.json();
    alert(`${data.message}\n\n📋 Guarda tu número de reporte:\nReporte #${data.reporteId}`);
    form.reset();
    preview.innerHTML = "";
    todasLasImagenes = [];
    inputUbicacion.value = "";
    if (marcador) { mapa.removeLayer(marcador); marcador = null; }
    mapa.setView([MONTERIA_LAT, MONTERIA_LNG], 13);
  } catch (error) {
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
  if (!id) { errorDiv.textContent = "Ingresa el número del reporte."; errorDiv.style.display = "block"; return; }
  try {
    const res = await fetch(`${API_URL}/reporte/estado/${id}`);
    if (res.status === 404) { errorDiv.textContent = `No se encontró el reporte #${id}.`; errorDiv.style.display = "block"; return; }
    const data = await res.json();
    document.getElementById("res-id").textContent = data.id;
    document.getElementById("res-descripcion").textContent = data.descripcion;
    document.getElementById("res-ubicacion").textContent = data.ubicacion;
    document.getElementById("res-categoria").textContent = data.categoria || "Sin clasificar";
    document.getElementById("res-entidad").textContent = data.entidad_nombre || "Sin asignar";
    document.getElementById("res-fecha").textContent = new Date(data.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
    const badge = document.getElementById("res-estado-badge");
    badge.textContent = data.estado;
    badge.className = `estado-badge estado-${data.estado.replace(" ", "-")}`;
    resultadoDiv.style.display = "block";
  } catch (err) {
    errorDiv.textContent = "Error al consultar.";
    errorDiv.style.display = "block";
  }
}
