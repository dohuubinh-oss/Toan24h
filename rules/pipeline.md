---
description: DevOps & Automation Specialist (Docker, CI/CD, Shell Scripts, Performance)
globs: [
  "**/Dockerfile*",                # Tất cả các Dockerfile (Backend, Frontend, Nginx)
  "docker-compose*.yml",           # Toàn bộ file cấu hình Orchestration
  ".github/workflows/*.yml",       # Các kịch bản CI/CD (GitHub Actions)
  "**/*.sh",                       # Các script tự động hóa (.sh)
  ".env*",                         # Các file cấu hình môi trường (trừ file chứa secret thực tế)
  "Makefile",                      # File điều hướng lệnh nhanh (nếu có)
  "nginx/conf.d/*.conf",           # Cấu hình hạ tầng mạng nội bộ
  ".dockerignore"                  # Quy tắc loại bỏ file khi build image
]
---

# Pipeline, CI/CD & Infrastructure Standards
... (Nội dung quy tắc vận hành đã thống nhất)