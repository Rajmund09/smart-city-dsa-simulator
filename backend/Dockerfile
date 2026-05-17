# Build stage
FROM ubuntu:24.04 AS builder

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install core build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    ninja-build \
    pkg-config \
    libpq-dev \
    libpqxx-dev \
    libspdlog-dev \
    libgtest-dev \
    meson \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Clone and build Pistache REST Framework (master branch)
RUN git clone https://github.com/pistacheio/pistache.git /tmp/pistache && \
    cd /tmp/pistache && \
    meson setup build --buildtype=release -Dcpp_std=c++20 -Dtests=false && \
    meson compile -C build && \
    meson install -C build && \
    cd / && rm -rf /tmp/pistache

# Set working directory
WORKDIR /app

# Copy CMakeLists.txt and source files
COPY CMakeLists.txt ./
COPY include/ ./include/
COPY src/ ./src/
COPY tests/ ./tests/

# Build the C++ backend
RUN mkdir build && cd build && \
    cmake -G Ninja -DCMAKE_BUILD_TYPE=Release .. && \
    ninja

# Runtime stage
FROM ubuntu:24.04 AS runner

ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies (libpqxx, spdlog, and SSL)
RUN apt-get update && apt-get install -y \
    libpqxx-7.8t64 \
    libpq5 \
    libspdlog1.12 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled binaries and libraries from builder
COPY --from=builder /usr/local/lib/ /usr/local/lib/
COPY --from=builder /app/build/smart_city_server /usr/local/bin/smart_city_server
COPY --from=builder /app/build/graph_tests /usr/local/bin/graph_tests

# Update dynamic library cache
RUN ldconfig

# Expose API port
EXPOSE 8080

# Run the server
CMD ["smart_city_server"]

