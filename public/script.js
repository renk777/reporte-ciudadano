const form = document.getElementById("formReporte");
const inputImagenes = document.getElementById("imagenes");
const preview = document.getElementById("preview");

inputImagenes.addEventListener("change", () => {
  preview.innerHTML = "";

  const archivos = inputImagenes.files;

  if (!archivos || archivos.length === 0) {
    preview.innerHTML = "<p>No seleccionaste imágenes</p>";
    return;
  }

  for (let i = 0; i < archivos.length; i++) {
    const file = archivos[i];

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) continue;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);

    // estilos
    img.style.width = "120px";
    img.style.height = "120px";
    img.style.objectFit = "cover";
    img.style.margin = "5px";
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";

    preview.appendChild(img);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const descripcion = document.getElementById("descripcion").value;
  const ubicacion = document.getElementById("ubicacion").value;
  const imagenes = inputImagenes.files;

  const formData = new FormData();
  formData.append("descripcion", descripcion);
  formData.append("ubicacion", ubicacion);

  for (let i = 0; i < imagenes.length; i++) {
    formData.append("imagenes", imagenes[i]);
  }

  try {
    const res = await fetch("http://localhost:3000/reporte", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    form.reset();
    preview.innerHTML = "";

  } catch (error) {
    console.error(error);
    alert("Error al enviar el reporte");
  }
});