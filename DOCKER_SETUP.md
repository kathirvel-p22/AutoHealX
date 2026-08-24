# 🐳 AutoHealX Docker Setup Guide

This guide will help you run AutoHealX using Docker.

## 📋 Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (usually included with Docker Desktop)

### Check if Docker is installed:
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

Run both the web dashboard and agent together:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

Access the application at: **http://localhost:3000**

### Option 2: Run Web App Only

```bash
# Build the Docker image
docker build -t autohealx-web .

# Run the container
docker run -d -p 3000:3000 --name autohealx-web autohealx-web
```

### Option 3: Run Agent Only

```bash
# Navigate to agent directory
cd agent

# Build the agent image
docker build -t autohealx-agent .

# Run the agent container
docker run -d --name autohealx-agent autohealx-agent
```

## 🛠️ Docker Commands

### View running containers
```bash
docker ps
```

### View logs
```bash
# Web app logs
docker logs autohealx-web

# Agent logs
docker logs autohealx-agent

# Follow logs in real-time
docker logs -f autohealx-web
```

### Stop containers
```bash
# Using Docker Compose
docker-compose down

# Or stop individual containers
docker stop autohealx-web
docker stop autohealx-agent
```

### Restart containers
```bash
# Using Docker Compose
docker-compose restart

# Or restart individual containers
docker restart autohealx-web
```

### Remove containers
```bash
# Using Docker Compose (removes containers and networks)
docker-compose down

# Remove containers
docker rm autohealx-web autohealx-agent

# Remove images
docker rmi autohealx-web autohealx-agent
```

### Clean up everything (including volumes)
```bash
docker-compose down -v
docker system prune -a
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration (Optional)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Application Settings
VITE_APP_NAME=AutoHealX
VITE_APP_VERSION=1.0.0
```

Then modify `docker-compose.yml` to include the env file:

```yaml
services:
  autohealx-web:
    env_file:
      - .env
```

## 🌐 Port Configuration

Default ports:
- **Web Dashboard**: 3000
- **Agent**: 8080 (internal)

To change ports, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

## 📊 Health Checks

Both containers include health checks:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' autohealx-web
```

## 🔍 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs autohealx-web

# Inspect container
docker inspect autohealx-web
```

### Port already in use
```bash
# Change port in docker-compose.yml or stop the conflicting service
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux
```

### Rebuild without cache
```bash
docker-compose build --no-cache
docker-compose up
```

### Access container shell
```bash
docker exec -it autohealx-web sh
```

## 🎯 Production Deployment

### Using Docker Hub

```bash
# Tag the image
docker tag autohealx-web yourusername/autohealx-web:latest

# Push to Docker Hub
docker push yourusername/autohealx-web:latest

# Pull and run on production server
docker pull yourusername/autohealx-web:latest
docker run -d -p 80:3000 yourusername/autohealx-web:latest
```

### Using a Registry

```bash
# Tag for private registry
docker tag autohealx-web registry.example.com/autohealx-web:latest

# Push to registry
docker push registry.example.com/autohealx-web:latest
```

## 📦 Multi-Architecture Builds

Build for multiple platforms (ARM, x86):

```bash
# Create builder
docker buildx create --use

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t autohealx-web:latest .
```

## 🔐 Security Best Practices

1. **Don't include secrets in the image**
   - Use environment variables or Docker secrets
   
2. **Run as non-root user** (already configured in Dockerfile)

3. **Keep images updated**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

4. **Scan for vulnerabilities**
   ```bash
   docker scan autohealx-web
   ```

## 📈 Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  autohealx-web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 🎉 Success!

Once running, access your AutoHealX dashboard at:
- **Local**: http://localhost:3000
- **Demo Login**: demo@autohealx.com / demo123

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AutoHealX Repository](https://github.com/kathirvel-p22/AutoHealX)

---

**Made with ❤️ for AutoHealX**
