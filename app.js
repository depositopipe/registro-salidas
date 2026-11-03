import { supabase } from './supabaseClient.js';

// ==========================================
// 1. LÓGICA DE INICIO DE SESIÓN
// ==========================================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password,
});

if (error) {
  // Muestra el motivo exacto del fallo (ej: "Email not confirmed" o "Invalid login credentials")
  alert('Error al ingresar: ' + error.message);
  console.error('Detalle del error:', error);
  return;
}

// Redirección si todo es correcto
window.location.href = 'dashboard.html';

    } catch (err) {
      console.error('Error inesperado:', err);
      alert('Ocurrió un error inesperado al intentar ingresar.');
    }
  });
}

// ==========================================
// 2. LÓGICA DE REGISTRO DE NUEVOS USUARIOS (Opcional)
// ==========================================
export async function registrarUsuario(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      alert('Error al registrar: ' + error.message);
      return false;
    }

    alert('¡Usuario registrado con éxito! Ya puede iniciar sesión.');
    return true;
  } catch (err) {
    console.error('Error en el registro:', err);
    return false;
  }
}