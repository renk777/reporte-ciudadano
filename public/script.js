const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");
const inputUbicacion = document.getElementById("ubicacion");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_URL = "https://reporte-ciudadano-production.up.railway.app";

const MONTERIA_LAT = 8.7479;
const MONTERIA_LNG = -75.8814;

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
    alert("Tu navegador no soporta geolocalización. Selecciona en el mapa.");
    return;
  }
  btnUbicacion.textContent = "Obteniendo...";
  btnUbicacion.disabled = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
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
        mapa.setView([pos.coords.latitude, pos.coords.longitude], 16);
        ponerMarcador(pos.coords.latitude, pos.coords.longitude);
      },
      () => { inputUbicacion.placeholder = "Selecciona en el mapa"; }
    );
  }

  // Limitar fecha máxima a hoy en el campo de nacimiento
  const hoy = new Date().toISOString().split("T")[0];
  document.getElementById("fechaNacimiento").setAttribute("max", hoy);
});

// ── VALIDAR MAYORÍA DE EDAD ────────────────────────
function esMayorDeEdad(fechaNacimiento) {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = hoy.getFullYear() - nacimiento.getFullYear();
  const cumpleEsteAno = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());
  return edad > 18 || (edad === 18 && hoy >= cumpleEsteAno);
}

// ── PREVIEW IMÁGENES ──────────────────────────────
inputImagenes.addEventListener("change", () => {
  preview.innerHTML = "";
  const archivos = inputImagenes.files;
  if (!archivos || archivos.length === 0) return;

  for (let i = 0; i < archivos.length; i++) {
    const file = archivos[i];
    if (!file.type.startsWith("image/")) continue;
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.cssText = "width:110px;height:110px;object-fit:cover;margin:5px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.2);";
    preview.appendChild(img);
  }
});

// ── ENVIAR REPORTE ────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fechaNacimiento = document.getElementById("fechaNacimiento").value;
  const inputFecha = document.getElementById("fechaNacimiento");

  // Validar mayoría de edad
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
  const imagenes = inputImagenes.files;

  if (!ubicacion) {
    alert("Por favor selecciona una ubicación en el mapa o usa tu ubicación.");
    return;
  }

  const formData = new FormData();
  formData.append("descripcion", descripcion);
  formData.append("ubicacion", ubicacion);
  for (let i = 0; i < imagenes.length; i++) {
    formData.append("imagenes", imagenes[i]);
  }

  try {
    const res = await fetch(`${API_URL}/reporte`, { method: "POST", body: formData });
    const data = await res.json();

    alert(`${data.message}\n\n📋 Guarda tu número de reporte para consultarlo después:\nReporte #${data.reporteId}`);

    form.reset();
    preview.innerHTML = "";
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