#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
//  VAULTAGENT CLI
//  Zero-knowledge secret injection for AI coding agents
//  Decryption happens locally — server never sees plaintext
// ═══════════════════════════════════════════════════════════════

import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
import { decryptSecret } from './crypto.js';

const API_URL = process.env.VAULTAGENT_URL || 'https://vaultagent.io';
const VERSION = '1.0.0';

// ── Helpers ──────────────────────────────────────────────────

function printUsage() {
  const text = `
vaultagent v${VERSION} — zero-knowledge secret injection

USAGE
  vaultagent env    <token>               Export secrets as shell variables
  vaultagent run    <token> -- <command>   Inject secrets and run a command
  vaultagent status <token>               Check session status

OPTIONS
  --url <url>    Override API URL (default: ${API_URL})
  --help         Show this help
  --version      Show version

EXAMPLES
  # Load secrets into current shell
  eval "$(vaultagent env va_sess_xxx)"

  # Run Claude Code with secrets injected
  vaultagent run va_sess_xxx -- claude

  # Run Cursor with secrets
  vaultagent run va_sess_xxx -- cursor .

  # Check session expiry
  vaultagent status va_sess_xxx

ENVIRONMENT
  VAULTAGENT_URL        API base URL override
  VAULTAGENT_PASSWORD   Master password (prefer interactive prompt)
`.trim();
  console.log(text);
}

async function promptPassword() {
  if (process.env.VAULTAGENT_PASSWORD) {
    return process.env.VAULTAGENT_PASSWORD;
  }

  // If not a TTY (piped input), read a line from stdin
  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin });
    return new Promise((resolve) => {
      rl.once('line', (line) => {
        rl.close();
        resolve(line);
      });
    });
  }

  // Interactive TTY: read password with echo disabled
  return new Promise((resolve) => {
    process.stderr.write('Master password: ');
    let password = '';

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stderr.write('\n');
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        resolve(password);
      } else if (char === '\u0003') {
        // Ctrl+C
        process.stderr.write('\n');
        process.exit(130);
      } else if (char === '\u007f' || char === '\b') {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    };

    process.stdin.on('data', onData);
  });
}

async function fetchSecrets(token, apiUrl) {
  const res = await fetch(`${apiUrl}/api/agent/secrets`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': `vaultagent-cli/${VERSION}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return data;
}

// ── Commands ─────────────────────────────────────────────────

async function cmdEnv(token, apiUrl) {
  process.stderr.write('[/] Fetching session secrets...\n');
  const data = await fetchSecrets(token, apiUrl);

  if (!data.secrets || data.secrets.length === 0) {
    process.stderr.write('[!] No secrets found for this session.\n');
    process.exit(1);
  }

  const expiresAt = new Date(data.session.expires_at);
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));
  process.stderr.write(`[/] Session: ${data.session.agent_name} (${remaining} min remaining)\n`);
  process.stderr.write(`[/] Decrypting ${data.secrets.length} secret(s)...\n`);

  const password = await promptPassword();

  for (const secret of data.secrets) {
    try {
      const value = await decryptSecret(
        secret.encrypted_value,
        secret.iv,
        secret.salt,
        password
      );
      // Output to stdout — clean for eval
      const escaped = value.replace(/'/g, "'\\''");
      process.stdout.write(`export ${secret.name}='${escaped}'\n`);
    } catch {
      process.stderr.write(`[!] Failed to decrypt ${secret.name} — wrong master password?\n`);
      process.exit(1);
    }
  }

  process.stderr.write('[/] Done. Secrets exported to stdout.\n');
}

async function cmdRun(token, apiUrl, command, args) {
  process.stderr.write('[/] Fetching session secrets...\n');
  const data = await fetchSecrets(token, apiUrl);

  if (!data.secrets || data.secrets.length === 0) {
    process.stderr.write('[!] No secrets found for this session.\n');
    process.exit(1);
  }

  const expiresAt = new Date(data.session.expires_at);
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));
  process.stderr.write(`[/] Session: ${data.session.agent_name} (${remaining} min remaining)\n`);
  process.stderr.write(`[/] Decrypting ${data.secrets.length} secret(s)...\n`);

  const password = await promptPassword();

  const env = { ...process.env };
  for (const secret of data.secrets) {
    try {
      env[secret.name] = await decryptSecret(
        secret.encrypted_value,
        secret.iv,
        secret.salt,
        password
      );
    } catch {
      process.stderr.write(`[!] Failed to decrypt ${secret.name} — wrong master password?\n`);
      process.exit(1);
    }
  }

  // Remove VAULTAGENT_PASSWORD from child env for security
  delete env.VAULTAGENT_PASSWORD;

  process.stderr.write(`[/] ${data.secrets.length} secret(s) injected. Launching: ${command}\n`);

  const child = spawn(command, args, {
    env,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    process.stderr.write(`[!] Failed to launch ${command}: ${err.message}\n`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

async function cmdStatus(token, apiUrl) {
  const data = await fetchSecrets(token, apiUrl);

  const expiresAt = new Date(data.session.expires_at);
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 60000));

  console.log('');
  console.log(`  Agent:     ${data.session.agent_name}`);
  console.log(`  Expires:   ${expiresAt.toISOString()}`);
  console.log(`  Remaining: ${remaining} minutes`);
  console.log(`  Secrets:   ${data.session.allowed_secrets.join(', ')}`);
  console.log(`  Status:    ${remaining > 0 ? 'ACTIVE' : 'EXPIRED'}`);
  console.log('');
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);

  // Parse --url flag
  let apiUrl = API_URL;
  const urlIdx = argv.indexOf('--url');
  if (urlIdx !== -1 && argv[urlIdx + 1]) {
    apiUrl = argv[urlIdx + 1];
    argv.splice(urlIdx, 2);
  }

  if (argv.includes('--help') || argv.length === 0) {
    printUsage();
    process.exit(0);
  }

  if (argv.includes('--version')) {
    console.log(`vaultagent v${VERSION}`);
    process.exit(0);
  }

  const command = argv[0];
  const token = argv[1];

  if (!token) {
    process.stderr.write('Error: Missing session token.\n');
    process.stderr.write('Usage: vaultagent <command> <token>\n');
    process.exit(1);
  }

  if (!token.startsWith('va_sess_')) {
    process.stderr.write('Error: Invalid token format (must start with va_sess_).\n');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'env':
        await cmdEnv(token, apiUrl);
        break;

      case 'run': {
        const dashIdx = argv.indexOf('--');
        if (dashIdx === -1 || dashIdx >= argv.length - 1) {
          process.stderr.write('Error: Missing command after --\n');
          process.stderr.write('Usage: vaultagent run <token> -- <command> [args...]\n');
          process.exit(1);
        }
        const runCmd = argv[dashIdx + 1];
        const runArgs = argv.slice(dashIdx + 2);
        await cmdRun(token, apiUrl, runCmd, runArgs);
        break;
      }

      case 'status':
        await cmdStatus(token, apiUrl);
        break;

      default:
        process.stderr.write(`Unknown command: ${command}\n`);
        printUsage();
        process.exit(1);
    }
  } catch (err) {
    process.stderr.write(`[!] ${err.message}\n`);
    process.exit(1);
  }
}

main();
