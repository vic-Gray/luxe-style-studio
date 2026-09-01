
<img width="1366" height="648" alt="Screenshot From 2026-09-01 17-36-07" src="https://github.com/user-attachments/assets/4eb84e81-bb91-4150-8925-5a3404201337" />



# Matteekay

Matteekay is a **full-stack fashion studio platform** with a **React/Vite frontend** and a **NestJS backend**.  
The platform allows users to interact with the application while providing a scalable and modular backend API.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [License](#license)

---

## Features

- **Frontend:** React + Vite, responsive and fast  
- **Backend:** NestJS API with MongoDB  
- User authentication with JWT  
- RESTful APIs for all backend operations  
- Modular architecture for scalability  
- Ready for production deployment

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, TailwindCSS  
- **Backend:** NestJS, TypeScript, Mongoose (MongoDB)  
- **Database:** MongoDB Atlas / Local MongoDB  
- **Package Manager:** npm  
- **Deployment:** Render.com or any Node.js hosting

---

## Project Structure

```text
matteekay/
├─ backend/               # NestJS backend
│  ├─ src/                # TypeScript source code
│  ├─ dist/               # Compiled JS output
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/              # React frontend
│  ├─ src/
│  ├─ dist/               # Build output (after `npm run build`)
│  ├─ package.json
│  └─ vite.config.ts
└─ README.md
