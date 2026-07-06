# Use a slim Node image as our base
FROM node:20-slim

# Install system dependencies: Python3, FFmpeg, and build environments
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python-is-python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crucial: Ensure /usr/bin/node is globally accessible to system binaries
RUN ln -sf /usr/local/bin/node /usr/bin/node

# Download the latest yt-dlp binary directly into the system execution path
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp

# Set up working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# --- HACK TO TRICK YT-DLP-EXEC PACKAGE ---
RUN mkdir -p /app/node_modules/yt-dlp-exec/bin
RUN ln -sf /usr/local/bin/yt-dlp /app/node_modules/yt-dlp-exec/bin/yt-dlp
# ----------------------------------------

# Render defaults to port 10000 for web services
ENV PORT=10000
EXPOSE 10000

# Start the production backend server
CMD ["node", "server.js"]