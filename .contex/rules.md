# OrbitalX Absolute Development Rules

## 1. Absolute Stop Rule & Phased Development
- Develop incrementally by phase (Phase 0 to 19).
- **STOP after completing each phase.**
- Provide a completion report (Files created, modified, dependencies, APIs, DB changes, tests, issues).
- **NEVER automatically move to the next phase.** Wait for explicit user permission (e.g., "Continue", "Start Phase X").

## 2. Anti-Over-Engineering
- Build the simplest clean implementation that satisfies the requirement.
- No unnecessary design patterns, abstraction layers, or generic wrappers.
- Route -> Controller -> Model -> MongoDB. No complex repository/factory layers.

## 3. Dependency & File Creation Rules
- **Dependencies:** Ask if existing code/React can solve it. If not, do NOT install it.
- **Files/Components:** Create them only if genuinely reused or logically separate. Do not split every tiny piece of code.
- **Functions:** Should have one clear responsibility. Don't extract unless used multiple times or severely hurts readability.

## 4. Code Constraints
- **JavaScript Only:** No TypeScript.
- **Vite + React:** `npm create vite@latest` for the frontend.
- **No Scientific Accuracy:** 3D and orbital mechanics are for visual simulation, not aerospace physics.
- **Simulated Infrastructure:** No connection to real satellites.

## 5. Security & Error Handling
- Use bcrypt for passwords, JWT for auth. Implement Helmet, CORS, Rate limiting.
- Never store passwords in plain text.
- Every major page must handle states: Loading, Empty, Error, Offline, Success.

## 6. MVP Priority
- Focus on: Auth, Dashboard, Satellite/Mission Management, 3D Earth, Simulated Telemetry/Comms/Commands, Alerts, Ground Stations.
- Ignore optional features (e.g., AI, TLE data) until the MVP is fully functional.

## 7. Testing & Walkthrough Rules
- After completing **each phase**, perform thorough testing of the application in the browser.
- Use the `browser_subagent` to navigate the UI, capture screenshots, and generate WebP video recordings of the built features.
- Create and update a `walkthrough.md` artifact showing all work completed in the folder.
- Embed all screenshots, recordings, and code highlights into the `walkthrough.md` artifact so the progress can be visually and functionally verified.

## 8. Git Multi-Branch & Commit Specifications
- **MANDATORY:** Always refer to [.contex/git_branching_strategy.md](file:///c:/Users/RH364/OneDrive/Desktop/orbital%20desktop/.contex/git_branching_strategy.md) before pulling, branching, staging, or committing.
- **Branch Hierarchy:** Use `main` (production), `develop` (integration), `developer` (daily development sandbox), `bugfix/*` (targeted issue fixes), `hotfix/*` (urgent patches), and modular `feature/*` branches (`feature/3d-studio`, `feature/cubesat-simulator`, `feature/telemetry-analytics`, `feature/mission-control-comms`, `feature/alerts-ai-diagnostics`, `feature/core-platform-auth`).
- **Strict Prohibitions:** Never commit local or scratch files (`FOLDER1`, `work`, `details`, `.env`, `node_modules`).


