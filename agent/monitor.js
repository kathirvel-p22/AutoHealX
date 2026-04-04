// ============================================================
// AutoHealX — Windows-Accurate Monitor Module
// Uses Windows APIs and commands to match Task Manager exactly
// ============================================================

const { exec, execSync } = require('child_process');
const os = require('os');
const si = require('systeminformation');

/**
 * Get CPU usage exactly like Task Manager using Windows Performance Counters
 */
async function getWindowsCPU() {
  return new Promise((resolve) => {
    try {
      // Use Windows Performance Counter for exact CPU measurement
      const cmd = 'wmic cpu get loadpercentage /value';
      exec(cmd, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          console.warn('Windows CPU fallback to systeminformation');
          si.currentLoad().then(load => resolve(Math.round(load.currentLoad * 100) / 100));
          return;
        }
        
        const match = stdout.match(/LoadPercentage=(\d+)/);
        if (match) {
          resolve(parseInt(match[1]));
        } else {
          si.currentLoad().then(load => resolve(Math.round(load.currentLoad * 100) / 100));
        }
      });
    } catch (error) {
      si.currentLoad().then(load => resolve(Math.round(load.currentLoad * 100) / 100));
    }
  });
}

/**
 * Get Memory usage exactly like Task Manager
 */
async function getWindowsMemory() {
  return new Promise((resolve) => {
    try {
      // Use Windows commands to get exact memory like Task Manager
      const cmd = 'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value';
      exec(cmd, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          console.warn('Windows Memory fallback to systeminformation');
          si.mem().then(mem => {
            const totalGB = Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10;
            const usedGB = Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10;
            const usedPercent = Math.round((mem.used / mem.total) * 100 * 10) / 10;
            resolve({
              usedPercent,
              usedGB,
              totalGB,
              usedMB: Math.round(mem.used / 1024 / 1024),
              totalMB: Math.round(mem.total / 1024 / 1024)
            });
          });
          return;
        }

        const totalMatch = stdout.match(/TotalVisibleMemorySize=(\d+)/);
        const freeMatch = stdout.match(/FreePhysicalMemory=(\d+)/);
        
        if (totalMatch && freeMatch) {
          const totalKB = parseInt(totalMatch[1]);
          const freeKB = parseInt(freeMatch[1]);
          const usedKB = totalKB - freeKB;
          
          const totalGB = Math.round(totalKB / 1024 / 1024 * 10) / 10;
          const usedGB = Math.round(usedKB / 1024 / 1024 * 10) / 10;
          const usedPercent = Math.round((usedKB / totalKB) * 100 * 10) / 10;
          
          resolve({
            usedPercent,
            usedGB,
            totalGB,
            usedMB: Math.round(usedKB / 1024),
            totalMB: Math.round(totalKB / 1024)
          });
        } else {
          // Fallback
          si.mem().then(mem => {
            const totalGB = Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10;
            const usedGB = Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10;
            const usedPercent = Math.round((mem.used / mem.total) * 100 * 10) / 10;
            resolve({
              usedPercent,
              usedGB,
              totalGB,
              usedMB: Math.round(mem.used / 1024 / 1024),
              totalMB: Math.round(mem.total / 1024 / 1024)
            });
          });
        }
      });
    } catch (error) {
      si.mem().then(mem => {
        const totalGB = Math.round(mem.total / 1024 / 1024 / 1024 * 10) / 10;
        const usedGB = Math.round(mem.used / 1024 / 1024 / 1024 * 10) / 10;
        const usedPercent = Math.round((mem.used / mem.total) * 100 * 10) / 10;
        resolve({
          usedPercent,
          usedGB,
          totalGB,
          usedMB: Math.round(mem.used / 1024 / 1024),
          totalMB: Math.round(mem.total / 1024 / 1024)
        });
      });
    }
  });
}

/**
 * Get Process count exactly like Task Manager
 */
