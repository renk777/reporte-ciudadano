function mostrarNotificacion(mensaje, tipo = "info", duracion = 4000) {
  const n = document.getElementById("notificacion");
  n.textContent = mensaje;
  n.className = tipo;
  n.style.display = "block";
  n.style.opacity = "1";
  clearTimeout(window._notifTimer);
  window._notifTimer = setTimeout(() => {
    n.style.opacity = "0";
    setTimeout(() => { n.style.display = "none"; }, 300);
  }, duracion);
}

document.getElementById("descripcion").addEventListener("input", function() {
  document.getElementById("contador-desc").textContent = `${this.value.length} / 200`;
});

const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");
const inputUbicacion = document.getElementById("ubicacion");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_URL = "https://reporte-ciudadano-production.up.railway.app";

const MONTERIA_LAT = 8.7479;
const MONTERIA_LNG = -75.8814;
const MONTERIA_RADIO_KM = 15;
let mapaModal = null;
let marcadorModal = null;

function verUbicacion(ubicacionTexto, id) {
  document.getElementById("modal-mapa").classList.add("activo");
  document.getElementById("texto-ubicacion").textContent = ubicacionTexto;

  setTimeout(() => {
    if (!mapaModal) {
      mapaModal = L.map('mapa-reporte').setView([8.7479, -75.8814], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapaModal);
    }

    
    const coords = ubicacionTexto.match(/-?\d+\.\d+/g);

    if (coords && coords.length >= 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);

      mapaModal.setView([lat, lng], 16);

      if (marcadorModal) mapaModal.removeLayer(marcadorModal);
      marcadorModal = L.marker([lat, lng]).addTo(mapaModal);
    }
  }, 200);
}

function cerrarModalMapa(e) {
  if (e.target.id === "modal-mapa") {
    document.getElementById("modal-mapa").classList.remove("activo");
  }
}

function cerrarModalMapaBtn() {
  document.getElementById("modal-mapa").classList.remove("activo");
}
let todasLasImagenes = [];

// MAPA
const mapa = L.map('mapa').setView([MONTERIA_LAT, MONTERIA_LNG], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

// VERIFICAR SI ESTA EN MONTERIA
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

// GEOCODIFICACION INVERSA(para obtener la direccion de las coordenadas)
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
   mostrarNotificacion("Solo se pueden reportar problemas dentro de la ciudad de Montería, Córdoba.");
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
inputUbicacion.dataset.lat = lat;
inputUbicacion.dataset.lng = lng;
}

mapa.on('click', (e) => ponerMarcador(e.latlng.lat, e.latlng.lng));

