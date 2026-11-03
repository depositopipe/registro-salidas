import { supabase } from './supabaseClient.js';

const loginForm = document.getElementById('form-login');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('input-email').value.trim();
    const password = document.getElementById('input-password').value.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        alert('Error al ingresar: ' + error.message);
        console.error('Detalle del error:', error);
        return;
      }

      // Redirección directa al dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Error inesperado:', err);
      alert('Ocurrió un error inesperado al intentar ingresar.');
    }
  });
}