# 🏢 Immobilien-App Magdeburg

React-basierte Single Page Application zur Objektverwaltung mit OVM-Checkliste (Ortsübliche Vergleichsmiete) für 36 Magdeburger Immobilien.

## ✨ Features

- 📋 **36 Magdeburger Objekte** mit Detailansicht
- ✅ **51-Punkt OVM-Checkliste** (Mietspiegel 2024)
- 👥 **4 feste Benutzerprofile** (Robin, Friedrich, Freddy, Salih)
- 💾 **LocalStorage-Persistierung** mit benutzerspezifischen Daten
- 🔄 **Automatische Speicherung** (500ms Debounce)
- 📱 **Responsive Design** für Desktop & Mobile
- 🚀 **CI/CD Pipeline** mit GitHub Actions
- 🐳 **Docker-Deployment** auf Hetzner

---

## 🚀 Quick Start

### Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Dev-Server starten (Port 5173)
npm run dev

# Im WLAN verfügbar machen (für iPhone-Test)
npm run dev -- --host
```

App öffnen: `http://localhost:5173`

### Produktion

```bash
# Build erstellen
npm run build

# Preview des Builds
npm run preview
```

---

## 🏗️ Tech Stack

- **Frontend**: React 18.3.1 + Vite 5.4.21
- **Type Safety**: JSDoc-Annotationen
- **Storage**: LocalStorage mit User-Namespacing
- **CI/CD**: GitHub Actions
- **Container**: Docker + Docker Compose
- **Registry**: GitHub Container Registry (GHCR)
- **Reverse Proxy**: Caddy mit Auto-HTTPS
- **Server**: Hetzner Cloud

---

## 📦 Deployment

### Automatisches Deployment

Push auf `main` Branch startet CI/CD:

```bash
git add .
git commit -m "feat: neue Funktion"
git push origin main
```

**Pipeline:**
1. ✅ Lint & Test
2. ✅ Docker Build
3. ✅ Push zu GHCR
4. ✅ Deploy auf Hetzner
5. ✅ Health Check

### Manuelle Deployment-Schritte

Siehe **[DEPLOYMENT.md](./DEPLOYMENT.md)** für:
- Server-Setup
- GitHub Secrets
- Caddy-Konfiguration
- Rollback-Strategien
- Troubleshooting

---

## 👥 Benutzerprofile

Die App hat 4 feste Profile:

| Profil | Slug | Badge | Farbe |
|--------|------|-------|-------|
| Robin | `robin` | 🏠 Owner | Orange |
| Friedrich | `friedrich` | 👔 Manager | Blau |
| Freddy | `freddy` | 🔧 Techniker | Grün |
| Salih | `salih` | 📊 Analyst | Lila |

**Storage-Key-Pattern:**
```
ms-2024.1:{userSlug}:ovm:{objectId}
```

---

## 🗂️ Projektstruktur

```
immobilien-app/
├── src/
│   ├── components/
│   │   ├── LoginModal.jsx         # Profile Selection UI
│   │   ├── OvmChecklist.jsx       # OVM-Checkliste (Accordion)
│   │   ├── PropertyCard.jsx       # Objektkarte (Sidebar)
│   │   └── PropertyDetail.jsx     # Detailansicht
│   ├── contexts/
│   │   └── UserContext.jsx        # User State Management
│   ├── data/
│   │   ├── objekte_magdeburg.json                    # 36 Objekte
│   │   └── mietspiegel_checkliste_magdeburg_2024.json # 51 Items
│   ├── lib/
│   │   ├── storage/
│   │   │   └── ovmStorage.js      # LocalStorage + Remote Provider
│   │   └── ovmLoader.js           # OVM Data Loader
│   ├── types/
│   │   └── ovm.js                 # Type Definitions (JSDoc)
│   ├── App.jsx                    # Main Component
│   └── main.jsx                   # Entry Point
├── .github/
│   └── workflows/
│       └── ci-cd.yml              # 5-Job Pipeline
├── scripts/
│   └── setup-server.sh            # Hetzner Server Setup
├── Dockerfile                     # Multi-Stage Build
├── docker-compose.yml             # Service Orchestration
├── nginx.conf                     # SPA Routing + Health Check
├── Caddyfile                      # Reverse Proxy + HTTPS
├── .env.example                   # Environment Template
└── DEPLOYMENT.md                  # Deployment Guide
```

---

## 🔧 Entwicklung

### Commands

```bash
# Dev-Server mit Hot-Reload
npm run dev

# Linting
npm run lint

# Build für Produktion
npm run build

# Preview des Builds
npm run preview

# Docker-Build lokal testen
docker build -t immobilien-app:test .
docker run -p 8080:80 immobilien-app:test
```

