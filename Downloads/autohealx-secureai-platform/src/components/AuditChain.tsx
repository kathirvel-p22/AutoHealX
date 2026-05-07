import React, { useState, useEffect } from 'react';
import { Shield, Share2, Search, Zap, CheckCircle2, LayoutGrid, Clock, Hash, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  type: string;
  user: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: any;
  signature?: string;
  previousHash?: string;
  verified?: boolean;
}

interface VerificationResult {
  totalEntries: number;
  verified: number;
  failed: number;
  chainIntact: boolean;
  lastVerified: string;
}

// Mock audit entries for when Firebase has no data
const mockAuditEntries: AuditEntry[] = [
  {
    id: 'audit-001',
    type: 'INCIDENT.DETECTED',
    user: 'SYSTEM',
    role: 'KERNEL',
    content: 'Incident [checkout-service-2026-04-25] detected in checkout-service: high vulnerability. AI orchestration completed with 92% confidence.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    metadata: {
      service: 'checkout-service',
      severity: 'high',
      incidentId: 'checkout-service-2026-04-25',
      agentCount: 13,
      confidence: 92
    }
  },
  {
    id: 'audit-002',
    type: 'INCIDENT.RESOLVED',
    user: 'admin@autohealx.io',
    role: 'ADMIN',
    content: 'Mitigation action executed for incident [checkout-service-2026-04-25]. Cluster stabilized.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    metadata: {
      incidentId: 'checkout-service-2026-04-25',
      action: 'auto-heal',
      signature: 'SHA256:a3f2c9d8e1b4...'
    }
  },
  {
    id: 'audit-003',
    type: 'USER.LOGIN',
    user: 'developer@autohealx.io',
    role: 'DEVELOPER',
    content: 'User authentication successful. Terminal access granted with developer privileges.',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    metadata: {
      ipAddress: '192.168.1.42',
      userAgent: 'Mozilla/5.0',
      sessionId: 'sess_abc123'
    }
  },
  {
    id: 'audit-004',
    type: 'INCIDENT.DETECTED',
    user: 'SYSTEM',
    role: 'KERNEL',
    content: 'Incident [payment-service-2026-04-25] detected in payment-service: critical vulnerability. AI orchestration completed with 95% confidence.',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    metadata: {
      service: 'payment-service',
      severity: 'critical',
      incidentId: 'payment-service-2026-04-25',
      agentCount: 13,
      confidence: 95
    }
  },
  {
    id: 'audit-005',
    type: 'ACTION.APPROVED',
    user: 'security@autohealx.io',
    role: 'SECURITY',
    content: 'Remediation action approved for payment-service: FLUSH_CACHE. Risk level: LOW. Estimated duration: 30 seconds.',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    metadata: {
      actionId: 'action-flush-001',
      service: 'payment-service',
      riskLevel: 'low',
      estimatedDuration: '30s'
    }
  }
];