btnUbicacion.addEventListener("click", () => {
  if (!navigator.geolocation) {
   mostrarNotificacion("Tu navegador no soporta geolocalización.");
    return;
  }
  btnUbicacion.textContent = "Obteniendo...";
  btnUbicacion.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (!estaEnMonteria(lat, lng)) {
        mostrarNotificacion("Tu ubicación está fuera de Montería. Solo se permiten reportes dentro de la ciudad.");
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
     mostrarNotificacion("No se pudo obtener tu ubicación. Selecciona en el mapa.");
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
   mostrarNotificacion("No se pudo acceder a la cámara.");
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


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const checkbox = document.getElementById("esMayor");
  if (!checkbox || !checkbox.checked) {
   mostrarNotificacion("Debes confirmar que eres mayor de 18 años.");
    return;
  }
  const descripcion = document.getElementById("descripcion").value;
  const ubicacion = inputUbicacion.value;
  if (!ubicacion || ubicacion === "Obteniendo dirección...") {
   mostrarNotificacion("Por favor selecciona una ubicación en el mapa.");
    return;
  }
  const formData = new FormData();
  formData.append("descripcion", descripcion);
  const categoria = document.getElementById("categoria").value;
if (!categoria) { mostrarNotificacion("Por favor selecciona una categoría."); return; }
formData.append("categoria", categoria);
  const lat = inputUbicacion.dataset.lat;
const lng = inputUbicacion.dataset.lng;
const ubicacionGuardar = (lat && lng) ? `${lat},${lng}|${ubicacion}` : ubicacion;
formData.append("ubicacion", ubicacionGuardar);
  todasLasImagenes.forEach(item => formData.append("imagenes", item.file, item.nombre));
  try {
    const res = await fetch(`${API_URL}/reporte`, { method: "POST", body: formData });
    const data = await res.json();
   mostrarNotificacion(`${data.message}\n\n📋 Guarda tu número de reporte:\nReporte #${data.reporteId}`);
    form.reset();
    preview.innerHTML = "";
    todasLasImagenes = [];
    inputUbicacion.value = "";
    if (marcador) { mapa.removeLayer(marcador); marcador = null; }
    mapa.setView([MONTERIA_LAT, MONTERIA_LNG], 13);
  } catch (error) {
    mostrarNotificacion("Error al enviar el reporte");
  }
});


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
// LISTA PuBLICA DE REPORTES
let mapaPublico = null;
let vistaActual = 'lista';

function cambiarVista(vista) {
  vistaActual = vista;
  const lista = document.getElementById("lista-reportes-publicos");
  const mapaDiv = document.getElementById("mapa-reportes-publicos");
  const btnLista = document.getElementById("btn-vista-lista");
  const btnMapa = document.getElementById("btn-vista-mapa");

  if (vista === 'lista') {
    lista.style.display = "block";
    mapaDiv.style.display = "none";
    btnLista.style.background = "#1a3c5e";
    btnMapa.style.background = "rgba(0,0,0,0.2)";
  } else {
    lista.style.display = "none";
    mapaDiv.style.display = "block";
    btnLista.style.background = "rgba(0,0,0,0.2)";
    btnMapa.style.background = "#1a3c5e";
    iniciarMapaPublico();
  }
}

function iniciarMapaPublico() {
  if (!mapaPublico) {
    mapaPublico = L.map('mapa-reportes-publicos').setView([8.7479, -75.8814], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapaPublico);
  } else {
    mapaPublico.invalidateSize();
  }
}

async function cargarReportesPublicos() {
  try {
    const res = await fetch(`${API_URL}/reportes/publicos`);
    const data = await res.json();
    const lista = document.getElementById("lista-reportes-publicos");

    if (data.length === 0) {
      lista.innerHTML = "<p style='text-align:center;color:#666;font-size:14px;'>No hay reportes aún.</p>";
      return;
    }

    // Vista lista
    lista.innerHTML = data.map(r => `
      <div style="padding:12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:10px;background:rgba(255,255,255,0.7);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <span style="font-weight:600;font-size:14px;">#${r.id} — ${r.descripcion}</span>
          <span class="estado-badge estado-${r.estado.replace(' ','-')}">${r.estado}</span>
        </div>
        <div style="font-size:12px;color:#666;margin-top:6px;display:grid;gap:2px;">
          <span>🏷️ ${r.categoria || 'Sin categoría'}</span>
          <span>📍 ${r.ubicacion.includes('|') ? r.ubicacion.split('|')[1] : r.ubicacion}</span>
          <span>📅 ${new Date(r.fecha).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})}</span>
        </div>
      </div>
    `).join('');

    // Agregar marcadores al mapa cuando se inicialice
    window._reportesPublicos = data;

  } catch (err) {
    document.getElementById("lista-reportes-publicos").innerHTML =
      "<p style='text-align:center;color:#aaa;font-size:14px;'>No se pudieron cargar los reportes.</p>";
  }
}

function iniciarMapaPublico() {
  if (!mapaPublico) {
    mapaPublico = L.map('mapa-reportes-publicos').setView([8.7479, -75.8814], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapaPublico);
  } else {
    mapaPublico.invalidateSize();
  }

  // Limpiar marcadores anteriores
  mapaPublico.eachLayer(layer => {
    if (layer instanceof L.Marker) mapaPublico.removeLayer(layer);
  });

  const reportes = window._reportesPublicos || [];
  const colores = {
    'Pendiente': '🔴',
    'Asignado': '🔵',
    'En proceso': '🟡',
    'Solucionado': '🟢'
  };

  reportes.forEach(r => {
    const coords = r.ubicacion.split('|')[0].match(/-?[\d.]+/g);
    if (!coords || coords.length < 2) return;

    const lat = parseFloat(coords[0]);
    const lng = parseFloat(coords[1]);
    const direccion = r.ubicacion.includes('|') ? r.ubicacion.split('|')[1] : r.ubicacion;
    const icono = colores[r.estado] || '📍';

    L.marker([lat, lng])
      .addTo(mapaPublico)
      .bindPopup(`
        <div style="font-size:13px;min-width:180px;">
          <p style="font-weight:700;margin-bottom:4px;">${icono} Reporte #${r.id}</p>
          <p style="margin-bottom:2px;">${r.descripcion}</p>
          <p style="color:#666;font-size:12px;">🏷️ ${r.categoria || 'Sin categoría'}</p>
          <p style="color:#666;font-size:12px;">📍 ${direccion}</p>
          <p style="margin-top:6px;"><b>Estado:</b> ${r.estado}</p>
        </div>
      `);
  });
}

cargarReportesPublicos();

    lista.innerHTML = data.map(r => `
      <div style="padding:12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:10px;background:rgba(255,255,255,0.7);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
          <span style="font-weight:600;font-size:14px;">#${r.id} — ${r.descripcion}</span>
          <span class="estado-badge estado-${r.estado.replace(' ','-')}">${r.estado}</span>
        </div>
        <div style="font-size:12px;color:#666;margin-top:6px;display:grid;gap:2px;">
          <span>🏷️ ${r.categoria || 'Sin categoría'}</span>
          <span>📍 ${r.ubicacion.includes('|') ? r.ubicacion.split('|')[1] : r.ubicacion}</span>
          <span>📅 ${new Date(r.fecha).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById("lista-reportes-publicos").innerHTML =
      "<p style='text-align:center;color:#aaa;font-size:14px;'>No se pudieron cargar los reportes.</p>";
  }
}

cargarReportesPublicos();