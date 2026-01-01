
import React, { useState, useEffect } from 'react';
import { User, Lab, LabInventoryItem, RecurringSlot, MaintenanceRequest } from '../../types';
import { getAllLabs, updateLab, createLab, deleteLab, getLabInventory, addInventoryItem, removeInventoryItem, getRecurringSlots, addRecurringSlot, removeRecurringSlot, getSlotRules, updateSlotRules } from '../../services/labService';
import { getMaintenanceRequests, updateMaintenanceRequestStatus } from '../../services/maintenanceService';

interface Props {
  user: User;
}

const LabsManagementPage: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'LABS' | 'INVENTORY' | 'MAINTENANCE' | 'RULES'>('LABS');
  const [labs, setLabs] = useState<Lab[]>([]);
  
  // States for Lab Form Modal
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [labForm, setLabForm] = useState<Partial<Lab>>({});

  useEffect(() => {
    refreshLabs();
  }, []);

  const refreshLabs = () => {
    setLabs([...getAllLabs()]);
  };

  // --- Lab Actions ---
  const handleEditLab = (lab: Lab) => {
    setEditingLab(lab);
    setLabForm(lab);
    setIsLabModalOpen(true);
  };

  const handleCreateLab = () => {
    setEditingLab(null);
    setLabForm({ status: 'ACTIVE', features: [] });
    setIsLabModalOpen(true);
  };

  const handleDeleteLab = (id: string) => {
    if (window.confirm("Are you sure you want to delete this lab? This cannot be undone.")) {
      deleteLab(id);
      refreshLabs();
    }
  };

  const handleSaveLab = () => {
    if (!labForm.name || !labForm.location) return;
    
    if (editingLab) {
      updateLab(editingLab.id, labForm);
    } else {
      createLab({
        name: labForm.name!,
        capacity: labForm.capacity || 0,
        location: labForm.location!,
        status: labForm.status || 'ACTIVE',
        features: labForm.features || [],
        assignedFacultyId: labForm.assignedFacultyId,
        assignedFacultyName: labForm.assignedFacultyName
      });
    }
    setIsLabModalOpen(false);
    refreshLabs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Labs & Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage lab facilities, assets, and operational rules.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('LABS')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'LABS' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Labs Overview</button>
           <button onClick={() => setActiveTab('INVENTORY')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'INVENTORY' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Inventory</button>
           <button onClick={() => setActiveTab('MAINTENANCE')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'MAINTENANCE' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Maintenance Logs</button>
           <button onClick={() => setActiveTab('RULES')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'RULES' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Rules & Schedule</button>
        </div>
      </div>

      {activeTab === 'LABS' && (
        <>
          <div className="flex justify-end">
            <button onClick={handleCreateLab} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> Add New Lab
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map(lab => (
              <div key={lab.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group transition-colors">
                <div className={`h-2 w-full ${lab.status === 'ACTIVE' ? 'bg-green-500' : lab.status === 'MAINTENANCE' ? 'bg-orange-500' : 'bg-slate-500'}`}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{lab.name}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400"><i className="fa-solid fa-location-dot mr-1"></i> {lab.location}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${lab.status === 'ACTIVE' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800' : lab.status === 'MAINTENANCE' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-100 dark:border-orange-800' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-600'}`}>
                      {lab.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                     <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Capacity</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{lab.capacity} Systems</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase">Faculty</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{lab.assignedFacultyName || 'Unassigned'}</p>
                     </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-6">
                     {lab.features.map(f => (
                       <span key={f} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full border border-blue-100 dark:border-blue-800">{f}</span>
                     ))}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                     <button onClick={() => handleEditLab(lab)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600">
                        Edit Details
                     </button>
                     <button onClick={() => handleDeleteLab(lab.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <i className="fa-solid fa-trash-can"></i>
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'INVENTORY' && <InventoryView labs={labs} />}
      {activeTab === 'MAINTENANCE' && <MaintenanceLogsView />}
      {activeTab === 'RULES' && <RulesView labs={labs} />}

      {/* Lab Modal */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{editingLab ? 'Edit Lab' : 'Create New Lab'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Lab Name</label>
                <input type="text" value={labForm.name || ''} onChange={e => setLabForm({...labForm, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Capacity</label>
                   <input type="number" value={labForm.capacity || 0} onChange={e => setLabForm({...labForm, capacity: parseInt(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Status</label>
                   <select value={labForm.status} onChange={e => setLabForm({...labForm, status: e.target.value as any})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-white dark:bg-slate-700 dark:text-white">
                     <option value="ACTIVE">Active</option>
                     <option value="MAINTENANCE">Maintenance</option>
                     <option value="OFFLINE">Offline</option>
                   </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Location</label>
                <input type="text" value={labForm.location || ''} onChange={e => setLabForm({...labForm, location: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Assigned Faculty Name</label>
                <input type="text" value={labForm.assignedFacultyName || ''} onChange={e => setLabForm({...labForm, assignedFacultyName: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setIsLabModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded font-medium">Cancel</button>
                <button onClick={handleSaveLab} className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Save Lab</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Components ---

const InventoryView: React.FC<{ labs: Lab[] }> = ({ labs }) => {
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id || '');
  const [items, setItems] = useState<LabInventoryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, type: 'SYSTEM' as const });

  useEffect(() => {
    if (selectedLabId) setItems(getLabInventory(selectedLabId));
  }, [selectedLabId, labs]);

  const handleAddItem = () => {
    if (newItem.name) {
      addInventoryItem(selectedLabId, { ...newItem, status: 'WORKING' });
      setItems(getLabInventory(selectedLabId));
      setNewItem({ name: '', quantity: 1, type: 'SYSTEM' });
    }
  };

  const handleDeleteItem = (id: string) => {
    removeInventoryItem(selectedLabId, id);
    setItems(getLabInventory(selectedLabId));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white">Lab Inventory</h3>
        <select value={selectedLabId} onChange={e => setSelectedLabId(e.target.value)} className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white text-sm">
          {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
        <div className="md:col-span-2">
           <input type="text" placeholder="Item Name (e.g. Dell Monitor)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
           <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 text-sm bg-white dark:bg-slate-700 dark:text-white">
              <option value="SYSTEM">System</option>
              <option value="PROJECTOR">Projector</option>
              <option value="SOFTWARE">Software License</option>
              <option value="OTHER">Other</option>
           </select>
        </div>
        <button onClick={handleAddItem} className="bg-slate-800 dark:bg-slate-700 text-white rounded px-3 py-2 text-sm font-bold hover:bg-slate-900 dark:hover:bg-slate-600">Add Item</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.type}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{item.quantity}</td>
                <td className="px-4 py-3"><span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.status}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400"><i className="fa-solid fa-trash"></i></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500 italic">No inventory items recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MaintenanceLogsView: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceRequest[]>([]);

  useEffect(() => {
    refreshLogs();
  }, []);

  const refreshLogs = () => {
    setLogs(getMaintenanceRequests());
  };

  const handleStatusUpdate = (id: string, status: MaintenanceRequest['status']) => {
    updateMaintenanceRequestStatus(id, status);
    refreshLogs();
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
         <h3 className="font-bold text-slate-800 dark:text-white">Maintenance Request Log</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {logs.map(log => (
          <div key={log.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-white">{log.issueTitle}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{log.labName} • Reported by {log.facultyName}</p>
               </div>
               <div className="flex items-center gap-2">
                 {log.status === 'PENDING' && (
                   <button onClick={() => handleStatusUpdate(log.id, 'IN_PROGRESS')} className="text-[10px] border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold">Start</button>
                 )}
                 {log.status === 'IN_PROGRESS' && (
                   <button onClick={() => handleStatusUpdate(log.id, 'RESOLVED')} className="text-[10px] border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-2 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 font-bold">Resolve</button>
                 )}
                 <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : log.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                   {log.status.replace('_', ' ')}
                 </span>
               </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{log.description}</p>
          </div>
        ))}
        {logs.length === 0 && <div className="p-8 text-center text-slate-400 dark:text-slate-500">No maintenance requests found.</div>}
      </div>
    </div>
  );
};

const RulesView: React.FC<{ labs: Lab[] }> = ({ labs }) => {
  const [rules, setRules] = useState(getSlotRules());
  const [slots, setSlots] = useState<RecurringSlot[]>([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', label: '', isBlocked: false, labId: labs[0]?.id || '' });

  useEffect(() => {
    setSlots(getRecurringSlots());
  }, []);

  const handleUpdateRules = () => {
    updateSlotRules(rules);
    alert('Global time rules updated.');
  };

  const handleAddSlot = () => {
    if (newSlot.label && newSlot.labId) {
      addRecurringSlot(newSlot);
      setSlots(getRecurringSlots());
    }
  };

  const handleRemoveSlot = (id: string) => {
    removeRecurringSlot(id);
    setSlots(getRecurringSlots());
  };

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-fit">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Global Operating Hours</h3>
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Open Time</label>
                   <input type="time" value={rules.startTime} onChange={e => setRules({...rules, startTime: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Close Time</label>
                   <input type="time" value={rules.endTime} onChange={e => setRules({...rules, endTime: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Default Slot Duration (mins)</label>
                <input type="number" value={rules.slotDuration} onChange={e => setRules({...rules, slotDuration: parseInt(e.target.value)})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-3 py-2 dark:bg-slate-700 dark:text-white" />
             </div>
             <button onClick={handleUpdateRules} className="w-full bg-slate-800 dark:bg-slate-700 text-white rounded px-4 py-2 font-bold hover:bg-slate-900 dark:hover:bg-slate-600">Update Rules</button>
          </div>
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-4">Recurring Schedules</h3>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 mb-4 space-y-3">
             <div className="grid grid-cols-2 gap-2">
                <select value={newSlot.labId} onChange={e => setNewSlot({...newSlot, labId: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white">
                   {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <select value={newSlot.dayOfWeek} onChange={e => setNewSlot({...newSlot, dayOfWeek: parseInt(e.target.value)})} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-white">
                   {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <input type="time" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm dark:bg-slate-700 dark:text-white" />
                <input type="time" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm dark:bg-slate-700 dark:text-white" />
             </div>
             <input type="text" placeholder="Label (e.g. Maintenance)" value={newSlot.label} onChange={e => setNewSlot({...newSlot, label: e.target.value})} className="w-full border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm dark:bg-slate-700 dark:text-white" />
             <div className="flex items-center gap-2">
                <input type="checkbox" checked={newSlot.isBlocked} onChange={e => setNewSlot({...newSlot, isBlocked: e.target.checked})} className="dark:bg-slate-700" />
                <label className="text-sm text-slate-600 dark:text-slate-400">Block Booking</label>
             </div>
             <button onClick={handleAddSlot} className="w-full bg-blue-600 text-white rounded px-3 py-2 text-sm font-bold hover:bg-blue-700">Add Schedule</button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
             {slots.map(slot => (
                <div key={slot.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700 text-sm">
                   <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{slot.label} <span className="font-normal text-slate-500 dark:text-slate-400">({labs.find(l=>l.id===slot.labId)?.name})</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{DAYS[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}</p>
                   </div>
                   <button onClick={() => handleRemoveSlot(slot.id)} className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"><i className="fa-solid fa-xmark"></i></button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default LabsManagementPage;
