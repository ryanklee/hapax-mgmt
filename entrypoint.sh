#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────
QDRANT_URL="${QDRANT_URL:-http://localhost:6333}"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
EMBEDDING_MODEL="${EMBEDDING_MODEL:-nomic-embed-text-v2-moe}"
EMBED_DIMS=768

COLLECTIONS=("documents" "samples" "claude-memory")

# ── Wait for Qdrant ──────────────────────────────────────────────────────
echo "entrypoint: waiting for Qdrant at $QDRANT_URL ..."
for i in $(seq 1 30); do
    if curl -sf "${QDRANT_URL}/healthz" >/dev/null 2>&1; then
        echo "entrypoint: Qdrant ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "entrypoint: ERROR — Qdrant not ready after 30s" >&2
        exit 1
    fi
    sleep 1
done

# ── Create Qdrant collections (idempotent) ───────────────────────────────
for coll in "${COLLECTIONS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
        -X PUT "${QDRANT_URL}/collections/${coll}" \
        -H "Content-Type: application/json" \
        -d "{\"vectors\":{\"size\":${EMBED_DIMS},\"distance\":\"Cosine\"}}" \
        2>/dev/null || echo "000")

    case "$HTTP_CODE" in
        200) echo "entrypoint: created collection '${coll}'" ;;
        409) echo "entrypoint: collection '${coll}' already exists" ;;
        *)   echo "entrypoint: WARNING — failed to create '${coll}' (HTTP ${HTTP_CODE})" >&2 ;;
    esac
done

# ── Pull Ollama embedding model (idempotent) ─────────────────────────────
echo "entrypoint: ensuring Ollama model '${EMBEDDING_MODEL}' ..."

# Check if model is already available
if curl -sf "${OLLAMA_URL}/api/tags" 2>/dev/null | grep -q "\"${EMBEDDING_MODEL}\""; then
    echo "entrypoint: model '${EMBEDDING_MODEL}' already present"
else
    echo "entrypoint: pulling '${EMBEDDING_MODEL}' (this may take a few minutes) ..."
    curl -s --connect-timeout 10 --max-time 600 -X POST "${OLLAMA_URL}/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"${EMBEDDING_MODEL}\",\"stream\":false}" \
        >/dev/null 2>&1 \
        && echo "entrypoint: model '${EMBEDDING_MODEL}' pulled successfully" \
        || echo "entrypoint: WARNING — failed to pull '${EMBEDDING_MODEL}'" >&2
fi

# ── Hand off to CMD ──────────────────────────────────────────────────────
exec "$@"
