import { supabase } from './supabaseClient.js';

const formLogin = document.getElementById('form-login');
const inputEmail = document.getElementById('input-email');
const inputPassword = document.getElementById('input-password');
const btnSalir = document.getElementById('btn-salir');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = inputEmail.value.trim();
        const password = inputPassword.value.trim();

        if (!email || !password) return;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error('Error al iniciar sesión:', error.message);
            alert('Credenciales incorrectas o error de conexión: ' + error.message);
        }
    });
}

export async function verificarSesion() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        if (!window.location.href.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return null;
    }
    
    return session.user;
}

if (btnSalir) {
    btnSalir.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });
}