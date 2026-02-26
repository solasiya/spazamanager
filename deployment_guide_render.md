# 🚀 Deployment Guide: Render

This guide explains how to deploy **Spaza Manager** to Render using the provided Blueprint (`render.yaml`).

## 1. Prerequisites
- A **Render** account (https://render.com)
- A **MySQL Database**. Since Render only provides PostgreSQL natively, you should get a MySQL connection URL from an external provider:
  - [Aiven](https://aiven.io) (Free Tier available)
  - [PlanetScale](https://planetscale.com)
  - [DigitalOcean](https://digitalocean.com)
  - Or use a MySQL instance if you have one.

## 2. Configuration (Environment Variables)
When creating the service or using the Blueprint, ensure you have these values:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Your MySQL connection string | `mysql://user:pass@host:3306/db_name` |
| `SESSION_SECRET` | A random string for securing sessions | `your-secret-key-12345` |
| `NODE_ENV` | Must be set to `production` | `production` |

## 3. Step-by-Step Deployment

### Option A: Using the Blueprint (Recommended)
1. Push your code to a **GitHub** or **GitLab** repository.
2. In the Render dashboard, click **"New"** -> **"Blueprint"**.
3. Select your repository.
4. Render will automatically detect the `render.yaml` file.
5. Provide your `DATABASE_URL` when prompted.
6. Click **"Apply"**.

### Option B: Manual Setup
1. Create a **New Web Service**.
2. Connect your repository.
3. **Runtime**: Node.js
4. **Build Command**: `npm install && npm run build`
5. **Start Command**: `npm run start`
6. Under **Advanced**, add the Environment Variables listed above.

## 4. Post-Deployment Checks
- Once deployed, your server will automatically run migrations and create the default admin user:
  - **Superuser**: `cms` / `cms123`
  - **Admin**: `admin` / `password`
- Check the **Logs** tab in Render to ensure the database connected successfully.

> [!IMPORTANT]
> Ensure your MySQL connection string includes any necessary parameters for Render's environment (like `ssl={"rejectUnauthorized":true}` if using an SSL-governed connection).
