import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Info, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

interface UserProfile {
  id: string;
  uid: string;
  email: string;
  role: 'admin' | 'developer' | 'viewer' | 'security';
  displayName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function UserList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    return unsubscribe;
  }, []);

  const handleRoleUpdate = async (id: string, role: string) => {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        role,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-gray-500 font-mono text-xs uppercase tracking-widest">Initialising User Directory...</div>;
  }

  return (
    <div className="bg-card border border-border p-6 rounded-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
           <div className="flex items-center gap-2 text-primary font-mono text-[11px] mb-1">
              <span>//</span>
              <span>AUTOHEALX_AUTH_DIR</span>
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Access Control</h2>
           <p className="text-[10px] text-gray-500 font-mono mt-1 tracking-widest uppercase">// active node operators</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-[11px]">
          <thead>
            <tr className="text-secondary-foreground border-b border-border">
              <th className="py-3 px-4 font-normal tracking-widest">OPERATOR</th>
              <th className="py-3 px-4 font-normal tracking-widest">EMAIL</th>
              <th className="py-3 px-4 font-normal tracking-widest">STATUS</th>
              <th className="py-3 px-4 font-normal tracking-widest text-right">PERMISSIONS</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {users.map((user) => (
              <tr key={user.id} className="border-b border-secondary group hover:bg-foreground/5 transition-colors">
                <td className="py-4 px-4 flex items-center gap-2">
                   <Shield className={cn("w-3 h-3", user.role === 'admin' ? "text-primary" : "text-muted-foreground")} />
                   <span className="font-bold">{user.displayName || 'Unknown Node'}</span>
                </td>
                <td className="py-4 px-4 text-secondary-foreground">{user.email}</td>
                <td className="py-4 px-4">
                   <select 
                     value={user.status}
                     onChange={(e) => handleStatusUpdate(user.id, e.target.value)}
                     className={cn(
                       "px-2 py-1 rounded-[2px] text-[9px] font-bold tracking-widest uppercase bg-background border border-border outline-none",
                       user.status === 'approved' ? "text-primary border-primary/20" : 
                       user.status === 'pending' ? "text-yellow-400 border-yellow-400/20" :
                       "text-red-400 border-red-400/20"
                     )}
                   >
                     <option value="pending">pending</option>
                     <option value="approved">approved</option>
                     <option value="rejected">rejected</option>
                   </select>
                </td>
                <td className="py-4 px-4 text-right">
                   <select 
                     className="bg-[#0B0C0E] border border-[#2D3139] text-[10px] px-3 py-1.5 rounded-sm outline-none focus:border-[#00FFC2] appearance-none text-center cursor-pointer uppercase font-bold tracking-widest"
                     value={user.role}
                     onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                   >
                      <option value="admin">admin</option>
                      <option value="developer">developer</option>
                      <option value="security">security</option>
                      <option value="viewer">viewer</option>
                   </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-[#00FFC2] font-mono text-[10px] opacity-40">
         <Info className="w-3 h-3" />
         <span>SEC_LEVEL: 04 • RBAC_SYNC_ACTIVE • NODE_HEARTBEAT_OK</span>
      </div>
    </div>
  );
}
