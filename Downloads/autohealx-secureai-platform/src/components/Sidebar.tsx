import React from 'react';
import { LayoutDashboard, AlertTriangle, ShieldCheck, LogOut, Terminal, Zap, Users, UserPlus, Sun, Moon, Network, Target, Shield } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../lib/localAuth';
import { useTheme } from '../lib/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'developer', 'viewer', 'security'] },
  { id: 'mission-control', label: 'Mission Control', icon: Target, roles: ['admin', 'developer', 'security', 'viewer'] },
  { id: 'topology', label: 'Topology', icon: Network, roles: ['admin', 'developer', 'security', 'viewer'] },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle, roles: ['admin', 'developer', 'security', 'viewer'] },
  { id: 'actions', label: 'Actions', icon: Zap, roles: ['admin', 'developer'] },
  { id: 'logs', label: 'Log Stream', icon: Terminal, roles: ['admin', 'developer', 'viewer'] },
  { id: 'audit', label: 'Audit Chain', icon: ShieldCheck, roles: ['admin', 'security', 'developer', 'viewer'] },
  { id: 'rbac', label: 'RBAC Users', icon: Users, roles: ['admin'] },
  { id: 'provisioning', label: 'Provisioning', icon: UserPlus, roles: ['admin'] },
];

export function Sidebar({ activeTab, setActiveTab, user, onLogout }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'viewer'));

  return (
    <div className="w-[220px] h-screen bg-card border-r border-border flex flex-col">
      <div className="p-6 pb-8">
        <h1 className="text-lg font-extrabold tracking-tighter text-primary">AUTOHEALX</h1>
        <div className="h-[2px] w-8 bg-primary mt-1" />
      </div>

      <nav className="flex-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-2.5 transition-all text-[13px]",
                isActive 
                  ? "bg-secondary text-primary border-l-2 border-primary" 
                  : "text-secondary-foreground hover:text-foreground hover:bg-foreground/5 border-l-2 border-transparent"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-secondary-foreground")} />
              <span className="font-semibold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-5 border-t border-border">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="terminal-label">System Health</span>
            <div className="text-xl font-bold text-primary tracking-tighter">99.98%</div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-sm bg-secondary text-secondary-foreground hover:text-primary border border-border transition-colors"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-secondary/50 border border-border rounded-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] text-foreground font-bold uppercase truncate">
                 {user?.displayName?.split(' ')[0] || 'OPERATOR'}
               </p>
               <p className="text-[9px] text-muted-foreground font-mono truncate">
                 {user?.email}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              {user?.role === 'admin' ? 'ADMINISTRATOR' :
               user?.role === 'developer' ? 'DEVELOPER' :
               user?.role === 'security' ? 'SECURITY OPS' :
               user?.role === 'viewer' ? 'VIEWER' :
               'OPERATOR'}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-[11px] text-secondary-foreground hover:text-red-400 font-mono transition-colors py-2 border border-border hover:border-red-400/50 rounded-sm"
        >
          <LogOut className="w-3 h-3" />
          TERMINAL_EXIT
        </button>
      </div>
    </div>
  );
}
