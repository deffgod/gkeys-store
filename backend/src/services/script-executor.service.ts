import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '../..');

export interface ScriptExecutionOptions {
  script: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
}

export interface ScriptExecutionResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  duration: number;
  error?: string;
}

/**
 * Execute a TypeScript script using tsx
 */
export async function executeScript(
  options: ScriptExecutionOptions
): Promise<ScriptExecutionResult> {
  const { script, args = [], env = {}, timeout = 300000 } = options; // 5 minutes default timeout
  
  const scriptPath = path.join(backendDir, 'scripts', script);
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let childProcess: ChildProcess | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Merge with process.env
    const processEnv: Record<string, string> = {
      ...process.env,
      ...env,
    };

    try {
      // Spawn tsx process
      childProcess = spawn('npx', ['tsx', scriptPath, ...args], {
        cwd: backendDir,
        env: processEnv as NodeJS.ProcessEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Collect stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      childProcess.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      childProcess.on('exit', (code, signal) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          exitCode: code,
          stdout,
          stderr,
          duration,
          error: signal ? `Process killed by signal: ${signal}` : undefined,
        });
      });

      // Handle process error
      childProcess.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: null,
          stdout,
          stderr,
          duration,
          error: error.message,
        });
      });

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (childProcess && !childProcess.killed) {
            childProcess.kill('SIGTERM');
            // Force kill after 5 seconds if still running
            setTimeout(() => {
              if (childProcess && !childProcess.killed) {
                childProcess.kill('SIGKILL');
              }
            }, 5000);
          }
        }, timeout);
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        exitCode: null,
        stdout,
        stderr,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Execute test-g2a-export-api script
 */
export async function executeTestG2AExportAPI(
  page: number = 1,
  perPage: number = 20,
  debug: boolean = false
): Promise<ScriptExecutionResult> {
  const args: string[] = [];
  if (page > 1) {
    args.push(`--page=${page}`);
  }
  if (perPage !== 20) {
    args.push(`--perPage=${perPage}`);
  }

  const env: Record<string, string> = {};
  if (debug) {
    env.DEBUG = 'true';
  }

  return executeScript({
    script: 'test-g2a-export-api.ts',
    args,
    env,
    timeout: 60000, // 1 minute for test script
  });
}

/**
 * Execute sync-all-g2a-games script
 */
export async function executeSyncAllG2AGames(
  limit?: number,
  dryRun: boolean = false,
  filters: boolean = false
): Promise<ScriptExecutionResult> {
  const args: string[] = [];
  if (dryRun) {
    args.push('--dry-run');
  }
  if (limit) {
    args.push(`--limit=${limit}`);
  }
  if (filters) {
    args.push('--filters');
  }

  return executeScript({
    script: 'sync-all-g2a-games.ts',
    args,
    timeout: 1800000, // 30 minutes for full sync
  });
}
