# Smart AI Based Civic Reporting And Managing System

A full stack smart city governance platform for civic issue reporting, intelligent routing, workforce execution, and government operations monitoring.

## Project Description
This system enables end-to-end civic complaint management with three integrated layers:
- Citizen-facing mobile app for issue reporting
- Flask backend with AI-assisted processing and operational APIs
- Government dashboard for monitoring, assignment, SLA control, and analytics

Core capabilities include:
- Mobile app for citizens
- AI based complaint classification
- Priority detection
- Smart assignment system
- Workforce management
- Government dashboard
- Real-time analytics
- Heatmap visualization
- SLA tracking
- Audit logging

## System Architecture
### 1. Mobile App (React Native + Expo)
Citizens submit complaints with description, image, and geolocation, then track status updates.

### 2. Backend (Flask + SQLite + ML)
Handles API requests, stores complaint lifecycle data, applies ML for department/priority workflows, and supports assignment + SLA processes.

### 3. Government Dashboard (React + Bootstrap + Leaflet)
Provides officer actions, complaint operations, analytics, workload insights, SLA monitoring, and map-based density visualization.

## Features
### Citizen Side
- Report issue with image and location
- Auto department detection
- Priority classification
- Track complaint status
- Personal report history

### Government Side
- Complaint management panel
- Workforce assignment system
- SLA monitoring
- Urgent action center
- Activity feed
- Analytics dashboard
- Geographic heatmap
- Department workload tracking
- Audit logs

### AI Features
- Department classification model
- Priority prediction
- Smart assignment logic

## Tech Stack
### Frontend Mobile
- React Native
- Expo
- TypeScript

### Web Dashboard
- React.js
- Bootstrap
- Recharts
- Leaflet

### Backend
- Python Flask
- SQLite
- Scikit-learn ML models
- REST API

## Folder Structure
- `backend/` - Flask server, API routes, DB integration, initialization scripts
- `mobile_app/` - React Native + Expo citizen app
- `government-dashboard/` - React-based officer dashboard and analytics

## Installation Guide
### 1. Clone Project
```bash
git clone <repo url>
cd Smart-Ai-Based-Civic-Reporting-And-Managing-System-
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
```

Activate venv:
- Mac/Linux
```bash
source .venv/bin/activate
```
- Windows
```bash
.venv\Scripts\activate
```

Install and run backend:
```bash
pip install -r requirements.txt
python init_db.py
python app.py
```

### 3. Mobile App Setup
```bash
cd mobile_app
npm install
npx expo start
```

### 4. Dashboard Setup
```bash
cd government-dashboard
npm install
npm run dev
```

## API Base URL Configuration
For local/mobile testing, update API base URL references to your machine IP.

Typical example for mobile app:
- Replace `localhost` with your local network IP (for example `http://192.168.x.x:5001`)
- Ensure phone/emulator and backend are on reachable network paths

## Complaint Flow
Citizen -> Backend -> AI classify -> Database -> Dashboard -> Officer assigns -> Worker resolves

## Database Tables
- complaints
- departments
- teams
- workers
- assignments
- audit_logs

## Future Improvements
- AI prediction alerts
- Push notifications
- Worker mobile app
- Cloud deployment
- Authentication roles
- Performance optimization

## License
MIT License