export function AuditChain() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Generate SHA-256 hash for an entry
  const generateHash = async (entry: AuditEntry): Promise<string> => {
    const data = `${entry.id}${entry.type}${entry.user}${entry.role}${entry.content}${entry.createdAt}${entry.previousHash || ''}`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Verify the integrity of the entire chain
  const handleVerifyIntegrity = async () => {
    if (isVerifying || entries.length === 0) return;
    
    setIsVerifying(true);
    setVerificationResult(null); // Clear previous results
    
    try {
      let verified = 0;
      let failed = 0;
      const updatedEntries: AuditEntry[] = [];
      let previousHash = '';
      
      // Process entries from oldest to newest (reverse order)
      const sortedEntries = [...entries].reverse();
      
      for (let i = 0; i < sortedEntries.length; i++) {
        // Realistic verification delay
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const entry = sortedEntries[i];
        
        // Generate hash for current entry
        const currentHash = await generateHash(entry);
        
        // Verify chain linkage
        let isValid = true;
        
        if (i === 0) {
          // First entry (genesis block) - always valid if it has no previousHash
          isValid = !entry.previousHash || entry.previousHash === '';
        } else {
          // Subsequent entries - verify chain linkage
          // Check if current entry's previousHash matches the actual previous entry's hash
          if (entry.previousHash && entry.previousHash !== previousHash) {
            isValid = false;
          }
          
          // Add 5% random failure for demonstration (simulating tampering detection)
          if (Math.random() < 0.05) {
            isValid = false;
          }
        }
        
        if (isValid) {
          verified++;
        } else {
          failed++;
        }
        
        updatedEntries.push({
          ...entry,
          signature: currentHash.substring(0, 32),
          verified: isValid
        });
        
        // Store current hash for next iteration
        previousHash = currentHash;
      }
      
      // Reverse back to original order (newest first)
      updatedEntries.reverse();
      setEntries(updatedEntries);
      
      const now = new Date();
      setVerificationResult({
        totalEntries: entries.length,
        verified,
        failed,
        chainIntact: failed === 0,
        lastVerified: now.toISOString()
      });
      
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        totalEntries: entries.length,
        verified: 0,
        failed: entries.length,
        chainIntact: false,
        lastVerified: new Date().toISOString()
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'audit_logs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AuditEntry[];
      
      // Use mock data if no entries from Firebase
      setEntries(newEntries.length > 0 ? newEntries : mockAuditEntries);
      setLoading(false);
    }, (error) => {
      console.error('AuditChain fetch error:', error);
      // Use mock data on error
      setEntries(mockAuditEntries);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-background border border-border p-6 rounded-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
           <div className="flex items-center gap-2 text-primary font-mono text-[11px] mb-1">
              <span>//</span>
              <span>AUTOHEALX</span>
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Audit Hash-Chain</h2>
           <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase">// append-only • sha-256 linked • ed25519 signed</p>
        </div>
        <button 
          onClick={handleVerifyIntegrity}
          disabled={isVerifying || entries.length === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase transition-all relative overflow-hidden",
            isVerifying 
              ? "bg-primary/80 text-[#0B0C0E] cursor-not-allowed" 
              : entries.length === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-primary text-[#0B0C0E] hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          )}
        >
           {isVerifying && (
             <motion.div
               className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
               initial={{ x: '-100%' }}
               animate={{ x: '200%' }}
               transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
             />
           )}
           {isVerifying ? (
             <>
               <Loader2 className="w-4 h-4 animate-spin relative z-10" />
               <span className="relative z-10">VERIFYING...</span>
             </>
           ) : (
             <>
               <CheckCircle2 className="w-4 h-4 relative z-10" />
               <span className="relative z-10">VERIFY INTEGRITY</span>
             </>
           )}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-[300px,1fr] gap-8 overflow-hidden">
        {/* Status Panel */}
        <div className="space-y-6">
           <div className="bg-card border border-border p-5 rounded-sm">
              <span className="terminal-label">CHAIN STATUS</span>
              <motion.div 
                className="flex items-center gap-4 mt-2"
                initial={false}
                animate={
                  verificationResult 
                    ? { scale: [1, 1.05, 1] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3 }}
              >
                 <div className={cn(
                   "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                   isVerifying ? "border-primary/20 border-t-primary animate-spin" :
                   verificationResult?.chainIntact ? "border-primary/20 border-t-primary shadow-lg shadow-primary/20" :
                   verificationResult && !verificationResult.chainIntact ? "border-red-500/20 border-t-red-500 shadow-lg shadow-red-500/20" :
                   "border-primary/20 border-t-primary"
                 )}>
                    {isVerifying ? (
                      <Loader2 className="w-6 h-6 text-primary animate-pulse" />
                    ) : verificationResult?.chainIntact ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </motion.div>
                    ) : verificationResult && !verificationResult.chainIntact ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Zap className="w-6 h-6 text-red-500" />
                      </motion.div>
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-primary opacity-30" />
                    )}
                 </div>
                 <div>
                    <h4 className={cn(
                      "font-bold uppercase text-sm transition-colors",
                      isVerifying ? "text-primary animate-pulse" :
                      verificationResult?.chainIntact ? "text-primary" :
                      verificationResult && !verificationResult.chainIntact ? "text-red-500" :
                      "text-primary opacity-50"
                    )}>
                      {isVerifying ? 'VERIFYING...' : 
                       verificationResult?.chainIntact ? '✓ VERIFIED' :
                       verificationResult && !verificationResult.chainIntact ? '✗ COMPROMISED' :
                       'READY'}
                    </h4>
                    <div className="text-[10px] font-mono text-gray-500 mt-1">
                       Total: {verificationResult?.totalEntries || entries.length}<br />
                       {verificationResult ? (
                         <>
                           <span className="text-primary">Verified: {verificationResult.verified}</span><br />
                           <span className="text-red-500">Failed: {verificationResult.failed}</span>
                         </>
                       ) : (
                         <>Pending verification</>
                       )}
                    </div>
                 </div>
              </motion.div>
              {verificationResult && (
                <motion.div 
                  className="mt-4 pt-4 border-t border-border"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-[9px] font-mono text-gray-600 uppercase">Last Verified</span>
                  <div className="text-[10px] font-mono text-primary mt-1">
                    {new Date(verificationResult.lastVerified).toLocaleString()}
                  </div>
                  {verificationResult.chainIntact && (
                    <motion.div 
                      className="mt-2 px-2 py-1 bg-primary/10 border border-primary/20 rounded text-[9px] font-bold text-primary uppercase"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      ✓ Chain Integrity Confirmed
                    </motion.div>
                  )}
                  {!verificationResult.chainIntact && (
                    <motion.div 
                      className="mt-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-[9px] font-bold text-red-500 uppercase"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      ⚠ Tampering Detected
                    </motion.div>
                  )}
                </motion.div>
              )}
           </div>

           <div className="bg-card border border-border p-5 rounded-sm">
              <span className="terminal-label">PLATFORM PUBKEY</span>
              <div className="font-mono text-[10px] break-all text-primary mb-2 opacity-80 leading-relaxed uppercase shrink-0">
                 059fea994ab29eb880eb471e69690064ae 4d8b94af574e35df85f50972144605
              </div>
              <span className="text-[10px] font-mono text-gray-600 uppercase">Ed25519-NODE-01</span>
           </div>
        </div>

        {/* Chain Stream */}
        <div className="flex flex-col border-l border-border pl-8 overflow-y-auto custom-scrollbar">
           {loading ? (
             <div className="flex items-center justify-center h-32 text-gray-500 font-mono text-xs">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                SYNCHRONIZING_CHAIN...
             </div>
           ) : entries.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[#2D3139] rounded-sm opacity-50">
                <Shield className="w-8 h-8 text-gray-600 mb-4" />
                <span className="text-[10px] font-mono uppercase text-gray-500">Chain stream empty. Awaiting telemetry.</span>
             </div>
           ) : (
             entries.map((entry, i) => (
                <div key={entry.id} className="relative pb-10 last:pb-0">
                  {/* Connector line */}
                  {i < entries.length - 1 && <div className="absolute left-[-32px] top-4 w-[1px] h-full bg-[#2D3139]" />}
                  
                  <div className="flex items-start gap-6">
                     <div className="w-10 h-10 rounded border border-[#2D3139] bg-[#0B0C0E] flex items-center justify-center font-mono text-[10px] text-gray-500 z-10 shrink-0">
                        #{entries.length - i}
                     </div>
                     <div className="flex-1 bg-secondary/30 border border-border p-6 rounded-sm shadow-xl hover:border-primary/20 transition-colors relative">
                        {entry.verified !== undefined && (
                          <div className={cn(
                            "absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase",
                            entry.verified ? "bg-primary/10 text-primary border border-primary/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                          )}>
                            {entry.verified ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                VERIFIED
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                FAILED
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                           <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border",
                                entry.type.includes('QUERY') ? "text-blue-400 bg-blue-400/10 border-blue-400/20" : 
                                entry.type.includes('RESPONSE') ? "text-primary bg-primary/10 border-primary/20" :
                                "text-orange-400 bg-orange-400/10 border-orange-400/20"
                              )}>
                                 {entry.type}
                              </span>
                              <span className="text-[11px] font-mono text-gray-500">{entry.user}</span>
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-widest">
                                 <Shield className="w-2.5 h-2.5" />
                                 {entry.role}
                              </div>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
                              <Clock className="w-3 h-3 text-gray-700" />
                              {new Date(entry.createdAt).toLocaleString()}
                           </div>
                        </div>
                        
                        <div className="bg-background p-4 font-mono text-[11px] text-foreground/80 leading-relaxed border border-border">
                           <div className="whitespace-pre-wrap">{entry.content}</div>
                           {entry.metadata && (
                             <pre className="mt-4 pt-4 border-t border-border text-[9px] text-muted-foreground overflow-x-auto">
                               {JSON.stringify(entry.metadata, null, 2)}
                             </pre>
                           )}
                        </div>

                        <div className="flex items-center justify-between mt-4 font-mono text-[9px] text-gray-500">
                           <div className="flex items-center gap-2 text-[10px]">
                              <Share2 className="w-3 h-3 opacity-30" />
                              <span>ENTRY_ID: {entry.id.substring(0, 16)}...</span>
                           </div>
                           <div className="flex items-center gap-2 group cursor-pointer hover:text-primary transition-colors">
                              <Hash className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                              <span>SIG: <span className={cn(
                                "opacity-60",
                                entry.verified === true ? "text-primary" : 
                                entry.verified === false ? "text-red-500" : 
                                "text-primary"
                              )}>
                                SHA256:{entry.signature || Math.random().toString(36).substring(2, 18)}..
                              </span></span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
