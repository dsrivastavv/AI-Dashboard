# AI Dashboard Monorepo

This repository is now organized by app boundary:

- `backend/` -> Django API + auth + storage
- `frontend/` -> React/Vite web dashboard
- `macos_app/` -> native SwiftUI macOS client
- `agent/` -> remote monitoring agent package/service
- `globals/` -> shared, root-level cross-app copy/constants (`globals/app_text.yml`)
- `docs/` -> architecture + operations documentation

## Shared Globals

Use `globals/app_text.yml` as the root source-of-truth for product/app copy that should stay consistent across web, macOS, backend legal pages, and docs.

## Build / Run Each Project

## 1) Backend (Django)

```bash
cd backend

# one-time env
conda env create -f environment.yml
conda activate ai-dashboard
pip install -r requirements.txt

# run
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Full-stack debug launcher (backend + frontend)

From repo root:

```bash
./backend/deploy-debug.sh
```

## 2) Frontend (React + Vite)

```bash
cd frontend
corepack npm install
corepack npm run dev
```

Open: `http://127.0.0.1:3000/dashboard`

## 3) Agent

Linux package flow:

```bash
cd agent
./build-deb.sh
sudo apt install ../ai-dashboard-agent_*_all.deb
```

Source/macOS flow:

```bash
cd agent
conda env create -f environment.yml
conda activate ai-dashboard-agent
./run-agent.sh --help
```

## 4) macOS App (SwiftUI)

```bash
cd macos_app
```

Open `Package.swift` in Xcode and run the `AIDashboardMacApp` target.

## Notes

- Backend env vars can still be loaded from repo-root `.env`.
- Backend production helper script: `backend/deploy.sh`
- Backend Procfile: `backend/Procfile`

## Documentation

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/WEBAPP_SETUP.md`
- `docs/AGENT_GUIDE.md`
- `docs/API_REFERENCE.md`
- `docs/OPERATIONS.md`
