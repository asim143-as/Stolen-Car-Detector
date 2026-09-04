# Lightweight Python 3.10 slim image
FROM python:3.10-slim

# Prevent Python from buffering stdout/stderr and prevent pyc generation
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive \
    PORT=8000

# Install required system packages for OpenCV, EasyOCR, and video processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to leverage Docker layer caching
COPY requirements.txt .

# Upgrade pip and install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download EasyOCR model weights into cache to make startup instant
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# Copy the rest of the application files
COPY . .

# Ensure storage directories exist with write permissions
RUN mkdir -p uploads detections outputs && \
    chmod -R 777 uploads detections outputs

# Expose standard FastAPI port (8000) and Hugging Face Spaces port (7860)
EXPOSE 8000 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start Uvicorn dynamically binding to whatever $PORT is provided by the host (defaults to 8000)
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
