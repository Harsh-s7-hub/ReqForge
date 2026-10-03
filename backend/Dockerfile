FROM python:3.12-slim

# Python runtime configuration
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application and database migration files
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Backend port
EXPOSE 8001

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]