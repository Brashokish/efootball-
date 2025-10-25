// public/js/auth.js
console.log('🔐 Admin Auth System Loading...');

// ==================== CONFIGURATION ====================
const ADMIN_EMAIL = 'support@kishtechsite.online';

// ==================== HELPER FUNCTIONS ====================

// Generate a secure reset token
const generateResetToken = () =>
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

// Show notifications
const showNotification = (message, type) => {
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, type);
  } else {
    // Fallback notification
    alert(`${type.toUpperCase()}: ${message}`);
  }
};

// Simple hash function for browser (replaces bcrypt)
const simpleHash = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'efootball-admin-salt-2025');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// ==================== AUTH FUNCTIONS ====================

// Check if admin is authenticated
const checkAdminAuth = async () => {
  try {
    console.log('🔍 Checking admin auth with Supabase...');
    const { data, error } = await supabase
      .from('admin_auth')
      .select('is_authenticated')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (error) {
      console.error('❌ Failed to check auth status:', error);
      return false;
    }
    
    const isAuthenticated = data?.is_authenticated || false;
    console.log('✅ Admin auth status:', isAuthenticated);
    return isAuthenticated;
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return false;
  }
};

// Login admin
const loginAdmin = async (enteredPassword) => {
  try {
    console.log('🔐 Attempting admin login...');
    
    // Get stored hash from Supabase
    const { data, error } = await supabase
      .from('admin_auth')
      .select('password_hash')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (error || !data) {
      console.error('❌ Admin account not found:', error);
      showNotification('Admin account not configured', 'error');
      return false;
    }

    const storedHash = data.password_hash;
    if (!storedHash) {
      showNotification('Admin password not set', 'error');
      return false;
    }

    // Compare passwords using our simple hash
    const enteredHash = await simpleHash(enteredPassword);
    const match = (enteredHash === storedHash);
    
    if (!match) {
      console.log('❌ Invalid password attempt');
      showNotification('Invalid password!', 'error');
      return false;
    }

    // Update authentication status in Supabase
    const { error: updateError } = await supabase
      .from('admin_auth')
      .update({ 
        is_authenticated: true,
        last_login: new Date().toISOString()
      })
      .eq('email', ADMIN_EMAIL);

    if (updateError) {
      console.error('❌ Login update failed:', updateError);
      return false;
    }

    console.log('✅ Admin login successful');
    showNotification('Login successful!', 'success');
    return true;
  } catch (error) {
    console.error('❌ Login error:', error);
    showNotification('Login failed', 'error');
    return false;
  }
};

// Logout admin
const logoutAdmin = async () => {
  try {
    console.log('🚪 Logging out admin...');
    
    await supabase
      .from('admin_auth')
      .update({ 
        is_authenticated: false,
        last_logout: new Date().toISOString()
      })
      .eq('email', ADMIN_EMAIL);
    
    showNotification('Logged out successfully', 'success');
    console.log('✅ Admin logged out');
  } catch (error) {
    console.error('❌ Logout error:', error);
    showNotification('Logout failed', 'error');
  }
};

// Save password reset token
const saveResetToken = async (token) => {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  try {
    const { error } = await supabase
      .from('admin_auth')
      .update({ 
        reset_token: token, 
        reset_expires: expires.toISOString() 
      })
      .eq('email', ADMIN_EMAIL);

    if (error) throw error;
    console.log('✅ Reset token saved');
  } catch (error) {
    console.error('❌ Save reset token error:', error);
    throw error;
  }
};

