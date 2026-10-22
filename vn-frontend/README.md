# VN Group - Frontend

React + Vite + Tailwind CSS (cream and navy theme).

## Run (Windows, VS Code terminal)
1. Install Node.js LTS from https://nodejs.org (once)
2. In this folder:
   npm install
   npm run dev
3. Open http://localhost:5173

The backend must be running at http://127.0.0.1:8000 (change with VITE_API_URL in a .env file).
Your backend .env CORS_ORIGINS must include http://localhost:5173.

## Notes
- Sign-up creates student accounts only. Staff accounts are created by you (change role in the users table).
- Tokens are kept in localStorage - fine for development; use httpOnly cookies for production.
