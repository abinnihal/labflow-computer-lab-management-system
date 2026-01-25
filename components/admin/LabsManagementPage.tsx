import React, { useState, useEffect } from 'react';
import { User, Lab, LabInventoryItem, RecurringSlot, MaintenanceRequest } from '../../types';
import {
  getAllLabs,
  updateLab,
  createLab,
  deleteLab,
  getLabInventory,
  addInventoryItem,
  removeInventoryItem,
  getRecurringSlots,
  addRecurringSlot,
  removeRecurringSlot,
  getSlotRules,
  updateSlotRules
} from '../../services/labService';
import { getMaintenanceRequests, updateMaintenanceRequestStatus } from '../../services/maintenanceService';

interface Props {
  user: User;
}

const LabsManagementPage: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'LABS' | 'INVENTORY' | 'MAINTENANCE' | 'RULES'>('LABS');
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  // Lab Form State
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [labForm, setLabForm] = useState<Partial<Lab>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // Maintenance Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceLab, setMaintenanceLab] = useState<Lab | null>(null);
  // NEW: Store specific date string instead of duration
  const [maintenanceUntil, setMaintenanceUntil] = useState('');

  useEffect(() => {
    refreshLabs();
  }, []);

  const refreshLabs = async () => {
    setLoading(true);
    const data = await getAllLabs();
    setLabs(data);
    setLoading(false);
  };

  // --- Maintenance Logic ---
  const openMaintenanceModal = (lab: Lab) => {
    if (lab.status === 'MAINTENANCE') {
      // If on, confirm turning off
      if (confirm(`Turn off maintenance mode for ${lab.name}?`)) {
        updateLab(lab.id, { status: 'ACTIVE', maintenanceUntil: '' });
        refreshLabs();
      }
    } else {
      // If off, open modal to set End Date
      setMaintenanceLab(lab);

      // Default to Tomorrow at 9:00 AM
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      defaultDate.setHours(9, 0, 0, 0);
      // Format to "YYYY-MM-DDTHH:mm" for input type="datetime-local"
      // Note: We need to adjust for local timezone offset manually or use a library, 
      // but for this demo, a simple ISO slice works for UTC/local approximation or manual entry.
      // A safer simple default is just the string:
      const isoString = defaultDate.toISOString().slice(0, 16);
      setMaintenanceUntil(isoString);

      setIsMaintenanceModalOpen(true);
    }
  };

  const handleStartMaintenance = async () => {
    if (!maintenanceLab || !maintenanceUntil) return;

    // Save the specific ISO date
    const finalDate = new Date(maintenanceUntil).toISOString();

    await updateLab(maintenanceLab.id, {
      status: 'MAINTENANCE',
      maintenanceUntil: finalDate
    });

    setIsMaintenanceModalOpen(false);
    refreshLabs();
  };

  // --- CRUD Logic ---
  const handleEditLab = (lab: Lab) => {
    setEditingLab(lab);
    setLabForm(lab);
    setErrorMsg('');
    setIsLabModalOpen(true);
  };

  const handleCreateLab = () => {
    setEditingLab(null);
    setLabForm({ status: 'ACTIVE', features: [] });
    setErrorMsg('');
    setIsLabModalOpen(true);
  };

  const handleDeleteLab = async (id: string) => {
    if (window.confirm("Delete this lab?")) {
      await deleteLab(id);
      refreshLabs();
    }
  };

  const handleSaveLab = async () => {
    if (!labForm.name || !labForm.location) {
      setErrorMsg("Name and Location required.");
      return;
    }
    try {
      const payload = {
        name: labForm.name!,
        capacity: labForm.capacity || 30,
        location: labForm.location!,
        status: labForm.status || 'ACTIVE',
        features: labForm.features || [],
        assignedFacultyId: labForm.assignedFacultyId || '',
        assignedFacultyName: labForm.assignedFacultyName || ''
      };
      if (editingLab) await updateLab(editingLab.id, payload);
      else await createLab(payload);
      setIsLabModalOpen(false);
      refreshLabs();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Labs & Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage facilities and assets.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-x-auto">
          {['LABS', 'INVENTORY', 'MAINTENANCE', 'RULES'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              {tab === 'LABS' ? 'Labs Overview' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'LABS' && (
        <>
          <div className="flex justify-end">
            <button onClick={handleCreateLab} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> Add New Lab
            </button>
          </div>

          {loading ? <div className="text-center py-10">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {labs.map(lab => (
                <div key={lab.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group">
                  {/* Status Bar */}
                  <div className={`h-2 w-full ${lab.status === 'ACTIVE' ? 'bg-green-500' : lab.status === 'MAINTENANCE' ? 'bg-orange-500' : 'bg-slate-500'}`}></div>

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{lab.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{lab.location}</p>
                      </div>

                      {/* Maintenance Toggle Switch */}
                      <div className="flex flex-col items-end gap-1">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={lab.status === 'MAINTENANCE'}
                            onChange={() => openMaintenanceModal(lab)}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {lab.status === 'MAINTENANCE' ? 'Maint. Mode' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Maintenance Info */}
                    {lab.status === 'MAINTENANCE' && lab.maintenanceUntil && (
                      <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-100 dark:border-orange-800">
                        <p className="text-xs text-orange-800 dark:text-orange-300 font-bold flex items-center gap-1">
                          <i className="fa-solid fa-clock"></i>
                          Until: {new Date(lab.maintenanceUntil).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400 text-xs font-bold uppercase">Capacity</p>
                        <p className="font-semibold dark:text-white">{lab.capacity}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded">
                        <p className="text-slate-400 text-xs font-bold uppercase">Faculty</p>
                        <p className="font-semibold dark:text-white truncate">{lab.assignedFacultyName || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => handleEditLab(lab)} className="flex-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">Edit</button>
                      <button onClick={() => handleDeleteLab(lab.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><i className="fa-solid fa-trash-can"></i></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* OTHER TABS */}
      {activeTab === 'INVENTORY' && <InventoryView labs={labs} />}
      {activeTab === 'MAINTENANCE' && <MaintenanceLogsView />}
      {activeTab === 'RULES' && <RulesView labs={labs} />}

      {/* Lab Modal */}
      {isLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{editingLab ? 'Edit Lab' : 'Create New Lab'}</h2>
            {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{errorMsg}</div>}
            <div className="space-y-4">
              <input type="text" placeholder="Lab Name" value={labForm.name || ''} onChange={e => setLabForm({ ...labForm, name: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" />
              <input type="text" placeholder="Location" value={labForm.location || ''} onChange={e => setLabForm({ ...labForm, location: e.target.value })} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" />
              <input type="number" placeholder="Capacity" value={labForm.capacity || ''} onChange={e => setLabForm({ ...labForm, capacity: parseInt(e.target.value) })} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" />
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setIsLabModalOpen(false)} className="px-4 py-2 text-slate-500">Cancel</button>
                <button onClick={handleSaveLab} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Date/Time Picker Modal for Maintenance */}
      {isMaintenanceModalOpen && maintenanceLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                <i className="fa-solid fa-calendar-xmark"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Schedule Maintenance</h3>
              <p className="text-sm text-slate-500">When will {maintenanceLab.name} be available again?</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Maintenance Ends At</label>
              <input
                type="datetime-local"
                value={maintenanceUntil}
                onChange={(e) => setMaintenanceUntil(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-bold dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
              <button onClick={handleStartMaintenance} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm">Confirm Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Components (Same as before) ---

const InventoryView: React.FC<{ labs: Lab[] }> = ({ labs }) => {
  const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id || '');
  const [items, setItems] = useState<LabInventoryItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, type: 'SYSTEM' as const });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLabId) fetchInventory();
    else if (labs.length > 0) setSelectedLabId(labs[0].id);
  }, [selectedLabId, labs]);

  const fetchInventory = async () => {
    if (!selectedLabId) return;
    setLoading(true);
    const data = await getLabInventory(selectedLabId);
    setItems(data);
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (newItem.name && newItem.quantity > 0 && selectedLabId) {
      await addInventoryItem(selectedLabId, { ...newItem, status: 'WORKING' });
      await fetchInventory();
      setNewItem({ name: '', quantity: 1, type: 'SYSTEM' });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!selectedLabId) return;
    if (window.confirm("Delete?")) {
      await removeInventoryItem(selectedLabId, id);
      await fetchInventory();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white">Inventory</h3>
        {labs.length > 0 && (
          <select value={selectedLabId} onChange={e => setSelectedLabId(e.target.value)} className="border p-2 rounded text-sm dark:bg-slate-700 dark:text-white">
            {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>
      {labs.length > 0 && (
        <>
          <div className="flex gap-4 mb-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <input type="text" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="flex-1 border p-2 rounded text-sm dark:bg-slate-700 dark:text-white" />
            <input type="number" min="1" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })} className="w-20 border p-2 rounded text-sm dark:bg-slate-700 dark:text-white" />
            <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as any })} className="border p-2 rounded text-sm dark:bg-slate-700 dark:text-white">
              <option value="SYSTEM">System</option>
              <option value="PROJECTOR">Projector</option>
              <option value="SOFTWARE">Software</option>
              <option value="OTHER">Other</option>
            </select>
            <button onClick={handleAddItem} className="bg-slate-800 text-white px-4 rounded text-sm font-bold">Add</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase font-bold text-slate-500">
                <tr><th className="p-3">Item</th><th className="p-3">Type</th><th className="p-3">Qty</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="p-3 font-medium dark:text-white">{item.name}</td>
                    <td className="p-3 text-slate-500">{item.type}</td>
                    <td className="p-3 text-slate-500">{item.quantity}</td>
                    <td className="p-3 text-right"><button onClick={() => handleDeleteItem(item.id)} className="text-red-500"><i className="fa-solid fa-trash"></i></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

const MaintenanceLogsView: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceRequest[]>([]);
  useEffect(() => { getMaintenanceRequests().then(setLogs); }, []);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6">
      <h3 className="font-bold text-slate-800 dark:text-white mb-4">Maintenance Logs</h3>
      <div className="divide-y">
        {logs.map(log => (
          <div key={log.id} className="py-4">
            <div className="flex justify-between"><span className="font-bold dark:text-white">{log.issueTitle}</span><span className="text-xs bg-slate-100 px-2 py-1 rounded">{log.status}</span></div>
            <p className="text-sm text-slate-500">{log.description}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-slate-400">No logs found.</p>}
      </div>
    </div>
  );
};

const RulesView: React.FC<{ labs: Lab[] }> = ({ labs }) => {
  const [rules, setRules] = useState(getSlotRules());
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border">
      <h3 className="font-bold dark:text-white mb-4">Slot Rules</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div><label className="text-xs font-bold text-slate-500">Open</label><input type="time" value={rules.startTime} onChange={e => { const r = { ...rules, startTime: e.target.value }; setRules(r); updateSlotRules(r); }} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" /></div>
        <div><label className="text-xs font-bold text-slate-500">Close</label><input type="time" value={rules.endTime} onChange={e => { const r = { ...rules, endTime: e.target.value }; setRules(r); updateSlotRules(r); }} className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" /></div>
      </div>
      <p className="text-xs text-slate-400">Changes auto-save locally for this session.</p>
    </div>
  );
};

export default LabsManagementPage;