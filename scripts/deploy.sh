#!/usr/bin/env bash

set -e

# ==============================================================================
# Service Factory Deployment Script
# 1. Load env configuration (.env.local or .env if present)
# 2. Authenticate to GHCR (via GITHUB_TOKEN / GH_TOKEN / CR_PAT in env)
# 3. Build Docker image locally for linux/amd64 (Zero server CPU/RAM usage)
# 4. Push image to Container Registry (GHCR)
# 5. SSH into remote server (using SERVER_HOST, SERVER_USER, etc.) and run `pull & up`
# ==============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 0. Load environment file if present
if [ -f ".env.local" ]; then
  echo -e "${CYAN}📄 Loading environment from .env.local...${NC}"
  set -a
  # shellcheck disable=SC1091
  source ".env.local"
  set +a
elif [ -f ".env" ]; then
  echo -e "${CYAN}📄 Loading environment from .env...${NC}"
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

BRANCH="${1:-${DEPLOY_BRANCH:-dev}}"
DEFAULT_IMAGE="ghcr.io/jyk0128/web-framework-app/service-factory-app:latest"
APP_IMAGE="${APP_IMAGE:-$DEFAULT_IMAGE}"
PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"

GITHUB_USER="${GITHUB_USER:-${GH_USER:-jyk0128}}"
GITHUB_TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-${CR_PAT:-}}}"

SERVER_HOST="${SERVER_HOST:-}"
SERVER_USER="${SERVER_USER:-}"
SERVER_PORT="${SERVER_PORT:-22}"
SERVER_DEPLOY_PATH="${SERVER_DEPLOY_PATH:-/app/service-factory}"
SERVER_SSH_KEY="${SERVER_SSH_KEY:-}"

# Extract DOTENV_PRIVATE_KEY_PRD from keys file if not set in environment
if [ -z "$DOTENV_PRIVATE_KEY_PRD" ]; then
  if [ -f "docker/env/.env.keys" ]; then
    DOTENV_PRIVATE_KEY_PRD=$(grep -E "^DOTENV_PRIVATE_KEY_PRD=" docker/env/.env.keys | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
  elif [ -f ".env.keys" ]; then
    DOTENV_PRIVATE_KEY_PRD=$(grep -E "^DOTENV_PRIVATE_KEY_PRD=" .env.keys | cut -d'=' -f2- | tr -d '"' | tr -d "'" || true)
  fi
fi

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BLUE}  🚀 Local Build & Remote Server Deployment (${BRANCH})               ${NC}"
echo -e "${BLUE}====================================================================${NC}"

# 1. Verify local Docker & GHCR authentication
echo -e "\n${YELLOW}[1/4] Checking local Docker build & GHCR authentication...${NC}"
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed locally.${NC}"
  exit 1
fi

# Authenticate with GHCR if token is provided in env or not logged in
if [ -n "$GITHUB_TOKEN" ]; then
  echo -e "🔑 Logging in to GHCR using GITHUB_TOKEN from env..."
  echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin
elif ! grep -q "ghcr.io" ~/.docker/config.json 2>/dev/null; then
  echo -e "${YELLOW}🔑 GHCR (GitHub Container Registry) 로그인이 필요합니다.${NC}"
  echo -e "👉 .env.local에 GITHUB_TOKEN=ghp_... 을 설정하거나 직접 입력해주세요."
  read -r -p "GitHub 사용자명 (Username, 기본값: ${GITHUB_USER}): " INPUT_GH_USER
  if [ -n "$INPUT_GH_USER" ]; then
    GITHUB_USER="$INPUT_GH_USER"
  fi
  read -r -s -p "GitHub 토큰 (PAT Token): " GITHUB_TOKEN
  echo ""
  echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_USER}" --password-stdin
fi

