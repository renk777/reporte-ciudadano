const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");
const inputUbicacion = document.getElementById("ubicacion");
const btnUbicacion = document.getElementById("btnUbicacion");

const API_URL = "https://reporte-ciudadano-production.up.railway.app";

// Coordenadas de Montería, Córdoba, Colombia
const MONTERIA_LAT = 8.7479;
const MONTERIA_LNG = -75.8814;

// Inicializar mapa centrado en Montería
const mapa = L.map('mapa').setView([MONTERIA_LAT, MONTERIA_LNG], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

function ponerMarcador(lat, lng) {
  if (marcador) {
    mapa.removeLayer(marcador);
  }
  marcador = L.marker([lat, lng]).addTo(mapa);
  inputUbicacion.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Clic en el mapa para seleccionar ubicación
mapa.on('click', (e) => {
  ponerMarcador(e.latlng.lat, e.latlng.lng);
});

// Botón: usar ubicación del dispositivo
btnUbicacion.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización. Selecciona la ubicación en el mapa.");
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
      alert("No se pudo obtener tu ubicación. Selecciona la ubicación en el mapa.");
      btnUbicacion.textContent = "📍 Usar mi ubicación";
      btnUbicacion.disabled = false;
    }
  );
});

// Intentar obtener ubicación automáticamente al cargar
window.addEventListener("load", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapa.setView([lat, lng], 16);
        ponerMarcador(lat, lng);
      },
      () => {
        // Si no da permiso, el mapa queda en Montería
        inputUbicacion.placeholder = "Selecciona en el mapa";
      }
    );
  }
});

// Preview de imágenes
inputImagenes.addEventListener("change", () => {
  preview.innerHTML = "";
  const archivos = inputImagenes.files;

  if (!archivos || archivos.length === 0) {
    preview.innerHTML = "<p>No seleccionaste imágenes</p>";
    return;
  }

  for (let i = 0; i < archivos.length; i++) {
    const file = archivos[i];
    if (!file.type.startsWith("image/")) continue;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "120px";
    img.style.height = "120px";
    img.style.objectFit = "cover";
    img.style.margin = "5px";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    preview.appendChild(img);
  }
});

// Enviar reporte
form.addEventListener("submit", async (e) => {
  e.preventDefault();

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
    const res = await fetch(`${API_URL}/reporte`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    form.reset();
    preview.innerHTML = "";
    inputUbicacion.value = "";
    if (marcador) {
      mapa.removeLayer(marcador);
      marcador = null;
    }
    mapa.setView([MONTERIA_LAT, MONTERIA_LNG], 13);

  } catch (error) {
    console.error(error);
    alert("Error al enviar el reporte");
  }
});