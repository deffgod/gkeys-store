# MCP Toolbox Setup Instructions

## Installation Complete

MCP Toolbox has been installed and configured for this project.

## Files Created

1. **`toolbox`** - MCP Toolbox binary (in project root)
2. **`backend/tools.yaml`** - Configuration file with database sources, tools, and toolsets
3. **`backend/setup-mcp-env.sh`** - Script to parse DATABASE_URL and set environment variables
4. **`.cursor/mcp-config.json`** - MCP configuration template for Cursor IDE

## Setting Up Cursor IDE

### Option 1: Using Cursor Settings UI

1. Open Cursor IDE
2. Go to Settings (Cmd+, on macOS)
3. Search for "MCP" or "Model Context Protocol"
4. Add a new MCP server with the following configuration:

```json
{
  "name": "toolbox",
  "command": "./toolbox",
  "args": ["--tools-file", "backend/tools.yaml"],
  "cwd": "/Users/bmdone/Downloads/coolshapes-v1.0/gkeys2"
}
```

### Option 2: Manual Configuration File

1. Locate Cursor's configuration directory:
   - macOS: `~/Library/Application Support/Cursor/User/globalStorage/`
   - Or check Cursor settings for MCP configuration location

2. Add the MCP server configuration to your Cursor settings

3. Set environment variables before starting Cursor:
   ```bash
   cd backend
   source setup-mcp-env.sh
   ```

## Environment Variables

The MCP Toolbox needs the following environment variables set:

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

These are automatically set by `setup-mcp-env.sh` script which parses your `DIRECT_URL` or `DATABASE_URL` from `.env` file.

## Starting MCP Toolbox Server

### Manual Start

To start the MCP Toolbox server manually:

```bash
cd backend
source setup-mcp-env.sh
cd ..
./toolbox --tools-file backend/tools.yaml
```

The server will start on port 5000 by default.

### Automatic Start (via Cursor)

If configured correctly in Cursor, the server will start automatically when Cursor launches.

## Available Tools

The following tools are available through MCP Toolbox:

### User Tools
- `get-users` - Get list of users with pagination
- `get-user-by-id` - Get specific user by ID

### Game Tools
- `get-games` - Get list of games with pagination
- `search-games` - Search games by title/description
- `get-game-by-slug` - Get specific game by slug
- `get-game-stats` - Get game statistics

### Order Tools
- `get-orders` - Get list of orders with pagination
- `get-order-by-id` - Get specific order with items

### Transaction Tools
- `get-transactions` - Get list of transactions with pagination

### Statistics Tools
- `get-user-stats` - Get user statistics

All tools are grouped in the `gkeys-store-tools` toolset.

## Testing the Connection

1. Start the MCP Toolbox server:
   ```bash
   cd backend
   source setup-mcp-env.sh
   cd ..
   ./toolbox --tools-file backend/tools.yaml
   ```

2. Check if the server is running:
   ```bash
   curl http://localhost:5000/health
   ```

3. In Cursor IDE, try asking questions like:
   - "How many users are in the database?"
   - "Show me the latest games"
   - "Search for games with 'cyberpunk' in the title"

## Troubleshooting

### Connection Issues

If you're having connection issues:

1. Verify database connection parameters:
   ```bash
   cd backend
   source setup-mcp-env.sh
   echo $DB_HOST $DB_PORT $DB_NAME
   ```

2. Test database connection directly:
   ```bash
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME
   ```

3. Check MCP Toolbox logs for errors

### Port Already in Use

If port 5000 is already in use, you can change it:
```bash
./toolbox --tools-file backend/tools.yaml --port 5001
```

Update Cursor configuration accordingly.

### Environment Variables Not Set

Make sure to run `setup-mcp-env.sh` before starting the server:
```bash
cd backend
source setup-mcp-env.sh
```

## Notes

- The MCP Toolbox uses `DIRECT_URL` from your `.env` file for direct database connection
- If `DIRECT_URL` is not set, it falls back to `DATABASE_URL`
- SSL mode is set to `require` for secure connections
- All tools use parameterized queries to prevent SQL injection
