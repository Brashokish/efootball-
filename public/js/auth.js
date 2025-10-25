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
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-warning';
    
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      <strong>${type.toUpperCase()}:</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
};

// Simple hash function for browser
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
    
    // Reload to show login form
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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
      const copySuccess = await copyToClipboard(resetLink);
      showNotification(`Reset link generated! ${copySuccess ? 'Copied to clipboard:' : ''} ${resetLink}`, 'info');
      console.log('📋 Manual reset link:', resetLink);
      return true;
    }
  } catch (error) {
    console.error('❌ Email sending error:', error);
    showNotification(`Email unavailable. Copy link manually: ${resetLink}`, 'warning');
    return false;
  }
};

// Copy to clipboard helper
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Copy failed:', error);
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
    console.log('🔄 Generated reset link:', resetLink);

    await sendPasswordResetEmail(email, resetLink);
    return true;
  } catch (error) {
    console.error('❌ Password reset request failed:', error);
    showNotification('Error generating reset link.', 'error');
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

  if (loginSection) loginSection.classList.add('d-none');
  if (resetSection) resetSection.classList.remove('d-none');

  const resetEmail = document.getElementById('reset-email');
  const resetToken = document.getElementById('reset-token');
  
  if (resetEmail) resetEmail.value = email;
  if (resetToken) resetToken.value = token;
};

const showForgotPasswordForm = () => {
  const loginSection = document.getElementById('login-section');
  const forgotSection = document.getElementById('forgot-password-section');

  if (loginSection) loginSection.classList.add('d-none');
  if (forgotSection) forgotSection.classList.remove('d-none');
  
  const forgotEmail = document.getElementById('forgot-email');
  if (forgotEmail) forgotEmail.value = ADMIN_EMAIL;
};

const showLoginForm = () => {
  const loginSection = document.getElementById('login-section');
  const forgotSection = document.getElementById('forgot-password-section');
  const resetSection = document.getElementById('reset-password-section');

  if (loginSection) loginSection.classList.remove('d-none');
  if (forgotSection) forgotSection.classList.add('d-none');
  if (resetSection) resetSection.classList.add('d-none');
};

const showAdminDashboard = () => {
  const loginSection = document.getElementById('login-section');
  const forgotSection = document.getElementById('forgot-password-section');
  const resetSection = document.getElementById('reset-password-section');
  const adminDashboard = document.getElementById('admin-dashboard');

  if (loginSection) loginSection.classList.add('d-none');
  if (forgotSection) forgotSection.classList.add('d-none');
  if (resetSection) resetSection.classList.add('d-none');
  if (adminDashboard) adminDashboard.classList.remove('d-none');
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

const setupAuthEventListeners = () => {
  console.log('🔧 Setting up auth event listeners...');

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const passwordInput = document.getElementById('admin-password');
      const password = passwordInput?.value;
      
      if (!password) {
        showNotification('Please enter a password', 'error');
        return;
      }

      const success = await loginAdmin(password);
      if (success) {
        showAdminDashboard();
        if (passwordInput) passwordInput.value = ''; // Clear password field
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutAdmin();
    });
  }

  // Forgot password form
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('forgot-email');
      const email = emailInput?.value || ADMIN_EMAIL;
      await requestPasswordReset(email);
    });
  }

  // Reset password form
  const resetPasswordForm = document.getElementById('reset-password-form');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('reset-email');
      const tokenInput = document.getElementById('reset-token');
      const newPasswordInput = document.getElementById('new-password');
      const confirmPasswordInput = document.getElementById('confirm-password');

      const email = emailInput?.value;
      const token = tokenInput?.value;
      const newPassword = newPasswordInput?.value;
      const confirmPassword = confirmPasswordInput?.value;

      if (!email || !token || !newPassword || !confirmPassword) {
        showNotification('Please fill all fields', 'error');
        return;
      }

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
        // Clear forms
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmPasswordInput) confirmPasswordInput.value = '';
        setTimeout(showLoginForm, 2000);
      }
    });
  }

  // Back to login links
  document.querySelectorAll('.back-to-login').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginForm();
    });
  });

  // Forgot password link
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordForm();
    });
  }
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Admin page loaded, initializing auth system...');

  // Check for reset tokens in URL
  checkResetTokenInURL();

  // Setup event listeners
  setupAuthEventListeners();

  // Check authentication status
  try {
    const isAuthenticated = await checkAdminAuth();
    if (isAuthenticated) {
      console.log('✅ Admin already authenticated, showing dashboard');
      showAdminDashboard();
    } else {
      console.log('🔒 Admin not authenticated, showing login form');
      showLoginForm();
    }
  } catch (error) {
    console.error('❌ Auth initialization error:', error);
    showLoginForm();
  }
});

// ==================== GLOBAL EXPORTS ====================

// Make functions available globally
window.checkAdminAuth = checkAdminAuth;
window.loginAdmin = loginAdmin;
window.logoutAdmin = logoutAdmin;
window.requestPasswordReset = requestPasswordReset;
window.showNotification = showNotification;

console.log('✅ Auth system loaded successfully');
