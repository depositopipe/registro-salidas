import { supabase } from './supabaseClient.js';

export async function registrarSalida(producto, cantidad, usuarioEmail) {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .insert([
                { 
                    producto: producto.trim(), 
                    cantidad: parseInt(cantidad), 
                    usuario: usuarioEmail,
                    fecha: new Date().toISOString()
                }
            ]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error en registrarSalida:', error.message);
        alert('Error al guardar el pedido: ' + error.message);
        return { success: false };
    }
}

// Cargar registros aplicando filtros de días (hoy = 1, 3 días, 7 días, 30 días, o null para todo)
export async function cargarRegistros(contenedorTabla, filtroDias = null) {
    if (!contenedorTabla) return;

    try {
        let query = supabase.from('pedidos').select('*').order('fecha', { ascending: false });

        if (filtroDias) {
            const fechaLimite = new Date();
            if (filtroDias === 1) {
                // Desde el inicio del día de hoy (00:00:00)
                fechaLimite.setHours(0, 0, 0, 0);
            } else {
                fechaLimite.setDate(fechaLimite.getDate() - filtroDias);
            }
            query = query.gte('fecha', fechaLimite.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        contenedorTabla.innerHTML = '';

        if (!data || data.length === 0) {
            contenedorTabla.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No hay registros para este período.</td></tr>`;
            return;
        }

        // Agrupar y sumar cantidades por nombre de producto
        const productosAgrupados = {};
        data.forEach(item => {
            // Normalizar clave para agrupar sin importar mayúsculas/minúsculas
            const clave = item.producto.trim().toLowerCase();
            if (!productosAgrupados[clave]) {
                productosAgrupados[clave] = {
                    productoOriginal: item.producto.trim(),
                    cantidadTotal: 0,
                    ultimoUsuario: item.usuario,
                    ultimaFecha: item.fecha
                };
            }
            productosAgrupados[clave].cantidadTotal += parseInt(item.cantidad);
            
            // Mantener la fecha más reciente
            if (new Date(item.fecha) > new Date(productosAgrupados[clave].ultimaFecha)) {
                productosAgrupados[clave].ultimaFecha = item.fecha;
                productosAgrupados[clave].ultimoUsuario = item.usuario;
            }
        });

        // Pintar filas consolidadas en la tabla
        Object.values(productosAgrupados).forEach(item => {
            const fechaFormateada = new Date(item.ultimaFecha).toLocaleString();
            const fila = document.createElement('tr');
            
            fila.innerHTML = `
                <td>${escapeHtml(item.productoOriginal)}</td>
                <td><strong>${item.cantidadTotal}</strong></td>
                <td>${escapeHtml(item.ultimoUsuario || 'N/A')}</td>
                <td>${fechaFormateada}</td>
            `;
            
            contenedorTabla.appendChild(fila);
        });

    } catch (err) {
        console.error('Error al cargar y consolidar pedidos:', err.message);
    }
}

export function agregarFilaALaTabla(item, contenedorTabla) {
    // Al haber un ingreso en tiempo real, recargamos la vista actual para actualizar las sumas de inmediato
    // Nota: El dashboard principal se encarga de refrescar según el filtro activo.
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}