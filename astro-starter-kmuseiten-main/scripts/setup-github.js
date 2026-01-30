#!/usr/bin/env node
/**
 * GitHub Setup Script
 * ═══════════════════════════════════════════════════════════════
 * One-time setup for GitHub integration.
 * Creates a new repo, sets up remote, and makes initial commit.
 * 
 * Usage: pnpm github:setup
 */

import { execSync } from 'child_process';
import fs from 'fs';
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

function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
  
  return env;
}

function saveEnv(env) {
  const envPath = path.join(ROOT_DIR, '.env');
  let content = '';
  
  // Read existing .env to preserve comments and structure
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Update or add each key
  Object.entries(env).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  });
  
  fs.writeFileSync(envPath, content.trim() + '\n');
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

async function main() {
  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log('  GitHub Setup - Agency Astro Starter', 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  // Load stack config
  const stackConfigPath = path.join(ROOT_DIR, 'stack.config.js');
  const stackConfig = (await import(stackConfigPath)).default;

  // Load environment variables
  const env = loadEnv();

  // Check for GitHub token
  let token = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  let username = env.GITHUB_USERNAME || process.env.GITHUB_USERNAME;
  let repoName = env.GITHUB_REPO_NAME || stackConfig.github.repoName || stackConfig.project.name;

  if (!token) {
    log('⚠️  No GitHub token found!', 'yellow');
    log('\nTo set up GitHub integration:', 'dim');
    log('1. Go to https://github.com/settings/tokens', 'dim');
    log('2. Create a new token (classic) with "repo" scope', 'dim');
    log('3. Add to your .env file: GITHUB_TOKEN=your_token_here', 'dim');
    log('4. Also add: GITHUB_USERNAME=your_username', 'dim');
    log('\nThen run this script again.\n', 'dim');
    process.exit(1);
  }

  if (!username) {
    log('⚠️  No GitHub username found!', 'yellow');
    log('Add GITHUB_USERNAME to your .env file and run again.\n', 'dim');
    process.exit(1);
  }

  log(`📦 Repository: ${username}/${repoName}`, 'green');
  log(`👤 Username: ${username}`, 'green');

  // Check if git is initialized
  const gitDir = path.join(ROOT_DIR, '.git');
  if (!fs.existsSync(gitDir)) {
    log('\n🔧 Initializing git repository...', 'yellow');
    exec('git init');
    exec('git branch -M main');
  }

  // Check if remote exists
  const remotes = exec('git remote -v', { silent: true }) || '';
  const repoUrl = `https://${token}@github.com/${username}/${repoName}.git`;
  const publicUrl = `https://github.com/${username}/${repoName}`;

  if (!remotes.includes('origin')) {
    log('\n🌐 Creating GitHub repository...', 'yellow');
    
    // Create repo via GitHub API
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: stackConfig.project.description,
          private: stackConfig.github.isPrivate !== false,
          auto_init: false,
        }),
      });

      if (response.status === 201) {
        log('✅ Repository created successfully!', 'green');
      } else if (response.status === 422) {
        log('ℹ️  Repository already exists on GitHub', 'yellow');
      } else {
        const error = await response.json();
        log(`⚠️  API Response: ${error.message}`, 'yellow');
      }
    } catch (error) {
      log(`⚠️  Could not create repo via API: ${error.message}`, 'yellow');
      log('You may need to create the repository manually on GitHub.', 'dim');
    }

    // Add remote
    log('\n🔗 Adding remote origin...', 'yellow');
    exec(`git remote add origin ${repoUrl}`, { ignoreError: true });
  } else {
    log('\nℹ️  Remote origin already configured', 'yellow');
  }

  // Update .env with repo name
  saveEnv({ GITHUB_REPO_NAME: repoName });

  // Update stack.config.js
  const stackConfigContent = fs.readFileSync(stackConfigPath, 'utf-8');
  const updatedConfig = stackConfigContent
    .replace(/username: ['"].*['"]/, `username: '${username}'`)
    .replace(/repoName: ['"].*['"]/, `repoName: '${repoName}'`);
  fs.writeFileSync(stackConfigPath, updatedConfig);

  // Make initial commit if needed
  const status = exec('git status --porcelain', { silent: true }) || '';
  if (status.trim()) {
    log('\n📝 Creating initial commit...', 'yellow');
    exec('git add -A');
    exec('git commit -m "🎉 Initial commit - Agency Astro Starter"');
  }

  // Push to GitHub
  log('\n🚀 Pushing to GitHub...', 'yellow');
  try {
    exec('git push -u origin main');
    log('\n✅ Successfully pushed to GitHub!', 'green');
    log(`\n🔗 Repository URL: ${publicUrl}\n`, 'cyan');
  } catch (error) {
    log('\n⚠️  Push failed. You may need to push manually:', 'yellow');
    log(`   git push -u origin main\n`, 'dim');
  }

  log('═══════════════════════════════════════════════════════════════', 'cyan');
  log('  Setup complete! Use "pnpm github:save" to save changes.', 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});


