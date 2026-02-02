/**
 * Dev Server Authentication Middleware
 *
 * Protects localhost from unauthorized access with a password gate.
 * Only active when DEV_PASSWORD env var is set.
 *
 * Usage in hooks.server.ts:
 *   import { devAuthHandle } from '$lib/server/dev-auth';
 *   export const handle = devAuthHandle;
 *
 * Or with sequence:
 *   import { sequence } from '@sveltejs/kit/hooks';
 *   export const handle = sequence(devAuthHandle, yourOtherHandle);
 */

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

const DEV_AUTH_COOKIE = 'dev_auth_token';
const LOGIN_PATH = '/__dev_auth';

// Generate session token from password (simple hash for dev use)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const loginPage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev Auth Required</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      backdrop-filter: blur(10px);
      max-width: 400px;
      width: 90%;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
    p { color: #888; margin-bottom: 32px; font-size: 14px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    input {
      padding: 14px 18px;
      font-size: 16px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(0,0,0,0.3);
      color: #fff;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus { border-color: #3b82f6; }
    input::placeholder { color: #666; }
    button {
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #fff;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }
    button:active { transform: translateY(0); }
    .error {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }
    .hint {
      margin-top: 24px;
      font-size: 12px;
      color: #555;
    }
    code {
      background: rgba(255,255,255,0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔐</div>
    <h1>Dev Server Protected</h1>
    <p>This development server requires authentication.</p>
    {{ERROR}}
    <form method="POST" action="${LOGIN_PATH}">
      <input
        type="password"
        name="password"
        placeholder="Enter dev password"
        autocomplete="current-password"
        autofocus
        required
      />
      <input type="hidden" name="redirect" value="{{REDIRECT}}" />
      <button type="submit">Authenticate</button>
    </form>
    <p class="hint">Set <code>DEV_PASSWORD</code> in .env.local</p>
  </div>
</body>
</html>
`;

export const devAuthHandle: Handle = async ({ event, resolve }) => {
  const DEV_PASSWORD = env.DEV_PASSWORD;

  // Skip if not in dev mode or no password configured
  if (!dev || !DEV_PASSWORD) {
    return resolve(event);
  }

  const expectedToken = hashPassword(DEV_PASSWORD);
  const cookieToken = event.cookies.get(DEV_AUTH_COOKIE);

  // Handle login form submission
  if (event.url.pathname === LOGIN_PATH && event.request.method === 'POST') {
    const formData = await event.request.formData();
    const password = formData.get('password')?.toString() || '';
    const redirect = formData.get('redirect')?.toString() || '/';

    if (password === DEV_PASSWORD) {
      // Success - set auth cookie and redirect
      return new Response(null, {
        status: 303,
        headers: {
          'Location': redirect,
          'Set-Cookie': `${DEV_AUTH_COOKIE}=${expectedToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        },
      });
    } else {
      // Wrong password - show error
      const html = loginPage
        .replace('{{ERROR}}', '<div class="error">Incorrect password</div>')
        .replace('{{REDIRECT}}', redirect);
      return new Response(html, {
        status: 401,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  }

  // Check if authenticated
  if (cookieToken === expectedToken) {
    return resolve(event);
  }

  // Not authenticated - show login page
  const html = loginPage
    .replace('{{ERROR}}', '')
    .replace('{{REDIRECT}}', event.url.pathname + event.url.search);

  return new Response(html, {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

export default devAuthHandle;
