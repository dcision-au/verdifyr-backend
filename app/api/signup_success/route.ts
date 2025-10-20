import { NextResponse } from "next/server";

export async function GET() {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Signup Complete – Verdifyr</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background: #f9fafb;
        color: #333;
      }
      .card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        text-align: center;
      }
      h1 {
        margin-bottom: 0.5rem;
      }
      p {
        font-size: 1rem;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>✅ Account Created</h1>
      <p>You can now close this window and return to the app.</p>
      <script>
        // Automatically close WKWebView after 2 seconds
        setTimeout(() => {
          window.location.href = 'signup_success';
        }, 2000);
      </script>
    </div>
  </body>
  </html>
  `;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}