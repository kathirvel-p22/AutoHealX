import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Database, 
  Bell, 
  Settings, 
  LogOut, 
  Plus, 
  Monitor, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Terminal,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  BarChart3,
  Wifi,
  Network as NetworkIcon,
  LayoutDashboard,
  Search,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  HardDrive,
  User as UserIcon,
  Brain,
  History,
  Play,
  Pause,
  XCircle,
  Edit2,
  BookOpen,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSimulationAgent } from '../hooks/useSimulationAgent';
import { useRealSystemAgent } from '../hooks/useRealSystemAgent';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';
import { Device, Metric, Alert, Command, Process, KnowledgeBaseEntry, ActionLog } from '../types';

interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface DashboardProps {
  user: LocalUser;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'performance' | 'processes' | 'network' | 'settings' | 'knowledge' | 'history' | 'intelligence' | 'pairing'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [isPairingMode, setIsPairingMode] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState<{[key: string]: string}>({});
  const [preventiveActions, setPreventiveActions] = useState<string[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [useRealSystem, setUseRealSystem] = useState(true); // Toggle between real and simulation
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('autohealx-theme');
    return (savedTheme as 'dark' | 'light') || 'dark';
  }); // Theme state with persistence
  
  // 🏆 THEME PERSISTENCE
  useEffect(() => {
    localStorage.setItem('autohealx-theme', theme);
    document.documentElement.classList.toggle('light-theme', theme === 'light');
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  }, [theme]);
  
  // 🏆 MULTILINGUAL SUPPORT - English + Tamil
  const translations = {
    en: {
      dashboard: 'Overview',
      performance: 'Performance',
      processes: 'Processes',
      network: 'Network',
      knowledge: 'Knowledge Base',
      intelligence: 'AI Intelligence',
      history: 'Action History',
      settings: 'Settings',
      healthScore: 'Health Score',
      agentConnected: 'Agent Connected',
      systemPerformance: 'System Performance',
      realTime: 'REAL-TIME',
      stabilizing: 'STABILIZING',
      quickActions: 'Quick Actions',
      killProcess: 'Kill Process',
      restartService: 'Restart Service',
      cleanCache: 'Clean Cache',
      stressTest: 'Stress Test',
      alertHistory: 'Alert History',
      fixNow: 'FIX NOW',
      advice: 'ADVICE',
      devicePairing: 'Device Pairing',
      pairingCode: 'Pairing Code',
      rootCause: 'Root Cause Analysis',
      preventiveActions: 'Preventive Actions',
      darkTheme: 'Dark Theme',
      lightTheme: 'Light Theme'
    },
    ta: {
      dashboard: 'கண்ணோட்டம்',
      performance: 'செயல்திறன்',
      processes: 'செயல்முறைகள்',
      network: 'நெட்வொர்க்',
      knowledge: 'அறிவுத் தளம்',
      intelligence: 'AI புத்திசாலித்தனம்',
      history: 'செயல் வரலாறு',
      settings: 'அமைப்புகள்',
      healthScore: 'ஆரோக்கிய மதிப்பெண்',
      agentConnected: 'ஏஜென்ட் இணைக்கப்பட்டது',
      systemPerformance: 'கணினி செயல்திறன்',
      realTime: 'நேரடி',
      stabilizing: 'நிலைப்படுத்துதல்',
      quickActions: 'விரைவு செயல்கள்',
      killProcess: 'செயல்முறையை நிறுத்து',
      restartService: 'சேவையை மறுதொடக்கம்',
      cleanCache: 'கேச் சுத்தம்',
      stressTest: 'அழுத்த சோதனை',
      alertHistory: 'எச்சரிக்கை வரலாறு',
      fixNow: 'இப்போது சரிசெய்',
      advice: 'ஆலோசனை',
      devicePairing: 'சாதன இணைப்பு',
      pairingCode: 'இணைப்பு குறியீடு',
      rootCause: 'மூல காரண பகுப்பாய்வு',
      preventiveActions: 'தடுப்பு நடவடிக்கைகள்',
      darkTheme: 'இருண்ட தீம்',
      lightTheme: 'வெள்ளை தீம்'
    }
  };
  
  const t = (key: keyof typeof translations.en) => translations[language][key];
  
  const [knowledgeBase] = useState<KnowledgeBaseEntry[]>([
    { id: '1', title: 'High CPU Usage', description: 'System CPU usage exceeds 90%', solution: 'Identify the process consuming the most CPU and terminate it if it is non-critical.', category: 'performance', confidence: 94 },
    { id: '2', title: 'Memory Leak Detected', description: 'Memory usage is steadily increasing over time', solution: 'Restart the affected service or clear system cache.', category: 'performance', confidence: 88 },
    { id: '3', title: 'Network Congestion', description: 'High latency detected in Wi-Fi signal', solution: 'Check for interference or move closer to the access point.', category: 'network', confidence: 72 },
  ]);

  const simulationData = useSimulationAgent(selectedDeviceId, user.id);
  const realSystemData = useRealSystemAgent(selectedDeviceId, user.id);
  
  // 🏆 CHOOSE BETWEEN REAL SYSTEM OR SIMULATION
  const systemData = useRealSystem ? realSystemData : simulationData;
  const { 
    cpuLoad, setCpuLoad, 
    memLoad, setMemLoad, 
    diskLoad, setDiskLoad,
    netLoad, setNetLoad,
    gpuLoad, setGpuLoad,
    wifiLoad, setWifiLoad,
    processes, setProcesses,
    isSimulating, setIsSimulating,
    isHighCpuForced, setIsHighCpuForced,
    killProcess,
    systemInfo,
    smartFix,
    autoKillEnabled, setAutoKillEnabled,
    intelligentMode, setIntelligentMode,
    isStabilizing,
    // 🏆 ADVANCED FEATURES
    systemHealthScore,
    trendData,
    confidenceScores,
    decisionExplanations,
    setConfidenceScores
  } = systemData;

  // Helper functions for localStorage operations
  const getStorageKey = (type: string, deviceId?: string) => {
    const base = `autohealx_${user.id}_${type}`;
    return deviceId ? `${base}_${deviceId}` : base;
  };

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const getFromStorage = (key: string) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  };

  // Generate sample data for demonstration
  const generateSampleData = (deviceId: string) => {
    const now = new Date();
    
    // Generate sample metrics
    const sampleMetrics: Metric[] = Array.from({ length: 20 }, (_, i) => ({
      id: `metric_${i}`,
      deviceId,
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
      disk: Math.floor(Math.random() * 100),
      network: Math.floor(Math.random() * 100),
      gpu: Math.floor(Math.random() * 100),
      wifi: Math.floor(Math.random() * 100),
      timestamp: new Date(now.getTime() - i * 60000).toISOString()
    }));

    // Generate sample alerts
    const sampleAlerts: Alert[] = [
      {
        id: 'alert_1',
        deviceId,
        type: 'HIGH_CPU',
        message: 'CPU usage is critically high at 95%',
        status: 'pending',
        timestamp: new Date().toISOString()
      },
      {
        id: 'alert_2',
        deviceId,
        type: 'HIGH_MEMORY',
        message: 'Memory usage exceeded 90%',
        status: 'resolved',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Generate sample commands
    const sampleCommands: Command[] = [
      {
        id: 'cmd_1',
        deviceId,
        action: 'KILL_PROCESS',
        target: 'chrome.exe',
        status: 'done',
        timestamp: new Date().toISOString()
      }
    ];

    // Generate sample action logs
    const sampleActionLogs: ActionLog[] = [
      {
        id: 'log_1',
        deviceId,
        action: 'System optimization completed',
        result: 'success',
        timestamp: new Date().toISOString(),
        details: 'Cleared 2.3GB of temporary files'
      }
    ];

    return { sampleMetrics, sampleAlerts, sampleCommands, sampleActionLogs };
  };

  // Load data from localStorage or generate sample data
  useEffect(() => {
    if (!selectedDeviceId) return;

    const metricsKey = getStorageKey('metrics', selectedDeviceId);
    const alertsKey = getStorageKey('alerts', selectedDeviceId);
    const commandsKey = getStorageKey('commands', selectedDeviceId);
    const logsKey = getStorageKey('logs', selectedDeviceId);

    let storedMetrics = getFromStorage(metricsKey);
    let storedAlerts = getFromStorage(alertsKey);
    let storedCommands = getFromStorage(commandsKey);
    let storedLogs = getFromStorage(logsKey);

    // If no data exists, generate sample data
    if (storedMetrics.length === 0) {
      const { sampleMetrics, sampleAlerts, sampleCommands, sampleActionLogs } = generateSampleData(selectedDeviceId);
      
      saveToStorage(metricsKey, sampleMetrics);
      saveToStorage(alertsKey, sampleAlerts);
      saveToStorage(commandsKey, sampleCommands);
      saveToStorage(logsKey, sampleActionLogs);

      storedMetrics = sampleMetrics;
      storedAlerts = sampleAlerts;
      storedCommands = sampleCommands;
      storedLogs = sampleActionLogs;
    }

    setMetrics(storedMetrics);
    setAlerts(storedAlerts);
    setCommands(storedCommands);
    setActionLogs(storedLogs);
  }, [selectedDeviceId, user.id]);

  // Calculate Health Score
  const calculateHealthScore = () => {
    if (metrics.length === 0) return 100;
    const latest = metrics[metrics.length - 1];
    const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
    
    let score = 100;
    score -= (latest.cpu > 80 ? 20 : latest.cpu > 50 ? 10 : 0);
    score -= (latest.memory > 80 ? 20 : latest.memory > 50 ? 10 : 0);
    score -= (pendingAlerts * 15);
    return Math.max(0, score);
  };

  const healthScore = calculateHealthScore();

  const getTrend = (key: string) => {
    if (metrics.length < 2) return 'Stable';
    const current = metrics[metrics.length - 1][key as keyof Metric];
    const previous = metrics[metrics.length - 2][key as keyof Metric];
    if (typeof current !== 'number' || typeof previous !== 'number') return 'Stable';
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return 'Stable';
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  // Load devices from localStorage
  useEffect(() => {
    const devicesKey = getStorageKey('devices');
    let storedDevices = getFromStorage(devicesKey);

    // If no devices exist, create a sample device
    if (storedDevices.length === 0) {
      const sampleDevice: Device = {
        id: 'device_' + Date.now(),
        name: 'My Computer',
        status: 'active',
        lastSeen: new Date().toISOString(),
        userId: user.id,
        mode: 'suggest'
      };
      storedDevices = [sampleDevice];
      saveToStorage(devicesKey, storedDevices);
    }

    setDevices(storedDevices);
    if (storedDevices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(storedDevices[0].id);
    }
  }, [user.id, selectedDeviceId]);

  // 🏆 DEVICE PAIRING SYSTEM - Secure linking
  const generatePairingCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPairingCode(code);
    setIsPairingMode(true);
    
    // Auto-expire pairing code after 5 minutes
    setTimeout(() => {
      setIsPairingMode(false);
      setPairingCode('');
    }, 300000);
  };

  // 🏆 ROOT CAUSE IDENTIFICATION
  const analyzeRootCause = (alertType: string, metrics: Metric[]) => {
    let rootCause = '';
    
    if (alertType === 'HIGH_CPU') {
      const recentMetrics = metrics.slice(-5);
      const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu, 0) / recentMetrics.length;
      
      if (avgCpu > 90) {
        rootCause = 'Multiple high-CPU processes running simultaneously. Likely cause: Resource-intensive applications or background services.';
      } else if (avgCpu > 70) {
        rootCause = 'Single process consuming excessive CPU. Likely cause: Inefficient algorithm or infinite loop in application.';
      } else {
        rootCause = 'Temporary CPU spike. Likely cause: System maintenance task or antivirus scan.';
      }
    } else if (alertType === 'HIGH_MEMORY') {
      rootCause = 'Memory leak detected. Likely cause: Application not releasing allocated memory properly.';
    }
    
    setRootCauseAnalysis(prev => ({
      ...prev,
      [alertType]: rootCause
    }));
    
    return rootCause;
  };

  // 🏆 PREVENTIVE ACTION SYSTEM
  const suggestPreventiveActions = (healthScore: number, trendData: any) => {
    const actions: string[] = [];
    
    if (healthScore < 70) {
      actions.push('Schedule regular system cleanup');
      actions.push('Monitor resource-intensive applications');
      actions.push('Consider hardware upgrade if issues persist');
    }
    
    if (trendData.cpu.length >= 3) {
      const trend = trendData.cpu[trendData.cpu.length - 1] - trendData.cpu[0];
      if (trend > 10) {
        actions.push('Implement CPU usage alerts at 80% threshold');
        actions.push('Review startup programs and disable unnecessary ones');
      }
    }
    
    if (actions.length > 0) {
      setPreventiveActions(actions);
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceName) return;
    
    const newDevice: Device = {
      id: 'device_' + Date.now(),
      name: newDeviceName,
      status: 'active',
      lastSeen: new Date().toISOString(),
      userId: user.id,
      mode: 'suggest'
    };

    const devicesKey = getStorageKey('devices');
    const currentDevices = getFromStorage(devicesKey);
    const updatedDevices = [...currentDevices, newDevice];
    saveToStorage(devicesKey, updatedDevices);
    
    setDevices(updatedDevices);
    setNewDeviceName('');
    setIsAddingDevice(false);
    setSelectedDeviceId(newDevice.id);
  };

  const sendCommand = async (action: Command['action'], target: string = 'system') => {
    if (!selectedDeviceId) return;
    
    const newCommand: Command = {
      id: 'cmd_' + Date.now(),
      deviceId: selectedDeviceId,
      action,
      target,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const commandsKey = getStorageKey('commands', selectedDeviceId);
    const currentCommands = getFromStorage(commandsKey);
    const updatedCommands = [newCommand, ...currentCommands].slice(0, 10); // Keep only last 10
    saveToStorage(commandsKey, updatedCommands);
    setCommands(updatedCommands);
  };

  const deleteDevice = async (id: string) => {
    try {
      const devicesKey = getStorageKey('devices');
      const currentDevices = getFromStorage(devicesKey);
      const updatedDevices = currentDevices.filter((d: Device) => d.id !== id);
      saveToStorage(devicesKey, updatedDevices);
      setDevices(updatedDevices);
      setSelectedDeviceId(null);
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const handleRenameDevice = async () => {
    if (!selectedDeviceId || !renameValue) return;
    try {
      const devicesKey = getStorageKey('devices');
      const currentDevices = getFromStorage(devicesKey);
      const updatedDevices = currentDevices.map((d: Device) => 
        d.id === selectedDeviceId ? { ...d, name: renameValue } : d
      );
      saveToStorage(devicesKey, updatedDevices);
      setDevices(updatedDevices);
      setIsRenaming(false);
      setRenameValue('');
    } catch (error) {
      console.error('Error renaming device:', error);
    }
  };

  const toggleDeviceMode = async () => {
    if (!selectedDeviceId || !selectedDevice) return;
    try {
      const devicesKey = getStorageKey('devices');
      const currentDevices = getFromStorage(devicesKey);
      const updatedDevices = currentDevices.map((d: Device) => 
        d.id === selectedDeviceId 
          ? { ...d, mode: d.mode === 'auto' ? 'suggest' : 'auto' }
          : d
      );
      saveToStorage(devicesKey, updatedDevices);
      setDevices(updatedDevices);
    } catch (error) {
      console.error('Error toggling device mode:', error);
    }
  };

  const handleKillProcess = async (pid: number, processName: string) => {
    try {
      const success = await killProcess(pid, processName);
      if (success) {
        setNotification({
          message: useRealSystem 
            ? `🔥 REAL SYSTEM: Successfully killed process: ${processName} (PID: ${pid})`
            : `Successfully killed process: ${processName} (PID: ${pid})`,
          type: 'success'
        });
        
        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          message: `Failed to kill process: ${processName}`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      setNotification({
        message: `Error killing process: ${processName}`,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSmartFix = async (alert: Alert) => {
    try {
      const result = await smartFix(alert.type, alert.message);
      
      if (result.success) {
        // Mark alert as resolved
        const alertsKey = getStorageKey('alerts', selectedDeviceId);
        const currentAlerts = getFromStorage(alertsKey);
        const updatedAlerts = currentAlerts.map((a: Alert) => 
          a.id === alert.id 
            ? { ...a, status: 'resolved', actionTaken: 'SMART_FIX' }
            : a
        );
        saveToStorage(alertsKey, updatedAlerts);
        setAlerts(updatedAlerts);
        
        setNotification({
          message: result.message,
          type: 'success'
        });
      } else {
        setNotification({
          message: result.message,
          type: 'error'
        });
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        message: 'Fix failed: Unable to resolve issue',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const selectedDevice = devices.find(d => d.id === selectedDeviceId);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden relative transition-colors duration-300",
      theme === 'dark' ? "bg-surface-950 dark-theme" : "bg-white light-theme"
    )}>
      {/* Background Effects */}
      <div className={cn(
        "absolute inset-0 bg-grid pointer-events-none",
        theme === 'dark' ? "opacity-50" : "opacity-20"
      )} />
      <div className={cn(
        "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none",
        theme === 'dark' ? "bg-brand-blue/5" : "bg-brand-blue/10"
      )} />
      <div className={cn(
        "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full pointer-events-none",
        theme === 'dark' ? "bg-brand-purple/5" : "bg-brand-purple/10"
      )} />

      {/* Sidebar */}
      <aside className={cn(
        "w-72 backdrop-blur-xl border-r flex flex-col relative z-10 transition-colors duration-300",
        theme === 'dark' 
          ? "bg-surface-950/50 border-white/5" 
          : "bg-white/80 border-slate-200"
      )}>
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-brand-blue to-brand-indigo rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className={cn(
            "text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r",
            theme === 'dark' ? "from-white to-white/60" : "from-slate-900 to-slate-600"
          )}>
            AutoHealX
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8">
          <div>
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider px-2 mb-4 block",
              theme === 'dark' ? "text-slate-500" : "text-slate-600"
            )}>
              Menu
            </span>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={cn("nav-tab w-full", activeTab === 'dashboard' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="text-sm font-medium">{t('dashboard')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('performance')}
                className={cn("nav-tab w-full", activeTab === 'performance' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">{t('performance')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('processes')}
                className={cn("nav-tab w-full", activeTab === 'processes' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">{t('processes')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('network')}
                className={cn("nav-tab w-full", activeTab === 'network' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">{t('network')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('knowledge')}
                className={cn("nav-tab w-full", activeTab === 'knowledge' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">{t('knowledge')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('intelligence')}
                className={cn("nav-tab w-full", activeTab === 'intelligence' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{t('intelligence')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('pairing')}
                className={cn("nav-tab w-full", activeTab === 'pairing' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Monitor className="h-4 w-4" />
                <span className="text-sm font-medium">{t('devicePairing')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn("nav-tab w-full", activeTab === 'history' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <History className="h-4 w-4" />
                <span className="text-sm font-medium">{t('history')}</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn("nav-tab w-full", activeTab === 'settings' ? "nav-tab-active" : "nav-tab-inactive")}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">{t('settings')}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between px-2 mb-4">
              <span className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                theme === 'dark' ? "text-slate-500" : "text-slate-600"
              )}>
                Devices
              </span>
              <button 
                onClick={() => setIsAddingDevice(true)}
                className="p-1 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              {devices.map(device => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDeviceId(device.id)}
                  className={cn(
                    "nav-tab w-full group",
                    selectedDeviceId === device.id 
                      ? "nav-tab-active" 
                      : "nav-tab-inactive"
                  )}
                >
                  <Monitor className={cn("h-4 w-4 transition-colors", selectedDeviceId === device.id ? "text-brand-blue" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="flex-1 text-left text-sm font-medium">{device.name}</span>
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all duration-500",
                    device.status === 'active' ? "bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"
                  )} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={cn(
              "text-xs font-semibold uppercase tracking-wider px-2 mb-4 block",
              theme === 'dark' ? "text-slate-500" : "text-slate-600"
            )}>
              Simulation
            </span>
            <div className="px-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>
                  Agent Status
                </span>
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    isSimulating ? "bg-blue-600" : "bg-slate-700"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isSimulating ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
              
              {isSimulating && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Inject CPU Load</span>
                      <span>{cpuLoad.toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={cpuLoad} 
                      onChange={(e) => setCpuLoad(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Inject Memory Load</span>
                      <span>{memLoad.toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={memLoad} 
                      onChange={(e) => setMemLoad(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Inject GPU Load</span>
                      <span>{gpuLoad.toFixed(0)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={gpuLoad} 
                      onChange={(e) => setGpuLoad(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-xl transition-all group"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative z-10">
        {/* Header */}
        <header className={cn(
          "h-20 border-b px-8 flex items-center justify-between sticky top-0 backdrop-blur-xl z-20 transition-colors duration-300",
          theme === 'dark' 
            ? "border-white/5 bg-surface-950/40" 
            : "border-slate-200 bg-white/40"
        )}>
          <div>
            <div className="flex items-center gap-3">
              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={renameValue} 
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white text-lg font-bold focus:outline-none focus:border-brand-blue"
                    autoFocus
                  />
                  <button onClick={handleRenameDevice} className="p-1.5 bg-brand-emerald/20 text-brand-emerald rounded-lg hover:bg-brand-emerald/30 transition-all">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setIsRenaming(false)} className="p-1.5 bg-brand-red/20 text-brand-red rounded-lg hover:bg-brand-red/30 transition-all">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <h1 className={cn(
                  "text-2xl font-bold flex items-center gap-3 group",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {selectedDevice?.name || 'Select Device'}
                  <button 
                    onClick={() => {
                      setIsRenaming(true);
                      setRenameValue(selectedDevice?.name || '');
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <span className="px-2.5 py-0.5 bg-brand-emerald/10 text-brand-emerald text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-emerald/20">
                    Online
                  </span>
                  {/* 🏆 SYSTEM HEALTH SCORE */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-600 rounded-xl">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      systemHealthScore >= 80 ? "bg-green-400" :
                      systemHealthScore >= 60 ? "bg-yellow-400" : "bg-red-400"
                    )} />
                    <span className="text-xs font-bold text-slate-300">Health:</span>
                    <span className={cn(
                      "text-sm font-bold",
                      systemHealthScore >= 80 ? "text-green-400" :
                      systemHealthScore >= 60 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {systemHealthScore}%
                    </span>
                  </div>
                </h1>
              )}
            </div>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-slate-500" : "text-slate-600"
            )}>
              Autonomous Health Monitoring
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health Score</span>
                <span className={cn(
                  "text-sm font-bold",
                  healthScore > 80 ? "text-brand-emerald" : healthScore > 50 ? "text-brand-amber" : "text-brand-red"
                )}>{healthScore}%</span>
              </div>
              <div className="h-8 w-8 rounded-full border-2 border-white/5 flex items-center justify-center relative">
                <svg className="h-full w-full -rotate-90">
                  <circle
                    cx="16" cy="16" r="14"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/5"
                  />
                  <circle
                    cx="16" cy="16" r="14"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * healthScore) / 100}
                    className={cn(
                      "transition-all duration-1000",
                      healthScore > 80 ? "text-brand-emerald" : healthScore > 50 ? "text-brand-amber" : "text-brand-red"
                    )}
                  />
                </svg>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="h-2 w-2 bg-brand-emerald rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-medium text-slate-300">{t('agentConnected')}</span>
            </div>

            {/* 🏆 THEME SWITCHER - Dark/Light Mode */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <button 
                onClick={() => setTheme('dark')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  theme === 'dark' ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                title={t('darkTheme')}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  theme === 'light' ? "bg-white text-slate-900" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
                title={t('lightTheme')}
              >
                <Sun className="h-4 w-4" />
              </button>
            </div>

            {/* 🏆 LANGUAGE SWITCHER - Multilingual Support */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <button 
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded-lg transition-all",
                  language === 'en' ? "bg-brand-blue text-white" : "text-slate-400 hover:text-white"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('ta')}
                className={cn(
                  "px-2 py-1 text-xs font-bold rounded-lg transition-all",
                  language === 'ta' ? "bg-brand-blue text-white" : "text-slate-400 hover:text-white"
                )}
              >
                தமிழ்
              </button>
            </div>

            {/* 🏆 REAL SYSTEM / SIMULATION TOGGLE */}
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {useRealSystem ? 'REAL SYSTEM' : 'SIMULATION'}
                </span>
                <span className={cn(
                  "text-xs font-bold",
                  useRealSystem ? "text-brand-emerald" : "text-brand-blue"
                )}>
                  {useRealSystem ? 'Live Monitoring' : 'Demo Mode'}
                </span>
              </div>
              <button 
                onClick={() => setUseRealSystem(!useRealSystem)}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  useRealSystem ? "bg-brand-emerald" : "bg-brand-blue"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  useRealSystem ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-blue to-brand-indigo flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-brand-blue/20">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="hidden md:block text-left pr-2">
                  <p className="text-xs font-bold text-white leading-none mb-1">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-500 font-medium leading-none uppercase tracking-wider">Standard User</p>
                </div>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-surface-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 p-2 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/5 mb-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-white truncate">{user.email}</p>
                      </div>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <UserIcon className="h-4 w-4" />
                        My Profile
                      </button>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-brand-red hover:bg-brand-red/10 rounded-xl transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard 
              label="CPU" 
              value={`${metrics[metrics.length-1]?.cpu.toFixed(1) || '0.0'}%`} 
              icon={<Cpu className="h-4 w-4 text-blue-400" />}
              trend={getTrend('cpu')}
              color="blue"
            />
            <StatCard 
              label="Memory" 
              value={`${metrics[metrics.length-1]?.memory.toFixed(1) || '0.0'}%`} 
              icon={<Database className="h-4 w-4 text-purple-400" />}
              trend={getTrend('memory')}
              color="purple"
            />
            <StatCard 
              label="GPU" 
              value={`${metrics[metrics.length-1]?.gpu?.toFixed(1) || '0.0'}%`} 
              icon={<Zap className="h-4 w-4 text-brand-amber" />}
              trend={getTrend('gpu')}
              color="amber"
            />
            <StatCard 
              label="Disk" 
              value={`${metrics[metrics.length-1]?.disk?.toFixed(1) || '0.0'}%`} 
              icon={<HardDrive className="h-4 w-4 text-brand-emerald" />}
              trend={getTrend('disk')}
              color="emerald"
            />
            <StatCard 
              label="Network" 
              value={`${metrics[metrics.length-1]?.network?.toFixed(1) || '0.0'} Mbps`} 
              icon={<NetworkIcon className="h-4 w-4 text-brand-pink" />}
              trend={getTrend('network')}
              color="pink"
            />
            <StatCard 
              label="Wi-Fi" 
              value={`${metrics[metrics.length-1]?.wifi?.toFixed(0) || '0'}%`} 
              icon={<Wifi className="h-4 w-4 text-brand-indigo" />}
              trend={getTrend('wifi')}
              color="indigo"
            />
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Charts Section */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bento-card">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{t('systemPerformance')}</h3>
                        <div className={cn(
                          "flex items-center gap-2 px-2 py-1 border rounded-full",
                          useRealSystem 
                            ? "bg-green-500/10 border-green-500/20" 
                            : "bg-blue-500/10 border-blue-500/20"
                        )}>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            useRealSystem ? "bg-green-500" : "bg-blue-500"
                          )} />
                          <span className={cn(
                            "text-xs font-medium",
                            useRealSystem ? "text-green-400" : "text-blue-400"
                          )}>
                            {useRealSystem ? 'REAL SYSTEM' : t('realTime')}
                          </span>
                        </div>
                        {isStabilizing && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-yellow-400">{t('stabilizing')}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {useRealSystem 
                          ? 'Live system monitoring • Real process management • Updates every 3 seconds' 
                          : 'Live system monitoring • Updates every 2 seconds'
                        }
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-blue/10 rounded-lg border border-brand-blue/20">
                        <div className="h-2 w-2 bg-brand-blue rounded-full" />
                        <span className="text-[10px] font-bold text-brand-blue uppercase">CPU</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-purple/10 rounded-lg border border-brand-purple/20">
                        <div className="h-2 w-2 bg-brand-purple rounded-full" />
                        <span className="text-[10px] font-bold text-brand-purple uppercase">Memory</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(val) => val?.toDate ? format(val.toDate(), 'HH:mm') : ''}
                          stroke="#475569"
                          fontSize={8}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis 
                          stroke="#475569" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(12px)' }}
                          itemStyle={{ fontSize: '12px' }}
                          labelFormatter={(label) => label?.toDate ? format(label.toDate(), 'HH:mm:ss') : 'Unknown'}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cpu" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorCpu)" 
                          animationDuration={1000}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="memory" 
                          stroke="#a855f7" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorMem)" 
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Actions & Terminal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bento-card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-brand-blue" />
                      {t('quickActions')}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <ActionButton 
                        label={t('killProcess')} 
                        icon={<Trash2 className="h-4 w-4" />} 
                        onClick={() => sendCommand('KILL_PROCESS', 'heavy_task.exe')}
                      />
                      <ActionButton 
                        label={t('restartService')} 
                        icon={<RefreshCw className="h-4 w-4" />} 
                        onClick={() => sendCommand('RESTART_SERVICE', 'web_server')}
                      />
                      <ActionButton 
                        label={t('cleanCache')} 
                        icon={<Database className="h-4 w-4" />} 
                        onClick={() => sendCommand('CLEAN_CACHE')}
                      />
                      <ActionButton 
                        label={t('stressTest')} 
                        icon={<Zap className="h-4 w-4" />} 
                        onClick={() => sendCommand('STRESS_TEST')}
                      />
                    </div>
                  </div>

                  <div className="bento-card flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-brand-indigo" />
                      Command History
                    </h3>
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[180px] pr-2">
                      {commands.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">No commands executed</p>
                      ) : (
                        commands.map(cmd => (
                          <div key={cmd.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-2 w-2 rounded-full",
                                cmd.status === 'done' ? "bg-brand-emerald" : "bg-brand-amber animate-pulse"
                              )} />
                              <span className="text-xs font-bold text-slate-300">{cmd.action}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {cmd.status === 'done' ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="bento-card">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-brand-emerald" />
                    System Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold">OS Version</span>
                      <span className="text-xs text-slate-200 font-mono">Windows 11 Pro (22H2)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold">Processor</span>
                      <span className="text-xs text-slate-200 font-mono">Intel Core i9-13900K</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-xs text-slate-500 uppercase font-bold">Uptime</span>
                      <span className="text-xs text-slate-200 font-mono">14d 06h 22m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 uppercase font-bold">Agent Version</span>
                      <span className="text-xs text-slate-200 font-mono">v2.4.1-stable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts Feed */}
              <div className="bento-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-brand-amber" />
                    {t('alertHistory')}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent</span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2">
                  <AnimatePresence mode="popLayout">
                    {alerts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                        <ShieldCheck className="h-12 w-12 mb-2 opacity-20" />
                        <p className="text-sm">No alerts detected</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "p-4 rounded-2xl border transition-all duration-300",
                            alert.status === 'pending' 
                              ? "bg-brand-red/5 border-brand-red/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]" 
                              : "bg-white/5 border-white/5 opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "mt-1 h-8 w-8 rounded-lg flex items-center justify-center",
                              alert.status === 'pending' ? "bg-brand-red/20 text-brand-red" : "bg-brand-emerald/20 text-brand-emerald"
                            )}>
                              {alert.status === 'pending' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider",
                                  alert.status === 'pending' ? "text-brand-red" : "text-brand-emerald"
                                )}>
                                  {alert.type}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {alert.timestamp?.toDate ? format(alert.timestamp.toDate(), 'HH:mm:ss') : 'Just now'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200 font-medium leading-snug mb-3">{alert.message}</p>
                              
                              {alert.status === 'pending' && (
                                <div className="flex items-center gap-4 mb-4 p-2 bg-white/5 rounded-xl border border-white/5">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">Confidence</span>
                                    <span className="text-[10px] font-bold text-brand-emerald">94% Match</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 uppercase font-bold">Expected Success</span>
                                    <span className="text-[10px] font-bold text-brand-blue">88%</span>
                                  </div>
                                </div>
                              )}

                              {alert.status === 'pending' ? (
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleSmartFix(alert)}
                                    className="px-3 py-1.5 bg-brand-blue text-white text-[10px] font-bold rounded-lg hover:bg-brand-blue/80 transition-all flex items-center gap-1.5 shadow-lg shadow-brand-blue/20"
                                  >
                                    <Zap className="h-3 w-3" />
                                    {t('fixNow')}
                                  </button>
                                  <button 
                                    onClick={() => setActiveTab('knowledge')}
                                    className="px-3 py-1.5 bg-white/5 text-slate-300 text-[10px] font-bold rounded-lg hover:bg-white/10 transition-all flex items-center gap-1.5 border border-white/10"
                                  >
                                    <BookOpen className="h-3 w-3" />
                                    {t('advice')}
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-500 italic">Resolved via {alert.actionTaken}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PerformanceChart title="CPU Usage" data={metrics} dataKey="cpu" color="#3b82f6" />
                  <PerformanceChart title="Memory Usage" data={metrics} dataKey="memory" color="#a855f7" />
                  <PerformanceChart title="GPU Usage" data={metrics} dataKey="gpu" color="#f59e0b" />
                  <PerformanceChart title="Disk Activity" data={metrics} dataKey="disk" color="#10b981" />
                  <PerformanceChart title="Network Throughput" data={metrics} dataKey="network" color="#ec4899" />
                  <PerformanceChart title="Wi-Fi Signal" data={metrics} dataKey="wifi" color="#6366f1" />
                </div>

                <div className="space-y-6">
                  <div className="bento-card">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-brand-amber" />
                      Top Resource Consumers
                    </h3>
                    <div className="space-y-4">
                      {processes
                        .sort((a, b) => b.cpu - a.cpu)
                        .slice(0, 5)
                        .map((proc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-brand-red/30 transition-all">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                proc.cpu > 40 ? "bg-brand-red/10 text-brand-red" : "bg-slate-800 text-slate-400"
                              )}>
                                <Cpu className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-200">{proc.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">PID: {proc.pid}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-xs font-bold text-white font-mono">{proc.cpu.toFixed(1)}%</p>
                                <p className="text-[8px] text-slate-500 uppercase font-bold">CPU</p>
                              </div>
                              <button 
                                onClick={() => sendCommand('KILL_PROCESS', proc.name)}
                                className="flex items-center gap-1.5 px-2 py-1 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-red/20 border border-brand-red/20"
                                title="Kill Process"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                KILL
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bento-card">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <History className="h-5 w-5 text-brand-blue" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {actionLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider">{log.action}</span>
                            <span className="text-[8px] text-slate-500">{log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm') : 'Just now'}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 🚀 ADVANCED AUTOMATION CONTROLS */}
                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-sm font-bold text-white">🚀 Advanced Automation</h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-400">AI POWERED</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-200">🤖 Auto-Kill (CPU/GPU {'>'}95%)</p>
                          <p className="text-xs text-slate-500">Automatically terminate high-resource processes</p>
                        </div>
                        <button 
                          onClick={() => setAutoKillEnabled(!autoKillEnabled)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            autoKillEnabled ? "bg-red-500" : "bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            autoKillEnabled ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-200">🧠 Intelligent Mode (CPU/GPU {'>'}85%)</p>
                          <p className="text-xs text-slate-500">Predictive process management and prevention</p>
                        </div>
                        <button 
                          onClick={() => setIntelligentMode(!intelligentMode)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            intelligentMode ? "bg-purple-500" : "bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                            intelligentMode ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-green-400">AUTOMATION STATUS</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500">Critical Protection</p>
                            <p className={cn("font-bold", autoKillEnabled ? "text-red-400" : "text-slate-600")}>
                              {autoKillEnabled ? "🔥 ACTIVE" : "❌ DISABLED"}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Intelligent Mode</p>
                            <p className={cn("font-bold", intelligentMode ? "text-purple-400" : "text-slate-600")}>
                              {intelligentMode ? "🧠 ACTIVE" : "❌ DISABLED"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-4 border border-blue-500/20">
                        <h5 className="text-xs font-bold text-blue-400 mb-2">🚀 AUTOMATION LEVELS</h5>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">🔥 Level 1: Critical ({'>'}95%)</span>
                            <span className="text-red-400 font-bold">5s cooldown</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">🧠 Level 2: Intelligent ({'>'}85%)</span>
                            <span className="text-purple-400 font-bold">15s cooldown</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">💾 Level 3: Memory ({'>'}90%)</span>
                            <span className="text-green-400 font-bold">20s cooldown</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="bento-card overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">Active Processes</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-400">LIVE</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {processes.length} processes • Updates every 2s
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search processes..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-blue/50 w-64"
                    />
                  </div>
                  <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-4 py-3">Process Name</th>
                      <th className="px-4 py-3">PID</th>
                      <th className="px-4 py-3">CPU %</th>
                      <th className="px-4 py-3">Memory</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {processes.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((proc, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                              {proc.name[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-200">{proc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-400 font-mono">{proc.pid}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden max-w-[60px]">
                              <div 
                                className={`h-full transition-colors ${
                                  proc.cpu > 80 ? 'bg-red-500' : 
                                  proc.cpu > 50 ? 'bg-yellow-500' : 
                                  'bg-brand-blue'
                                }`} 
                                style={{ width: `${Math.min(100, proc.cpu)}%` }} 
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              proc.cpu > 80 ? 'text-red-400' : 
                              proc.cpu > 50 ? 'text-yellow-400' : 
                              'text-slate-300'
                            }`}>
                              {proc.cpu.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-400">{proc.mem}</td>
                        <td className="px-4 py-4">
                          <span className="px-2 py-1 bg-brand-emerald/10 text-brand-emerald text-[10px] font-bold rounded-full border border-brand-emerald/20">
                            {proc.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button 
                            onClick={() => handleKillProcess(proc.pid, proc.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded-lg hover:bg-brand-red/20 transition-all border border-brand-red/20"
                            title="Kill Process"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            KILL
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">Network Interfaces</h3>
                <div className="space-y-4">
                  <NetworkInterface 
                    name="Ethernet" 
                    status="Connected" 
                    up="12.4 Mbps" 
                    down="84.2 Mbps" 
                    icon={<NetworkIcon className="h-5 w-5" />} 
                  />
                  <NetworkInterface 
                    name="Wi-Fi (Home_5G)" 
                    status="Connected" 
                    up="4.1 Mbps" 
                    down="42.8 Mbps" 
                    icon={<Wifi className="h-5 w-5" />} 
                  />
                  <NetworkInterface 
                    name="Bluetooth" 
                    status="Disconnected" 
                    up="0 Mbps" 
                    down="0 Mbps" 
                    icon={<Activity className="h-5 w-5" />} 
                  />
                </div>
              </div>
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">Traffic Analysis</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      />
                      <Line type="monotone" dataKey="network" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">Agent Configuration</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Real System Monitoring</p>
                      <p className="text-xs text-slate-500">
                        {useRealSystem 
                          ? 'Monitor actual system metrics and processes' 
                          : 'Use simulation mode for testing and demonstration'
                        }
                      </p>
                    </div>
                    <button 
                      onClick={() => setUseRealSystem(!useRealSystem)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        useRealSystem ? "bg-brand-emerald" : "bg-brand-blue"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        useRealSystem ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  
                  {useRealSystem && (
                    <div className="p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="h-4 w-4 text-brand-emerald" />
                        <span className="text-sm font-bold text-brand-emerald">Real System Mode Active</span>
                      </div>
                      <p className="text-xs text-slate-400">AutoHealX is monitoring your actual system metrics and can take real actions to optimize performance.</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        {useRealSystem ? 'Real-time Monitoring' : 'Simulation Agent'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {useRealSystem 
                          ? 'Enable or disable real system monitoring' 
                          : 'Enable or disable the metric simulation agent'
                        }
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsSimulating(!isSimulating)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        isSimulating ? "bg-brand-blue" : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        isSimulating ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Autonomous Mode</p>
                      <p className="text-xs text-slate-500">Allow agent to automatically resolve critical issues</p>
                    </div>
                    <button 
                      onClick={toggleDeviceMode}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        selectedDevice?.mode === 'auto' ? "bg-brand-emerald" : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        selectedDevice?.mode === 'auto' ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-slate-200">Simulation Panel</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          isHighCpuForced ? "text-brand-red animate-pulse" : "text-brand-emerald"
                        )}>
                          {isHighCpuForced ? 'High Load Active' : 'Normal'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => setIsHighCpuForced(!isHighCpuForced)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all font-bold text-xs",
                          isHighCpuForced 
                            ? "bg-brand-red/10 border-brand-red/30 text-brand-red" 
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                        )}
                      >
                        {isHighCpuForced ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {isHighCpuForced ? 'Stop High CPU' : 'Simulate High CPU'}
                      </button>
                      <button 
                        onClick={() => sendCommand('STRESS_TEST')}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:bg-white/10 transition-all font-bold text-xs"
                      >
                        <Zap className="h-4 w-4" />
                        Full Stress Test
                      </button>
                      <button 
                        onClick={() => {
                          // Create a high CPU process for testing FIX NOW
                          const testProcess: Process = {
                            name: 'test_high_cpu.exe',
                            pid: Math.floor(Math.random() * 10000) + 9000,
                            cpu: 95 + Math.random() * 5,
                            mem: '800 MB',
                            status: 'Running'
                          };
                          setProcesses(prev => [testProcess, ...prev]);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all font-bold text-xs"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Create High CPU
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <p className="text-sm font-bold text-slate-200 mb-4">Simulation Controls</p>
                    <div className="space-y-4">
                      {[
                        { label: 'CPU Load', value: cpuLoad, setter: setCpuLoad },
                        { label: 'Memory Load', value: memLoad, setter: setMemLoad },
                        { label: 'GPU Load', value: gpuLoad, setter: setGpuLoad },
                        { label: 'Network Load', value: netLoad, setter: setNetLoad },
                      ].map((ctrl, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                            <span>{ctrl.label}</span>
                            <span>{ctrl.value.toFixed(0)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={ctrl.value} 
                            onChange={(e) => ctrl.setter(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏆 MANUAL OVERRIDE CONTROLS */}
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">🎛️ User Control Panel</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-200">Manual Override Mode</p>
                      <p className="text-xs text-slate-500">Disable all automatic actions and require manual approval</p>
                    </div>
                    <button 
                      onClick={() => setManualOverride(!manualOverride)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        manualOverride ? "bg-brand-amber" : "bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        manualOverride ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  
                  {manualOverride && (
                    <div className="p-4 bg-brand-amber/10 border border-brand-amber/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-brand-amber" />
                        <span className="text-sm font-bold text-brand-amber">Manual Override Active</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        All automatic healing actions are disabled. You have full control over system operations.
                        {useRealSystem && ' Real system monitoring continues but no automatic actions will be taken.'}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-sm font-bold text-slate-200 mb-4">Automation Levels</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Critical Auto-Kill (&gt;95%)</p>
                          <p className="text-xs text-slate-500">
                            Automatically terminate processes at critical CPU/GPU levels
                            {useRealSystem && ' - ⚠️ REAL SYSTEM ACTIONS'}
                          </p>
                        </div>
                        <button 
                          onClick={() => setAutoKillEnabled(!autoKillEnabled)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            autoKillEnabled ? "bg-brand-red" : "bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                            autoKillEnabled ? "left-5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-slate-200">Intelligent Prevention (&gt;85%)</p>
                          <p className="text-xs text-slate-500">
                            Predictive actions before critical thresholds
                            {useRealSystem && ' - ⚠️ REAL SYSTEM ACTIONS'}
                          </p>
                        </div>
                        <button 
                          onClick={() => setIntelligentMode(!intelligentMode)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-all relative",
                            intelligentMode ? "bg-brand-blue" : "bg-slate-800"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                            intelligentMode ? "left-5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🏆 PREVENTIVE ACTIONS SYSTEM */}
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">⚡ Preventive Action System</h3>
                <div className="space-y-4">
                  {preventiveActions.length === 0 ? (
                    <div className="text-center py-8">
                      <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No preventive actions suggested</p>
                      <p className="text-slate-500 text-xs">System is running optimally</p>
                    </div>
                  ) : (
                    preventiveActions.map((action, index) => (
                      <div key={index} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-brand-emerald/10 text-brand-emerald rounded-lg">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-200 leading-relaxed">{action}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-1 bg-brand-emerald/10 text-brand-emerald text-xs font-bold rounded-full border border-brand-emerald/20">
                                RECOMMENDED
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  <button 
                    onClick={() => suggestPreventiveActions(systemHealthScore, trendData)}
                    className="w-full px-4 py-3 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-xl font-bold text-sm hover:bg-brand-blue/20 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Analyze & Suggest Actions
                  </button>
                </div>
              </div>

              {/* 🏆 ROOT CAUSE ANALYSIS */}
              <div className="bento-card">
                <h3 className="text-lg font-bold text-white mb-6">🔍 {t('rootCause')}</h3>
                <div className="space-y-4">
                  {Object.keys(rootCauseAnalysis).length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">No root cause analysis available</p>
                      <p className="text-slate-500 text-xs">Analysis will appear when issues are detected</p>
                    </div>
                  ) : (
                    Object.entries(rootCauseAnalysis).map(([alertType, analysis]) => (
                      <div key={alertType} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-brand-red/10 text-brand-red text-xs font-bold rounded-full border border-brand-red/20">
                            {alertType}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{analysis}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bento-card border-brand-red/20">
                <h3 className="text-lg font-bold text-brand-red mb-4">Danger Zone</h3>
                <p className="text-sm text-slate-400 mb-6">Once you delete a device, all its metrics and history will be permanently removed.</p>
                <button 
                  onClick={() => selectedDeviceId && deleteDevice(selectedDeviceId)}
                  className="px-6 py-3 bg-brand-red/10 text-brand-red border border-brand-red/20 rounded-xl font-bold text-sm hover:bg-brand-red/20 transition-all flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Device
                </button>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <Brain className="h-4 w-4 text-brand-emerald" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">AI-Powered Insights</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledgeBase.map((entry) => (
                  <div key={entry.id} className="bento-card group hover:border-brand-blue/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase tracking-widest rounded-lg border border-brand-blue/20">
                        {entry.category}
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Confidence</span>
                        <span className="text-xs font-bold text-brand-emerald">{entry.confidence}%</span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{entry.title}</h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{entry.description}</p>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Recommended Solution</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{entry.solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏆 AI INTELLIGENCE TAB - EXPLAINABLE DECISIONS & CONFIDENCE SCORES */}
          {activeTab === 'intelligence' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">🧠 AI Intelligence Center</h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-purple-400">ADVANCED AI</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {decisionExplanations.length} Decisions Explained
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 🏆 EXPLAINABLE DECISIONS */}
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-white">🔍 Decision Explanations</h3>
                    <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                      <span className="text-xs font-medium text-blue-400">REAL-TIME</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {decisionExplanations.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No decisions made yet</p>
                        <p className="text-slate-500 text-xs">AI explanations will appear here</p>
                      </div>
                    ) : (
                      decisionExplanations.map((explanation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-slate-700/30 rounded-xl border border-slate-600"
                        >
                          <p className="text-sm text-slate-200 leading-relaxed">{explanation}</p>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* 🏆 CONFIDENCE SCORES */}
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-white">📊 Confidence Scores</h3>
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <span className="text-xs font-medium text-green-400">LEARNING</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(confidenceScores).map(([action, confidence]) => (
                      <div key={action} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-200">
                            {action.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={cn(
                            "text-sm font-bold",
                            confidence >= 90 ? "text-green-400" :
                            confidence >= 75 ? "text-yellow-400" : "text-red-400"
                          )}>
                            {confidence}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              confidence >= 90 ? "bg-green-500" :
                              confidence >= 75 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${confidence}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Based on {Math.floor(confidence / 10)} successful operations
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 🏆 TREND ANALYSIS */}
              <div className="bento-card">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-lg font-bold text-white">📈 Trend Analysis Engine</h3>
                  <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <span className="text-xs font-medium text-orange-400">PREDICTIVE</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">CPU Trend</h4>
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {trendData.cpu.length > 0 ? trendData.cpu[trendData.cpu.length - 1]?.toFixed(1) : '0'}%
                    </div>
                    <p className="text-xs text-slate-400">
                      {trendData.cpu.length >= 2 ? (
                        trendData.cpu[trendData.cpu.length - 1] > trendData.cpu[trendData.cpu.length - 2] ? 
                        '↗️ Increasing' : '↘️ Decreasing'
                      ) : 'Monitoring...'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">Memory Trend</h4>
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {trendData.memory.length > 0 ? trendData.memory[trendData.memory.length - 1]?.toFixed(1) : '0'}%
                    </div>
                    <p className="text-xs text-slate-400">
                      {trendData.memory.length >= 2 ? (
                        trendData.memory[trendData.memory.length - 1] > trendData.memory[trendData.memory.length - 2] ? 
                        '↗️ Increasing' : '↘️ Decreasing'
                      ) : 'Monitoring...'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">Prediction</h4>
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {trendData.cpu.length >= 3 ? (
                        trendData.cpu[trendData.cpu.length - 1] > trendData.cpu[trendData.cpu.length - 3] ? 
                        'Alert' : 'Stable'
                      ) : 'Learning'}
                    </div>
                    <p className="text-xs text-slate-400">Next 30 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Action History</h2>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{actionLogs.length} Events Logged</span>
              </div>

              <div className="bento-card">
                <div className="space-y-4">
                  {actionLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <History className="h-12 w-12 mb-2 opacity-20" />
                      <p className="text-sm">No actions recorded yet</p>
                    </div>
                  ) : (
                    actionLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
                        <div className={cn(
                          "p-2 rounded-xl",
                          log.result === 'success' ? "bg-brand-emerald/10 text-brand-emerald" : "bg-brand-red/10 text-brand-red"
                        )}>
                          {log.result === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-white">{log.action}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{log.details}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border",
                              log.result === 'success' ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20" : "bg-brand-red/10 text-brand-red border-brand-red/20"
                            )}>
                              {log.result}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🏆 DEVICE PAIRING TAB - Multi-device monitoring */}
          {activeTab === 'pairing' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white">🔗 {t('devicePairing')}</h2>
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-blue-400">SECURE LINKING</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {devices.length} Devices Connected
                  </span>
                  <button 
                    onClick={generatePairingCode}
                    className="px-4 py-2 bg-brand-blue text-white text-sm font-bold rounded-xl hover:bg-brand-blue/80 transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Generate Pairing Code
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pairing Code Generator */}
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-white">📱 Device Pairing</h3>
                    <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                      <span className="text-xs font-medium text-green-400">SECURE</span>
                    </div>
                  </div>
                  
                  {isPairingMode ? (
                    <div className="text-center space-y-6">
                      <div className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl">
                        <h4 className="text-sm font-bold text-slate-300 mb-4">Pairing Code</h4>
                        <div className="text-4xl font-bold text-white font-mono tracking-widest mb-2">
                          {pairingCode}
                        </div>
                        <p className="text-xs text-slate-400">Enter this code on your device to connect</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Code expires in 5 minutes</span>
                      </div>
                      <button 
                        onClick={() => {setIsPairingMode(false); setPairingCode('');}}
                        className="px-4 py-2 bg-slate-700 text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-600 transition-all"
                      >
                        Cancel Pairing
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Monitor className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-300 mb-2">Connect New Device</h4>
                      <p className="text-sm text-slate-400 mb-6">Generate a secure pairing code to connect additional devices to your AutoHealX network</p>
                      <button 
                        onClick={generatePairingCode}
                        className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/80 transition-all flex items-center gap-2 mx-auto"
                      >
                        <Zap className="h-4 w-4" />
                        Start Pairing Process
                      </button>
                    </div>
                  )}
                </div>

                {/* Connected Devices */}
                <div className="bento-card">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-lg font-bold text-white">🖥️ Connected Devices</h3>
                    <span className="px-2 py-1 bg-brand-emerald/10 text-brand-emerald text-xs font-bold rounded-full border border-brand-emerald/20">
                      {devices.length} Active
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {devices.map((device) => (
                      <div key={device.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600 group hover:border-brand-blue/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg">
                              <Monitor className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">{device.name}</h4>
                              <p className="text-xs text-slate-500">ID: {device.id.slice(-8)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              device.status === 'active' ? "bg-green-400 animate-pulse" : "bg-slate-500"
                            )} />
                            <span className={cn(
                              "text-xs font-bold uppercase",
                              device.status === 'active' ? "text-green-400" : "text-slate-500"
                            )}>
                              {device.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Last seen: {new Date(device.lastSeen).toLocaleString()}</span>
                          <span className="px-2 py-1 bg-slate-800 rounded-lg font-mono">
                            Mode: {device.mode.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-device Overview */}
              <div className="bento-card">
                <div className="flex items-center gap-3 mb-6">
                  <h3 className="text-lg font-bold text-white">📊 Multi-Device Overview</h3>
                  <div className="flex items-center gap-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    <span className="text-xs font-medium text-purple-400">CENTRALIZED</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">Total Devices</h4>
                    <div className="text-3xl font-bold text-blue-400 mb-1">{devices.length}</div>
                    <p className="text-xs text-slate-400">Connected to network</p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">Active Monitoring</h4>
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {devices.filter(d => d.status === 'active').length}
                    </div>
                    <p className="text-xs text-slate-400">Real-time monitoring</p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                    <h4 className="text-sm font-bold text-slate-200 mb-2">Auto-Heal Mode</h4>
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {devices.filter(d => d.mode === 'auto').length}
                    </div>
                    <p className="text-xs text-slate-400">Autonomous healing</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Device Modal */}
      <AnimatePresence>
        {isAddingDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Register Device</h2>
              <p className="text-slate-400 text-sm mb-6">Enter the name of the device you want to monitor.</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Device Name</label>
                  <input 
                    type="text" 
                    value={newDeviceName}
                    onChange={(e) => setNewDeviceName(e.target.value)}
                    placeholder="e.g. Main Server, Laptop-X1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsAddingDevice(false)}
                    className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddDevice}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                  >
                    Register
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-xl border shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-900/90 border-green-500/20 text-green-100' 
                : 'bg-red-900/90 border-red-500/20 text-red-100'
            } backdrop-blur-sm`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PerformanceChart({ title, data, dataKey, color }: { title: string, data: any[], dataKey: string, color: string }) {
  const hasData = data && data.length > 0;
  
  const stats = React.useMemo(() => {
    if (!hasData) return { max: 0, avg: 0 };
    const values = data.map(d => d[dataKey] || 0);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { max, avg };
  }, [data, dataKey, hasData]);

  return (
    <div className="bento-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[8px] text-slate-500 uppercase font-bold">Max</p>
            <p className="text-xs font-bold text-slate-200 font-mono">{stats.max.toFixed(1)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-slate-500 uppercase font-bold">Avg</p>
            <p className="text-xs font-bold text-slate-200 font-mono">{stats.avg.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      <div className="h-[200px] w-full flex items-center justify-center relative">
        {!hasData ? (
          <div className="flex flex-col items-center gap-2 text-slate-600">
            <Activity className="h-8 w-8 animate-pulse" />
            <p className="text-xs font-medium">Waiting for agent data...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(val) => val?.toDate ? format(val.toDate(), 'HH:mm') : ''}
                stroke="#475569"
                fontSize={8}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelFormatter={(label) => label?.toDate ? format(label.toDate(), 'HH:mm:ss') : 'Unknown'}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${dataKey})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function NetworkInterface({ name, status, up, down, icon }: { name: string, status: string, up: string, down: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-brand-blue/30 transition-all">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-brand-blue transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-200">{name}</p>
          <p className={cn("text-[10px] font-bold uppercase", status === 'Connected' ? "text-brand-emerald" : "text-slate-500")}>{status}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="flex items-center gap-1 text-brand-emerald">
            <ArrowDownRight className="h-3 w-3" />
            <span className="text-xs font-bold font-mono">{down}</span>
          </div>
          <p className="text-[8px] text-slate-500 uppercase font-bold">Download</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-brand-blue">
            <ArrowUpRight className="h-3 w-3" />
            <span className="text-xs font-bold font-mono">{up}</span>
          </div>
          <p className="text-[8px] text-slate-500 uppercase font-bold">Upload</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color }: { label: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-brand-blue/10 text-brand-blue border-brand-blue/20",
    purple: "bg-brand-purple/10 text-brand-purple border-brand-purple/20",
    amber: "bg-brand-amber/10 text-brand-amber border-brand-amber/20",
    emerald: "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20",
    pink: "bg-brand-pink/10 text-brand-pink border-brand-pink/20",
    indigo: "bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20",
  };

  return (
    <div className="glass-card glass-card-hover p-6 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={cn("p-2.5 rounded-xl border", colorClasses[color])}>
          {icon}
        </div>
        <span className={cn(
          "text-[10px] font-bold px-2 py-1 rounded-full",
          trend.startsWith('+') ? "bg-brand-red/10 text-brand-red" : 
          trend.startsWith('-') ? "bg-brand-emerald/10 text-brand-emerald" : 
          "bg-white/5 text-slate-400"
        )}>
          {trend}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1 relative z-10">{label}</p>
      <h4 className="text-3xl font-bold text-white tabular-nums relative z-10 tracking-tight">{value}</h4>
    </div>
  );
}

function ActionButton({ label, icon, onClick }: { label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-950/50 border border-white/5 rounded-2xl hover:bg-brand-blue/5 hover:border-brand-blue/30 text-slate-400 hover:text-brand-blue transition-all group relative overflow-hidden"
    >
      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-blue/10 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
    </button>
  );
}
