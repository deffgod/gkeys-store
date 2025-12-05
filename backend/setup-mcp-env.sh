#!/bin/bash
# Script to parse DATABASE_URL and set environment variables for MCP Toolbox

# Load .env file if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Parse DIRECT_URL if available, otherwise use DATABASE_URL
DB_URL="${DIRECT_URL:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
    echo "Error: DATABASE_URL or DIRECT_URL not set"
    exit 1
fi

# Parse PostgreSQL connection string
# Format: postgresql://user:password@host:port/database?params
if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
    export DB_USER="${BASH_REMATCH[1]}"
    export DB_PASSWORD="${BASH_REMATCH[2]}"
    export DB_HOST="${BASH_REMATCH[3]}"
    export DB_PORT="${BASH_REMATCH[4]}"
    export DB_NAME="${BASH_REMATCH[5]}"
    
    echo "Database connection configured:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
    echo "Environment variables set. You can now run:"
    echo "  ./toolbox --tools-file tools.yaml"
else
    echo "Error: Could not parse database URL"
    echo "Expected format: postgresql://user:password@host:port/database"
    exit 1
fi
