import { supabase } from './supabaseClient.js';
import { registrarSalida, cargarRegistros, agregarFilaALaTabla } from './pedidos.js';

// Función para verificar la sesión directamente
async function verificarSesion() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
        window.location.href = 'index.html';
        return null;
    }
    return session.user;
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarSesion();
    if (!user) return;

    const userDisplay = document.getElementById('user-email-display');
    if (userDisplay) {
        userDisplay.textContent = user.email;
    }

    const tablaCuerpo = document.getElementById('tabla-registros-body');

    // Cargar datos iniciales
    await cargarRegistros(tablaCuerpo);

    // Escucha en tiempo real para nuevos registros
    supabase
        .channel('public:pedidos')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'pedidos' 
        }, payload => {
            agregarFilaALaTabla(payload.new, tablaCuerpo);
        })
        .subscribe();

    // Manejador del formulario de nuevos pedidos
    const formPedido = document.getElementById('form-pedido');
    if (formPedido) {
        formPedido.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputProducto = document.getElementById('input-producto');
            const inputCantidad = document.getElementById('input-cantidad');

            const producto = inputProducto.value.trim();
            const cantidad = inputCantidad.value;

            if (!producto || !cantidad) return;

            const resultado = await registrarSalida(producto, cantidad, user.email);
            if (resultado.success) {
                inputProducto.value = '';
                inputCantidad.value = '1';
            }
        });
    }

    // Lógica del botón Salir (Cerrar sesión)
    const btnSalir = document.getElementById('btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert('Error al cerrar sesión: ' + error.message);
                return;
            }
            window.location.href = 'index.html';
        });
    }

    // Lógica de los botones de navegación (Menú)
    const btnMenuSalidas = document.getElementById('btn-menu-salidas');
    const btnMenuHistorial = document.getElementById('btn-menu-historial');
    const panelFormulario = document.querySelector('.panel-card');

    if (btnMenuSalidas && btnMenuHistorial) {
        btnMenuSalidas.addEventListener('click', () => {
            btnMenuSalidas.classList.add('active');
            btnMenuHistorial.classList.remove('active');
            if (panelFormulario) panelFormulario.style.display = 'block';
        });

        btnMenuHistorial.addEventListener('click', () => {
            btnMenuHistorial.classList.add('active');
            btnMenuSalidas.classList.remove('active');
            if (panelFormulario) panelFormulario.style.display = 'block';
        });
    }

    // Funcionalidad de Exportar y Purgar (Respaldo y limpieza de espacio)
    const btnExportarPurgar = document.getElementById('btn-exportar-purgar');
    if (btnExportarPurgar) {
        btnExportarPurgar.addEventListener('click', async () => {
            const confirmar = confirm("¿Estás seguro de exportar todo el historial a tu computadora y vaciar la base de datos para liberar espacio? Esta acción descargará un archivo CSV.");
            if (!confirmar) return;

            try {
                // 1. Consultar todos los registros actuales de Supabase
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*')
                    .order('fecha', { ascending: false });

                if (error) throw error;
                if (!data || data.length === 0) {
                    alert("No hay registros en el historial para exportar.");
                    return;
                }

                // 2. Convertir los datos a formato CSV
                let csvContent = "data:text/csv;charset=utf-8,Producto,Cantidad,Usuario,Fecha\n";
                data.forEach(row => {
                    const filaStr = `"${row.producto}",${row.cantidad},"${row.usuario}","${row.fecha}"`;
                    csvContent += filaStr + "\r\n";
                });

                // 3. Crear enlace de descarga automática en el navegador
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `historial_inventario_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // 4. Purgar (Borrar) los registros de la tabla en Supabase para liberar espacio
                const { error: errorBorrado } = await supabase
                    .from('pedidos')
                    .delete()
                    .neq('id', 0); // Borra todos los registros

                if (errorBorrado) {
                    alert("Se descargó el archivo, pero hubo un error al limpiar la base de datos: " + errorBorrado.message);
                } else {
                    alert("¡Historial exportado y base de datos purgada con éxito! Espacio liberado al 100%.");
                    tablaCuerpo.innerHTML = ""; // Limpia la tabla visualmente
                }

            } catch (err) {
                console.error("Error en el proceso de exportación y purga:", err.message);
                alert("Ocurrió un error al procesar el respaldo: " + err.message);
            }
        });
    }
});