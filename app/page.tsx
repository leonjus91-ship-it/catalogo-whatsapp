'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Producto {
    id: number
    nombre: string
    descripcion: string
    precio: number
    imagen_url: string
    categoria?: string
}

export default function Home() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [busqueda, setBusqueda] = useState('')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos')
    const [cargando, setCargando] = useState(true)

    const [carrito, setCarrito] = useState<Producto[]>([])

    useEffect(() => {
        async function obtenerProductos() {
            const { data, error } = await supabase.from('productos').select('*')
            if (error) {
                console.error('Error al cargar productos:', error)
            } else {
                setProductos(data || [])
            }
            setCargando(false)
        }

        obtenerProductos()
    }, [])

    const agregarAlCarrito = (producto: Producto) => {
        setCarrito([...carrito, producto])
    }

    const eliminarDelCarrito = (index: number) => {
        const nuevoCarrito = carrito.filter((_, i) => i !== index)
        setCarrito(nuevoCarrito)
    }

    const enviarPedidoWhatsApp = () => {
        if (carrito.length === 0) return

        let mensaje = 'Hola, quiero realizar el siguiente pedido:\n\n'
        let total = 0

        carrito.forEach((item, index) => {
            mensaje += `${index + 1}. ${item.nombre} - $${item.precio}\n`
            total += item.precio
        })

        mensaje += `\n*Total a pagar: $${total.toFixed(2)}*`

        const url = `https://wa.me/593996926920?text=${encodeURIComponent(mensaje)}`
        window.open(url, '_blank')
    }

    const productosFiltrados = productos.filter((producto) => {
        const coincideTexto = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())

        const categoriaProducto = producto.categoria?.toLowerCase() || ''
        const coincideCategoria = categoriaSeleccionada === 'todos' ||
            categoriaProducto.includes(categoriaSeleccionada.toLowerCase())

        return coincideTexto && coincideCategoria
    })

    return (
        // Fondo oscuro texturizado con patrón de cuadrícula sutil en tonos neón/azulados
        <main className= "min-h-screen py-8 px-4 sm:px-6 lg:px-8 pb-32 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]" >
        <div className="max-w-7xl mx-auto" >
        {/* Título de la Tienda */ }
            < div className = "text-center mb-8" >
                <h1 className="text-4xl font-extrabold text-white tracking-tight" >
                    Catálogo de Productos
                        </h1>
                        < p className = "mt-2 text-lg text-gray-400" >
                            Selecciona tus productos y pídelos juntos por WhatsApp
                                </p>
                                </div>

    {/* Barra de Búsqueda */ }
    <div className="max-w-md mx-auto mb-4" >
        <input
            type="text"
    placeholder = "Buscar producto..."
    value = { busqueda }
    onChange = {(e) => setBusqueda(e.target.value)
}
className = "w-full px-4 py-3 rounded-xl border border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
    />
    </div>

{/* Botones de Filtro por Categoría */ }
<div className="flex justify-center gap-3 mb-8" >
    <button
            onClick={ () => setCategoriaSeleccionada('todos') }
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'todos'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-slate-900 text-gray-300 border border-slate-700 hover:bg-slate-800'
    }`}
          >
    Todos
    </button>
    < button
onClick = {() => setCategoriaSeleccionada('camisetas')}
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'camisetas'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-slate-900 text-gray-300 border border-slate-700 hover:bg-slate-800'
    }`}
          >
    Camisetas
    </button>
    < button
onClick = {() => setCategoriaSeleccionada('gorras')}
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'gorras'
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-slate-900 text-gray-300 border border-slate-700 hover:bg-slate-800'
    }`}
          >
    Gorras
    </button>
    </div>

{/* Mensaje de carga */ }
{
    cargando && (
        <div className="text-center py-12 text-gray-400" > Cargando productos...</div>
        )
}

{/* Cuadrícula de Productos */ }
{
    !cargando && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" >
        {
            productosFiltrados.map((producto) => (
                <div
                key= { producto.id }
                className = "bg-white rounded-2xl shadow-md border border-slate-800 overflow-hidden flex flex-col hover:shadow-xl transition-shadow"
                >
                <div className="w-full h-48 bg-gray-100 relative overflow-hidden" >
            <img
                    src={ producto.imagen_url }
                    alt = { producto.nombre }
                    className = "w-full h-full object-cover"
                />
                </div>
                < div className = "p-5 flex-1 flex flex-col justify-between" >
                <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1" >
                { producto.nombre }
                </h3>
            < p className = "text-gray-600 text-sm mb-4 line-clamp-2" >
            { producto.descripcion }
            </p>
            </div>
            < div >
            <div className="text-xl font-bold text-gray-900 mb-4" >
            ${ producto.precio }
            </div>
            < button
                      onClick = {() => agregarAlCarrito(producto)}
    className = "w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
        Agregar al carrito
            </button>
            </div>
            </div>
            </div>
            ))
}
</div>
        )}

{/* Si no hay resultados */ }
{
    !cargando && productosFiltrados.length === 0 && (
        <div className="text-center py-12 text-gray-400" >
            No se encontraron productos con esos filtros.
          </div>
        )
}
</div>

{/* Barra flotante inferior del Carrito */ }
{
    carrito.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl p-4 z-50" >
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" >
                <div className="flex items-center gap-3" >
                    <span className="bg-black text-white text-sm font-bold px-3 py-1 rounded-full" >
                    { carrito.length } { carrito.length === 1 ? 'producto' : 'productos' }
    </span>
        < span className = "text-gray-700 font-medium" >
            Total: ${ carrito.reduce((acc, item) => acc + item.precio, 0).toFixed(2) }
    </span>
        </div>

        < div className = "flex items-center gap-2 overflow-x-auto max-w-xs sm:max-w-sm py-1" >
        {
            carrito.map((item, index) => (
                <div key= { index } className = "relative flex-shrink-0 group" >
                <img src={ item.imagen_url } alt = { item.nombre } className = "w-10 h-10 object-cover rounded-lg border" />
                <button
                    onClick={() => eliminarDelCarrito(index)}
    className = "absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs shadow hover:bg-red-600"
        >
                    ×
    </button>
        </div>
              ))
}
</div>

    < button
onClick = { enviarPedidoWhatsApp }
className = "bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors shadow-md flex items-center gap-2"
    >
    Enviar pedido por WhatsApp
        </button>
        </div>
        </div>
      )}
</main>
  )
}