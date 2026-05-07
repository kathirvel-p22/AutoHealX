/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CheckCircle, XCircle, Clock, UserPlus, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccessRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  publicKey: string;
}

export function ProvisioningList() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'access-requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccessRequest));
      setRequests(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'access-requests');
    });

    return unsubscribe;
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // 1. Update the access request
      const requestRef = doc(db, 'access-requests', id);
      await updateDoc(requestRef, {
        status,
        updatedAt: new Date().toISOString()
      });

      // 2. Update the user profile to activate the account
      // In our new flow, the requestId is the uid
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        status,
        updatedAt: new Date().toISOString()
      });
      
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'access-requests');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tighter">Provisioning Queue</h2>
            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">Pending terminal enrollment requests</p>
         </div>
         <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-[2px]">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{requests.filter(r => r.status === 'pending').length} Pending</span>
         </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#15171A] border border-[#2D3139] p-5 rounded-sm flex items-center justify-between group hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded bg-[#0B0C0E] border border-[#2D3139] flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors">
                    <Shield className="w-6 h-6" />
                 </div>
                 
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-sm font-bold text-white tracking-tight uppercase">{request.firstName} {request.lastName}</h3>
                       <div className={cn(
                          "px-2 py-0.5 rounded-[2px] text-[9px] font-bold tracking-widest uppercase",
                          request.status === 'approved' ? "bg-primary/10 text-primary" :
                          request.status === 'rejected' ? "bg-red-500/10 text-red-400" :
                          "bg-yellow-500/10 text-yellow-400"
                       )}>
                          {request.status}
                       </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                       <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {request.email}</span>
                       <span className="flex items-center gap-1.5 opacity-50"><Clock className="w-3 h-3" /> {new Date(request.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-[9px] text-[#8E9299] font-bold uppercase tracking-widest bg-[#0B0C0E] w-fit px-2 py-0.5 border border-[#1C1F23]">
                       Designated Role: {request.role}
                    </div>
                 </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleStatusUpdate(request.id, 'rejected')}
                     className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                   >
                      <XCircle className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => handleStatusUpdate(request.id, 'approved')}
                     className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-[2px] text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-[#0B0C0E] transition-all flex items-center gap-2"
                   >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve enrollment
                   </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-[#2D3139] rounded">
             <UserPlus className="w-12 h-12 text-gray-700 mx-auto mb-4" />
             <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No enrollment requests in queue</p>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
