import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, Mail, Trash2, Plus, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

export const TeamSettings = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('EDITOR');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/team');
      if (res.data.success) {
        setMembers(res.data.data.users);
        setInvites(res.data.data.pendingInvites);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      setError('');
      await api.post('/team/invite', { email: inviteEmail, role: inviteRole });
      setInviteEmail('');
      await fetchTeam(); // recargar
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al invitar al usuario');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar a este miembro del equipo?')) return;
    try {
      await api.delete(`/team/member/${userId}`);
      await fetchTeam();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      
      {isAdmin && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus size={20} /> Invitar Miembro
          </h3>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="correo@agencia.com" 
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50"
              />
            </div>
            <select 
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-900/50"
            >
              <option value="MANAGER">Manager</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button 
              type="submit" 
              disabled={inviting || !inviteEmail}
              className="w-full sm:w-auto btn-primary whitespace-nowrap"
            >
              {inviting ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Invitación'}
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} /> Miembros Activos
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {members.map(m => (
              <div key={m.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{m.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Shield size={10} /> {m.role}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && m.id !== user?.id && (
                  <button onClick={() => handleRemove(m.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden opacity-70">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              Invitaciones Pendientes
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invites.map(inv => (
              <div key={inv.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">{inv.email}</p>
                  <p className="text-xs text-slate-400 mt-1">Expira en 48 horas - Rol: {inv.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