async function getWindowsProcesses() {
  return new Promise((resolve) => {
    try {
      // Use tasklist command to get exact process count like Task Manager
      const cmd = 'tasklist /fo csv | find /c /v ""';
      exec(cmd, { timeout: 10000 }, (error, stdout) => {
        if (error) {
          console.warn('Windows Process count fallback to systeminformation');
          si.processes().then(procs => {
            resolve({
              count: procs.all || 0,
              processes: procs.list || []
            });
          });
          return;
        }
        
        const processCount = parseInt(stdout.trim()) - 1; // Subtract header line
        
        // Now get detailed process information
        const detailCmd = 'wmic process get Name,ProcessId,PageFileUsage,WorkingSetSize /format:csv';
        exec(detailCmd, { timeout: 15000 }, (detailError, detailStdout) => {
          if (detailError) {
            si.processes().then(procs => {
              resolve({
                count: processCount,
                processes: procs.list || []
              });
            });
            return;
          }
          
          // Parse CSV output
          const lines = detailStdout.split('\n').filter(line => line.trim() && !line.startsWith('Node'));
          const processes = [];
          
          for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 4) {
              const name = parts[1]?.trim();
              const pid = parseInt(parts[3]?.trim());
              const workingSet = parseInt(parts[4]?.trim()) || 0;
              
              if (name && pid && name !== 'Name') {
                processes.push({
                  name,
                  pid,
                  cpu: 0, // Will be filled by systeminformation
                  memory: 0,
                  memoryMB: Math.round(workingSet / 1024 / 1024),
                  status: 'running'
                });
              }
            }
          }
          
          resolve({
            count: processCount,
            processes: processes.slice(0, 100) // Limit for performance
          });
        });
      });
    } catch (error) {
      si.processes().then(procs => {
        resolve({
          count: procs.all || 0,
          processes: procs.list || []
        });
      });
    }
  });
}

/**
 * Enhance processes with CPU usage from systeminformation
 */
async function enhanceProcessesWithCPU(windowsProcesses) {
  try {
    const siProcesses = await si.processes();
    const siMap = new Map();
    
    // Create a map of PID to CPU usage
    siProcesses.list.forEach(proc => {
      if (proc.pid) {
        siMap.set(proc.pid, {
          cpu: proc.cpu || 0,
          memory: proc.memPercent || 0
        });
      }
    });
    
    // Enhance Windows processes with CPU data
    const enhancedProcesses = windowsProcesses.map(proc => {
      const siData = siMap.get(proc.pid);
      return {
        ...proc,
        cpu: siData ? Math.round(siData.cpu * 100) / 100 : 0,
        memory: siData ? Math.round(siData.memory * 100) / 100 : 0
      };
    });
    
    // Sort by CPU usage
    return enhancedProcesses.sort((a, b) => b.cpu - a.cpu);
  } catch (error) {
    return windowsProcesses;
  }
}

/**
 * Collect system metrics with Windows accuracy
 */
async function collectMetrics() {
  try {
    console.log('📊 Collecting Windows-accurate metrics...');
    
    const startTime = Date.now();
    
    // Get all metrics in parallel for speed
    const [cpuUsage, memoryInfo, processInfo] = await Promise.all([
      getWindowsCPU(),
      getWindowsMemory(),
      getWindowsProcesses()
    ]);
    
    // Enhance processes with CPU usage
    const enhancedProcesses = await enhanceProcessesWithCPU(processInfo.processes);
    
    const metrics = {
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown'
      },
      memory: {
        usedPercent: memoryInfo.usedPercent,
        usedGB: memoryInfo.usedGB,
        totalGB: memoryInfo.totalGB,
        used: memoryInfo.usedMB,
        total: memoryInfo.totalMB
      },
      processes: {
        total: processInfo.count,
        running: enhancedProcesses.filter(p => p.status === 'running').length,
        topCPU: enhancedProcesses.slice(0, 20),
        topMemory: [...enhancedProcesses].sort((a, b) => b.memory - a.memory).slice(0, 20),
        all: enhancedProcesses
      },
      system: {
        platform: process.platform,
        hostname: os.hostname(),
        uptime: Math.round(os.uptime())
      },
      timestamp: Date.now(),
      collectionTime: Date.now() - startTime
    };

    // Log comparison for debugging
    console.log(`📊 Windows Metrics: CPU: ${cpuUsage}%, Memory: ${memoryInfo.usedGB}GB/${memoryInfo.totalGB}GB (${memoryInfo.usedPercent}%), Processes: ${processInfo.count}`);
    console.log(`⏱️  Collection time: ${metrics.collectionTime}ms`);
    
    return metrics;
  } catch (err) {
    console.error('[Monitor] Error collecting Windows metrics:', err.message);
    return null;
  }
}

/**
 * Get highest CPU consuming process
 */
async function getTopCPUProcess() {
  try {
    const processInfo = await getWindowsProcesses();
    const enhancedProcesses = await enhanceProcessesWithCPU(processInfo.processes);
    return enhancedProcesses[0] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get highest memory consuming process
 */
async function getTopMemoryProcess() {
  try {
    const processInfo = await getWindowsProcesses();
    const enhancedProcesses = await enhanceProcessesWithCPU(processInfo.processes);
    const sortedByMemory = enhancedProcesses.sort((a, b) => b.memory - a.memory);
    return sortedByMemory[0] || null;
  } catch (error) {
    return null;
  }
}

module.exports = { collectMetrics, getTopCPUProcess, getTopMemoryProcess };
