/**
 * VDLV Site Tracker — Auth Module
 * Handles session management, auth guard, and sign-out.
 * Invite-only: no self-registration UI (users invited via Supabase dashboard).
 */

/**
 * Guard: redirects unauthenticated users to login.html.
 * Returns the current user if authenticated.
 */
async function guardAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session.user;
}

/**
 * Sign in with email + password.
 */
async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Sign out and redirect to login page.
 */
async function signOut() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem('vdlv_tracker_state');
  sessionStorage.removeItem('vdlv_active_project');
  window.location.href = 'login.html';
}

/**
 * Get the current authenticated user.
 */
async function getCurrentUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.user || null;
}

/**
 * Update the user email badge in the header UI.
 */
function renderUserBadge(user) {
  const badge = document.getElementById('userEmailBadge');
  if (badge && user) {
    badge.textContent = user.email;
  }
}
