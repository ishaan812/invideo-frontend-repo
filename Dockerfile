# Stage 1: Build the Rust WASM package
FROM rust:1.87 AS rust_builder

# Install wasm-pack (latest version), using --locked to respect its lockfile
RUN cargo install wasm-pack --locked

WORKDIR /app
# Copy rust-calc source into a subdirectory to keep things organized
COPY rust-calc/ ./rust-calc/

# Build wasm package
RUN cd rust-calc && wasm-pack build --target web
# This creates /app/rust-calc/pkg

# Stage 2: Build the React frontend
FROM node:18-alpine AS frontend_builder

WORKDIR /app

# Create frontend directory structure first
RUN mkdir -p frontend rust-calc/pkg

# Copy package.json and package-lock.json (if it exists) for frontend
COPY frontend/package.json ./frontend/
# For package-lock.json, copy it only if it exists. Docker build will fail if it's missing and not optional.
# However, for simplicity with the linter, we'll assume it might exist.
# If it causes issues, we might need a shell command here.
COPY frontend/package-lock.json* ./frontend/

COPY frontend/tsconfig.json ./frontend/
COPY frontend/tsconfig.app.json ./frontend/
COPY frontend/tsconfig.node.json ./frontend/
COPY frontend/vite.config.ts ./frontend/

# Copy the WASM package built in Stage 1
COPY --from=rust_builder /app/rust-calc/pkg/ ./rust-calc/pkg/

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install --legacy-peer-deps

# Copy the rest of the frontend source code into /app/frontend
COPY frontend/ ./ 

# Build the frontend application
# The VITE_API_URL will be set at runtime by Fly.io from fly.toml
RUN npm run build
# This creates /app/frontend/dist

# Stage 3: Serve the application with Nginx
FROM nginx:alpine

# Copy built static assets from frontend_builder stage
COPY --from=frontend_builder /app/frontend/dist /usr/share/nginx/html/

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 
