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

## 5. Reliability & Backups (Litestream)

We use **Litestream** for continuous, per-second replication to S3-compatible storage.

1.  **Bucket Setup**: Create a bucket in Cloudflare R2 or Hetzner Object Storage.
2.  **Env Vars**: Add these to Dokploy "Environment" tab:
    - `LITESTREAM_ACCESS_KEY_ID`: `...`
    - `LITESTREAM_SECRET_ACCESS_KEY`: `...`
    - `LITESTREAM_BUCKET`: `cleverprices-backups`
    - `LITESTREAM_ENDPOINT`: `https://...`
3.  **Restore**: If the VPS disk is wiped, Litestream will automatically restore the DB from S3 on the first boot if the local folder is empty.

---

## 6. Automation (Dokploy Cron Jobs)

Do **not** use GitHub Actions for "Write" jobs. Instead, use Dokploy's native **Cron Jobs** tab for better performance and reliability.

| Job Name         | Schedule             | Command                               |
| :--------------- | :------------------- | :------------------------------------ |
| **Price Update** | `0 * * * *` (Hourly) | `bun run update-prices`               |
| **Enrichment**   | `*/15 * * * *` (15m) | `bun run worker:enrich de --limit=50` |
| **Cache Warmer** | `5 * * * *` (Hourly) | `bun run warm-cache`                  |
| **WAL Cleanup**  | `0 3 * * *` (3 AM)   | `bun run db:checkpoint`               |

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

## 8. Disaster Recovery Checklist

If the server is deleted:

1.  [ ] Buy new Hetzner Server.
2.  [ ] Update DNS A Record to new IP.
3.  [ ] Install Dokploy.
4.  [ ] Re-create App & Volume Config.
5.  [ ] **Optional**: Add Litestream credentials -> It will auto-restore on boot.
6.  [ ] **Manual**: Or run `bun run db:push-prod` to seed manually.
7.  [ ] Deploy.