// Validate password reset token
const validateResetToken = async (token) => {
  try {
    const { data, error } = await supabase
      .from('admin_auth')
      .select('reset_token, reset_expires')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (error || !data) {
      console.error('❌ Token validation error:', error);
      return false;
    }
    
    // Check if token matches and hasn't expired
    if (data.reset_token !== token) {
      console.log('❌ Token mismatch');
      return false;
    }
    
    if (new Date() > new Date(data.reset_expires)) {
      console.log('❌ Token expired');
      return false;
    }
    
    console.log('✅ Reset token validated');
    return true;
  } catch (error) {
    console.error('❌ Validate token error:', error);
    return false;
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    console.log('🔄 Attempting password reset...');
    
    if (!(await validateResetToken(token))) {
      showNotification('Invalid or expired reset token', 'error');
      return false;
    }

    const hash = await simpleHash(newPassword);

    const { error } = await supabase
      .from('admin_auth')
      .update({ 
        password_hash: hash, 
        reset_token: null, 
        reset_expires: null,
        is_authenticated: false // Force re-login after password reset
      })
      .eq('email', ADMIN_EMAIL);

    if (error) {
      console.error('❌ Password reset failed:', error);
      showNotification('Password reset failed', 'error');
      return false;
    }

    console.log('✅ Password reset successful');
    showNotification('Password reset successful! Please login.', 'success');
    return true;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    showNotification('Password reset failed', 'error');
    return false;
  }
};

// ==================== PASSWORD RESET EMAIL ====================

// Send password reset email
const sendPasswordResetEmail = async (email, resetLink) => {
  try {
    console.log('🔧 Sending reset email to:', email);
    console.log('🔗 Reset link:', resetLink);

    // If you have an email API, use it here
    if (typeof eflAPI !== 'undefined' && eflAPI.sendResetEmail) {
      await eflAPI.sendResetEmail({ to_email: email, reset_link: resetLink });
      console.log('✅ Password reset email sent via API');
      showNotification('Password reset link has been sent!', 'success');
      return true;
    } else {
      // Fallback: show the link to copy
      showNotification(`Copy this reset link: ${resetLink}`, 'info');
      console.log('📋 Manual reset link:', resetLink);
      
      // Copy to clipboard if possible
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(resetLink);
        console.log('📋 Reset link copied to clipboard');
      }
      return true;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    showNotification(`Email unavailable. Copy link manually: ${resetLink}`, 'warning');
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
  const originalText = submitBtn?.innerHTML;
  
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
    submitBtn.disabled = true;
  }

  try {
    const resetToken = generateResetToken();
    await saveResetToken(resetToken);

    const resetLink = `${window.location.origin}${window.location.pathname}?reset_token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('🔄 Sending reset email with link:', resetLink);

    await sendPasswordResetEmail(email, resetLink);
    return true;
  } catch (error) {
    console.error('❌ Password reset request failed:', error);
    showNotification('Error sending reset email.', 'error');
    return false;
  } finally {
    if (submitBtn) {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
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

const showAdminDashboard = () => {
  document.getElementById('login-section')?.classList.add('d-none');
  document.getElementById('forgot-password-section')?.classList.add('d-none');
  document.getElementById('reset-password-section')?.classList.add('d-none');
  document.getElementById('admin-dashboard')?.classList.remove('d-none');
};

const checkResetTokenInURL = () => {
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('reset_token');
  const email = params.get('email');

  if (resetToken && email) {
    console.log('🔄 Reset token detected in URL');
    showResetPasswordForm(decodeURIComponent(email), resetToken);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Admin page loaded, setting up auth...');

  checkResetTokenInURL();

  // Check if user is already authenticated
  const isAuthenticated = await checkAdminAuth();
  if (isAuthenticated) {
    console.log('✅ Admin already authenticated, showing dashboard');
    showAdminDashboard();
  }

  // Login form
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const success = await loginAdmin(password);

    if (success) {
      showAdminDashboard();
    }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await logoutAdmin();
    window.location.reload();
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
      setTimeout(showLoginForm, 2000);
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

// ==================== GLOBAL EXPORTS ====================

// Make functions available globally
window.checkAdminAuth = checkAdminAuth;
window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.requestPasswordReset = requestPasswordReset;

console.log('✅ Auth system loaded successfully');
