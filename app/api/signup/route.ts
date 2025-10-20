import { NextResponse } from "next/server";

export async function GET() {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sign Up – Verdifyr</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: #fafafa;
        color: #333;
      }
      form {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        width: 90%;
        max-width: 400px;
      }
      h1 {
        margin-bottom: 1.2rem;
        text-align: center;
      }
      input {
        width: 100%;
        padding: 0.8rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        border: 1px solid #ccc;
        font-size: 1rem;
      }
      button {
        width: 100%;
        padding: 0.8rem;
        border: none;
        border-radius: 8px;
        background: black;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover {
        background: #222;
      }
      .msg {
        margin-top: 1rem;
        text-align: center;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <form id="signupForm">
      <h1>Create Account</h1>
      <input type="email" id="email" placeholder="Email address" required />
      <input type="password" id="password" placeholder="Password" required minlength="6" />
      <button type="submit">Sign Up</button>
      <div id="msg" class="msg"></div>
    </form>

    <script>
      const form = document.getElementById('signupForm');
      const msg = document.getElementById('msg');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.textContent = 'Creating account...';
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
if (res.ok) {
  window.location.href = '/api/signup_success';
} else {
            msg.textContent = '❌ ' + (data.error || 'Registration failed.');
          }
        } catch (err) {
          msg.textContent = '⚠️ Network error.';
        }
      });
    </script>
  </body>
  </html>
  `;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}