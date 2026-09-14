'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
    id: number
    nombre: string
    descripcion: string
    precio: number
    imagen_url: string
}

export default function CatalogoPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [errorMensaje, setErrorMensaje] = useState<string | null>(null)

    const NUMERO_WHATSAPP = '593900000000'

    useEffect(() => {
        const obtenerProductos = async () => {
            try {
                setLoading(true)
                setErrorMensaje(null)

                const { data, error } = await supabase
                    .from('productos')
                    .select('*')
                    .order('id', { ascending: false })

                if (error) {
                    setErrorMensaje(error.message)
                } else if (data) {
                    setProductos(data)
                }
            } catch (err: any) {
                setErrorMensaje('Error de conexión')
            } finally {
                setLoading(false)
            }
        }

        obtenerProductos()
    }, [])

    const productosFiltrados = productos.filter((producto) => {
        const termino = busqueda.toLowerCase()
        return (
            producto.nombre?.toLowerCase().includes(termino) ||
            producto.descripcion?.toLowerCase().includes(termino)
        )
    })

    const generarEnlaceWhatsApp = (producto: Producto) => {
        const mensaje = `¡Hola! Me interesa comprar este producto:\n\n📌 *${producto.nombre}*\n💰 Precio: $${Number(producto.precio).toFixed(2)}`
        return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 pb-12">
            <header className="max-w-md mx-auto text-center mb-6 pt-4">
                <h1 className="text-2xl font-bold text-gray-800">Catálogo de Productos</h1>
                <p className="text-xs text-gray-500 mt-1">Pedidos directos por WhatsApp</p>
            </header>

            <main className="max-w-md mx-auto space-y-4">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-black outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {loading && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Cargando catálogo...
                    </div>
                )}

                {errorMensaje && !loading && (
                    <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg text-center">
                        {errorMensaje}
                    </div>
                )}

                {!loading && !errorMensaje && (
                    <div className="grid grid-cols-1 gap-4">
                        {productosFiltrados.map((producto) => (
                            <div key={producto.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Visualizador de Imagen */}
                                <div className="w-full h-56 bg-gray-50 flex items-center justify-center overflow-hidden">
                                    {producto.imagen_url ? (
                                        <img
                                            src={producto.imagen_url}
                                            alt={producto.nombre}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-gray-400 text-xs">Sin imagen</span>
                                    )}
                                </div>

                                {/* Detalle del producto */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-base">{producto.nombre}</h3>
                                    <p className="text-xs text-gray-500 mt-1">{producto.descripcion}</p>

                                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                                        <span className="text-lg font-black text-gray-900">
                                            ${Number(producto.precio).toFixed(2)}
                                        </span>
                                        <a
                                            href={generarEnlaceWhatsApp(producto)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-emerald-600 active:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm"
                                        >
                                            Pedir por WhatsApp
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}