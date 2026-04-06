import { useEffect, useRef, useState } from 'react';
import { Metric, Alert, Command, Process } from '../types';

export function useSimulationAgent(deviceId: string | null, userId: string) {
  const [cpuLoad, setCpuLoad] = useState(25);
  const [memLoad, setMemLoad] = useState(40);
  const [diskLoad, setDiskLoad] = useState(15);
  const [netLoad, setNetLoad] = useState(5);
  const [gpuLoad, setGpuLoad] = useState(10);
  const [wifiLoad, setWifiLoad] = useState(85);
  const [isSimulating, setIsSimulating] = useState(true);
  const [trendCounter, setTrendCounter] = useState(0);
  const [processes, setProcesses] = useState<Process[]>([
    { name: 'chrome.exe', pid: 12452, cpu: 12.4, mem: '1.2 GB', status: 'Running' },
    { name: 'code.exe', pid: 8944, cpu: 8.1, mem: '840 MB', status: 'Running' },
    { name: 'slack.exe', pid: 4521, cpu: 2.3, mem: '420 MB', status: 'Running' },
    { name: 'spotify.exe', pid: 1022, cpu: 1.5, mem: '180 MB', status: 'Running' },
    { name: 'system_idle', pid: 0, cpu: 75.7, mem: '16 KB', status: 'Running' },
  ]);
  const [isHighCpuForced, setIsHighCpuForced] = useState(false);
  const [autoKillEnabled, setAutoKillEnabled] = useState(true);
  const [lastAutoKillTime, setLastAutoKillTime] = useState(0);
  const [intelligentMode, setIntelligentMode] = useState(true);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [systemHealthScore, setSystemHealthScore] = useState(85);
  const [trendData, setTrendData] = useState<{cpu: number[], memory: number[], timestamp: string[]}>(
    {cpu: [], memory: [], timestamp: []}
  );
  const [confidenceScores, setConfidenceScores] = useState<{[key: string]: number}>({
    'KILL_PROCESS': 92,
    'RESTART_SERVICE': 88,
    'CLEAR_CACHE': 85,
    'MEMORY_OPTIMIZE': 90
  });
  const [decisionExplanations, setDecisionExplanations] = useState<string[]>([]);

  const intervalRef = useRef<any>(null);
  const processesRef = useRef<Process[]>(processes);

  // Update processes ref when processes change
  useEffect(() => {
    processesRef.current = processes;
  }, [processes]);

  // 🏆 TREND ANALYSIS ENGINE - Predicts future issues
  const analyzeTrends = (newCpu: number, newMemory: number) => {
    const now = new Date().toISOString();
    
    // Update trend data (keep last 20 points)
    setTrendData(prev => ({
      cpu: [...prev.cpu, newCpu].slice(-20),
      memory: [...prev.memory, newMemory].slice(-20),
      timestamp: [...prev.timestamp, now].slice(-20)
    }));

    // Analyze CPU trend
    const recentCpu = trendData.cpu.slice(-5); // Last 5 readings
    if (recentCpu.length >= 3) {
      const trend = recentCpu[recentCpu.length - 1] - recentCpu[0];
      const avgIncrease = trend / recentCpu.length;
      
      if (avgIncrease > 5) { // Increasing by 5% per reading
        const explanation = `🔥 CRITICAL TREND DETECTED: CPU increasing by ${avgIncrease.toFixed(1)}% per reading. Current: ${newCpu.toFixed(1)}% → Predicted: ${(newCpu + avgIncrease * 3).toFixed(1)}% in 9 seconds`;
        addDecisionExplanation(explanation);
        
        if (deviceId) {
          createAlert(deviceId, 'TREND_OVERLOAD', explanation);
        }
      }
    }
  };

  // 🏆 SYSTEM HEALTH SCORE CALCULATOR
  const calculateSystemHealth = (cpu: number, memory: number, processCount: number) => {
    let health = 100;
    
    // CPU impact (40% weight)
    if (cpu > 90) health -= 30;
    else if (cpu > 70) health -= 15;
    else if (cpu > 50) health -= 5;
    
    // Memory impact (30% weight)
    if (memory > 85) health -= 25;
    else if (memory > 70) health -= 10;
    else if (memory > 50) health -= 3;
    
    // Process count impact (20% weight)
    if (processCount > 50) health -= 15;
    else if (processCount > 30) health -= 8;
    
    // Trend impact (10% weight)
    const recentCpu = trendData.cpu.slice(-3);
    if (recentCpu.length >= 2) {
      const trend = recentCpu[recentCpu.length - 1] - recentCpu[0];
      if (trend > 10) health -= 10; // Rapidly increasing
    }
    
    health = Math.max(0, Math.min(100, health));
    setSystemHealthScore(health);
    return health;
  };

  // 🏆 EXPLAINABLE DECISIONS SYSTEM
  const addDecisionExplanation = (explanation: string) => {
    setDecisionExplanations(prev => [
      `${new Date().toLocaleTimeString()}: ${explanation}`,
      ...prev.slice(0, 9) // Keep last 10 explanations
    ]);
  };

  // 🏆 ROOT CAUSE ANALYSIS ENGINE
  const analyzeRootCause = (alertType: string, processes: Process[]) => {
    let rootCause = '';
    
    if (alertType === 'HIGH_CPU') {
      const highCpuProcesses = processes.filter(p => p.cpu > 50);
      const totalHighCpu = highCpuProcesses.reduce((sum, p) => sum + p.cpu, 0);
      
      if (highCpuProcesses.length > 3) {
        rootCause = `Multiple processes (${highCpuProcesses.length}) consuming CPU simultaneously. Total: ${totalHighCpu.toFixed(1)}%. Likely cause: System overload or resource contention.`;
      } else if (highCpuProcesses.length === 1) {
        const process = highCpuProcesses[0];
        rootCause = `Single process "${process.name}" consuming ${process.cpu.toFixed(1)}% CPU. Likely cause: Inefficient algorithm, infinite loop, or heavy computation.`;
      } else {
        rootCause = 'CPU spike detected without specific high-usage process. Likely cause: System maintenance, antivirus scan, or background service.';
      }
    } else if (alertType === 'HIGH_MEMORY') {
      rootCause = 'Memory usage critical. Likely cause: Memory leak, large dataset processing, or insufficient RAM for current workload.';
    } else if (alertType === 'TREND_OVERLOAD') {
      rootCause = 'Predictive analysis detected increasing resource usage trend. Likely cause: Gradual performance degradation or resource leak.';
    }
    
    addDecisionExplanation(`🔍 ROOT CAUSE: ${rootCause}`);
    return rootCause;
  };
  
  const getStorageKey = (type: string, deviceId?: string) => {
    const base = `autohealx_${userId}_${type}`;
    return deviceId ? `${base}_${deviceId}` : base;
  };

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getFromStorage = (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  // Kill process function
  const killProcess = async (pid: number, processName: string): Promise<boolean> => {
    try {
      console.log(`🔥 KILLING PROCESS: ${processName} (PID: ${pid})`);
      
      // Remove the process from the list
      setProcesses(prev => prev.filter(p => p.pid !== pid));
      
      // Log the action
      if (deviceId) {
        const logsKey = getStorageKey('logs', deviceId);
        const currentLogs = getFromStorage(logsKey);
        const newLog = {
          id: 'log_' + Date.now(),
          deviceId: deviceId,
          action: `Killed process: ${processName}`,
          result: 'success',
          details: `Successfully terminated process ${processName} (PID: ${pid})`,
          timestamp: new Date().toISOString()
        };
        const updatedLogs = [newLog, ...currentLogs].slice(0, 50);
        saveToStorage(logsKey, updatedLogs);
      }
      
      return true;
    } catch (error) {
      console.error('Error killing process:', error);
      return false;
    }
  };

  // 🏆 ENHANCED SMART FIX WITH EXPLAINABLE DECISIONS & CONFIDENCE SCORES
  const smartFix = async (alertType: string, alertMessage: string) => {
    try {
      const currentProcesses = processesRef.current;
      console.log('🔧 SmartFix initiated:', { alertType, processCount: currentProcesses.length });
      
      // 🏆 ROOT CAUSE ANALYSIS
      const rootCause = analyzeRootCause(alertType, currentProcesses);
      
      if (alertType === 'HIGH_CPU') {
        // Find processes with detailed analysis
        const highCpuProcesses = currentProcesses
          .filter(p => p.cpu > 30 && p.name !== 'System' && p.name !== 'system_idle' && p.pid !== 0)
          .sort((a, b) => b.cpu - a.cpu);
        
        if (highCpuProcesses.length > 0) {
          const target = highCpuProcesses[0];
          const confidence = confidenceScores['KILL_PROCESS'] || 92;
          
          // 🏆 EXPLAINABLE DECISION
          const explanation = `🧠 ANALYSIS: ${target.name} consuming ${target.cpu.toFixed(1)}% CPU → causing system overload → terminating process (Confidence: ${confidence}%)`;
          addDecisionExplanation(explanation);
          
          console.log('🎯 Executing fix:', explanation);
          await killProcess(target.pid, target.name);
          
          // Update confidence based on success
          setConfidenceScores(prev => ({
            ...prev,
            'KILL_PROCESS': Math.min(99, prev['KILL_PROCESS'] + 1)
          }));
          
          return { 
            success: true, 
            message: `✅ Fixed: Killed ${target.name} (${target.cpu.toFixed(1)}% CPU)`,
            explanation,
            confidence
          };
        } else {
          // 🏆 SIMULATION ENGINE - Show before fixing
          const simulatedProcess: Process = {
            name: 'high_cpu_simulator.exe',
            pid: Math.floor(Math.random() * 10000) + 8000,
            cpu: 96 + Math.random() * 4,
            mem: '750 MB',
            status: 'Running'
          };
          
          const confidence = confidenceScores['KILL_PROCESS'] || 92;
          const explanation = `🎯 SIMULATION: Creating high CPU process → Expected fix success: ${confidence}% → Terminating simulated process`;
          addDecisionExplanation(explanation);
          
          // Add and immediately kill the simulated process
          setProcesses(prev => [simulatedProcess, ...prev]);
          setTimeout(async () => {
            await killProcess(simulatedProcess.pid, simulatedProcess.name);
          }, 500);
          
          return { 
            success: true, 
            message: `🎯 Simulated Fix: Terminated ${simulatedProcess.name} (${simulatedProcess.cpu.toFixed(1)}% CPU)`,
            explanation,
            confidence
          };
        }
      } else if (alertType === 'HIGH_MEMORY') {
        const memoryHogs = currentProcesses
          .filter(p => p.name !== 'System' && p.name !== 'system_idle' && p.pid !== 0)
          .sort((a, b) => parseFloat(b.mem) - parseFloat(a.mem));
        
        if (memoryHogs.length > 0) {
          const target = memoryHogs[0];
          const confidence = confidenceScores['MEMORY_OPTIMIZE'] || 90;
          
          const explanation = `💾 MEMORY ANALYSIS: ${target.name} using ${target.mem} RAM → optimizing memory usage → terminating process (Confidence: ${confidence}%)`;
          addDecisionExplanation(explanation);
          
          await killProcess(target.pid, target.name);
          return { 
            success: true, 
            message: `💾 Memory Optimized: Killed ${target.name}`,
            explanation,
            confidence
          };
        }
      }
      
      return { success: false, message: 'No processes found to fix', explanation: 'No high-resource processes detected', confidence: 0 };
    } catch (error) {
      console.error('❌ SmartFix error:', error);
      return { success: false, message: 'Fix failed: ' + error, explanation: 'System error occurred', confidence: 0 };
    }
  };

  // Create alert function
  const createAlert = async (deviceId: string, type: Alert['type'], message: string) => {
    const alertsKey = getStorageKey('alerts', deviceId);
    const currentAlerts = getFromStorage(alertsKey);
    
    // Check if similar alert exists recently
    const existingAlert = currentAlerts.find((alert: Alert) => 
      alert.type === type && alert.status === 'pending'
    );
    
    if (!existingAlert) {
      const newAlert: Alert = {
        id: 'alert_' + Date.now(),
        deviceId,
        type,
        message,
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      
      const updatedAlerts = [newAlert, ...currentAlerts].slice(0, 10);
      saveToStorage(alertsKey, updatedAlerts);
    }
  };

  // 🏆 ADVANCED AUTONOMOUS DECISION ENGINE
  const handleAdvancedAutomation = async (cpuUsage: number, gpuUsage: number) => {
    const now = Date.now();
    const currentProcesses = processesRef.current;
    
    // 🔥 LEVEL 1: CRITICAL AUTO-KILL (CPU/GPU > 95%)
    if (autoKillEnabled && (cpuUsage > 95 || gpuUsage > 95)) {
      if (now - lastAutoKillTime > 5000) {
        const criticalProcesses = currentProcesses
          .filter(p => p.cpu > 70 && p.name !== 'System' && p.name !== 'system_idle')
          .sort((a, b) => b.cpu - a.cpu);
        
        if (criticalProcesses.length > 0) {
          const target = criticalProcesses[0];
          const confidence = confidenceScores['KILL_PROCESS'] || 92;
          
          // 🏆 EXPLAINABLE DECISION
          const explanation = `🚨 CRITICAL PROTECTION: System overload detected (CPU: ${cpuUsage.toFixed(1)}%, GPU: ${gpuUsage.toFixed(1)}%) → ${target.name} consuming ${target.cpu.toFixed(1)}% CPU → Auto-terminating (Confidence: ${confidence}%)`;
          addDecisionExplanation(explanation);
          
          console.log('🤖 CRITICAL AUTO-KILL:', explanation);
          
          await killProcess(target.pid, target.name);
          setLastAutoKillTime(now);
          
          if (deviceId) {
            await createAlert(deviceId, 'HIGH_CPU', `🤖 ${explanation}`);
          }
        }
      }
    }
    
    // 🧠 LEVEL 2: INTELLIGENT PREVENTION (CPU/GPU > 85%)
    else if (intelligentMode && (cpuUsage > 85 || gpuUsage > 85)) {
      if (now - lastAutoKillTime > 15000) {
        const suspiciousProcesses = currentProcesses
          .filter(p => p.cpu > 60 && p.name !== 'System' && p.name !== 'system_idle')
          .sort((a, b) => b.cpu - a.cpu);
        
        if (suspiciousProcesses.length > 0) {
          const target = suspiciousProcesses[0];
          const confidence = confidenceScores['KILL_PROCESS'] || 92;
          
          const explanation = `🧠 PREDICTIVE ACTION: Rising system load detected (CPU: ${cpuUsage.toFixed(1)}%) → ${target.name} showing suspicious activity (${target.cpu.toFixed(1)}% CPU) → Preventive termination (Confidence: ${confidence}%)`;
          addDecisionExplanation(explanation);
          
          console.log('🧠 INTELLIGENT AUTO-KILL:', explanation);
          
          await killProcess(target.pid, target.name);
          setLastAutoKillTime(now);
          
          if (deviceId) {
            await createAlert(deviceId, 'HIGH_CPU', `🧠 ${explanation}`);
          }
        }
      }
    }
  };

  // Real-time monitoring simulation
  useEffect(() => {
    if (!deviceId || !isSimulating) return;

    const runRealTimeMonitoring = async () => {
      try {
        // Prevent rapid updates during stabilization
        if (isStabilizing) {
          return;
        }

        // Simulate real-time metrics with more realistic fluctuations
        let newCpu = Math.max(5, Math.min(100, cpuLoad + (Math.random() * 20 - 10)));
        let newGpu = Math.max(0, Math.min(100, gpuLoad + (Math.random() * 15 - 7.5)));
        const newMem = Math.max(10, Math.min(100, memLoad + (Math.random() * 8 - 4)));
        const newDisk = Math.max(5, Math.min(100, diskLoad + (Math.random() * 4 - 2)));
        const newNet = Math.max(0, Math.min(100, netLoad + (Math.random() * 20 - 10)));
        const newWifi = Math.max(20, Math.min(100, wifiLoad + (Math.random() * 8 - 4)));

        // Occasionally spike CPU/GPU to test automation (but not too often)
        if (Math.random() > 0.98 && !isStabilizing) {
          newCpu = Math.random() > 0.5 ? 96 + Math.random() * 4 : newCpu;
          newGpu = Math.random() > 0.5 ? 96 + Math.random() * 4 : newGpu;
          
          // Set stabilizing flag to prevent rapid changes
          if (newCpu > 95 || newGpu > 95) {
            setIsStabilizing(true);
            setTimeout(() => setIsStabilizing(false), 10000); // Stabilize for 10 seconds
          }
        }

        // Gradual reduction if CPU/GPU is very high (to prevent blinking)
        if (newCpu > 90) {
          newCpu = Math.max(30, newCpu - Math.random() * 20);
        }
        if (newGpu > 90) {
          newGpu = Math.max(20, newGpu - Math.random() * 15);
        }

        setCpuLoad(newCpu);
        setGpuLoad(newGpu);
        setMemLoad(newMem);
        setDiskLoad(newDisk);
        setNetLoad(newNet);
        setWifiLoad(newWifi);

        // 🏆 TREND ANALYSIS & HEALTH SCORE CALCULATION
        analyzeTrends(newCpu, newMem);
        const healthScore = calculateSystemHealth(newCpu, newMem, currentProcesses.length);

        // Update processes with realistic CPU usage and ensure variety
        setProcesses(prev => {
          let updatedProcesses = prev.map(p => {
            if (p.pid === 0) return { ...p, cpu: Math.max(0, 100 - newCpu) };
            
            // Occasionally create high CPU processes for testing
            if (Math.random() > 0.97 && p.name === 'chrome.exe') {
              return { ...p, cpu: 85 + Math.random() * 15 };
            }
            
            const fluctuation = (Math.random() * 4 - 2);
            return { ...p, cpu: Math.max(0.1, Math.min(80, p.cpu + fluctuation)) };
          });

          // Ensure we always have some processes with moderate CPU usage for FIX NOW to work
          const hasHighCpuProcess = updatedProcesses.some(p => p.cpu > 30 && p.pid !== 0);
          if (!hasHighCpuProcess && Math.random() > 0.8) {
            // Add a process with moderate CPU usage
            const newProcess: Process = {
              name: `process_${Math.floor(Math.random() * 1000)}.exe`,
              pid: Math.floor(Math.random() * 10000) + 1000,
              cpu: 40 + Math.random() * 30, // 40-70% CPU
              mem: `${Math.floor(Math.random() * 500 + 200)} MB`,
              status: 'Running'
            };
            updatedProcesses.push(newProcess);
          }

          return updatedProcesses;
        });

        // Store metrics
        const metricsKey = getStorageKey('metrics', deviceId);
        const currentMetrics = getFromStorage(metricsKey);
        const newMetric: Metric = {
          id: 'metric_' + Date.now(),
          deviceId,
          cpu: newCpu,
          memory: newMem,
          disk: newDisk,
          network: newNet,
          gpu: newGpu,
          wifi: newWifi,
          timestamp: new Date().toISOString(),
        };
        
        const updatedMetrics = [newMetric, ...currentMetrics].slice(0, 20);
        saveToStorage(metricsKey, updatedMetrics);

        // Advanced automation system
        await handleAdvancedAutomation(newCpu, newGpu);

        // Create alerts for high usage
        if (newCpu > 90) {
          await createAlert(deviceId, 'HIGH_CPU', `CPU usage critical: ${newCpu.toFixed(1)}%`);
        }
        if (newMem > 85) {
          await createAlert(deviceId, 'HIGH_MEMORY', `Memory usage critical: ${newMem.toFixed(1)}%`);
        }

      } catch (error) {
        console.error('Error in real-time monitoring:', error);
      }
    };

    // Run immediately
    runRealTimeMonitoring();

    // Set up interval for continuous monitoring
    intervalRef.current = setInterval(runRealTimeMonitoring, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceId, isSimulating, autoKillEnabled, intelligentMode, userId]);

  // System info
  const systemInfo = {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    cores: navigator.hardwareConcurrency || 4,
    memory: (performance as any).memory ? {
      used: Math.round(((performance as any).memory.usedJSHeapSize / 1024 / 1024)),
      total: Math.round(((performance as any).memory.totalJSHeapSize / 1024 / 1024)),
      limit: Math.round(((performance as any).memory.jsHeapSizeLimit / 1024 / 1024))
    } : null
  };

  return {
    cpuLoad,
    setCpuLoad,
    memLoad,
    setMemLoad,
    diskLoad,
    setDiskLoad,
    netLoad,
    setNetLoad,
    gpuLoad,
    setGpuLoad,
    wifiLoad,
    setWifiLoad,
    processes,
    setProcesses,
    isSimulating,
    setIsSimulating,
    isHighCpuForced,
    setIsHighCpuForced,
    killProcess,
    systemInfo,
    smartFix,
    autoKillEnabled,
    setAutoKillEnabled,
    intelligentMode,
    setIntelligentMode,
    isStabilizing,
    // 🏆 ADVANCED FEATURES
    systemHealthScore,
    trendData,
    confidenceScores,
    decisionExplanations,
    setConfidenceScores
  };
}