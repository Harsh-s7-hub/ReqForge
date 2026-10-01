# RegForge

RegForge is a focused legal-intelligence workspace for triaging contracts and regulatory material. It turns an uploaded document into a risk posture, structured findings, and assignable obligations.

## Run locally

Start the API in one terminal:

```powershell
cd D:\ReqForge\backend
.\venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Start the web app in another:

```powershell
cd D:\ReqForge\reqforge
npm run dev
```

Open `http://localhost:3000`. The API documentation is at `http://localhost:8000/docs`.

## Current architecture

- `reqforge/`: Next.js App Router dashboard and document intake experience.
- `backend/`: FastAPI API with typed document, analysis, finding, and obligation boundaries.
- `docker/`: local compose definition for the web and API services.

The current API uses an in-memory demonstration repository deliberately. It gives the UI a usable contract while persistence, queueing, storage, and vendor-backed model adapters are introduced behind the same endpoints.
