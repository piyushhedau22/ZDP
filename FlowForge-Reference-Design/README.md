# FlowForge Reference Design

Dark SaaS workflow dashboard with Sign Up, Sign In, Overview, Workflow Builder, Executions and Settings.

## Requirements
- Node.js 18+
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/workflow_saga`)

## Backend
```powershell
cd server
npm install
Copy-Item .env.example .env
npm run dev
```

## Frontend (new terminal)
```powershell
cd client
npm install
npm run dev
```
Open the URL printed by Vite, usually `http://localhost:5173`.

## Account behavior
- New users can create an account with name, email/Gmail address, phone number, and password.
- Returning users can sign in using their registered email or phone number and password.
- Passwords are hashed with bcrypt before saving.
- Phone number is used as a login identifier, not as SMS OTP verification.
- A real Google “Continue with Google” OAuth button requires Google OAuth client credentials and callback configuration; this starter does not pretend to provide OAuth without those credentials.

This is a development starter. Review security, configure a strong `JWT_SECRET`, and add production controls before deployment.
