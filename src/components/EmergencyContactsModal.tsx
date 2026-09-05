import React, { useState } from 'react';
import { X, UserPlus, Phone, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EmergencyContact } from '../types';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: EmergencyContact[];
  onAddContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  onRemoveContact: (id: string) => void;
  onSetPrimary: (id: string) => void;
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onRemoveContact,
  onSetPrimary,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState<EmergencyContact['relationship']>('Parent');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      relationship,
      isPrimary: contacts.length === 0,
    });

    setName('');
    setPhone('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Trusted Emergency Contacts</h2>
              <p className="text-xs text-slate-400">Notified instantly if check-in is missed or SOS fires</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* List of Contacts */}
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No trusted contacts configured yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Add at least one person who will receive safety alerts.</p>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                        {c.relationship}
                      </span>
                      {c.isPrimary && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!c.isPrimary && (
                      <button
                        onClick={() => onSetPrimary(c.id)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 text-[10px] font-bold"
                        title="Set as Primary contact"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveContact(c.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Contact Form Toggle */}
          {isAdding ? (
            <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">New Emergency Contact</h4>
              <div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name (e.g. Mom, Sister, Sarah)"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Parent">Parent</option>
                  <option value="Partner">Partner</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Save Contact
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full bg-white border-2 border-dashed border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Emergency Contact</span>
            </button>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
