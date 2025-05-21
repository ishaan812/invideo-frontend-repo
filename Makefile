# Frontend Makefile

.PHONY: install build dev clean test

# Default target
all: install build

# Install dependencies
install:
	cd frontend && npm install

# Build the project
build:
	cd frontend && npm run build

# Start development server
dev:
	cd frontend && npm run dev

# Clean build artifacts
clean:
	cd frontend && rm -rf node_modules
	cd frontend && rm -rf build
	cd frontend && rm -rf dist

# Run tests
test:
	cd frontend && npm test

# Build Rust WASM calculator
build-wasm:
	cd rust-calc && wasm-pack build --target web

# Clean and reinstall everything
reset: clean install build 