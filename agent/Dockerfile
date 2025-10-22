# Python agent container using uv
FROM ghcr.io/astral-sh/uv:python3.11-bookworm
WORKDIR /app

# Ensure uv uses project venv
ENV UV_SYSTEM_PYTHON=1

# Copy project files and install deps (uses uv.lock for determinism)
COPY pyproject.toml uv.lock ./
COPY agent ./agent
RUN uv sync --frozen

EXPOSE 9000
# Launch FastAPI via uvicorn
CMD ["uv", "run", "uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "9000"]
