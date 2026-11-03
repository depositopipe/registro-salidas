import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('loginForm'); // Asegúrate de que coincida con el id de tu formulario

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        alert('Credenciales incorrectas: ' + error.message);
        return;
      }

      // Redirección relativa directa al dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Error en el proceso de autenticación:', err);
      alert('Ocurrió un error inesperado al intentar ingresar.');
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