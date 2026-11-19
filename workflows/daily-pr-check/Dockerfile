# syntax=docker/dockerfile:1
FROM python:3.14-slim AS build
COPY --from=ghcr.io/astral-sh/uv:0.11.17 /uv /uvx /bin/
WORKDIR /app
ENV UV_PYTHON_PREFERENCE=only-system \
    UV_NO_PYTHON_DOWNLOADS=1 \
    UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-local
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM python:3.14-slim AS runtime
COPY --from=ghcr.io/astral-sh/uv:0.11.17 /uv /uvx /bin/
WORKDIR /app
ENV UV_PYTHON_PREFERENCE=only-system \
    UV_NO_PYTHON_DOWNLOADS=1 \
    UV_CACHE_DIR=/tmp/uv-cache \
    XDG_CACHE_HOME=/tmp \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:${PATH}"
RUN groupadd -g 1000 app && \
    useradd -u 1000 -g 1000 -m -s /usr/sbin/nologin app
COPY --from=build --chown=1000:1000 /app /app
USER 1000:1000
ENV HEALTH_SERVER_HOST=127.0.0.1 HEALTH_SERVER_PORT=3001
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:3001/health', timeout=5).status==200 else 1)"
CMD ["sh", "-c", "exec uv run --frozen --no-dev --no-sync python -m worker"]
