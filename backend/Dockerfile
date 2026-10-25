FROM python:3.12-slim

# Prevent Python from creating .pyc files
ENV PYTHONDONTWRITEBYTECODE=1

# Send Python logs directly to stdout/stderr
ENV PYTHONUNBUFFERED=1

# Application directory
WORKDIR /app

# System dependencies
# build-essential is useful for packages that need compilation
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency file first
# This allows Docker to cache the pip installation layer
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app ./app
COPY ai_services ./ai_services

# Alembic
COPY alembic ./alembic
COPY alembic.ini .

# Expose FastAPI port
EXPOSE 8001

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]