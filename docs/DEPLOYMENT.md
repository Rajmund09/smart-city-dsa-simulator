# Production Deployment Guide

This document describes how to deploy the Smart City DSA Simulator Platform to cloud providers (Render, AWS, DigitalOcean, Railway) and configure production-grade Nginx proxies.

---

## 1. Environment Configurations

Make sure to define the following environment variables in your production container environments:

| Environment Variable | Description | Production Example |
| :--- | :--- | :--- |
| `DB_HOST` | Database server hostname | `dpg-xxxx.render.com` or `aws-rds-url` |
| `DB_PORT` | Database server port | `5432` |
| `DB_NAME` | Database schema name | `smart_city_production` |
| `DB_USER` | Database username | `db_admin` |
| `DB_PASSWORD` | Database password | `<your-db-password>` |

---

## 2. Cloud Deployment Methods

### 2.1 DigitalOcean App Platform / Render
Both platforms support deploying multi-container systems directly using Docker files.

1. **Deploy Database:** Create a Managed PostgreSQL Database cluster. Keep note of the credentials.
2. **Deploy Backend:**
   - Source: Git repository
   - Build command: Dockerfile (select `backend/Dockerfile` as the build context)
   - Add environment variables (`DB_HOST`, `DB_PORT`, etc.) mapped to your database cluster.
3. **Deploy Frontend:**
   - Source: Git repository
   - Build command: Dockerfile (select `frontend/Dockerfile` as the build context)
   - Ensure the frontend's built-in Nginx container points to the deployed backend's URL.

### 2.2 AWS (Elastic Container Service / EC2)
For large scale enterprise deployment:
1. Spin up an **RDS PostgreSQL** database instance inside your VPC.
2. Push backend and frontend images to **AWS Elastic Container Registry (ECR)**.
3. Create an **ECS Task Definition** mapping:
   - `db` connection variables in task definitions.
   - Run task on **AWS Fargate** (serverless containers).
4. Configure an **Application Load Balancer (ALB)** to route port 80 to the frontend task and port 8080 to the backend task.

---

## 3. Production Nginx Optimizations

In production, Nginx should serve static assets directly and compress outputs to reduce bandwidth:

```nginx
# Add inside server block
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;
gzip_min_length 1000;

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}
```
This is configured inside `frontend/nginx.conf` and `docker/nginx.conf` to guarantee high ratings in performance audits (like Google Lighthouse).
