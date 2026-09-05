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
      await fetchTeam();
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
        <div className="bg-surface border border-borderc rounded-xl p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Plus size={16} className="text-accent" /> Invitar a un Colaborador
          </h3>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={16} className="text-text-secondary" />
              </div>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colaborador@agencia.com" 
                required
                className="input-field pl-9 text-xs"
              />
            </div>
            <select 
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input-field w-full sm:w-auto text-xs cursor-pointer"
            >
              <option value="MANAGER">Manager</option>
              <option value="EDITOR">Editor</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button 
              type="submit" 
              disabled={inviting || !inviteEmail}
              className="w-full sm:w-auto bg-accent hover:bg-accent-hover text-white text-xs font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              {inviting ? <Loader2 size={15} className="animate-spin" /> : 'Enviar Invitación'}
            </button>
          </form>
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
        </div>
      )}

      {/* Lista de Miembros */}
      <div className="bg-surface border border-borderc rounded-xl overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-borderc bg-surface-raised">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users size={16} className="text-accent" /> Miembros del Equipo ({members.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-text-secondary text-xs">Cargando equipo...</div>
        ) : (
          <div className="divide-y divide-borderc">
            {members.map(m => (
              <div key={m.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-raised border border-borderc text-accent flex items-center justify-center font-bold text-xs">
                    {m.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{m.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono bg-surface-raised text-text-secondary px-1.5 py-0.5 rounded border border-borderc flex items-center gap-1">
                        <Shield size={9} /> {m.role}
                      </span>
                    </div>
                  </div>
                </div>
                {isAdmin && m.id !== user?.id && (
                  <button 
                    onClick={() => handleRemove(m.id)} 
                    className="p-1.5 text-text-secondary hover:text-danger rounded-md transition-colors"
                    title="Eliminar del equipo"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {invites.length > 0 && (
        <div className="bg-surface border border-borderc rounded-xl overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-borderc bg-surface-raised">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Invitaciones Pendientes ({invites.length})
            </h3>
          </div>
          <div className="divide-y divide-borderc">
            {invites.map(inv => (
              <div key={inv.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">{inv.email}</p>
                  <p className="text-[10px] text-text-secondary mt-0.5">Expira en 48 horas · Rol: {inv.role}</p>
                </div>
                <span className="text-[10px] font-medium text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/20">
                  Pendiente
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
