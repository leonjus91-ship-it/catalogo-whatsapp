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

    const productosFiltrados = productos.filter((producto) => {
        const coincideTexto = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())

        const categoriaProducto = producto.categoria?.toLowerCase() || ''
        const coincideCategoria = categoriaSeleccionada === 'todos' ||
            categoriaProducto.includes(categoriaSeleccionada.toLowerCase())

        return coincideTexto && coincideCategoria
    })

    return (
        <main className= "min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" >
        <div className="max-w-7xl mx-auto" >
        {/* Título de la Tienda */ }
            < div className = "text-center mb-8" >
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight" >
                    Catálogo de Productos
                        </h1>
                        < p className = "mt-2 text-lg text-gray-600" >
                            Pedidos directos por WhatsApp
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
className = "w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
    />
    </div>

{/* Botones de Filtro por Categoría */ }
<div className="flex justify-center gap-3 mb-8" >
    <button
            onClick={ () => setCategoriaSeleccionada('todos') }
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'todos'
        ? 'bg-black text-white shadow-md'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
    }`}
          >
    Todos
    </button>
    < button
onClick = {() => setCategoriaSeleccionada('camisetas')}
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'camisetas'
        ? 'bg-black text-white shadow-md'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
    }`}
          >
    Camisetas
    </button>
    < button
onClick = {() => setCategoriaSeleccionada('gorras')}
className = {`px-5 py-2 rounded-full font-medium transition-all ${categoriaSeleccionada === 'gorras'
        ? 'bg-black text-white shadow-md'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
    }`}
          >
    Gorras
    </button>
    </div>

{/* Mensaje de carga */ }
{
    cargando && (
        <div className="text-center py-12 text-gray-500" > Cargando productos...</div>
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
                className = "bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
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
            < a
                      href = {`https://wa.me/593996926920?text=${encodeURIComponent(`Hola, quiero comprar este modelo: ${producto.nombre}.\nAquí puedes ver la foto: ${producto.imagen_url}`)}`}
    target = "_blank"
    rel = "noopener noreferrer"
    className = "w-full block text-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-xl transition-colors shadow-sm"
        >
        Pedir por WhatsApp
            </a>
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
        <div className="text-center py-12 text-gray-500" >
            No se encontraron productos con esos filtros.
          </div>
        )
}
</div>
    </main>
  )
}
