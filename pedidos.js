import { supabase } from './supabaseClient.js';

export async function registrarSalida(producto, cantidad, usuarioEmail) {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .insert([
                { 
                    producto: producto, 
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

export async function cargarRegistros(contenedorTabla) {
    if (!contenedorTabla) return;

    const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('fecha', { ascending: false });

    if (error) {
        console.error('Error al cargar pedidos:', error.message);
        return;
    }

    contenedorTabla.innerHTML = '';
    data.forEach(item => agregarFilaALaTabla(item, contenedorTabla));
}

export function agregarFilaALaTabla(item, contenedorTabla) {
    if (!contenedorTabla) return;

    const fechaFormateada = new Date(item.fecha).toLocaleString();
    const fila = document.createElement('tr');
    
    fila.innerHTML = `
        <td>${item.producto}</td>
        <td>${item.cantidad}</td>
        <td>${item.usuario}</td>
        <td>${fechaFormateada}</td>
    `;
    
    contenedorTabla.prepend(fila);
}