### Environment Variables

Erstelle `.env` (siehe `.env.example`):

```env
GITHUB_REPOSITORY_OWNER=dein-username
USE_REMOTE_STORAGE=false
SCHEMA_VERSION=ms-2024.1
ALLOWED_USERS=robin,friedrich,freddy,salih
```

---

## 📊 CI/CD Pipeline

### Workflow-Jobs

| Job | Trigger | Zweck |
|-----|---------|-------|
| **lint-and-test** | Push/PR auf main/dev | Code-Qualität |
| **build-and-push** | Nach Tests | Docker Image zu GHCR |
| **deploy-staging** | Push auf `dev` | Staging-Environment |
| **deploy-production** | Push auf `main` | Production-Environment |
| **rollback** | Manuell | Notfall-Rollback |

### Branch-Strategie

```
main/master  →  Production (your-domain.com)
dev          →  Staging (staging.your-domain.com)
feature/*    →  Nur Tests, kein Deploy
```

---

## 🌐 Production URLs

Nach erfolgreichem Deployment:

- **Production**: `https://your-domain.com`
- **Staging**: `https://staging.your-domain.com`
- **Health Check**: `https://your-domain.com/health`

---

## 🔒 Security

### Implementierte Features

- ✅ HTTPS via Let's Encrypt (Caddy)
- ✅ Security Headers (HSTS, CSP, X-Frame-Options)
- ✅ Firewall (UFW: nur 22, 80, 443)
- ✅ Docker Container Isolation
- ✅ Non-Root User in Container
- ✅ Secrets Management (GitHub Secrets)
- ✅ SSH Key Authentication

### Environment-spezifische Sicherheit

**Staging:**
- Basic Authentication
- Eigene Subdomain
- Testdaten

**Production:**
- Produktiv-Daten
- Monitoring aktiv
- Backup-Strategie

---

## 📱 PWA & Mobile

### iOS-Installation

1. App über HTTPS öffnen (Safari)
2. **Teilen** → **Zum Home-Bildschirm**
3. Als PWA installiert
4. Offline-fähig (LocalStorage)

### WLAN-Test (Development)

```bash
# Dev-Server im Netzwerk verfügbar machen
npm run dev -- --host

# Ausgabe zeigt lokale IP:
# ➜  Network: http://192.168.1.100:5173
```

iPhone im selben WLAN: `http://192.168.1.100:5173`

---

## 🐛 Troubleshooting

### Dev-Server startet nicht

```bash
# Port bereits belegt?
netstat -ano | findstr :5173

# Prozess beenden und neu starten
npm run dev
```

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs -f

# Manueller Neustart
docker-compose down
docker-compose up -d
```

### Health Check fehlgeschlagen

```bash
# Direkt testen
curl http://localhost:3000/health

# Sollte zurückgeben: {"status": "ok"}
```

Mehr Details: **[DEPLOYMENT.md → Troubleshooting](./DEPLOYMENT.md#troubleshooting)**

---

## 🤝 Contributing

### Workflow

1. Feature-Branch erstellen: `git checkout -b feature/neue-funktion`
2. Änderungen committen: `git commit -m "feat: beschreibung"`
3. Tests lokal ausführen: `npm run lint && npm run build`
4. Push: `git push origin feature/neue-funktion`
5. Pull Request erstellen
6. CI/CD validiert automatisch
7. Merge nach Review

### Commit-Konventionen

```
feat:     Neue Funktion
fix:      Bugfix
docs:     Dokumentation
style:    Formatierung
refactor: Code-Refactoring
test:     Tests hinzufügen
chore:    Build-Prozess, Dependencies
```

---

## 📋 Roadmap

- [x] React-App mit 36 Magdeburg-Objekten
- [x] OVM-Checkliste Integration
- [x] LocalStorage-Persistierung
- [x] 4 feste Benutzerprofile
- [x] Docker + CI/CD Pipeline
- [ ] PWA Service Worker
- [ ] Remote Storage Provider (Optional)
- [ ] Objektsuche & Filter
- [ ] PDF-Export der OVM-Checkliste
- [ ] Dark Mode
- [ ] Multi-Language Support

---

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten.

---

## 📞 Support

- **Deployment-Probleme**: Siehe [DEPLOYMENT.md](./DEPLOYMENT.md)
- **GitHub Issues**: Für Feature-Requests und Bugs
- **Health Check**: `https://your-domain.com/health`

---

**Version:** 1.0.0  
**Node Version:** 20+  
**React Version:** 18.3.1  
**Vite Version:** 5.4.21
#   D e p l o y m e n t   r e a d y  
 