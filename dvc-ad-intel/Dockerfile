FROM debian:bookworm

# Install system dependencies required by Playwright and Chromium.
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Set working directory.
WORKDIR /app

# Copy and install Python dependencies.
COPY requirements.txt .
RUN pip3 install --upgrade pip && pip3 install -r requirements.txt

# Install Playwright and download the Chromium binary.
RUN pip3 install playwright && playwright install chromium

# Copy the rest of your code.
COPY . .

# Run the Facebook scraper.
CMD ["python", "scraper/tools/playwright_fb_scraper.py"]
