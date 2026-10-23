'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
    id: number
    nombre: string
    precio: number
}

interface ItemFactura {
    producto: Producto
    cantidad: number
}

export default function AdminPage() {
    const [autenticado, setAutenticado] = useState(false)
    const [passwordInput, setPasswordInput] = useState('')
    const [errorPassword, setErrorPassword] = useState(false)

    // Datos para la Factura
    const [productos, setProductos] = useState<Producto[]>([])
    const [clienteNombre, setClienteNombre] = useState('')
    const [clienteDni, setClienteDni] = useState('')
    const [clienteTelefono, setClienteTelefono] = useState('')
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [cantidad, setCantidad] = useState<number>(1)
    const [itemsFactura, setItemsFactura] = useState<ItemFactura[]>([])

    const CLAVE_SECRETA = '1234'

    useEffect(() => {
        if (autenticado) {
            cargarProductos()
        }
    }, [autenticado])

    const cargarProductos = async () => {
        const { data } = await supabase.from('productos').select('*').order('nombre', { ascending: true })
        if (data) setProductos(data as Producto[])
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordInput === CLAVE_SECRETA) {
            setAutenticado(true)
            setErrorPassword(false)
        } else {
            setErrorPassword(true)
        }
    }

    const handleAddItem = () => {
        if (!selectedProductId) return
        const prod = productos.find((p) => p.id === parseInt(selectedProductId))
        if (!prod) return

        setItemsFactura((prev) => {
            const existe = prev.find((item) => item.producto.id === prod.id)
            if (existe) {
                return prev.map((item) =>
                    item.producto.id === prod.id
                        ? { ...item, cantidad: item.cantidad + cantidad }
                        : item
                )
            }
            return [...prev, { producto: prod, cantidad }]
        })

        setCantidad(1)
    }

    const handleRemoveItem = (id: number) => {
        setItemsFactura((prev) => prev.filter((item) => item.producto.id !== id))
    }

    const total = itemsFactura.reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0)

    const handlePrint = () => {
        window.print()
    }

    // Pantalla de Login
    if (!autenticado) {
        return (
            <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
                <form onSubmit={handleLogin} style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', width: '100%', maxWidth: '360px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: '#f8fafc', letterSpacing: '1px' }}>RJL FLOW STORE</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Acceso al Módulo de Facturación</p>
                    <input
                        type="password"
                        placeholder="Ingrese la contraseña"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', marginBottom: '1rem', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {errorPassword && (
                        <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '-0.5rem 0 1rem' }}>Contraseña incorrecta</p>
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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '25px 20px' }}>

            {/* Estilos para impresión limpia */}
            <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
          }
          .print-grid {
            display: block !important;
          }
        }
      `}</style>

            {/* Cabecera Admin */}
            <div className="no-print" style={{ maxWidth: '1000px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', letterSpacing: '1px' }}>RJL FLOW STORE</h1>
                    <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Punto de Venta & Comprobantes</p>
                </div>
                <button
                    onClick={() => setAutenticado(false)}
                    style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                    Cerrar Sesión
                </button>
            </div>

            <div className="print-grid" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>

                {/* Formulario Cliente y Selección de Prendas */}
                <div className="no-print" style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ color: '#0f172a', marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontSize: '1.05rem' }}>Datos del Cliente</h3>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Nombre Completo:</label>
                        <input type="text" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Ej. Juan Pérez" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Cédula / RUC:</label>
                        <input type="text" value={clienteDni} onChange={(e) => setClienteDni(e.target.value)} placeholder="Ej. 0999999999" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Teléfono:</label>
                        <input type="text" value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} placeholder="Ej. 0987654321" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '4px', boxSizing: 'border-box' }} />
                    </div>

                    <h4 style={{ color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.95rem' }}>Agregar Prendas</h4>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="">Seleccionar producto...</option>
                            {productos.map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre} - ${p.precio}</option>
                            ))}
                        </select>
                        <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <button onClick={handleAddItem} style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        + Agregar al Comprobante
                    </button>
                </div>

                {/* Vista previa de Comprobante / Ticket */}
                <div className="print-container" style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '12px', border: '2px solid #0f172a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: '#0f172a', letterSpacing: '2px', fontSize: '1.3rem' }}>RJL FLOW STORE</h2>
                            <p style={{ margin: '3px 0 0 0', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569' }}>MODA Y ESTILO URBANO</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>COMPROBANTE DE VENTA</p>
                        </div>

                        <div style={{ fontSize: '0.85rem', marginBottom: '15px', color: '#334155' }}>
                            <p style={{ margin: '3px 0' }}><strong>Cliente:</strong> {clienteNombre || '--------------------'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Cédula/RUC:</strong> {clienteDni || '--------------------'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Teléfono:</strong> {clienteTelefono || '--------------------'}</p>
                            <p style={{ margin: '3px 0' }}><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '15px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #0f172a', textAlign: 'left', color: '#0f172a' }}>
                                    <th style={{ padding: '6px 0' }}>Producto</th>
                                    <th style={{ padding: '6px 0' }}>Cant.</th>
                                    <th style={{ padding: '6px 0' }}>P.Unit</th>
                                    <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
                                    <th className="no-print" style={{ padding: '6px 0' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsFactura.map((item) => (
                                    <tr key={item.producto.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 0' }}>{item.producto.nombre}</td>
                                        <td style={{ padding: '6px 0' }}>{item.cantidad}</td>
                                        <td style={{ padding: '6px 0' }}>${item.producto.precio}</td>
                                        <td style={{ padding: '6px 0', textAlign: 'right' }}>${(item.producto.precio * item.cantidad).toFixed(2)}</td>
                                        <td className="no-print" style={{ padding: '6px 0', textAlign: 'right' }}>
                                            <button onClick={() => handleRemoveItem(item.producto.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <div style={{ borderTop: '2px solid #0f172a', paddingTop: '10px', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                            TOTAL: ${total.toFixed(2)}
                        </div>
                        <button className="no-print" onClick={handlePrint} style={{ width: '100%', marginTop: '15px', padding: '12px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' }}>
                            🖨️ Imprimir / Guardar PDF
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}