// ============================================================
// AutoHealX — Enhanced Main Agent Orchestrator
// Advanced monitoring, detection, and healing with permissions
// ============================================================

require('dotenv').config();
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const { collectMetrics } = require('./monitor');
const advancedDetector = require('./advancedDetector');
const intelligentEngine = require('./intelligentEngine');
const permissionSystem = require('./permissionSystem');
// const devicePairing = require('./devicePairing'); // Temporarily disabled
const { executeHeal, getActionForIssue } = require('./healer');
const { recordFix, getBestFix, getAllKnowledge, setUseLocalStorage } = require('./knowledgeBase');
const {
  initFirebase,
  writeMetrics,
  writeAlert,
  writeFixLog,
  writeAgentStatus,
  isUseLocalStorage
} = require('./firebase');

// ─── Configuration ──────────────────────────────────────────
const CONFIG = {
  intervalMs: 15000,        // Monitoring interval (15 seconds - professional timing)
  maxMetricsToKeep: 200,    // Firebase cleanup
  version: '2.0.0'          // Enhanced version
};

// ─── State ──────────────────────────────────────────────────
let isRunning = false;
let cycleCount = 0;
let waitingForPermissions = false;
let metricsHistory = []; // Store for trend analysis

// ─── Enhanced Banner ─────────────────────────────────────────────────
function printBanner() {
  console.log(chalk.cyan('\n╔══════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold.white('        AutoHealX Agent v' + CONFIG.version + '         ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.gray('  Advanced Self-Healing System Monitor    ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════════╝'));
  
  const status = permissionSystem.getStatus();
  console.log(chalk.yellow(`  Mode: ${status.mode?.toUpperCase() || 'UNKNOWN'}`));
  console.log(chalk.yellow(`  Monitoring: ${status.monitoring ? 'ENABLED' : 'DISABLED'}`));
  console.log(chalk.yellow(`  Interval: ${CONFIG.intervalMs / 1000}s`));
  console.log(chalk.green('  Starting...\n'));
  
  if (!status.monitoring) {
    console.log(chalk.red('⚠️  MONITORING DISABLED'));
    console.log(chalk.yellow('   Please enable monitoring in the dashboard:'));
    console.log(chalk.blue('   👉 http://localhost:3000\n'));
  }
}

// ─── Enhanced Core Monitoring Loop ────────────────────────────────────
async function monitoringCycle() {
  const cycleStartTime = Date.now();
  cycleCount++;

  console.log(chalk.blue(`🔄 Starting monitoring cycle ${cycleCount} at ${new Date().toLocaleTimeString()} (${new Date().toISOString()})`));
  console.log(chalk.gray(`⏰ Expected interval: ${CONFIG.intervalMs}ms (${CONFIG.intervalMs / 1000}s)`));

  try {
    // Check for kill requests from dashboard
    try {
      // First check for file-based kill request
      const killRequestPath = path.join(__dirname, '../config/killRequest.json');
      if (fs.existsSync(killRequestPath)) {
        const request = JSON.parse(fs.readFileSync(killRequestPath, 'utf8'));
        console.log(chalk.red(`🗑️ Kill request received for ${request.name} (PID: ${request.pid})`));
        
        // Execute kill request
        const result = await executeHeal('KILL_SPECIFIC_PROCESS', 'auto', {
          pid: request.pid,
          name: request.name
        });
        
        console.log(chalk[result.success ? 'green' : 'red'](
          `${result.success ? '✅' : '❌'} Kill result: ${result.message}`
        ));
        
        // Log the kill action
        await writeFixLog({
          issueType: 'USER_KILL_REQUEST',
          severity: 'info',
          action: 'KILL_SPECIFIC_PROCESS',
          mode: 'manual',
          success: result.success,
          message: result.message,
          processName: request.name,
          pid: request.pid,
          timestamp: new Date().toISOString()
        });
        
        // Remove the processed request
        fs.unlinkSync(killRequestPath);
      }
      
      // Also check localStorage-based kill requests (fallback)
      try {
        const stored = localStorage?.getItem ? localStorage.getItem('autohealx_killRequest') : null;
        if (stored) {
          const request = JSON.parse(stored);
          console.log(chalk.red(`🗑️ Kill request from localStorage for ${request.name} (PID: ${request.pid})`));
          
          // Execute kill request
          const result = await executeHeal('KILL_SPECIFIC_PROCESS', 'auto', {
            pid: request.pid,
            name: request.name
          });
          
          console.log(chalk[result.success ? 'green' : 'red'](
            `${result.success ? '✅' : '❌'} Kill result: ${result.message}`
          ));
          
          // Log the kill action
          await writeFixLog({
            issueType: 'USER_KILL_REQUEST_LOCALSTORAGE',
            severity: 'info',
            action: 'KILL_SPECIFIC_PROCESS',
            mode: 'manual',
            success: result.success,
            message: result.message,
            processName: request.name,
            pid: request.pid,
            timestamp: new Date().toISOString()
          });
          
          // Remove the processed request
          localStorage.removeItem('autohealx_killRequest');
        }
      } catch (localStorageError) {
        // localStorage not available in Node.js, ignore
      }
    } catch (error) {
      // Silently handle file system errors
      if (!error.message.includes('ENOENT')) {
        console.warn('Kill request check failed:', error.message);
      }
    }

    // Check for config updates from dashboard every cycle for real-time response
    const configUpdated = permissionSystem.checkForConfigUpdates();
    if (configUpdated) {
      console.log(chalk.green('✅ Configuration updated from dashboard'));
    }

    // Check device pairing status
    // if (!devicePairing.isRegistered) {
    //   devicePairing.checkPairingStatus();
    // }

    // Always update agent status every cycle for real-time updates
    const agentStatus = permissionSystem.getStatus();
    await writeAgentStatus({
      status: 'online',
      mode: agentStatus.mode,
      monitoring: agentStatus.monitoring,
      version: CONFIG.version,
      cycleCount,
      deviceId: 'demo-device-123',
      hostname: require('os').hostname(),
      platform: process.platform,
      isRegistered: true,
      timestamp: Date.now(),
      lastMetrics: null
    });

    // Check if monitoring is enabled
    if (!permissionSystem.isMonitoringEnabled()) {
      if (cycleCount % 4 === 0) { // Print reminder every minute (4 cycles × 15 seconds)
        console.log(chalk.yellow('⏸️  Monitoring paused - waiting for user permission'));
        console.log(chalk.blue('   Enable at: http://localhost:3000'));
      }
      return;
    }

    // Step 1: Collect metrics
    const metrics = await collectMetrics();
    if (!metrics) return;

    // Prepare enhanced metrics for detection
    const enhancedMetrics = {
      cpu: metrics.cpu.usage,
      memory: metrics.memory.usedPercent,
      processCount: metrics.processes.total,
      topCPUProcess: metrics.processes.topCPU[0],
      topMemoryProcess: metrics.processes.topMemory?.[0] || metrics.processes.topCPU[0],
      timestamp: metrics.timestamp
    };

    // Step 2: Log to console (enhanced) - every cycle since we're now at 15 seconds
    const mode = permissionSystem.getMode();
    console.log(chalk.gray(`[${new Date().toLocaleTimeString()}]`) +
      chalk.blue(` CPU: ${enhancedMetrics.cpu}%`) +
      chalk.magenta(` MEM: ${enhancedMetrics.memory}%`) +
      chalk.gray(` Procs: ${enhancedMetrics.processCount}`) +
      chalk.cyan(` Mode: ${mode?.toUpperCase() || 'UNKNOWN'}`));

    // Step 3: Store metrics in Firebase/localStorage with accurate data
    await writeMetrics({
      cpu: enhancedMetrics.cpu,
      memory: enhancedMetrics.memory,
      memoryUsedMB: metrics.memory.used,
      memoryTotalMB: metrics.memory.total,
      processCount: enhancedMetrics.processCount,
      topProcesses: metrics.processes.topCPU.slice(0, 10), // Top 10 for dashboard
      allProcesses: metrics.processes.all, // All processes for detailed view
      // Include hardware data for WiFi and GPU graphs
      gpu: metrics.gpu,
      network: metrics.network,
      disks: metrics.disks,
      hardware: metrics.hardware,
      platform: metrics.system.platform,
      hostname: metrics.system.hostname,
      timestamp: metrics.timestamp
    });

    // Step 4: 🧠 INTELLIGENT ANALYSIS (This is what makes us ADVANCED)
    console.log(chalk.blue('🧠 ACTIVATING INTELLIGENT ENGINE...'));
    const intelligentAnalysis = await intelligentEngine.analyzeAndDecide(enhancedMetrics, metricsHistory);
    
    // Extract decisions array from the analysis
    const intelligentDecisions = intelligentAnalysis?.decisions || [];
    
    // Store metrics for trend analysis
    metricsHistory.push(enhancedMetrics);
    if (metricsHistory.length > 20) {
      metricsHistory = metricsHistory.slice(-20); // Keep last 20 for trends
    }

    // Step 5: Process intelligent decisions (AUTONOMOUS SYSTEM)
    for (const decision of intelligentDecisions) {
      console.log(chalk[decision.severity === 'critical' ? 'red' : 'yellow'](
        `\n🚨 [${decision.severity?.toUpperCase() || 'UNKNOWN'}] ${decision.type}`
      ));
      console.log(chalk.gray(`   📋 Explanation: ${decision.explanation}`));
      console.log(chalk.gray(`   🎯 Expected Result: ${decision.expectedResult}`));
      console.log(chalk.gray(`   📊 Success Rate: ${decision.successRate}%`));
      console.log(chalk.gray(`   ⚠️  Risk: ${decision.riskAssessment.level}`));

      // Step 5a: Write intelligent alert to Firebase/localStorage
      await writeAlert({
        type: decision.type,
        severity: decision.severity,
        message: decision.explanation,
        value: decision.currentValue,
        threshold: decision.threshold,
        confidence: decision.confidence,
        suggestedAction: decision.suggestedAction,
        expectedResult: decision.expectedResult,
        successRate: decision.successRate,
        riskLevel: decision.riskAssessment.level,
        process: decision.process,
        timestamp: new Date().toISOString()
      });

      // Step 5b: Request permission for intelligent action (non-blocking)
      console.log(chalk.blue(`🔐 Requesting permission for: ${decision.suggestedAction}`));
      
      // Don't await - let it run in background while monitoring continues
      permissionSystem.requestPermission(decision).then(async (permission) => {
        if (permission.approved) {
          // Step 5c: Execute intelligent healing action
          const action = getActionForIssue(decision.type);
          const result = await executeHeal(action, permission.mode || 'manual');

          console.log(chalk[result.success ? 'green' : 'red'](
            `✅ [INTELLIGENT HEAL] ${result.message}`
          ));

          // Step 5d: Update learning system
          intelligentEngine.learningData.get(decision.type).attempts++;
          if (result.success) {
            intelligentEngine.learningData.get(decision.type).successes++;
          }

          // Step 5e: Write intelligent fix log
          await writeFixLog({
            issueType: decision.type,
            severity: decision.severity,
            action,
            mode: permission.mode || 'manual',
            success: result.success,
            skipped: result.skipped || false,
            message: result.message,
            explanation: decision.explanation,
            expectedResult: decision.expectedResult,
            actualResult: result.message,
            confidence: decision.confidence,
            successRate: decision.successRate,
            processName: result.processName || decision.process,
            approvalReason: permission.reason,
            timestamp: new Date().toISOString()
          });

          // Step 5f: Update knowledge base with intelligent data
          if (!result.skipped) {
            await recordFix(decision.type, action, result.success);
          }
        } else {
          console.log(chalk.red(`❌ Intelligent action rejected: ${permission.reason}`));
          
          // Log rejected intelligent action
          await writeFixLog({
            issueType: decision.type,
            severity: decision.severity,
            action: 'rejected',
            mode: 'manual',
            success: false,
            skipped: true,
            message: `Intelligent action rejected by user: ${permission.reason}`,
            explanation: decision.explanation,
            confidence: decision.confidence,
            timestamp: new Date().toISOString()
          });
        }
      }).catch(error => {
        console.error(chalk.red(`❌ Intelligent permission request failed: ${error.message}`));
      });
    }

    // Step 6: Update agent heartbeat with real-time config
    const currentStatus = permissionSystem.getStatus();
    await writeAgentStatus({
      status: 'online',
      mode: currentStatus.mode,
      monitoring: currentStatus.monitoring,
      version: CONFIG.version,
      cycleCount,
      deviceId: 'demo-device-123',
      hostname: require('os').hostname(),
      platform: process.platform,
      isRegistered: true,
      lastMetrics: {
        cpu: enhancedMetrics.cpu,
        memory: enhancedMetrics.memory,
        processCount: enhancedMetrics.processCount,
        topProcess: enhancedMetrics.topCPUProcess?.name || 'Unknown'
      },
      timestamp: Date.now()
    });

  } catch (err) {
    console.error(chalk.red('[ERROR] Monitoring cycle failed:'), err.message);
  }

  const cycleEndTime = Date.now();
  const cycleDuration = cycleEndTime - cycleStartTime;
  console.log(chalk.gray(`⏱️  Cycle ${cycleCount} completed in ${cycleDuration}ms. Next cycle in ${CONFIG.intervalMs}ms.`));
}

// ─── Enhanced Start Agent ─────────────────────────────────────────────
async function startAgent() {
  printBanner();

  // Initialize Firebase
  initFirebase();
  
  // Sync localStorage state with knowledgeBase module
  setUseLocalStorage(isUseLocalStorage());

  // Initialize device pairing system
  // if (!devicePairing.isRegistered) {
  //   await devicePairing.startPairing();
  // }

  // Check for existing configuration
  const initialStatus = permissionSystem.getStatus();
  
  // Mark agent online immediately
  await writeAgentStatus({
    status: 'online',
    mode: initialStatus.mode,
    monitoring: initialStatus.monitoring,
    version: CONFIG.version,
    startedAt: new Date().toISOString(),
    timestamp: Date.now()
  });

  isRunning = true;

  // Start loop with proper 15-second intervals
  console.log(chalk.green('✅ AutoHealX Enhanced Agent is running. Press Ctrl+C to stop.\n'));
  
  if (initialStatus.monitoring) {
    console.log(chalk.green('🔍 System monitoring is ACTIVE'));
  } else {
    console.log(chalk.yellow('⏸️  System monitoring is PAUSED'));
    console.log(chalk.blue('   👉 Enable monitoring at: http://localhost:3000\n'));
  }
  
  // Start with proper 15-second intervals (no immediate first cycle)
  console.log(chalk.blue(`⏰ First monitoring cycle will start in ${CONFIG.intervalMs / 1000} seconds...`));
  
  // Clear any existing intervals to prevent multiple timers
  if (global.autohealxInterval) {
    clearInterval(global.autohealxInterval);
  }
  
  global.autohealxInterval = setInterval(monitoringCycle, CONFIG.intervalMs);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\n[AutoHealX] Shutting down gracefully...'));
    if (global.autohealxInterval) {
      clearInterval(global.autohealxInterval);
    }
    await writeAgentStatus({ 
      status: 'offline',
      stoppedAt: new Date().toISOString(),
      timestamp: Date.now()
    });
    console.log(chalk.green('[AutoHealX] Enhanced Agent stopped. Goodbye!'));
    process.exit(0);
  });
}

// ─── Entry Point ─────────────────────────────────────────────
startAgent().catch(err => {
  console.error(chalk.red('Fatal error starting agent:'), err);
  process.exit(1);
});
