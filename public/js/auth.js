// ===== Authentication =====

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }
});

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    // Hide previous errors
    errorDiv.classList.remove('show');
    errorDiv.textContent = '';

    // Disable submit button
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Signing in...</span>';
    submitBtn.disabled = true;

    try {
        const response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Save auth token and user data
        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Show dashboard
        showDashboard();

    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message || 'Login failed. Please try again.';
        errorDiv.classList.add('show');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
