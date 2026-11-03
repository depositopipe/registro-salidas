import { supabase } from './supabaseClient.js';
import { registrarSalida, cargarRegistros } from './pedidos.js';

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
    const tituloTabla = document.getElementById('titulo-tabla');

    // Estado actual del filtro (null = Historial General por defecto)
    let filtroActual = null;

    // Cargar datos iniciales
    await cargarRegistros(tablaCuerpo, filtroActual);

    // Escucha en tiempo real para nuevos registros
    supabase
        .channel('public:pedidos')
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'pedidos' 
        }, () => {
            // Recarga automática manteniendo el filtro seleccionado
            cargarRegistros(tablaCuerpo, filtroActual);
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
                // Recargar tabla de inmediato
                cargarRegistros(tablaCuerpo, filtroActual);
            }
        });
    }

    // Botón Salir (Cerrar sesión)
    const btnSalir = document.getElementById('btn-salir');
    if (btnSalir) {
        btnSalir.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // Botones de Filtros Temporales y Navegación
    const btnHoy = document.getElementById('btn-menu-hoy');
    const btn3Dias = document.getElementById('btn-menu-3dias');
    const btnSemana = document.getElementById('btn-menu-semana');
    const btnMes = document.getElementById('btn-menu-mes');
    const btnGeneral = document.getElementById('btn-menu-general');

    const botonesFiltro = [btnHoy, btn3Dias, btnSemana, btnMes, btnGeneral];

    function activarBoton(btnSeleccionado) {
        botonesFiltro.forEach(b => {
            if (b) b.classList.remove('active');
        });
        if (btnSeleccionado) btnSeleccionado.classList.add('active');
    }

    if (btnHoy) {
        btnHoy.addEventListener('click', () => {
            filtroActual = 1;
            activarBoton(btnHoy);
            if (tituloTabla) tituloTabla.textContent = "Consolidado de Salidas - Hoy";
            cargarRegistros(tablaCuerpo, filtroActual);
        });
    }

    if (btn3Dias) {
        btn3Dias.addEventListener('click', () => {
            filtroActual = 3;
            activarBoton(btn3Dias);
            if (tituloTabla) tituloTabla.textContent = "Consolidado - Últimos 3 Días";
            cargarRegistros(tablaCuerpo, filtroActual);
        });
    }

    if (btnSemana) {
        btnSemana.addEventListener('click', () => {
            filtroActual = 7;
            activarBoton(btnSemana);
            if (tituloTabla) tituloTabla.textContent = "Consolidado - Última Semana";
            cargarRegistros(tablaCuerpo, filtroActual);
        });
    }

    if (btnMes) {
        btnMes.addEventListener('click', () => {
            filtroActual = 30;
            activarBoton(btnMes);
            if (tituloTabla) tituloTabla.textContent = "Consolidado - Último Mes";
            cargarRegistros(tablaCuerpo, filtroActual);
        });
    }

    if (btnGeneral) {
        btnGeneral.addEventListener('click', () => {
            filtroActual = null;
            activarBoton(btnGeneral);
            if (tituloTabla) tituloTabla.textContent = "Historial General Consolidado";
            cargarRegistros(tablaCuerpo, filtroActual);
        });
    }

    // Funcionalidad de Exportar a Excel (CSV limpio con punto y coma) y Purgar
    const btnExportarPurgar = document.getElementById('btn-exportar-purgar');
    if (btnExportarPurgar) {
        btnExportarPurgar.addEventListener('click', async () => {
            const confirmar = confirm("¿Estás seguro de exportar todo el historial a tu computadora en formato Excel y vaciar la base de datos para liberar espacio?");
            if (!confirmar) return;

            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*')
                    .order('fecha', { ascending: false });

                if (error) throw error;
                if (!data || data.length === 0) {
                    alert("No hay registros en el historial para exportar.");
                    return;
                }

                // Generar CSV con delimitador punto y coma (;) y BOM (\uFEFF) para compatibilidad total con Excel en español
                let csvContent = "\uFEFFProducto;Cantidad;Usuario;Fecha\n";
                data.forEach(row => {
                    const fechaFormateada = new Date(row.fecha).toLocaleString();
                    const productoLimpio = row.producto ? row.producto.replace(/"/g, '""') : '';
                    const usuarioLimpio = row.usuario ? row.usuario.replace(/"/g, '""') : '';
                    csvContent += `"${productoLimpio}";${row.cantidad};"${usuarioLimpio}";"${fechaFormateada}"\n`;
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `inventario_salidas_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Purgar (Borrar) los registros de la tabla en Supabase
                const { error: errorBorrado } = await supabase
                    .from('pedidos')
                    .delete()
                    .neq('id', 0);

                if (errorBorrado) {
                    alert("Se descargó el archivo, pero hubo un error al limpiar la base de datos: " + errorBorrado.message);
                } else {
                    alert("¡Historial exportado con éxito a Excel y base de datos purgada!");
                    cargarRegistros(tablaCuerpo, filtroActual);
                }

            } catch (err) {
                console.error("Error en exportación y purga:", err);
                alert("Ocurrió un error al procesar el archivo: " + err.message);
            }
        });
    }
});