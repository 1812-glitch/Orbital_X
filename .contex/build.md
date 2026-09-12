# OrbitalX Tech Stack & Architecture

## Core Requirement Changes
- **No TypeScript:** Use ONLY JavaScript and JS-related technologies.
- **Frontend Framework:** Use Vite with React (instead of Next.js) via `npx create-vite`.

## Technology Stack
### Frontend
- **Framework:** React.js (via Vite)
- **Styling:** Tailwind CSS
- **3D Visualization:** Three.js, React Three Fiber, @react-three/drei
- **Charts:** Recharts
- **Animation:** Framer Motion
- **State Management:** Zustand (Only for shared state; prefer `useState` locally)
- **HTTP/API:** Axios
- **Realtime:** Socket.IO Client
- **Forms/Validation:** React Hook Form, Zod
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js, Express.js
- **Realtime:** Socket.IO
- **Database:** MongoDB, Mongoose (MongoDB Atlas)
- **Authentication:** JWT, bcrypt
- **Utilities:** dotenv, cors, helmet, morgan, express-rate-limit, express-validator, node-cron

### Optional (Only if strictly required)
- satellite.js
- PapaParse

## Architecture
- Monolith approach (One frontend, one backend, one MongoDB). No microservices.
- **Frontend Structure:** `OrbitalX/frontend/src/` (components, hooks, lib, store, pages/views).
- **Backend Structure:** `OrbitalX/backend/src/` (config, models, routes, controllers, middleware, simulation, socket, utils).
- **Pattern:** Route -> Controller -> Mongoose Model -> Response (Keep it simple!).
