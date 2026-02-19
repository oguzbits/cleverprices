# 🤖 Automation & CI/CD Plan

**Goal:** Fully automate the data pipeline so you never have to run `scp` or `db:push-prod` manually.

## 1. SSH Authentication

- [ ] **Generate Deploy Key**: Create a dedicated SSH key pair (no passphrase) for GitHub Actions.
- [ ] **Add to Server**: Add the public key to `/root/.ssh/authorized_keys` on your Hetzner VPS.
- [ ] **Add to GitHub**: Add the private key as a Secret named `SSH_PRIVATE_KEY` in your GitHub repository.

## 2. Automated Data Sync (Workflow)

- [ ] **Create `deploy-data.yml`**: A new GitHub Action that runs on a schedule (e.g., every 6 hours).
  - Step 1: Setup Bun & Checkout.
  - Step 2: Run `update-prices` (fetches Keepa).
  - Step 3: Run `db:lite` (optimizes SQLite).
  - Step 4: Use `appleboy/scp-action` to push the `lite.db` to `/etc/dokploy/volumes/cleverprices/data/`.

## 3. Automated App Deployment

- [ ] **Dokploy Webhook**: Configure Dokploy to deploy automatically on every `git push` to `main`.
  - (You likely already have this active if you linked GitHub).

---

**Next Step:** Would you like me to generate the SSH key commands for you?
