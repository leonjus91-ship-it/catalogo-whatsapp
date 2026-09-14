'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
    id: number
    nombre: string
    descripcion: string
    precio: number
    imagen_url: string
    disponible: boolean
}

export default function AdminPage() {
    const [autenticado, setAutenticado] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [errorPassword, setErrorPassword] = useState(false)

    const [productos, setProductos] = useState<Producto[]>([])
    const [nombre, setNombre] = useState('')
    const [precio, setPrecio] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [imagen, setImagen] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    // Cambia '1234' por la contraseña de tu preferencia
    const CLAVE_SECRETA = '1234'

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === CLAVE_SECRETA) {
            setAutenticado(true)
            setErrorPassword(false)
        } else {
            setErrorPassword(true)
        }
    }

    const cargarProductos = async () => {
        const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
        if (data) setProductos(data)
    }

    useEffect(() => {
        if (autenticado) {
            cargarProductos()
        }
    }, [autenticado])

    const guardarProducto = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        let imagen_url = ''

        if (imagen) {
            const fileExt = imagen.name.split('.').pop()
            const fileName = `${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('productos')
                .upload(filePath, imagen)

            if (uploadError) {
                alert('Error al subir la imagen: ' + uploadError.message)
                setLoading(false)
                return
            }

            const { data: urlData } = supabase.storage
                .from('productos')
                .getPublicUrl(filePath)

            imagen_url = urlData.publicUrl
        }

        const { error } = await supabase.from('productos').insert([
            {
                nombre,
                precio: parseFloat(precio),
                descripcion,
                imagen_url,
                disponible: true
            }
        ])

        if (error) {
            alert('Error al guardar el producto: ' + error.message)
        } else {
            setNombre('')
            setPrecio('')
            setDescripcion('')
            setImagen(null)
            const fileInput = document.getElementById('fileInput') as HTMLInputElement
            if (fileInput) fileInput.value = ''

            cargarProductos()
        }

        setLoading(false)
    }

    const eliminarProducto = async (id: number) => {
        const confirmar = confirm('¿Estás seguro de que deseas eliminar este producto?')
        if (!confirmar) return

        const { error } = await supabase.from('productos').delete().eq('id', id)

        if (error) {
            alert('Error al eliminar: ' + error.message)
        } else {
            cargarProductos()
        }
    }

    // Pantalla de acceso si no está autenticado
    if (!autenticado) {
        return (
            <div style={{ backgroundColor: '#f9fafb', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <form onSubmit={handleLogin} style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '360px' }}>
                    <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', textAlign: 'center', color: '#111827' }}>Acceso Administrativo</h2>
                    <input
                        type="password"
                        placeholder="Ingrese la contraseña"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '1rem', boxSizing: 'border-box' }}
                    />
                    {errorPassword && (
                        <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: '-0.5rem 0 1rem' }}>Contraseña incorrecta</p>
                    )}
                    <button
                        type="submit"
                        style={{ width: '100%', padding: '0.65rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        )
    }

    // Panel de administración activo
    return (
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Panel de Administración</h1>
                <button
                    onClick={() => setAutenticado(false)}
                    style={{ backgroundColor: '#6b7280', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    Cerrar Sesión
                </button>
            </div>

            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Agregar Nuevo Producto</h2>

                <input
                    type="text"
                    placeholder="Nombre del producto"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />

                <input
                    type="number"
                    step="0.01"
                    placeholder="Precio ($)"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    required
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />

                <textarea
                    placeholder="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                    style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                />

                <label style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Imagen del producto:</label>
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImagen(e.target.files ? e.target.files[0] : null)}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
            </form>

            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Inventario Actual</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {productos.map((prod) => (
                    <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {prod.imagen_url && (
                                <img src={prod.imagen_url} alt={prod.nombre} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '4px', backgroundColor: '#f3f4f6' }} />
                            )}
                            <div>
                                <strong>{prod.nombre}</strong> - ${prod.precio.toFixed(2)}
                                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.85rem' }}>{prod.descripcion}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => eliminarProducto(prod.id)}
                            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </main>
    )
}