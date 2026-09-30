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

    useEffect(() => {
        cargarProductos()
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

    const enviarPedidoWhatsApp = () => {
        if (carrito.length === 0) return

        let mensaje = '¡Hola! 🧢 Me gustaría hacer el siguiente pedido en JL Flow Store:\n\n'
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

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            {/* Header / Banner */}
            <header className="bg-black text-white py-8 px-4 text-center shadow-md">
                <h1 className="text-3xl font-extrabold tracking-wider uppercase">JL Flow Store</h1>
                <p className="text-sm text-gray-400 mt-1">Streetwear, gorras y estilo urbano</p>
            </header>

            <div className="max-w-6xl mx-auto px-4 mt-6">
                {/* Barra de búsqueda y Filtros */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
                    <input
                        type="text"
                        placeholder="Buscar gorras, camisetas..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full md:w-80 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2">
                        {['todos', 'gorras', 'camisetas'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoriaSeleccionada(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${categoriaSeleccionada === cat
                                        ? 'bg-black text-white shadow'
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {productosFiltrados.map((producto) => (
                        <div
                            key={producto.id}
                            className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col justify-between relative"
                        >
                            {/* Etiqueta flotante de Oferta si tiene precio anterior */}
                            {producto.precio_anterior && producto.precio_anterior > producto.precio && (
                                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow z-10">
                                    Oferta
                                </span>
                            )}

                            <div
                                className="cursor-pointer relative h-56 bg-gray-100 overflow-hidden"
                                onClick={() => setProductoSeleccionado(producto)}
                            >
                                <img
                                    src={producto.imagen_url}
                                    alt={producto.nombre}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                            </div>

                            <div className="p-4 flex flex-col flex-grow justify-between">
                                <div>
                                    <h3
                                        className="font-bold text-lg text-gray-900 cursor-pointer hover:underline"
                                        onClick={() => setProductoSeleccionado(producto)}
                                    >
                                        {producto.nombre}
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                                        {producto.descripcion}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        {producto.precio_anterior && producto.precio_anterior > producto.precio && (
                                            <span className="text-xs text-gray-400 line-through">
                                                ${producto.precio_anterior.toFixed(2)}
                                            </span>
                                        )}
                                        <span className="text-xl font-bold text-gray-900">
                                            ${producto.precio.toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => agregarAlCarrito(producto)}
                                        className="bg-black text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal de Detalle del Producto */}
            {productoSeleccionado && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setProductoSeleccionado(null)}
                            className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center font-bold z-10 transition-colors"
                        >
                            ✕
                        </button>

                        <div className="h-72 bg-gray-100 relative">
                            {productoSeleccionado.precio_anterior && productoSeleccionado.precio_anterior > productoSeleccionado.precio && (
                                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow z-10">
                                    Oferta
                                </span>
                            )}
                            <img
                                src={productoSeleccionado.imagen_url}
                                alt={productoSeleccionado.nombre}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="p-6">
                            <h2 className="text-2xl font-black text-gray-900 mb-1">
                                {productoSeleccionado.nombre}
                            </h2>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl font-bold text-black">
                                    ${productoSeleccionado.precio.toFixed(2)}
                                </span>
                                {productoSeleccionado.precio_anterior && productoSeleccionado.precio_anterior > productoSeleccionado.precio && (
                                    <span className="text-base text-gray-400 line-through">
                                        ${productoSeleccionado.precio_anterior.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Sección dinámica de especificaciones con viñetas */}
                            <div className="text-gray-700 text-sm mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="font-bold text-gray-900 mb-2">Detalles del producto:</p>
                                {productoSeleccionado.especificaciones ? (
                                    <ul className="space-y-1.5 list-disc list-inside text-gray-700">
                                        {productoSeleccionado.especificaciones
                                            .split('\n')
                                            .map((spec: string, index: number) => (
                                                <li key={index}>{spec.replace(/^[-*]\s*/, '')}</li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600">{productoSeleccionado.descripcion}</p>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    agregarAlCarrito(productoSeleccionado)
                                    setProductoSeleccionado(null)
                                }}
                                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                            >
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Carrito Flotante / Botón de Pedido por WhatsApp */}
            {carrito.length > 0 && (
                <div className="fixed bottom-6 right-6 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 max-w-sm w-full z-40">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-900">Tu Pedido ({carrito.reduce((acc, item) => acc + item.cantidad, 0)})</h4>
                        <button
                            onClick={() => setCarrito([])}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Vaciar
                        </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-2 mb-4 pr-1">
                        {carrito.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-700">
                                <span className="truncate pr-2">
                                    {item.cantidad}x {item.producto.nombre}
                                </span>
                                <span className="font-semibold">
                                    ${(item.producto.precio * item.cantidad).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={enviarPedidoWhatsApp}
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                        Pedir por WhatsApp 📱
                    </button>
                </div>
            )}
        </main>
    )
}