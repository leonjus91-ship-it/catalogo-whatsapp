import jsPDF from "jspdf"

interface Producto {
    id: number | string
    nombre: string
    descripcion?: string
    precio: number | string
    imagen_url?: string
}

export const descargarReciboPDF = (carrito: Producto[]) => {
    // Pedir el nombre y apellido mediante una ventana emergente en el navegador
    const nombreClienteInput = window.prompt("Ingrese el Nombre y Apellido del cliente:", "Cliente General");

    // Si el usuario cancela, detenemos la descarga
    if (nombreClienteInput === null) return;

    const nombreCliente = nombreClienteInput.trim() === "" ? "Cliente General" : nombreClienteInput;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 160] // Altura adaptada para el ticket
    })

    doc.setFont("courier", "normal")

    let y = 10
    const margenX = 5

    // Encabezado
    doc.setFontSize(11)
    doc.text("==================================", margenX, y)
    y += 5
    doc.text("         JL FLOW STORE           ", margenX, y)
    y += 5
    doc.text("     COMPROBANTE DE COMPRA       ", margenX, y)
    y += 5
    doc.text("==================================", margenX, y)
    y += 6

    // Fecha y hora actual
    doc.setFontSize(8)
    const fecha = new Date().toLocaleString()
    doc.text(`FECHA: ${fecha}`, margenX, y)
    y += 4

    // Datos del Cliente (Nombre y Apellido)
    doc.text(`CLIENTE: ${nombreCliente}`, margenX, y)
    y += 5
    doc.text("----------------------------------", margenX, y)
    y += 5

    // Cabecera de la tabla
    doc.text("CANT.   PRODUCTO          SUBTOTAL", margenX, y)
    y += 4
    doc.text("----------------------------------", margenX, y)
    y += 5

    let total = 0

    // Listado de productos del carrito con nombres completos
    carrito.forEach((item) => {
        const cantidad = 1
        const precioNum = Number(item.precio) || 0
        const subtotal = cantidad * precioNum
        total += subtotal

        doc.text(cantidad.toString(), margenX, y)
        doc.text(`$${subtotal.toFixed(2)}`, 55, y)
        doc.text(item.nombre, margenX + 8, y, { maxWidth: 38 })

        const lineasNombre = doc.splitTextToSize(item.nombre, 38)
        y += lineasNombre.length * 5 + 2
    })

    doc.text("----------------------------------", margenX, y)
    y += 6

    // Total a pagar
    doc.setFontSize(9)
    doc.text(`TOTAL A PAGAR: $${total.toFixed(2)}`, margenX, y)
    y += 8

    // Pie de página
    doc.setFontSize(8)
    doc.text("==================================", margenX, y)
    y += 5
    doc.text("      ¡GRACIAS POR SU COMPRA!     ", margenX, y)

    doc.save(`recibo-${nombreCliente.toLowerCase().replace(/\s+/g, '-')}.pdf`)
}