# 🚀 Deployment Guide - Immobilien-App

Vollständige Anleitung für CI/CD mit GitHub Actions und Docker-Deployment auf Hetzner.

## 📋 Inhaltsverzeichnis

- [Überblick](#überblick)
- [Voraussetzungen](#voraussetzungen)
- [Server-Setup](#server-setup)
- [GitHub-Konfiguration](#github-konfiguration)
- [Deployment-Prozess](#deployment-prozess)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)
- [Alternative: Systemd-Deployment](#alternative-systemd-deployment)

---

## 🎯 Überblick

### Architektur

```
GitHub (Push) 
  → GitHub Actions 
    → Build Docker Image 
      → Push to GHCR 
        → SSH zu Hetzner 
          → Docker Compose Pull & Up 
            → Caddy Reverse Proxy 
              → HTTPS (Let's Encrypt)
```

### Komponenten

- **CI/CD**: GitHub Actions
- **Container Registry**: GitHub Container Registry (GHCR)
- **Server**: Hetzner Cloud
- **Container Runtime**: Docker + Docker Compose
- **Reverse Proxy**: Caddy (Auto-HTTPS)
- **Storage**: LocalStorage im Browser (benutzerspezifisch)

---

## 📦 Voraussetzungen

### Lokale Entwicklung

- Node.js 20+
- Git
- Docker (für lokales Testen)

### Hetzner Server

- Ubuntu 22.04 LTS
- Mindestens 2 GB RAM
- Docker & Docker Compose
- Caddy Web Server
- Öffentliche IPv4-Adresse
- Domain mit DNS zu Server-IP

---

## 🛠️ Server-Setup

### 1. Server vorbereiten

```bash
# SSH zum Server
ssh root@your-server-ip

# Setup-Script ausführen
curl -fsSL https://raw.githubusercontent.com/YOUR-USERNAME/immobilien-app/main/scripts/setup-server.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

Das Script installiert:
- ✅ Docker & Docker Compose
- ✅ Caddy Web Server
- ✅ Firewall-Regeln (UFW)
- ✅ Log-Rotation
- ✅ Verzeichnisstruktur

### 2. Environment konfigurieren

```bash
cd /opt/immobilien-app
nano .env
```

**Erforderliche Werte:**

```env
GITHUB_REPOSITORY_OWNER=dein-github-username
USE_REMOTE_STORAGE=false
SCHEMA_VERSION=ms-2024.1
ALLOWED_USERS=robin,friedrich,freddy,salih
```

### 3. Docker Compose bereitstellen

```bash
# docker-compose.yml ins Verzeichnis kopieren
nano docker-compose.yml
# (Inhalt aus Repository einfügen)
```

### 4. Caddy konfigurieren

```bash
# Caddyfile bearbeiten
sudo nano /etc/caddy/Caddyfile
```

**Domain anpassen:**

```caddy
your-domain.com {
    # ... (Rest bleibt gleich)
    reverse_proxy localhost:3000
}
```

**Caddy neu laden:**

```bash
sudo systemctl reload caddy
```

### 5. Firewall-Check

```bash
sudo ufw status
# Sollte zeigen: 22, 80, 443 erlaubt
```

---

## 🔐 GitHub-Konfiguration

### 1. Repository Settings

Gehe zu: **Settings → Environments**

Erstelle zwei Environments:
- `production`
- `staging` (optional)

### 2. Secrets einrichten

Unter **Settings → Secrets and variables → Actions**:

| Secret Name | Beschreibung | Beispiel |
|------------|-------------|----------|
| `SERVER_HOST` | Hetzner Server IP | `123.45.67.89` |
| `SERVER_USER` | SSH User | `deploy` |
| `SSH_PRIVATE_KEY` | SSH Private Key | `-----BEGIN OPENSSH...` |
| `SSH_PORT` | SSH Port (optional) | `22` |

### 3. SSH-Key generieren

**Auf lokalem Rechner:**

```bash
# Key-Pair erstellen
ssh-keygen -t ed25519 -C "github-actions@immobilien-app" -f ~/.ssh/deploy_key

# Public Key auf Server hinzufügen
ssh-copy-id -i ~/.ssh/deploy_key.pub user@server-ip

# Private Key zu GitHub Secrets hinzufügen
cat ~/.ssh/deploy_key
# (Kompletten Output kopieren → GitHub Secret SSH_PRIVATE_KEY)
```

### 4. Package Permissions

Gehe zu: **Settings → Actions → General**

Unter "Workflow permissions":
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

### 5. Branch Protection (optional)

Unter **Settings → Branches → Branch protection rules**:

Für `main`:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

---

## 🚀 Deployment-Prozess

### Automatisches Deployment

**Trigger:** Push auf `main` oder `master` Branch

```bash
git add .
git commit -m "feat: neue Funktion"
git push origin main
```

**Workflow-Schritte:**

1. ✅ **Lint & Test** - Code-Qualität prüfen
2. ✅ **Build** - Docker Image erstellen
3. ✅ **Push** - Image zu GHCR pushen
4. ✅ **Deploy** - SSH zu Server, Container aktualisieren
5. ✅ **Health Check** - Verfügbarkeit prüfen

### Deployment überwachen

**GitHub UI:**
- Actions Tab → Aktuellen Workflow ansehen
- Live-Logs in Echtzeit

**Server-Logs:**

```bash
ssh user@server-ip
cd /opt/immobilien-app
docker-compose logs -f
```

### Manuelles Deployment

```bash
# Auf Server
cd /opt/immobilien-app

# Login zu GHCR
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Image pullen
docker-compose pull

# Container neu starten
docker-compose up -d --remove-orphans

# Alte Images aufräumen
docker image prune -af
```

---

## 🔄 Rollback

### Automatischer Rollback (GitHub Actions)

1. Gehe zu **Actions** Tab
2. Wähle Workflow "CI/CD Pipeline"
3. Klicke **Run workflow** → `rollback`
4. Bestätige

### Manueller Rollback

**Methode 1: Vorheriges Image verwenden**

```bash
cd /opt/immobilien-app

# Vorherige Images anzeigen
docker images ghcr.io/YOUR-USERNAME/immobilien-app

# docker-compose.yml anpassen
nano docker-compose.yml
# Ändere :latest zu :PREVIOUS-TAG

# Container neu starten
docker-compose up -d --force-recreate
```

**Methode 2: Spezifischen Commit deployen**

```bash
# Lokale auf bestimmten Commit zurücksetzen
git checkout COMMIT-SHA

# Force-Push (Vorsicht!)
git push origin main --force

# Workflow läuft automatisch
```

### Image-Tags verstehen

```
ghcr.io/username/immobilien-app:latest          # Aktuellste main-Version
ghcr.io/username/immobilien-app:main-abc1234    # Spezifischer Commit
ghcr.io/username/immobilien-app:dev             # Dev-Branch
```

---

## 🐛 Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker-compose logs

# Container Status
docker-compose ps

# Detaillierte Info
docker inspect immobilien-app
```

**Häufige Fehler:**

| Fehler | Lösung |
|--------|--------|
| Port bereits belegt | `docker ps` prüfen, anderen Container stoppen |
| Image nicht gefunden | GHCR Login prüfen, Package Permissions |
| Permission denied | User zu docker-Gruppe: `sudo usermod -aG docker $USER` |

### Health Check schlägt fehl

```bash
# Direkt testen
curl http://localhost:3000/health

# Container-Logs
docker-compose logs immobilien-app

# Nginx-Status
docker-compose exec immobilien-app nginx -t
```

### HTTPS funktioniert nicht

```bash
# Caddy-Logs
sudo journalctl -u caddy -f

# Caddy neu starten
sudo systemctl restart caddy

# DNS prüfen
dig your-domain.com

# Port 80/443 testen
sudo netstat -tuln | grep -E '80|443'
```

### GitHub Actions schlägt fehl

**SSH-Verbindung fehlgeschlagen:**
- Private Key korrekt in Secret?
- Server-IP in `SERVER_HOST`?
- Firewall Port 22 offen?

```bash
# Manuell testen
ssh -i ~/.ssh/deploy_key user@server-ip
```

**Docker Login fehlgeschlagen:**
- Package read permission in GitHub?
- Token noch gültig?

**Build fehlgeschlagen:**
- `npm run build` lokal testen
- Dependencies aktuell?

---

## 📱 PWA & Mobile

### iOS-Test im WLAN

```bash
# Server mit Host-Binding starten
npm run dev -- --host

# Ausgabe zeigt:
# ➜  Network: http://192.168.1.100:5173
```

Auf iPhone in Safari öffnen: `http://192.168.1.100:5173`

### PWA-Installation

Nach Deployment über HTTPS:

1. Safari → Domain öffnen
2. **Teilen** → **Zum Home-Bildschirm**
3. App startet im Vollbild-Modus
4. Offline-Nutzung möglich (LocalStorage bleibt)

---

## 🔧 Alternative: Systemd-Deployment

### Variante B (ohne Docker)

**Vorteile:**
- Einfacher Setup
- Weniger Overhead
- Direkter Zugriff auf Node-Prozess

**Nachteile:**
- Keine Container-Isolation
- Manuelle Dependency-Updates
- Komplexeres Rollback

### Setup

```bash
# 1. Build auf Server
cd /opt/immobilien-app
npm ci --only=production
npm run build

# 2. Systemd Service erstellen
sudo nano /etc/systemd/system/immobilien-app.service
```

**Service-Datei:**

```ini
[Unit]
Description=Immobilien-App
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/immobilien-app
ExecStart=/usr/bin/npm run preview -- --port 3000 --host
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Service aktivieren:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable immobilien-app
sudo systemctl start immobilien-app
sudo systemctl status immobilien-app
```

### Deployment mit rsync

**GitHub Actions Workflow:**

```yaml
- name: Deploy via rsync
  run: |
    rsync -avz --delete \
      --exclude='node_modules' \
      --exclude='.git' \
      dist/ ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }}:/opt/immobilien-app/dist/
    
    ssh ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} \
      'sudo systemctl restart immobilien-app'
```

---

## 📊 Monitoring & Logs

### Log-Locations

```bash
# Application Logs
docker-compose logs -f immobilien-app

# Caddy Logs
sudo tail -f /var/log/caddy/immobilien-app.log

# System Logs
sudo journalctl -u docker -f
```

### Health Monitoring

```bash
# Regelmäßiger Health Check
watch -n 30 'curl -s http://localhost:3000/health'

# Container Resource Usage
docker stats immobilien-app
```

### Backup-Strategie

**LocalStorage-Daten** werden im Browser gespeichert:
- Pro User: `ms-2024.1:{userSlug}:ovm:{objectId}`
- Export: Browser DevTools → Application → LocalStorage → Export

**Optional: Remote-Storage aktivieren**

In `.env`:
```env
USE_REMOTE_STORAGE=true
API_BASE_URL=https://your-api-domain.com
```

---

## ✅ Checkliste vor Go-Live

- [ ] Domain DNS konfiguriert
- [ ] Server-Setup abgeschlossen
- [ ] `.env` Datei ausgefüllt
- [ ] Caddyfile angepasst
- [ ] GitHub Secrets hinterlegt
- [ ] SSH-Key funktioniert
- [ ] Firewall konfiguriert
- [ ] Erstes Deployment erfolgreich
- [ ] HTTPS funktioniert
- [ ] Health Check antwortet
- [ ] PWA auf iPhone getestet
- [ ] Profile (Robin/Friedrich/Freddy/Salih) funktionieren
- [ ] LocalStorage persistiert nach Reload
- [ ] Rollback getestet

---

## 📞 Support

Bei Fragen oder Problemen:

1. **Logs prüfen** (siehe Monitoring-Sektion)
2. **GitHub Issues** durchsuchen
3. **Health Check** ausführen
4. **Rollback** bei kritischen Problemen

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** November 2025  
**Maintainer:** Robin
