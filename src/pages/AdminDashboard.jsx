import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserX, UserCheck, Trash2, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchProfiles();
    }
  }, [profile]);

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    const { error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id);
      
    if (!error) {
      setProfiles(profiles.map(p => p.id === id ? { ...p, status } : p));
    } else {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
    setActionLoading(null);
  };

  const deleteProfile = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce compte ? Cela supprimera également toutes ses données.")) return;
    
    setActionLoading(id);
    // Note: Pour supprimer complètement le compte Auth, il faudrait utiliser la fonction Admin API (pas possible côté client).
    // Ici on supprime le profil. On peut aussi changer le status à 'deleted' pour bloquer l'accès.
    // Supprimer la ligne dans 'profiles' bloquera l'accès à l'app via nos vérifications.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setProfiles(profiles.filter(p => p.id !== id));
    } else {
      alert("Erreur lors de la suppression : " + error.message);
    }
    setActionLoading(null);
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <ShieldCheck className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Accès Refusé</h2>
          <p className="text-slate-400">Vous n'avez pas les droits d'administrateur.</p>
        </div>
      </div>
    );
  }

  const pendingProfiles = profiles.filter(p => p.status === 'pending');
  const activeProfiles = profiles.filter(p => p.status === 'active');

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Administration</h1>
          <p className="text-slate-400 mt-1">Gérez les accès à Iron Track</p>
        </div>
        <button 
          onClick={fetchProfiles}
          className="p-3 bg-slate-800 rounded-2xl text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Pending Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm">
            {pendingProfiles.length}
          </span>
          Demandes en attente
        </h2>
        
        {pendingProfiles.length === 0 ? (
          <p className="text-slate-500 text-center py-6">Aucune demande en attente.</p>
        ) : (
          <div className="space-y-3">
            {pendingProfiles.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl gap-4">
                <div>
                  <p className="text-white font-medium">{p.email}</p>
                  <p className="text-xs text-slate-500">Inscrit le {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    disabled={actionLoading === p.id}
                    onClick={() => updateStatus(p.id, 'active')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors text-sm font-bold"
                  >
                    <UserCheck size={16} /> Accepter
                  </button>
                  <button
                    disabled={actionLoading === p.id}
                    onClick={() => deleteProfile(p.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors text-sm font-bold"
                  >
                    <UserX size={16} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
            {activeProfiles.length}
          </span>
          Comptes Actifs
        </h2>
        
        <div className="space-y-3">
          {activeProfiles.map(p => (
            <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/50 rounded-2xl gap-4">
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  {p.email} 
                  {p.role === 'admin' && <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">Admin</span>}
                </p>
                <p className="text-xs text-slate-500">Inscrit le {new Date(p.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              
              {p.role !== 'admin' && (
                <button
                  disabled={actionLoading === p.id}
                  onClick={() => deleteProfile(p.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-sm font-bold w-full sm:w-auto"
                >
                  <Trash2 size={16} /> Supprimer
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
