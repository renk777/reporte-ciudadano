const form = document.getElementById("formReporte");
const inputImagen = document.getElementById("imagen");
const preview = document.getElementById("preview");

// Vista previa de imagen
inputImagen.addEventListener("change", () => {
  const file = inputImagen.files[0];

  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// Enviar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const descripcion = document.getElementById("descripcion").value;
  const ubicacion = document.getElementById("ubicacion").value;
  const imagen = inputImagen.files[0];

  const formData = new FormData();
  formData.append("descripcion", descripcion);
  formData.append("ubicacion", ubicacion);

  if (imagen) {
    formData.append("imagen", imagen);
  }

  try {
    const res = await fetch("http://localhost:3000/reporte", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    form.reset();
    preview.style.display = "none";

  } catch (error) {
    alert("Error al enviar el reporte");
  }
});