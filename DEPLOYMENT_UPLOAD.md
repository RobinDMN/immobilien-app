# Deployment-Anleitung für Upload-Server auf Hetzner

## Schritt 1: Nginx-Konfiguration auf dem Server erstellen

Verbinden Sie sich mit Ihrem Server:
```bash
ssh root@167.235.57.65
```

Erstellen Sie die Nginx-Konfiguration:
```bash
sudo nano /etc/nginx/sites-available/immobilien-app
```

Fügen Sie folgenden Inhalt ein:
```nginx
server {
    listen 80;
    server_name 167.235.57.65;

    client_max_body_size 20M;

    # Main app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Upload API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }

    # Serve uploaded images
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        
        # Cache images
        proxy_cache_valid 200 1d;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

Aktivieren Sie die Konfiguration:
```bash
sudo ln -s /etc/nginx/sites-available/immobilien-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Schritt 2: Docker Compose auf dem Server aktualisieren

```bash
cd /opt/immobilien-app
```

Erstellen Sie die `.env` Datei falls noch nicht vorhanden:
```bash
nano .env
```

Inhalt:
```
GITHUB_REPOSITORY_OWNER=RobinDMN
USE_REMOTE_STORAGE=false
API_BASE_URL=
```

## Schritt 3: Deployment ausführen

Die Änderungen sind schon in GitHub Actions integriert. Nach dem Push werden beide Container automatisch gebaut und deployed:

```bash
git add .
git commit -m "feat(upload): Photo upload functionality with server deployment"
git push
```

## Schritt 4: Überprüfung

Nach erfolgreichem Deployment prüfen Sie:

1. Containers laufen:
```bash
ssh root@167.235.57.65 "cd /opt/immobilien-app && docker compose ps"
```

2. Upload-Server ist erreichbar:
```bash
curl http://167.235.57.65/api/health
```

3. Hauptanwendung funktioniert:
```bash
curl http://167.235.57.65
```

## Lokaler Test (vor Deployment)

1. Upload-Server starten:
```bash
cd server
npm run dev
```

2. Frontend starten (in anderem Terminal):
```bash
npm run dev
```

3. Im Browser öffnen: http://localhost:5174
4. Ein Objekt öffnen und Foto-Upload testen

## Troubleshooting

### Upload funktioniert nicht:
- Prüfen Sie die Browser-Console auf CORS-Fehler
- Prüfen Sie die Server-Logs: `docker compose logs upload-server`

### Bilder werden nicht angezeigt:
- Prüfen Sie die Nginx-Logs: `sudo tail -f /var/log/nginx/error.log`
- Prüfen Sie ob Volume korrekt gemountet ist: `docker volume inspect immobilien-app_upload-data`

### Container startet nicht:
- Prüfen Sie Logs: `docker compose logs -f upload-server`
- Prüfen Sie Docker Images: `docker images | grep upload`
