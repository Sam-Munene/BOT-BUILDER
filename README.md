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
APP_PORT=3001 docker-compose up -d --build
```

For faster repeated deploys, prefer the deploy script without a forced clean rebuild:

```bash
APP_PORT=3001 bash scripts/deploy.sh
```

If you need to invalidate Docker cache because of a dependency or build issue:

```bash
FORCE_REBUILD=1 APP_PORT=3001 bash scripts/deploy.sh
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
It keeps Docker layer cache on by default so repeated deploys are much faster.

## HTTPS / nginx

Use `nginx.bot.derinance.com.ssl.conf.example` on the host nginx side.

It proxies HTTPS traffic to the Docker container on `127.0.0.1:3001`.

Do not enable the SSL server block until Let’s Encrypt has issued the certs for `bot.derinance.com`.
