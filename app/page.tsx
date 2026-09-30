'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

interface Producto {
    id: number
    nombre: string
    descripcion: string
    precio: number
    precio_anterior?: number
    imagen_url: string
    categoria?: string
    especificaciones?: string
}

export default function CatalogoPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos')
    const [busqueda, setBusqueda] = useState<string>('')
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
    const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([])

    // Estado para controlar la visibilidad del modal del carrito
    const [mostrarCarritoModal, setMostrarCarritoModal] = useState<boolean>(false)

    // Estado para el nombre del comprador
    const [nombreCliente, setNombreCliente] = useState<string>('')

    // Estado para detectar si estamos en entorno local
    const [esLocalhost, setEsLocalhost] = useState<boolean>(false)

    useEffect(() => {
        cargarProductos()
        // Verificamos si estamos corriendo en localhost o 127.0.0.1
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                setEsLocalhost(true)
            }
        }
    }, [])

    async function cargarProductos() {
        const { data, error } = await supabase.from('productos').select('*')
        if (error) {
            console.error('Error cargando productos:', error)
        } else if (data) {
            setProductos(data)
        }
    }

    // Filtrar productos por categoría y barra de búsqueda
    const productosFiltrados = productos.filter((p) => {
        const coincideCategoria =
            categoriaSeleccionada === 'todos' || p.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase()
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return coincideCategoria && coincideBusqueda
    })

    const agregarAlCarrito = (producto: Producto) => {
        setCarrito((prevCarrito) => {
            const index = prevCarrito.findIndex((item) => item.producto.id === producto.id)
            if (index >= 0) {
                const nuevoCarrito = [...prevCarrito]
                nuevoCarrito[index].cantidad += 1
                return nuevoCarrito
            } else {
                return [...prevCarrito, { producto, cantidad: 1 }]
            }
        })
    }

    const cambiarCantidad = (id: number, delta: number) => {
        setCarrito((prevCarrito) => {
            return prevCarrito.map((item) => {
                if (item.producto.id === id) {
                    const nuevaCantidad = item.cantidad + delta
                    return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null
                }
                return item
            }).filter(Boolean) as { producto: Producto; cantidad: number }[]
        })
    }

    const eliminarDelCarrito = (id: number) => {
        setCarrito((prevCarrito) => prevCarrito.filter((item) => item.producto.id !== id))
    }

    const enviarPedidoWhatsApp = () => {
        if (carrito.length === 0) return

        const clienteFinal = nombreCliente.trim() !== '' ? nombreCliente : 'Cliente'
        let mensaje = `¡Hola! 🧢 Me gustaría hacer el siguiente pedido en JL Flow Store (Comprador: ${clienteFinal}):\n\n`
        let total = 0

        carrito.forEach((item) => {
            const subtotal = item.producto.precio * item.cantidad
            total += subtotal
            mensaje += `- *${item.producto.nombre}* (x${item.cantidad}) - $${subtotal.toFixed(2)}\n`
        })

        mensaje += `\n*Total a pagar: $${total.toFixed(2)}*\n\n¡Quedo atento para coordinar el pago y envío!`

        const numeroWhatsApp = '593999999999' // Reemplaza con tu número de WhatsApp real
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
        window.open(urlWhatsApp, '_blank')
    }

    const descargarReciboPDF = () => {
        if (carrito.length === 0) return

        let total = 0
        let itemsTexto = carrito.map(item => {
            const subtotal = item.producto.precio * item.cantidad
            total += subtotal
            const cantStr = String(item.cantidad).padEnd(4, ' ')
            const nombreStr = item.producto.nombre.padEnd(20, ' ')
            const subtotalStr = `$${subtotal.toFixed(2)}`
            return `${cantStr} ${nombreStr} ${subtotalStr}`
        }).join('\n')

        const fechaActual = new Date().toLocaleString('es-EC', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        const clienteFinal = nombreCliente.trim() !== '' ? nombreCliente.toUpperCase() : 'CLIENTE GENERAL'

        const ventanaImpresion = window.open('', '_blank')
        if (!ventanaImpresion) return

        ventanaImpresion.document.write(`
            <html>
                <head>
                    <title>Comprobante de Compra - JL Flow Store</title>
                    <style>
                        @page {
                            size: 80mm auto;
                            margin: 0;
                        }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 12px;
                            color: #000;
                            margin: 0;
                            padding: 10px;
                            width: 72mm;
                            white-space: pre-wrap;
                            line-height: 1.3;
                        }
                        .ticket-container {
                            width: 100%;
                        }
                    </style>
                </head>
                <body>
                    <div class="ticket-container">
========================================
             JL FLOW STORE
         COMPROBANTE DE COMPRA
========================================

FECHA: ${fechaActual}
CLIENTE: ${clienteFinal}

----------------------------------------
CANT. PRODUCTO              SUBTOTAL
----------------------------------------
${itemsTexto}
----------------------------------------
TOTAL A PAGAR: $${total.toFixed(2)}

========================================
        ¡GRACIAS POR SU COMPRA!
========================================
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
            </html>
        `)
        ventanaImpresion.document.close()
    }

    const totalProductosCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0)
    const precioTotalCarrito = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)

    return (
        <main className= "min-h-screen bg-[#0b0f19] text-white pb-40" >
        {/* Header / Banner Principal */ }
        < header className = "bg-black text-white py-10 px-4 text-center shadow-lg border-b border-gray-800" >
            <h1 className="text-4xl font-black tracking-wider uppercase" > JL FLOW STORE </h1>
                < p className = "text-sm text-gray-400 mt-1 font-medium" > Streetwear, gorras y estilo urbano </p>
                    </header>

    {/* Contenedor principal */ }
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8" >

    {/* Barra de búsqueda y Filtros */ }
        < div className = "bg-[#151b2b] p-4 rounded-2xl shadow-md border border-gray-800 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center" >
            <input
                        type="text"
    placeholder = "🔍 Buscar gorras, camisetas..."
    value = { busqueda }
    onChange = {(e) => setBusqueda(e.target.value)
}
className = "w-full md:w-96 px-4 py-2.5 rounded-xl border border-gray-700 bg-[#0b0f19] text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
    />

    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 justify-start md:justify-end" >
    {
        ['todos', 'gorras', 'camisetas'].map((cat) => (
            <button
                                key= { cat }
                                onClick = {() => setCategoriaSeleccionada(cat)}
className = {`px-5 py-2 rounded-xl text-sm font-semibold capitalize transition-all whitespace-nowrap ${categoriaSeleccionada === cat
    ? 'bg-blue-600 text-white shadow-md'
    : 'bg-[#1e293b] text-gray-300 hover:bg-gray-700'
    }`}
                            >
{ cat }
    </button>
                        ))}
</div>
    </div>

{/* Grid de Productos */ }
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" >
{
    productosFiltrados.map((producto) => (
        <div
                            key= { producto.id }
                            className = "bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between relative group transition-transform duration-300 hover:-translate-y-1"
        >
        {
            producto.precio_anterior && producto.precio_anterior > producto.precio && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md z-10">
                    Oferta
                    </span>
                            )
}

    < div
className = "cursor-pointer relative h-64 bg-gray-100 overflow-hidden"
onClick = {() => setProductoSeleccionado(producto)}
                            >
    <img
                                    src={ producto.imagen_url }
alt = { producto.nombre }
className = "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
    </div>

    < div className = "p-5 flex flex-col flex-grow justify-between" >
        <div>
        <h3
                                        className="font-bold text-base text-gray-900 cursor-pointer hover:text-blue-600 line-clamp-1 transition-colors"
onClick = {() => setProductoSeleccionado(producto)}
                                    >
{ producto.nombre }
    </h3>
    < p className = "text-gray-500 text-xs mt-1 line-clamp-2" >
    { producto.descripcion }
        </p>
        </div>

        < div className = "mt-4 pt-3 border-t border-gray-100" >
            <div className="flex items-center gap-2 mb-3" >
            {
                producto.precio_anterior && producto.precio_anterior > producto.precio && (
                    <span className="text-xs text-gray-400 line-through">
                        ${ producto.precio_anterior.toFixed(2) }
</span>
                                        )}
<span className="text-lg font-black text-gray-900" >
    ${ producto.precio.toFixed(2) }
</span>
    </div>
    < button
onClick = {() => agregarAlCarrito(producto)}
className = "w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-1.5"
    >
    Agregar al carrito
        </button>
        </div>
        </div>
        </div>
                    ))}
