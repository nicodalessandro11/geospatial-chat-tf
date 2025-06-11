# ====================================
# Makefile — Are U Query-ous Project
# Description: This Makefile is used to manage the 
# development and deployment of the Are U Query-ous project.
# Author: Nico D'Alessandro Calderon
# Date: 2025-03-01
# Version: 1.0.0
# License: MIT License
# ====================================

# ======================
# Environment Setup
# ======================

# Setup Python virtual environment (Python 3.11 required)
setup-venv:
	@echo "Creating virtual environment with Python 3.11..."
	@python3.11 -m venv .venv && \
	source .venv/bin/activate && \
	echo "Upgrading pip..." && \
	python -m pip install --upgrade pip && \
	echo "Installing requirements..." && \
	pip install -r requirements.txt && \
	echo "Virtual environment setup complete."


# Install shared libraries
install-common-lib:
	pip install -e shared/common_lib

# ======================
# Database Commands
# ======================

# Reset and apply migrations and seeds
reset-and-migrate-db:
	@set -a; . "$(CURDIR)/.env"; set +a; \
	echo "Resetting database..."; \
	psql "$$SUPABASE_DB_URL" -f auq_database/reset_db.sql && \
	echo "Applying migrations..."; \
	for f in auq_database/migrations/*.sql; do \
		echo "Applying $$f..."; \
		psql "$$SUPABASE_DB_URL" -f $$f || exit 1; \
	done && \
	echo "Applying seed data..."; \
	psql "$$SUPABASE_DB_URL" -f auq_database/seed.sql && \
	echo "✅ Database reset and migrated successfully."

# ======================
# Data engine (ETL) Commands
# ======================

# Run full ETL engine
run-engine:
	PYTHONPATH=shared python -m auq_data_engine.main

# Run ETL in developer mode (skip uploads)
run-engine-dev:	
	PYTHONPATH=shared python -m auq_data_engine.main --skip-upload

# Run tests
test:
	pytest

# ======================
# Frontend Commands
# ======================

# Install frontend dependencies
install-frontend:
	cd auq_frontend && pnpm install

# Run frontend development server
dev-frontend:
	cd auq_frontend && pnpm dev

# Build frontend for production
build-frontend:
	cd auq_frontend && pnpm build

# ======================
# Support Commands
# ======================

# Clean pycache
clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	rm -rf .pytest_cache

# Generate CHANGELOG.md from implementation report
changelog:
	@set -a; . "$(CURDIR)/.env"; set +a; \
	python -m shared.scripts.generate_changelog

# Generate and display Git commit message using GPT
git-commit-m:
	@set -a; . "$(CURDIR)/.env"; set +a; \
	python -m shared.scripts.git_commit_message_generator
	@echo "Please review the commit message and use it to commit your changes."

# Print environment variables
print-env:
	@set -a; . "$(CURDIR)/.env"; set +a; \
	for f in $$(grep -v '^#' .env | cut -d '=' -f 1); do \
		echo "$$f=$${!f}"; \
	done

# Check database permissions
check-perms:
	@set -a; . "$(CURDIR)/.env"; set +a; \
	psql "$$SUPABASE_DB_URL" -c "SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'districts';"

