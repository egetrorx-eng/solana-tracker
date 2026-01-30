#!/usr/bin/env node
/**
 * Module Toggle Script
 * ═══════════════════════════════════════════════════════════════
 * Enable or disable stack modules.
 * 
 * Usage: 
 *   pnpm module:toggle sanity enable
 *   pnpm module:toggle supabase disable
 */

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

const MODULE_PATHS = {
  sanity: 'sanity',
  supabase: 'supabase',
};

const LIB_FILES = {
  sanity: 'src/lib/sanity.ts',
  supabase: 'src/lib/supabase.ts',
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('\n═══════════════════════════════════════════════════════════════', 'cyan');
    log('  Module Toggle - Agency Astro Starter', 'cyan');
    log('═══════════════════════════════════════════════════════════════\n', 'cyan');
    log('Usage: pnpm module:toggle <module> <enable|disable>', 'yellow');
    log('\nModules: sanity, supabase', 'dim');
    log('\nExamples:', 'dim');
    log('  pnpm module:toggle sanity enable', 'dim');
    log('  pnpm module:toggle supabase disable\n', 'dim');
    process.exit(0);
  }

  const [moduleName, action] = args;
  
  if (!['sanity', 'supabase'].includes(moduleName)) {
    log(`\n❌ Unknown module: ${moduleName}`, 'red');
    log('Available modules: sanity, supabase\n', 'dim');
    process.exit(1);
  }

  if (!['enable', 'disable'].includes(action)) {
    log(`\n❌ Unknown action: ${action}`, 'red');
    log('Use: enable or disable\n', 'dim');
    process.exit(1);
  }

  const enable = action === 'enable';

  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log(`  ${enable ? '✅ Enabling' : '❌ Disabling'} ${moduleName}`, 'cyan');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');

  // Update stack.config.js
  const stackConfigPath = path.join(ROOT_DIR, 'stack.config.js');
  let configContent = fs.readFileSync(stackConfigPath, 'utf-8');
  
  const regex = new RegExp(`(${moduleName}:\\s*)(true|false)`);
  configContent = configContent.replace(regex, `$1${enable}`);
  
  // Update tier if needed
  if (moduleName === 'supabase' && enable) {
    configContent = configContent.replace(/tier:\s*['"](\w+)['"]/, "tier: 'fullstack'");
    log('  ℹ️  Upgraded tier to fullstack', 'yellow');
  }
  
  if (moduleName === 'sanity' && enable) {
    const currentTier = configContent.match(/tier:\s*['"](\w+)['"]/)?.[1];
    if (currentTier === 'basic') {
      configContent = configContent.replace(/tier:\s*['"]basic['"]/, "tier: 'cms'");
      log('  ℹ️  Upgraded tier to cms', 'yellow');
    }
  }

  fs.writeFileSync(stackConfigPath, configContent);
  log(`  ✅ Updated stack.config.js`, 'green');

  // Handle module folder
  const modulePath = path.join(ROOT_DIR, MODULE_PATHS[moduleName]);
  
  if (enable) {
    if (!fs.existsSync(modulePath)) {
      log(`  ⚠️  Module folder not found: ${MODULE_PATHS[moduleName]}/`, 'yellow');
      log(`     You may need to restore it from the starter template.`, 'dim');
    } else {
      log(`  ✅ Module folder exists: ${MODULE_PATHS[moduleName]}/`, 'green');
    }
  } else {
    if (fs.existsSync(modulePath)) {
      log(`  🗑️  Note: ${MODULE_PATHS[moduleName]}/ folder still exists`, 'yellow');
      log(`     Delete manually if not needed: rm -rf ${MODULE_PATHS[moduleName]}`, 'dim');
    }
  }

  // Handle lib file
  const libFile = path.join(ROOT_DIR, LIB_FILES[moduleName]);
  if (enable && !fs.existsSync(libFile)) {
    log(`  ⚠️  Lib file not found: ${LIB_FILES[moduleName]}`, 'yellow');
    log(`     You may need to restore it from the starter template.`, 'dim');
  }

  log('\n═══════════════════════════════════════════════════════════════', 'cyan');
  log(`  ${moduleName} is now ${enable ? 'ENABLED' : 'DISABLED'}`, enable ? 'green' : 'yellow');
  log('═══════════════════════════════════════════════════════════════\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}\n`, 'red');
  process.exit(1);
});


