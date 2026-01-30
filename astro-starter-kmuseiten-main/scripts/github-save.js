#!/usr/bin/env node
/**
 * GitHub Save Script
 * ═══════════════════════════════════════════════════════════════
 * Simple one-command save to GitHub.
 * Stages all changes, commits with message, and pushes.
 * 
 * Usage: 
 *   pnpm github:save                    # Auto-generated message
 *   pnpm github:save --message "msg"    # Custom message
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(cmd, options = {}) {
  try {
    return execSync(cmd, { 
      cwd: ROOT_DIR, 
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

function getCommitMessage() {
  // Check for --message flag
  const args = process.argv.slice(2);
  const messageIndex = args.findIndex(arg => arg === '--message' || arg === '-m');
  
  if (messageIndex !== -1 && args[messageIndex + 1]) {
    return args[messageIndex + 1];
  }

  // Generate automatic message with timestamp
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace('T', ' ');
  
  // Get changed files summary
  const status = exec('git status --porcelain', { silent: true }) || '';
  const lines = status.trim().split('\n').filter(Boolean);
  
  if (lines.length === 0) {
    return null; // Nothing to commit
  }

  const added = lines.filter(l => l.startsWith('A') || l.startsWith('?')).length;
  const modified = lines.filter(l => l.startsWith('M') || l.startsWith(' M')).length;
  const deleted = lines.filter(l => l.startsWith('D') || l.startsWith(' D')).length;

  const parts = [];
  if (added) parts.push(`+${added}`);
  if (modified) parts.push(`~${modified}`);
  if (deleted) parts.push(`-${deleted}`);

  return `💾 Save: ${parts.join(' ')} files [${timestamp}]`;
}

async function main() {
  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log('  GitHub Save - Agency Astro Starter', 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  // Check for uncommitted changes
  const status = exec('git status --porcelain', { silent: true }) || '';
  
  if (!status.trim()) {
    log('✅ No changes to save - working tree clean.\n', 'green');
    return;
  }

  // Show what will be committed
  log('📋 Changes to save:', 'yellow');
  log(status, 'dim');

  // Get commit message
  const message = getCommitMessage();
  
  if (!message) {
    log('✅ Nothing to commit.\n', 'green');
    return;
  }

  // Stage all changes
  log('\n📦 Staging all changes...', 'yellow');
  exec('git add -A');

  // Commit
  log(`\n💬 Committing: "${message}"`, 'yellow');
  exec(`git commit -m "${message}"`);

  // Push
  log('\n🚀 Pushing to GitHub...', 'yellow');
  try {
    exec('git push');
    log('\n✅ Successfully saved to GitHub!\n', 'green');
  } catch (error) {
    // Try setting upstream if first push
    try {
      exec('git push -u origin main');
      log('\n✅ Successfully saved to GitHub!\n', 'green');
    } catch (pushError) {
      log('\n⚠️  Push failed. Try running: pnpm github:setup\n', 'yellow');
      process.exit(1);
    }
  }

  // Show current status
  const branch = exec('git branch --show-current', { silent: true })?.trim();
  const remote = exec('git remote get-url origin', { silent: true })?.trim()?.replace(/https:\/\/[^@]+@/, 'https://');
  
  log('═══════════════════════════════════════════════════════════════', 'cyan');
  log(`  Branch: ${branch}`, 'dim');
  if (remote) log(`  Remote: ${remote}`, 'dim');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});