# 2. Build and Push image locally
echo -e "\n${YELLOW}[2/4] Building Docker image locally for ${PLATFORM}...${NC}"
echo -e "${CYAN}Target Image: ${APP_IMAGE}${NC}"

# Ensure buildx builder exists
if ! docker buildx inspect default &> /dev/null; then
  docker buildx create --use --name service-factory-builder 2>/dev/null || true
fi

echo -e "🐳 Building & pushing image to registry..."
docker buildx build \
  --platform "${PLATFORM}" \
  --secret id=DOTENV_PRIVATE_KEY_PRD,env=DOTENV_PRIVATE_KEY_PRD \
  -f docker/Dockerfile.prd \
  -t "${APP_IMAGE}" \
  --push \
  .

echo -e "${GREEN}✓ Docker image built and pushed to ${APP_IMAGE} successfully!${NC}"

# 3. Server connection info
echo -e "\n${YELLOW}[3/4] Checking remote server connection details...${NC}"
if [ -z "$SERVER_HOST" ] || [ -z "$SERVER_USER" ]; then
  echo -e "${YELLOW}👉 .env.local에 SERVER_HOST, SERVER_USER를 설정하면 입력을 생략할 수 있습니다.${NC}"
  read -r -p "서버 IP/호스트 (SERVER_HOST): " SERVER_HOST
  read -r -p "서버 사용자명 (SERVER_USER, e.g. ubuntu/root): " SERVER_USER
  read -r -p "서버 배포 경로 (기본값: ${SERVER_DEPLOY_PATH}): " INPUT_PATH
  if [ -n "$INPUT_PATH" ]; then
    SERVER_DEPLOY_PATH="$INPUT_PATH"
  fi
fi

# Prepare SSH command options
SSH_OPTS=("-p" "${SERVER_PORT}")
if [ -n "$SERVER_SSH_KEY" ]; then
  EXPANDED_KEY="${SERVER_SSH_KEY/#\~/$HOME}"
  SSH_OPTS+=("-i" "${EXPANDED_KEY}")
fi

# 4. SSH Remote Run
echo -e "\n${YELLOW}[4/4] Connecting to remote server (${SERVER_USER}@${SERVER_HOST}) and deploying...${NC}"
ssh "${SSH_OPTS[@]}" "${SERVER_USER}@${SERVER_HOST}" "bash -s" << REMOTE_SCRIPT
set -e
echo "📂 Navigating to ${SERVER_DEPLOY_PATH}..."
cd "${SERVER_DEPLOY_PATH}"

echo "📥 Syncing latest git branch (${BRANCH})..."
git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"

if ! command -v dotenvx &> /dev/null; then
  echo "📥 Installing dotenvx on server..."
  sudo curl -sfS https://dotenvx.sh | sudo sh || true
fi

if [ -n "${GITHUB_TOKEN}" ]; then
  echo "🔑 Logging in to GHCR on server..."
  echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_USER}" --password-stdin 2>/dev/null || true
fi

export DOTENV_PRIVATE_KEY_PRD="${DOTENV_PRIVATE_KEY_PRD}"

echo "📥 Pulling latest image from registry (${APP_IMAGE})..."
DOTENV_PRIVATE_KEY_PRD="${DOTENV_PRIVATE_KEY_PRD}" dotenvx run -f docker/env/.env.prd -- docker compose -f docker/docker-compose.prd.yml pull app

echo "🔄 Starting updated containers..."
DOTENV_PRIVATE_KEY_PRD="${DOTENV_PRIVATE_KEY_PRD}" dotenvx run -f docker/env/.env.prd -- docker compose -f docker/docker-compose.prd.yml up -d --remove-orphans

echo "🧹 Cleaning unused dangling images..."
docker image prune -af --filter "until=24h"

echo "✅ Container restarted successfully with new image!"
REMOTE_SCRIPT

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}  🎉 Remote Deployment Complete! Server is now running updated image. ${NC}"
echo -e "${GREEN}====================================================================${NC}"