</div>
    </div>

{/* Modal de Detalle de Producto */ }
{
    productoSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" >
            <div className="bg-white text-gray-900 rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200" >
                <button
                            onClick={ () => setProductoSeleccionado(null) }
    className = "absolute top-3 right-3 bg-black/60 hover:bg-black text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-20 transition-colors"
        >
                            ✕
    </button>

        < div className = "h-56 bg-gray-100 relative flex-shrink-0" >
            <img
                                src={ productoSeleccionado.imagen_url }
    alt = { productoSeleccionado.nombre }
    className = "w-full h-full object-cover"
        />
        </div>

        < div className = "p-5 overflow-y-auto flex-grow" >
            <h2 className="text-xl font-black text-gray-900 mb-1" >
            { productoSeleccionado.nombre }
                </h2>
                < span className = "text-xl font-bold text-blue-600 block mb-4" >
                    ${ productoSeleccionado.precio.toFixed(2) }
    </span>

        < div className = "text-gray-700 text-xs sm:text-sm mb-5 bg-gray-50 p-4 rounded-2xl border border-gray-100" >
            <p className="font-bold text-gray-900 mb-2" > Detalles del producto: </p>
    {
        productoSeleccionado.especificaciones ? (
            <ul className= "space-y-1.5 list-disc list-inside text-gray-700" >
            {
                productoSeleccionado.especificaciones
                    .split('\n')
                    .map((spec: string, index: number) => (
                        <li key= { index } > { spec.replace(/^[-*]\s*/, '') } </li>
                    ))
            }
            </ul>
                                ) : (
            <p className= "text-gray-600" > { productoSeleccionado.descripcion } </p>
                                )
    }
    </div>

        < button
    onClick = {() => {
        agregarAlCarrito(productoSeleccionado)
        setProductoSeleccionado(null)
    }
}
className = "w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm shadow-md"
    >
    Agregar al carrito
        </button>
        </div>
        </div>
        </div>
            )}

