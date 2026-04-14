exports.crearReporte = (req, res) => {

    const { descripcion, ubicacion } = req.body;
    const foto = req.file; 

    console.log("--- Nuevo Reporte Ciudadano ---");
    console.log("Descripción:", descripcion);
    console.log("Ubicación:", ubicacion);
    console.log("Imagen guardada en servidor:", foto ? foto.path : "Sin imagen");

    // conecta el MySQL
    // -----------------------------------------

    
    res.json({
        message: "¡Reporte enviado con éxito!"
    });
};