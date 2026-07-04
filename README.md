# Bot Builder Deployment

## Local development

```bash
cd server
npm install
npm run dev
```

## Production deployment on the server

1. Go to the `bot-builder` directory on the server.
2. Pull the latest changes:

```bash
git pull --ff-only origin main
```

3. Build and start the Docker stack:

```bash
docker-compose up -d --build
```

4. Check the container status:

```bash
docker-compose ps
```

## One-command deploy

You can also run:

```bash
bash scripts/deploy.sh
```

That script will:

1. Pull the latest GitHub changes.
2. Rebuild the Docker image.
3. Restart the container in detached mode.

The script auto-detects `docker-compose` first, then falls back to `docker compose` if your server has the plugin installed.

## HTTPS / nginx

Use `nginx.bot.derinance.com.ssl.conf.example` on the host nginx side.

Replace the certificate paths with your real Let’s Encrypt files, then reload nginx.