{/* Modal de Visualización del Carrito (Se abre al hacer clic en el botón de productos) */ }
{
    mostrarCarritoModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" >
            <div className="bg-[#151b2b] text-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative border border-gray-800" >
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40" >
                    <h2 className="text-lg font-black uppercase tracking-wider" >🛒 Productos en tu Carrito </h2>
                        < button
    onClick = {() => setMostrarCarritoModal(false)
}
className = "bg-gray-800 hover:bg-gray-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
    >
                                ✕
</button>
    </div>

    < div className = "p-4 overflow-y-auto flex-grow space-y-3" >
    {
        carrito.map((item) => (
            <div key= { item.producto.id } className = "flex items-center justify-between bg-black/30 p-3 rounded-2xl border border-gray-800 gap-3" >
            <img src={ item.producto.imagen_url } alt = { item.producto.nombre } className = "w-14 h-14 object-cover rounded-xl flex-shrink-0" />
            <div className="flex-grow min-w-0" >
        <h4 className="font-bold text-sm truncate" > { item.producto.nombre } </h4>
        < p className = "text-blue-400 text-xs font-semibold" > ${ item.producto.precio.toFixed(2) } c / u </p>
        </div>
        < div className = "flex items-center gap-2 bg-[#0b0f19] px-2.5 py-1 rounded-xl border border-gray-700" >
        <button onClick={() => cambiarCantidad(item.producto.id, -1)} className = "text-gray-400 hover:text-white font-bold px-1" > -</button>
            < span className = "text-xs font-bold w-4 text-center" > { item.cantidad } </span>
                < button onClick = {() => cambiarCantidad(item.producto.id, 1)} className = "text-gray-400 hover:text-white font-bold px-1" > +</button>
                    </div>
                    < button onClick = {() => eliminarDelCarrito(item.producto.id)} className = "text-red-400 hover:text-red-300 p-1 text-sm" title = "Eliminar" >
                                        🗑️
</button>
    </div>
                            ))}
</div>

    < div className = "p-4 border-t border-gray-800 bg-black/40 flex justify-between items-center" >
        <span className="text-sm font-medium text-gray-300" > Total a pagar: </span>
            < span className = "text-xl font-black text-blue-400" > ${ precioTotalCarrito.toFixed(2) } </span>
                </div>
                </div>
                </div>
            )}

{/* Barra Inferior Flotante */ }
{
    carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#151b2b] border-t border-gray-800 p-4 shadow-2xl z-40 max-w-7xl mx-auto sm:rounded-t-2xl flex flex-col gap-3" >

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 p-2.5 rounded-xl border border-gray-800" >
                <label className="text-xs font-semibold text-gray-300 whitespace-nowrap" >
                            👤 Nombre del Comprador:
    </label>
        < input
    type = "text"
    value = { nombreCliente }
    onChange = {(e) => setNombreCliente(e.target.value)
}
placeholder = "ESCRIBE EL NOMBRE DEL COMPRADOR..."
className = "w-full sm:w-72 px-3 py-1.5 bg-[#0b0f19] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono uppercase"
    />
    </div>

    < div className = "flex flex-col sm:flex-row items-center justify-between gap-4" >
        <div className="flex items-center gap-4 text-sm font-semibold w-full sm:w-auto justify-between sm:justify-start" >
        {/* Al hacer clic en este botón, ahora se abre la ventana flotante con los productos */ }
            < button
onClick = {() => setMostrarCarritoModal(true)}
className = "bg-black hover:bg-gray-900 px-4 py-2 rounded-full text-white text-xs border border-gray-700 flex items-center gap-2 transition-all cursor-pointer shadow-md"
    >
                                🛒 <span className="underline font-bold" > { totalProductosCarrito } producto{ totalProductosCarrito > 1 ? 's' : '' } (Ver carrito)</span>
    </button>
    < span > Total: <strong className="text-blue-400" > ${ precioTotalCarrito.toFixed(2) } </strong></span >
        </div>

        < div className = "flex items-center gap-3 w-full sm:w-auto" >
        {/* El botón de descarga solo se renderiza si es localhost */ }
{
    esLocalhost && (
        <button
                                    onClick={ descargarReciboPDF }
    className = "flex-1 sm:flex-none bg-[#1e293b] hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-gray-700 shadow-sm"
        >
        Descargar Comprobante PDF
            </button>
                            )
}
<button
                                onClick={ enviarPedidoWhatsApp }
className = "flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
    >
    Enviar pedido por WhatsApp
        </button>
        </div>
        </div>
        </div>
            )}
</main>
    )
}