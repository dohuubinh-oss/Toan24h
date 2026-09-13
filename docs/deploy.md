# Hướng dẫn & Thiết kế Triển khai CI/CD Toan24h lên VPS

Tài liệu này chi tiết hóa toàn bộ hệ thống CI/CD tự động hóa đóng gói, kiểm thử và triển khai (Deploy) ứng dụng **Toan24h** lên máy chủ VPS bằng **GitHub Actions**, **GitHub Container Registry (GHCR)**, **Docker Compose** và **NGINX Reverse Proxy (SSL Certbot)**.

---

## 1. Kiến trúc Tổng quan (Architecture Diagram)

```mermaid
flowchart TD
    subgraph Developer Workspace
        DEV[Developer Push Code] -->|git push origin main| GH[GitHub Repository]
    end

    subgraph GitHub Actions Pipeline
        GH -->|Trigger| WF[Workflow: .github/workflows/deploy.yml]
        WF --> JOB1[Job 1: Test & Lint]
        JOB1 -->|Success| JOB2[Job 2: Build & Push Images]
        JOB2 -->|Build Docker & Push| GHCR[(GitHub Container Registry: ghcr.io)]
        JOB2 -->|Success| JOB3[Job 3: SSH Deploy to VPS]
    end

    subgraph VPS Production Server
        JOB3 -->|SSH Commands| VPS[VPS Machine /var/www/toan24h]
        GHCR -->|docker compose pull| VPS
        VPS --> NGINX[NGINX Reverse Proxy + SSL Let's Encrypt]
        NGINX -->|:3000| FE[Frontend Next.js Container]
        NGINX -->|:8080| BE[Backend Go Container]
        BE --> DB[(PostgreSQL 15 Container)]
        BE --> REDIS[(Redis 7 Container)]
    end
```

---

## 2. Chuẩn bị VPS (VPS Initial Setup)

Trước khi kích hoạt CI/CD, hãy chuẩn bị VPS Ubuntu 22.04 / 24.04 LTS theo các bước sau:

### Bước 2.1: Cập nhật hệ thống & Cài đặt Docker
Chạy các lệnh sau trên VPS (với quyền `root` hoặc `sudo`):

```bash
# Cập nhật package hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker & Docker Compose Plugin
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Thêm user hiện tại vào docker group (nếu không dùng root)
sudo usermod -aG docker $USER

# Kiểm tra cài đặt thành công
docker --version
docker compose version
```

### Bước 2.2: Tạo thư mục chứa dự án trên VPS
```bash
sudo mkdir -p /var/www/toan24h
sudo chown -R $USER:$USER /var/www/toan24h
cd /var/www/toan24h
```

### Bước 2.3: Cài đặt SSH Key cho GitHub Actions
1. Tạo cặp SSH Key trên máy cá nhân hoặc VPS (nếu chưa có):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "deploy@toan24h" -f ~/.ssh/vps_toan24h -N ""
   ```
2. Thêm Public Key vào file `~/.ssh/authorized_keys` trên VPS:
   ```bash
   cat ~/.ssh/vps_toan24h.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
3. Lưu nội dung file Private Key (`~/.ssh/vps_toan24h`) để cấu hình vào GitHub Secrets ở bước tiếp theo.

---

## 3. Cấu hình GitHub Secrets

Vào Repository trên GitHub: **Settings** > **Secrets and variables** > **Actions** > Nhấn **New repository secret** và thêm các biến sau:

| Secret Name | Mô tả | Ví dụ giá trị |
| :--- | :--- | :--- |
| `VPS_HOST` | Địa chỉ IP Public của VPS | `123.45.67.89` |
| `VPS_USERNAME` | Tên người dùng SSH | `root` hoặc `ubuntu` |
| `VPS_SSH_KEY` | Nội dung đầy đủ của Private Key | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_PORT` | Cổng SSH của VPS | `22` |
| `ENV_PRODUCTION` | Nội dung file `.env` chứa bí mật sản xuất | *(Xem mẫu ở phần 4 bên dưới)* |

---

## 4. File Cấu hình Biến Môi trường Sản xuất (`ENV_PRODUCTION`)

Nội dung đưa vào Secret `ENV_PRODUCTION` trên GitHub:

```env
# Database Settings
POSTGRES_USER=admin
POSTGRES_PASSWORD=SuperStrongPostgresPassword2026!
POSTGRES_DB=toan24h

# Redis Settings
REDIS_PASSWORD=SuperStrongRedisPassword2026!

# Backend Secrets
JWT_SECRET=YourSuperSecretJWTKeyToan24h2026!
GEMINI_API_KEY=AIzaSy...YourGeminiKey

# Frontend Settings
NEXT_PUBLIC_API_URL=https://toan24h.vn/api/v1
```

---

## 5. File GitHub Actions Workflow (`.github/workflows/deploy.yml`)

File này sẽ được đặt tại đường dẫn `.github/workflows/deploy.yml` trong repository của bạn:

```yaml
name: CI/CD Pipeline Build & Deploy to VPS

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_BACKEND: ghcr.io/${{ github.repository_owner }}/toan24h-backend
  IMAGE_FRONTEND: ghcr.io/${{ github.repository_owner }}/toan24h-frontend

jobs:
  test-and-lint:
    name: 🧪 1. Test & Quality Check
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Run Backend Tests
        run: |
          cd backend
          go test ./...

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Test Frontend Build
        run: |
          cd frontend
          npm ci
          npm run build

  build-and-push:
    name: 🐳 2. Build & Push Docker Images
    needs: test-and-lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and Push Backend Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_BACKEND }}:latest
            ${{ env.IMAGE_BACKEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and Push Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ${{ env.IMAGE_FRONTEND }}:latest
            ${{ env.IMAGE_FRONTEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: 🚀 3. Deploy to VPS
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Copy Compose & Nginx config to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          source: "docker-compose.prod.yml,nginx/nginx.conf"
          target: "/var/www/toan24h"

      - name: SSH Command to Pull & Restart Services
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /var/www/toan24h
            
            # Ghi file .env từ GitHub Secret
            echo "${{ secrets.ENV_PRODUCTION }}" > .env
            
            # Đăng nhập GHCR trên VPS
            echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            
            # Pull Image mới nhất & Chạy container
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --remove-orphans
            
            # Dọn dẹp Image cũ để tối ưu dung lượng ổ cứng VPS
            docker image prune -f
```

---

## 6. Khởi tạo SSL miễn phí với Let's Encrypt (Certbot) trên VPS

Để kích hoạt HTTPS cho tên miền (ví dụ: `toan24h.vn`), thực hiện các bước sau một lần duy nhất trên VPS:

1. **Cài đặt Certbot trên VPS:**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. **Cấp phát SSL tự động cho NGINX:**
   ```bash
   sudo certbot --nginx -d toan24h.vn -d www.toan24h.vn
   ```
3. **Kiểm tra tự động gia hạn SSL (Cronjob mặc định):**
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 7. Quy trình Vận hành & Kiểm tra (Verification)

1. Mỗi khi bạn thực hiện `git push origin main`, GitHub Actions sẽ tự động kích hoạt luồng CI/CD.
2. Bạn có thể theo dõi tiến trình trực tiếp tại mục **Actions** trên GitHub Repository.
3. Khi hoàn tất, ứng dụng trên VPS sẽ tự động cập nhật bản mới nhất không gây gián đoạn dịch vụ.
