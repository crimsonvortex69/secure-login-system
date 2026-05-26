// Login form handler
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert('Login failed: ' + data.error);
            return;
        }
        
        if (data.two_fa_required) {
            // Redirect to 2FA verification
            window.location.href = '/2fa-verify.html';
        } else {
            // Redirect to dashboard
            window.location.href = '/';
        }
    } catch (err) {
        alert('Error during login: ' + err.message);
    }
});

// Register form handler
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, confirmPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert('Registration failed: ' + data.error);
            return;
        }
        
        alert('Registration successful! Redirecting to home...');
        window.location.href = '/';
    } catch (err) {
        alert('Error during registration: ' + err.message);
    }
});

// Show password toggle
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
        const input = this.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '👁️ Hide';
        } else {
            input.type = 'password';
            this.textContent = '👁️ Show';
        }
    });
});
