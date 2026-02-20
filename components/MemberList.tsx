
import React, { useState } from 'react';
import { Member, UserRole } from '../types';
import { Plus, Trash2, Search, Phone, Calendar, Users, Lock, Pencil, Save, X } from 'lucide-react';

interface MemberListProps {
  members: Member[];
  userRole: UserRole;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onUpdateMember: (id: string, updatedMember: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({ members, userRole, onAddMember, onUpdateMember, onDeleteMember }) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newMember, setNewMember] = useState({ 
    name: '', 
    phone: '', 
    joinDate: new Date().toISOString().split('T')[0],
    isSideFundMember: true
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: ''
  });

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.phone.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && newMember.name && newMember.phone) {
      onAddMember(newMember);
      setNewMember({ 
        name: '', 
        phone: '', 
        joinDate: new Date().toISOString().split('T')[0],
        isSideFundMember: true
      });
      setIsAdding(false);
    }
  };

  const handleStartEdit = (member: Member) => {
    setEditingId(member.id);
    setEditFormData({ name: member.name, phone: member.phone });
  };

  const handleSaveEdit = (id: string) => {
    onUpdateMember(id, editFormData);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center justify-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center space-x-3 p-4 bg-slate-100 rounded-2xl text-slate-600 text-xs font-bold border border-slate-200">
           <Lock className="w-4 h-4" />
           <span>Only Administrators can manage members.</span>
        </div>
      )}

      {isAdmin && isAdding && (
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-tight italic">Add New Member</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
              <input
                required
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
              <input
                required
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Mobile number"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Join Date</label>
                <input
                  type="date"
                  value={newMember.joinDate}
                  onChange={(e) => setNewMember(prev => ({ ...prev, joinDate: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors uppercase tracking-widest text-xs"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-colors relative overflow-hidden">
            {editingId === member.id ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-black text-sm"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => handleSaveEdit(member.id)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 inline-flex items-center justify-center space-x-1 py-2 bg-slate-100 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-200"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm italic">{member.name}</h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1 font-bold">
                        <Phone className="w-3 h-3 mr-1" />
                        {member.phone}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStartEdit(member)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center italic">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined: {new Date(member.joinDate).toLocaleDateString()}
                  </div>
                  <div className="px-2 py-1 bg-slate-50 rounded text-slate-500">
                    ID: {member.id}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {filteredMembers.length === 0 && !isAdding && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 italic uppercase">No members found</h3>
          <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-widest">Update your search or add a new member.</p>
        </div>
      )}
    </div>
  );
};
