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
    stock?: number
}

export default function CatalogoPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos')
    const [busqueda, setBusqueda] = useState<string>('')
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
    const [carrito, setCarrito] = useState<{ producto: Producto; cantidad: number }[]>([])

    const [mostrarCarritoModal, setMostrarCarritoModal] = useState<boolean>(false)
    const [cedulaCliente, setCedulaCliente] = useState<string>('')
    const [nombreCliente, setNombreCliente] = useState<string>('')
    const [clienteFrecuente, setClienteFrecuente] = useState<boolean>(false)
    const [esLocalhost, setEsLocalhost] = useState<boolean>(false)

    useEffect(() => {
        cargarProductos()
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

    const obtenerNombrePorCedula = async (cedula: string): Promise<string | null> => {
        if (!cedula.trim() || cedula.trim().length < 5) return null
        const { data } = await supabase
            .from('clientes')
            .select('nombre')
            .eq('cedula', cedula.trim())
            .single()

        if (data && data.nombre) {
            return data.nombre
        }
        return null
    }

    const manejarCambioCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const cedula = e.target.value
        setCedulaCliente(cedula)

        if (cedula.trim().length >= 5) {
            const nombreEncontrado = await obtenerNombrePorCedula(cedula)
            if (nombreEncontrado) {
                setNombreCliente(nombreEncontrado) // Rellena el nombre automáticamente
                setClienteFrecuente(true)
            } else {
                setClienteFrecuente(false)
            }
        } else {
            setClienteFrecuente(false)
        }
    }

    const guardarClienteSupabase = async (cedula: string, nombre: string) => {
        if (!cedula.trim() || !nombre.trim()) return

        await supabase.from('clientes').upsert(
            { cedula: cedula.trim(), nombre: nombre.trim().toUpperCase() },
            { onConflict: 'cedula' }
        )
    }

    const productosFiltrados = productos.filter((p) => {
        const coincideCategoria =
            categoriaSeleccionada === 'todos' || p.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase()
        const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return coincideCategoria && coincideBusqueda
    })

    const agregarAlCarrito = (producto: Producto) => {
        if (producto.stock !== undefined && producto.stock <= 0) return

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

    const enviarPedidoWhatsApp = async () => {
        if (carrito.length === 0) return

        const cedulaFinal = cedulaCliente.trim() !== '' ? cedulaCliente : 'N/A'
        let nombreFinal = nombreCliente.trim()
        if (nombreFinal === '' && cedulaFinal !== 'N/A') {
            const registrado = await obtenerNombrePorCedula(cedulaFinal)
            if (registrado) nombreFinal = registrado
        }
        if (nombreFinal === '') nombreFinal = 'Cliente'

        await guardarClienteSupabase(cedulaFinal, nombreFinal)

        let mensaje = `¡Hola! 🧢 Me gustaría hacer el siguiente pedido en RJL Flow Store:\n`
        mensaje += `Cédula: ${cedulaFinal}\n`
        mensaje += `Comprador: ${nombreFinal}\n\n`
        let total = 0

        carrito.forEach((item) => {
            const subtotal = item.producto.precio * item.cantidad
            total += subtotal
            mensaje += `- *${item.producto.nombre}* (x${item.cantidad}) - $${subtotal.toFixed(2)}\n`
        })

        mensaje += `\n*Total a pagar: $${total.toFixed(2)}*\n\n¡Quedo atento para coordinar el pago y envío!`

        const numeroWhatsApp = '593996926920'
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`
        window.open(urlWhatsApp, '_blank')
    }

    const descargarReciboPDF = async () => {
        if (carrito.length === 0) return

        const cedulaFinal = cedulaCliente.trim() !== '' ? cedulaCliente : 'N/A'
        let nombreFinal = nombreCliente.trim()
        if (nombreFinal === '' && cedulaFinal !== 'N/A') {
            const registrado = await obtenerNombrePorCedula(cedulaFinal)
            if (registrado) nombreFinal = registrado
        }
        const clienteFinal = nombreFinal !== '' ? nombreFinal.toUpperCase() : 'CLIENTE GENERAL'

        await guardarClienteSupabase(cedulaFinal, clienteFinal)

        let total = 0
        let itemsTexto = carrito.map(item => {
            const subtotal = item.producto.precio * item.cantidad
            total += subtotal
            const cantStr = String(item.cantidad).padEnd(4, ' ')
            const nombreStr = item.producto.nombre.padEnd(20, ' ')
            const subtotalStr = `$${subtotal.toFixed(2)}`.padStart(8, ' ')
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

        const ventanaImpresion = window.open('', '_blank', 'width=350,height=600')
        if (!ventanaImpresion) return

        ventanaImpresion.document.write(`
            <html>
                <head>
                    <title>Comprobante de Compra - RJL Flow Store</title>
                    <style>
                        @page { size: 80mm auto; margin: 0mm; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 11px;
                            color: #000;
                            margin: 0;
                            padding: 3mm;
                            width: 74mm;
                            white-space: pre-wrap;
                            line-height: 1.2;
                        }
                    </style>
                </head>
                <body>
========================================
             RJL FLOW STORE
          COMPROBANTE DE COMPRA
========================================

FECHA: ${fechaActual}
CEDULA: ${cedulaFinal}
CLIENTE: ${clienteFinal}

----------------------------------------
CANT.   PRODUCTO            SUBTOTAL
----------------------------------------
${itemsTexto}
----------------------------------------
TOTAL A PAGAR: $${total.toFixed(2)}

========================================
        ¡GRACIAS POR SU COMPRA!
========================================
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `)
        ventanaImpresion.document.close()
    }

    const totalProductosCarrito = carrito.reduce((acc, item) => acc + item.cantidad, 0)
    const precioTotalCarrito = carrito.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)

    return (
        <main className= "min-h-screen bg-[#0b0b0b] text-white pb-40 font-sans" >
        {/* Navbar Superior */ }
        < nav className = "bg-[#111] border-b border-amber-600/30 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md" >
            <div className="text-amber-400 font-black tracking-widest text-lg" > RJL </div>
                < div className = "hidden md:flex gap-8 text-xs font-semibold tracking-wider text-gray-300" >
                    <button onClick={ () => setCategoriaSeleccionada('todos') } className = "hover:text-amber-400 transition-colors" > INICIO </button>
                        < button onClick = {() => setCategoriaSeleccionada('camisetas')
} className = "hover:text-amber-400 transition-colors" > CAMISETAS </button>
    < button onClick = {() => setCategoriaSeleccionada('gorras')} className = "hover:text-amber-400 transition-colors" > GORRAS </button>
        < a href = "#historia" className = "hover:text-amber-400 transition-colors" > NOSOTROS </a>
            </div>
            < div className = "text-amber-400 text-xs font-bold tracking-wider" >
                PEDIDOS POR WHATSAPP[cite: 8]
</div>
    </nav>

{/* Banner Principal / Hero */ }
<header className="relative bg-black text-white py-16 px-4 text-center border-b border-amber-600/20 overflow-hidden" >
    <div className="max-w-4xl mx-auto flex flex-col items-center" >
        <span className="text-amber-500 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-2" >
            HECHO PARA GENTE CON ESTILO
                </span>
                < h1 className = "text-3xl md:text-5xl font-black tracking-wider uppercase text-amber-400 mb-4 font-serif" >
                    HERENCIA QUE SE VISTE
                        </h1>
                        < p className = "text-xs md:text-sm text-gray-400 max-w-lg mb-8 font-light" >
                            Encuentra el streetwear urbano de colección con los diseños más exclusivos.Camisetas oversize y gorras con detalles únicos.
                    </p>
                                < div className = "flex gap-4" >
                                    <button 
                            onClick={
    () => {
        const el = document.getElementById('catalogo');
        el?.scrollIntoView({ behavior: 'smooth' });
    }
}
className = "bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 py-3 rounded-none text-xs uppercase tracking-widest transition-all shadow-lg"
    >
    Ver Colección
        </button>
        < a
href = "https://wa.me/593996926920?text=¡Hola!%20Me%20gustaría%20recibir%20asesoría%20en%20RJL%20Flow%20Store"
target = "_blank"
rel = "noopener noreferrer"
className = "border border-amber-500/50 hover:border-amber-400 text-amber-400 px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all"
    >
    Pedir por WhatsApp
        </a>
        </div>
        </div>
        </header>

{/* Catálogo de Productos */ }
<div id="catalogo" className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12" >
    <div className="bg-[#141414] p-5 rounded-none border border-amber-600/30 mb-10 flex flex-col md:flex-row gap-4 justify-between items-center shadow-2xl" >
        <input
                        type="text"
placeholder = "🔍 Buscar gorras, camisetas..."
value = { busqueda }
onChange = {(e) => setBusqueda(e.target.value)}
className = "w-full md:w-96 px-4 py-2.5 rounded-none border border-gray-800 bg-[#080808] text-white focus:outline-none focus:border-amber-500 text-xs tracking-wide"
    />

    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 justify-start md:justify-end" >
    {
        ['todos', 'gorras', 'camisetas'].map((cat) => (
            <button
                                key= { cat }
                                onClick = {() => setCategoriaSeleccionada(cat)}
className = {`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${categoriaSeleccionada === cat
        ? 'bg-amber-500 text-black shadow-md'
        : 'bg-[#1a1a1a] text-gray-300 hover:bg-amber-500/20 hover:text-amber-400'
    }`}
                            >
{ cat }
    </button>
                        ))}
</div>
    </div>

    < div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" >
    {
        productosFiltrados.map((producto) => {
            const esAgotado = producto.stock !== undefined && producto.stock <= 0

            return (
                <div
                                key= { producto.id }
            className = {`bg-[#121212] text-white rounded-none border border-amber-600/20 overflow-hidden flex flex-col justify-between relative group transition-transform duration-300 shadow-xl ${esAgotado ? 'opacity-75' : 'hover:-translate-y-1'
                }`
        }
                            >
            {
                esAgotado?(
                                    <span className = "absolute top-3 left-3 bg-zinc-800 text-gray-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10 border border-gray-700" >
                        Agotado
                        </span>
                ): producto.precio_anterior && producto.precio_anterior > producto.precio ? (
                    <span className= "absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider z-10" >
                    Oferta
            </span>
                                ) : null}

        < div
className = "cursor-pointer relative h-64 bg-black overflow-hidden"
onClick = {() => setProductoSeleccionado(producto)}
                                >
    <img
                                        src={ producto.imagen_url }
alt = { producto.nombre }
className = {`w-full h-full object-cover transition-transform duration-500 ${esAgotado ? 'grayscale brightness-50' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'
    }`}
                                    />
    </div>

    < div className = "p-5 flex flex-col flex-grow justify-between" >
        <div>
        <h3
                                            className="font-bold text-sm text-amber-400 cursor-pointer hover:text-amber-300 line-clamp-1 transition-colors"
onClick = {() => setProductoSeleccionado(producto)}
                                        >
{ producto.nombre }
    </h3>
    < p className = "text-gray-400 text-xs mt-1.5 line-clamp-2 font-light" >
    { producto.descripcion }
        </p>
        </div>

        < div className = "mt-5 pt-3 border-t border-gray-800" >
            <div className="flex items-center gap-2 mb-3" >
            {
                producto.precio_anterior && producto.precio_anterior > producto.precio && (
                    <span className="text-[11px] text-gray-500 line-through">
                        ${ producto.precio_anterior.toFixed(2) }
</span>
                                            )}
<span className="text-base font-black text-white" >
    ${ producto.precio.toFixed(2) }
</span>
    </div>
    < button
onClick = {() => agregarAlCarrito(producto)}
disabled = { esAgotado }
className = {`w-full py-2.5 rounded-none text-xs font-extrabold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-1.5 ${esAgotado
        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
        : 'bg-amber-500 hover:bg-amber-600 text-black'
    }`}
                                        >
{ esAgotado? 'Agotado': 'Agregar al carrito' }
    </button>
    </div>
    </div>
    </div>
                        )
                    })}
</div>
    </div>

{/* Sección de Historia */ }
<section id="historia" className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24" >
    <div className="bg-[#121212] border border-amber-600/30 p-8 md:p-12 flex flex-col md:flex-row items-center gap-10" >
        <div className="w-full md:w-1/2" >
            <img 
                            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800"
alt = "RJL Flow Store Local"
className = "w-full h-80 object-cover border border-amber-600/20 grayscale hover:grayscale-0 transition-all duration-500"
    />
    </div>
    < div className = "w-full md:w-1/2 flex flex-col justify-center" >
        <span className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-2" > NUESTRA HISTORIA </span>
            < h2 className = "text-2xl md:text-3xl font-serif font-bold text-amber-400 uppercase mb-4" >
                DOS HERMANOS.UN APELLIDO.UNA CORONA.
                        </h2>
                    < p className = "text-gray-400 text-xs md:text-sm font-light leading-relaxed mb-6" >
                        En RJL Flow Store transformamos el estilo urbano en una declaración de identidad.Diseñamos piezas exclusivas con acabados en pedrería y gorras de colección que marcan tendencia en cada paso.Cada prenda lleva el sello de nuestra historia familiar.
                        </p>
                            < span className = "text-amber-400 font-serif text-xs italic tracking-wide" >
                                [JUSTYN & RONALD LEON]
                                </span>
                                </div>
                                </div>
                                </section>

{/* Modal de Detalle de Producto */ }
{
    productoSeleccionado && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50" >
            <div className="bg-[#141414] text-white border border-amber-600/40 rounded-none max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative" >
                <button
                            onClick={ () => setProductoSeleccionado(null) }
    className = "absolute top-3 right-3 bg-black hover:bg-amber-500 hover:text-black text-white rounded-none w-8 h-8 flex items-center justify-center font-bold z-20 transition-colors border border-amber-600/30"
        >
                            ✕
    </button>

        < div className = "h-64 bg-black relative flex-shrink-0" >
            <img
                                src={ productoSeleccionado.imagen_url }
    alt = { productoSeleccionado.nombre }
    className = {`w-full h-full object-cover ${productoSeleccionado.stock !== undefined && productoSeleccionado.stock <= 0 ? 'grayscale brightness-50' : ''}`
}
                            />
    </div>

    < div className = "p-6 overflow-y-auto flex-grow" >
        <h2 className="text-xl font-bold text-amber-400 mb-1 font-serif" >
        { productoSeleccionado.nombre }
            </h2>
            < span className = "text-lg font-bold text-white block mb-4" >
                ${ productoSeleccionado.precio.toFixed(2) }
</span>

    < div className = "text-gray-300 text-xs mb-6 bg-black p-4 border border-amber-600/20" >
        <p className="font-bold text-amber-400 mb-2 uppercase tracking-wider" > Detalles del producto: </p>
{
    productoSeleccionado.especificaciones ? (
        <ul className= "space-y-1.5 list-disc list-inside text-gray-300 font-light" >
        {
            productoSeleccionado.especificaciones
                .split('\n')
                .map((spec: string, index: number) => (
                    <li key= { index } > { spec.replace(/^[-*]\s*/, '') } </li>
                ))
        }
        </ul>
                                ) : (
        <p className= "text-gray-400 font-light" > { productoSeleccionado.descripcion } </p>
                                )
}
</div>

    < button
onClick = {() => {
    if (productoSeleccionado.stock === undefined || productoSeleccionado.stock > 0) {
        agregarAlCarrito(productoSeleccionado)
        setProductoSeleccionado(null)
    }
}}
disabled = { productoSeleccionado.stock !== undefined && productoSeleccionado.stock <= 0 }
className = {`w-full py-3 font-extrabold uppercase tracking-widest transition-colors text-xs shadow-md ${productoSeleccionado.stock !== undefined && productoSeleccionado.stock <= 0
        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
        : 'bg-amber-500 hover:bg-amber-600 text-black'
    }`}
                            >
{ productoSeleccionado.stock !== undefined && productoSeleccionado.stock <= 0 ? 'Agotado' : 'Agregar al carrito' }
    </button>
    </div>
    </div>
    </div>
            )}

{/* Modal de Carrito */ }
{
    mostrarCarritoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50" >
            <div className="bg-[#141414] text-white border border-amber-600/40 rounded-none max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative" >
                <div className="p-4 border-b border-amber-600/20 flex justify-between items-center bg-black" >
                    <h2 className="text-sm font-black uppercase tracking-wider text-amber-400" >🛒 Tu Carrito de Compras </h2>
                        < button
    onClick = {() => setMostrarCarritoModal(false)
}
className = "bg-gray-900 hover:bg-amber-500 hover:text-black text-white rounded-none w-8 h-8 flex items-center justify-center font-bold transition-colors border border-gray-800"
    >
                                ✕
</button>
    </div>

    < div className = "p-4 overflow-y-auto flex-grow space-y-3" >
    {
        carrito.map((item) => (
            <div key= { item.producto.id } className = "flex items-center justify-between bg-black p-3 border border-amber-600/20 gap-3" >
            <img src={ item.producto.imagen_url } alt = { item.producto.nombre } className = "w-14 h-14 object-cover rounded-none flex-shrink-0" />
            <div className="flex-grow min-w-0" >
        <h4 className="font-bold text-xs truncate text-amber-400" > { item.producto.nombre } </h4>
        < p className = "text-gray-300 text-xs font-semibold" > ${ item.producto.precio.toFixed(2) } c / u </p>
        </div>
        < div className = "flex items-center gap-2 bg-[#111] px-2.5 py-1 border border-gray-800" >
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

    < div className = "p-4 border-t border-amber-600/20 bg-black flex justify-between items-center" >
        <span className="text-xs font-bold text-gray-300 uppercase" > Total a pagar: </span>
            < span className = "text-lg font-black text-amber-400" > ${ precioTotalCarrito.toFixed(2) } </span>
                </div>
                </div>
                </div>
            )}

{/* Barra Inferior Flotante */ }
{
    carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#121212] border-t border-amber-600/40 p-4 shadow-2xl z-40 max-w-7xl mx-auto flex flex-col gap-3" >
        {/* Aviso de cliente frecuente si ya existe en Supabase */ }
    {
        clienteFrecuente && (
            <div className="bg-amber-500/10 border border-amber-500/40 px-3 py-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center justify-between" >
                <span>✨ ¡Qué bueno verte de nuevo, { nombreCliente }!(Cliente Frecuente) </span>
                    < span className = "text-[10px] text-gray-400 font-normal" > Datos sincronizados </span>
                        </div>
                    )
    }

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black p-3 border border-amber-600/20" >
        <div className="flex items-center gap-2" >
            <label className="text-[11px] font-bold text-amber-400 whitespace-nowrap uppercase tracking-wider" >
                                🆔 Cédula:
    </label>
        < input
    type = "text"
    value = { cedulaCliente }
    onChange = { manejarCambioCedula }
    placeholder = "NÚMERO DE CÉDULA..."
    className = "w-full px-3 py-1.5 bg-[#080808] border border-gray-800 rounded-none text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
        />
        </div>
        < div className = "flex items-center gap-2" >
            <label className="text-[11px] font-bold text-amber-400 whitespace-nowrap uppercase tracking-wider" >
                                👤 Nombre:
    </label>
        < input
    type = "text"
    value = { nombreCliente }
    onChange = {(e) => setNombreCliente(e.target.value)
}
placeholder = "NOMBRE DEL COMPRADOR..."
className = "w-full px-3 py-1.5 bg-[#080808] border border-gray-800 rounded-none text-xs text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
    />
    </div>
    </div>

    < div className = "flex flex-col sm:flex-row items-center justify-between gap-4" >
        <div className="flex items-center gap-4 text-xs font-semibold w-full sm:w-auto justify-between sm:justify-start" >
            <button
                                onClick={ () => setMostrarCarritoModal(true) }
className = "bg-black hover:bg-amber-500/20 px-4 py-2.5 text-white text-xs border border-amber-600/30 flex items-center gap-2 transition-all cursor-pointer shadow-md uppercase tracking-wider"
    >
                                🛒 <span className="underline font-bold" > { totalProductosCarrito } producto{ totalProductosCarrito > 1 ? 's' : '' } (Ver carrito)</span>
    </button>
    < span className = "text-gray-300" > Total: <strong className="text-amber-400 text-base" > ${ precioTotalCarrito.toFixed(2) } </strong></span >
        </div>

        < div className = "flex items-center gap-3 w-full sm:w-auto" >
        { esLocalhost && (
                <button
                                    onClick={ descargarReciboPDF }
className = "flex-1 sm:flex-none bg-[#1a1a1a] hover:bg-amber-500/30 text-amber-400 px-5 py-2.5 font-bold text-xs uppercase tracking-wider transition-colors border border-amber-600/40 shadow-sm"
    >
    Imprimir Comprobante
        </button>
                            )}
<button
                                onClick={ enviarPedidoWhatsApp }
className = "flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 font-bold text-xs uppercase tracking-widest transition-colors shadow-md flex items-center justify-center gap-2"
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