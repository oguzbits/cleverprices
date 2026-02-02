# 🐳 Dokploy & Hetzner Setup Guide

This guide documents the complete setup process for CleverPrices on a self-hosted VPS. Use this to restore the infrastructure from scratch if needed.

## 1. Server Provisioning (Hetzner)

1.  **Buy a Server**:
    - **Provider**: Hetzner Cloud
    - **Image**: **Ubuntu 24.04** (LTS)
    - **Type**: **Arm64** (Ampere) -> **CAX11** (or CAX21 for more RAM)
    - **Location**: Falkenstein or Nuremberg (DE)
    - **Networking**: Ensure **IPv4** is enabled (crucial for GitHub/Docker Hub).

2.  **Access**:
    - SSH into the server: `ssh root@<YOUR_IP>`
    - Change the default password when prompted.

3.  **Basic Security & Performance (First Run)**:

    ```bash
    # Update system
    apt update && apt upgrade -y

    # Add 4GB Swap (Essential for Builds)
    fallocate -l 4G /swapfile && \
    chmod 600 /swapfile && \
    mkswap /swapfile && \
    swapon /swapfile && \
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    ```

---

## 2. Install Dokploy

Run the official installer command:

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Once finished, open `http://<YOUR_IP>:3000` in your browser and create your admin account.

---

## 3. Application Setup (CleverPrices)

### Step 3.1: Create Project & App

1.  **Project**: Create a project named `CleverPrices`.
2.  **Application**: Create an app named `production`.
    - **Source**: GitHub
    - **Repository**: `oguzbits/cleverprices`
    - **Branch**: `main`
    - **Build Type**: `Dockerfile`
      - Docker File: `Dockerfile`
      - Context: `.`

### Step 3.2: Environment Configuration

Go to the **Environment** tab:

1.  **Container Port**: `3000`
2.  **Environment Variables**:
    - `NODE_ENV=production`
    - `NEXT_TELEMETRY_DISABLED=1`
    - _(Add any other secrets like KEEP_API_KEY if needed)_

### Step 3.3: Persistent Volumes (Crucial)

Go to **Advanced -> Volumes**:

1.  **Host Path**: `/etc/dokploy/volumes/cleverprices/data`
2.  **Container Path**: `/app/data`
3.  **Type**: **Bind**

**Initialize the Host Folder & Permissions:**
Run this on the server (SSH) to ensure permissions are correct for the container user (UID 1001):

```bash
# Create directory
mkdir -p /etc/dokploy/volumes/cleverprices/data

# Ensure standard UID (1001) has access
chown -R 1001:1001 /etc/dokploy/volumes/cleverprices/data
chmod -R 775 /etc/dokploy/volumes/cleverprices/data
```

### Step 3.4: Traefik & Compression (Brotli)

1.  **Global Middleware**: Go to **Traefik -> File System**. Open `dynamic/middlewares.yml`.
    Add (or append) the compression definition:

    ```yaml
    http:
      middlewares:
        app-compress:
          compress: {}
    ```

2.  **App Reference**: Go to your Application **Advanced -> Traefik**.
    Reference the global middleware in your HTTPS router:
    ```yaml
    http:
      routers:
        # Find your HTTPS router (usually ends in -websecure-X)
        cleverprices-production-router-websecure-X:
          rule: Host(`cleverprices.com`)
          middlewares:
            - app-compress # <--- REFERENCE GLOBAL MIDDLEWARE
          entryPoints:
            - websecure
          tls:
            certResolver: letsencrypt
    ```

---

## 4. Domain & SSL

1.  **DNS**: Point your domain's **A Record** (`@` and `www`) to the Server IP.
2.  **Dokploy Domain**:
    - Go to **Domains**.
    - Add `cleverprices.com`.
    - Port: `3000`.
    - HTTPS: **Enabled**.
3.  **Troubleshooting SSL**: If certificate fails, disable HTTPS -> Save -> Wait 10s -> Enable HTTPS -> Save.

---

---

## 5. Worker Service (Background Jobs)

We use a separate "Worker" application for background tasks to avoid blocking the main web server.

1.  **Create App**: Create a new application named `worker`.
    - **Source**: Same GitHub repo & branch.
    - **Build Type**: `Dockerfile`.
2.  **Environment**:
    - `NODE_ENV=production`
    - `IS_WORKER=true` (Important: Signals entrypoint to run worker mode)
3.  **Volumes** (CRITICAL):
    - Mount the **SAME** host volume as the main app:
    - Host: `/etc/dokploy/volumes/cleverprices/data`
    - Container: `/app/data`
    - This ensures both apps see the same SQLite database.

---

## 6. Redis Service (Caching)

1.  **Create Service**: Go to valid project -> Create Service -> **Redis**.
2.  **Name**: `cleverprices-redis`
3.  **Internal Network**: Note the container name (e.g., `cleverprices-redis-v7mm3u`).
4.  **Connect**:
    - In your Main App and Worker App, add env var:
    - `REDIS_URL=redis://default:<password>@<internal-container-name>:6379`

---

## 7. Automation (Worker Cron)

The `worker` service handles cron jobs internally via `node-cron` or simple loop if configured, but typically we trigger it via Dokploy Cron or internal scheduling.

_Current Setup:_ The Worker container runs `npm run start:worker` which keeps the process alive for processing queues.

---

## 7. Data Restoration & Local Sync

**Ship local data to Server:**

```bash
bun run db:push-prod
```

_(This SCPs `data/cleverprices.db` to the VPS volume)_.

**Pull production data for local debugging:**

```bash
bun run db:pull
```

---

---

## 8. Database Backups (Cloudflare R2)

We use a custom script to compress and upload the SQLite database to Cloudflare R2 daily.

1.  **Bucket**: `cleverprices-backups`
2.  **Env Vars** (In Worker App):
    - `R2_ACCESS_KEY_ID`: `...`
    - `R2_SECRET_ACCESS_KEY`: `...`
    - `R2_BUCKET`: `cleverprices-backups`
    - `R2_ENDPOINT`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
3.  **Cron Job** (In Worker App):
    - **Schedule**: `0 4 * * *` (Daily 4 AM)
    - **Command**: `npm run db:backup`

---

## 9. Disaster Recovery Checklist

If the server is deleted:

1.  [ ] Buy new Hetzner Server.
2.  [ ] Update DNS A Record to new IP.
3.  [ ] Install Dokploy.
4.  [ ] Re-create Apps (Main & Worker) & Volume Config.
5.  [ ] **Restore DB**: Download latest `.db.gz` from R2, unzip, and place in `/etc/dokploy/volumes/cleverprices/data/cleverprices.db`.
6.  [ ] Deploy.
