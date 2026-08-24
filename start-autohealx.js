// ============================================================
// AutoHealX — Combined Startup Script
// Starts both agent and dashboard together
// ============================================================

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk').default || require('chalk');

console.log(chalk.cyan('\n╔══════════════════════════════════════════╗'));
console.log(chalk.cyan('║') + chalk.bold.white('        AutoHealX System Launcher        ') + chalk.cyan('║'));
console.log(chalk.cyan('║') + chalk.gray('  Starting Agent + Dashboard Together     ') + chalk.cyan('║'));
console.log(chalk.cyan('╚══════════════════════════════════════════╝\n'));

let agentProcess = null;
let dashboardProcess = null;

// Start the agent
function startAgent() {
  console.log(chalk.blue('🤖 Starting AutoHealX Agent...'));
  
  agentProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'agent'),
    stdio: 'pipe'
  });

  agentProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(chalk.green('[AGENT]'), output);
    }
  });

  agentProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('DeprecationWarning')) {
      console.log(chalk.red('[AGENT ERROR]'), output);
    }
  });

  agentProcess.on('close', (code) => {
    console.log(chalk.yellow(`[AGENT] Process exited with code ${code}`));
    if (code !== 0 && code !== null) {
      console.log(chalk.red('Agent crashed, restarting in 5 seconds...'));
      setTimeout(startAgent, 5000);
    }
  });
}

// Start the dashboard
function startDashboard() {
  console.log(chalk.blue('🌐 Starting AutoHealX Dashboard...'));
  
  dashboardProcess = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'dashboard'),
    stdio: 'pipe',
    shell: true
  });

  dashboardProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('DeprecationWarning')) {
      console.log(chalk.magenta('[DASHBOARD]'), output);
    }
  });

  dashboardProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('DeprecationWarning') && !output.includes('webpack')) {
      console.log(chalk.red('[DASHBOARD ERROR]'), output);
    }
  });

  dashboardProcess.on('close', (code) => {
    console.log(chalk.yellow(`[DASHBOARD] Process exited with code ${code}`));
  });
}

// Graceful shutdown
function shutdown() {
  console.log(chalk.yellow('\n🛑 Shutting down AutoHealX System...'));
  
  if (agentProcess) {
    agentProcess.kill('SIGTERM');
  }
  
  if (dashboardProcess) {
    dashboardProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    console.log(chalk.green('✅ AutoHealX System stopped. Goodbye!'));
    process.exit(0);
  }, 2000);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start both services
console.log(chalk.green('🚀 Launching AutoHealX System...\n'));

startAgent();
setTimeout(() => {
  startDashboard();
}, 2000); // Start dashboard 2 seconds after agent

console.log(chalk.yellow('\n📝 Instructions:'));
console.log(chalk.white('  • Agent will start monitoring your system'));
console.log(chalk.white('  • Dashboard will be available at: http://localhost:3000'));
console.log(chalk.white('  • Press Ctrl+C to stop both services'));
console.log(chalk.gray('\n  Waiting for services to start...\n'));