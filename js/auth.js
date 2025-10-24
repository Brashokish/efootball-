const { supabase } = require('./database.js'); // or import if using ES modules
const bcrypt = require('bcrypt');

const ADMIN_EMAIL = 'support@kishtechsite.online';

// ==================== DEBUG ====================
console.log('🔐 Admin Auth System Loading...');

// ==================== HELPER FUNCTIONS ====================

// Generate a secure reset token
const generateResetToken = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// Show notifications (replace with your implementation)
const showNotification = (message, type) => {
  alert(`${type.toUpperCase()}: ${message}`);
};

// ==================== AUTH FUNCTIONS ====================

// Get hashed password from Supabase
const getPasswordHash = async () => {
  const { data, error } = await supabase
    .from('admin_auth')
    .select('password_hash')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (error) {
    console.error('❌ Failed to fetch admin password:', error);
    return null;
  }
  return data.password_hash;
};

// Check if admin is authenticated
const checkAdminAuth = async () => {
  const { data, error } = await supabase
    .from('admin_auth')
    .select('is_authenticated')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (error) {
    console.error('❌ Failed to check auth status:', error);
    return false;
  }
  return data?.is_authenticated || false;
};

// Login admin
const loginAdmin = async (enteredPassword) => {
  const hash = await getPasswordHash();
  if (!hash) return false;

  const match = await bcrypt.compare(enteredPassword, hash);
  if (!match) return false;

  await supabase
    .from('admin_auth')
    .update({ is_authenticated: true })
    .eq('email', ADMIN_EMAIL);

  return true;
};

// Logout admin
const logoutAdmin = async () => {
  await supabase
    .from('admin_auth')
    .update({ is_authenticated: false })
    .eq('email', ADMIN_EMAIL);
};

// Save password reset token
const saveResetToken = async (token) => {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await supabase
    .from('admin_auth')
    .update({ reset_token: token, reset_expires: expires })
    .eq('email', ADMIN_EMAIL);
};

// Validate password reset token
const validateResetToken = async (token) => {
  const { data, error } = await supabase
    .from('admin_auth')
    .select('reset_token, reset_expires')
    .eq('email', ADMIN_EMAIL)
    .single();

  if (!data || data.reset_token !== token) return false;
  if (new Date() > new Date(data.reset_expires)) return false;
  return true;
};

// Reset password
const resetPassword = async (token, newPassword) => {
  if (!(await validateResetToken(token))) return false;

  const hash = await bcrypt.hash(newPassword, 10);

  await supabase
    .from('admin_auth')
    .update({ password_hash: hash, reset_token: null, reset_expires: null })
    .eq('email', ADMIN_EMAIL);

  return true;
};

// ==================== PASSWORD RESET EMAIL ====================

// Send password reset email using Render backend
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    console.log('🔧 Sending reset email to:', email);

    await eflAPI.sendResetEmail({ to_email: email, reset_link: resetLink });

    console.log('✅ Password reset email sent');
    showNotification('Password reset link has been sent!', 'success');
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error);
    showNotification(`Email unavailable. Copy link manually: ${resetLink}`, 'warning');
    console.log('🔗 Manual reset link:', resetLink);
    return false;
  }
};

// Request password reset
const requestPasswordReset = async (email) => {
  if (!email || email !== ADMIN_EMAIL) {
    showNotification('Only the admin email can request password resets.', 'error');
    return false;
  }

  const submitBtn = document.querySelector('#forgot-password-form button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
  submitBtn.disabled = true;

  try {
    const resetToken = generateResetToken();
    await saveResetToken(resetToken);

    const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('🔄 Sending reset email with link:', resetLink);

    await sendPasswordResetEmail(email, resetLink);
  } catch (error) {
    console.error('❌ Password reset request failed:', error);
    showNotification('Error sending reset email.', 'error');
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
};

// ==================== UI HANDLERS ====================

const showResetPasswordForm = (email, token) => {
  const loginSection = document.getElementById('login-section');
  const resetSection = document.getElementById('reset-password-section');

  loginSection?.classList.add('d-none');
  resetSection?.classList.remove('d-none');

  document.getElementById('reset-email').value = email;
  document.getElementById('reset-token').value = token;
};

const showForgotPasswordForm = () => {
  const loginSection = document.getElementById('login-section');
  const forgotSection = document.getElementById('forgot-password-section');

  loginSection?.classList.add('d-none');
  forgotSection?.classList.remove('d-none');
  document.getElementById('forgot-email').value = ADMIN_EMAIL;
};

const showLoginForm = () => {
  document.getElementById('login-section')?.classList.remove('d-none');
  document.getElementById('forgot-password-section')?.classList.add('d-none');
  document.getElementById('reset-password-section')?.classList.add('d-none');
};

const checkResetTokenInURL = () => {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('reset_token');
  const email = params.get('email');

  if (resetToken && email) {
    console.log('🔄 Reset token detected in URL');
    showResetPasswordForm(decodeURIComponent(email), resetToken);

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Admin page loaded');

  checkResetTokenInURL();

  if (await checkAdminAuth()) {
    document.getElementById('login-section')?.classList.add('d-none');
    document.getElementById('admin-dashboard')?.classList.remove('d-none');
  }

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logoutAdmin();
    window.location.href = 'admin.html';
  });

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const success = await loginAdmin(password);

    if (success) {
      document.getElementById('login-section')?.classList.add('d-none');
      document.getElementById('admin-dashboard')?.classList.remove('d-none');
      showNotification('Login successful!', 'success');
    } else {
      showNotification('Invalid password!', 'error');
    }
  });

  // Forgot password form
  document.getElementById('forgot-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    await requestPasswordReset(email);
  });

  // Reset password form
  document.getElementById('reset-password-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const token = document.getElementById('reset-token').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showNotification('Password must be at least 6 characters long!', 'error');
      return;
    }

    const success = await resetPassword(token, newPassword);
    if (success) {
      showNotification('Password reset successful! Please login.', 'success');
      setTimeout(showLoginForm, 2000);
    } else {
      showNotification('Reset failed. Invalid or expired token.', 'error');
    }
  });

  // Back to login links
  document.querySelectorAll('.back-to-login').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  });

  // Forgot password link
  document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordForm();
  });
});
