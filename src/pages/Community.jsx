import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { showNotification } from "../utils/native";
import { motion } from "framer-motion";
import { Send, Trophy, Clock, Dumbbell, Flame, Target, Users } from "lucide-react";

const Community = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isAtBottomRef = useRef(true);
  
  const userName = profile?.email ? profile.email.split('@')[0] : "Utilisateur";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
      
    if (!error && data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(current => [...current, payload.new]);
        if (payload.new.user_id !== user?.id) {
          showNotification(`Message de ${payload.new.user_email}`, payload.new.content);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Scroll down only if already at the bottom when a new message arrives
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distFromBottom < 60;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    setShowScrollTop(el.scrollTop > 120);
  };

  const scrollToTop = () => {
    chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage("");

    await supabase.from('messages').insert([
      {
        user_id: user.id,
        user_email: capitalizedName,
        content: messageText,
      }
    ]);
  };

  const renderWorkoutCard = (workoutData) => {
    if (!workoutData) return null;
    return (
      <div className="mt-2 glass-card p-3 border-blue-500/30 glow-blue text-left w-full sm:w-80">
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={16} className="text-amber-400" />
          <span className="text-xs font-black text-white uppercase tracking-wider">{workoutData.sessionTitle || "Séance"}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-black/20 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Tonnage</p>
            <p className="text-sm font-black text-blue-400">{workoutData.tonnage} kg</p>
          </div>
          <div className="bg-black/20 rounded-xl p-2 text-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Rang</p>
            <p className={`text-sm font-black ${workoutData.rank === 'super' ? 'text-amber-400' : workoutData.rank === 'medium' ? 'text-blue-400' : 'text-slate-400'}`}>
              {workoutData.rank === 'super' ? 'Légendaire' : workoutData.rank === 'medium' ? 'Solide' : 'Normal'}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          {workoutData.exercises?.slice(0,3).map((exo, i) => (
            <p key={i} className="text-[10px] text-slate-300 flex items-center gap-1.5 truncate">
              <Dumbbell size={10} className="text-slate-500 shrink-0" />
              {exo.name} <span className="text-slate-500 ml-auto">{exo.sets} séries</span>
            </p>
          ))}
          {workoutData.exercises?.length > 3 && (
            <p className="text-[9px] text-slate-500 italic text-center mt-1">+ {workoutData.exercises.length - 3} autres exercices</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container flex flex-col h-[calc(100dvh-60px)] sm:h-[calc(100dvh-80px)] !pb-[76px] sm:!pb-4">
      <div className="bg-orbs" />
      
      <div className="mb-4 shrink-0 flex items-center justify-between">
        <div>
          <p className="section-title"><Users size={20} className="text-blue-400"/>Communauté</p>
          <p className="text-sm text-slate-400 -mt-2">Partage tes perfs avec les autres</p>
        </div>
        <button 
          onClick={async () => {
            if (window.confirm("Es-tu sûr de vouloir vider toute la conversation ? Cette action est irréversible.")) {
              const { error } = await supabase.from('messages').delete().not('id', 'is', null);
              if (!error) setMessages([]);
              else alert("Erreur (As-tu bien configuré les droits RLS dans Supabase ?) : " + error.message);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-colors"
        >
          Vider le chat
        </button>
      </div>

      {/* Chat Messages — iOS scroll fix: overflow-y-scroll + overscrollBehavior:contain */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-scroll glass-card border-white/5 p-4 mb-4 space-y-4 relative"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", minHeight: 0 }}
        onScroll={handleScroll}
      >
        {/* Scroll to top button */}
        {showScrollTop && (
          <div className="sticky top-0 flex justify-center z-10 mb-2 pointer-events-none">
            <button
              onClick={scrollToTop}
              className="pointer-events-auto bg-slate-800/90 border border-slate-600/60 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              ↑ Remonter
            </button>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.user_id === user?.id;
          return (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <span className="text-[10px] text-slate-500 mb-1 ml-1 font-bold">{isMe ? 'Moi' : msg.user_email}</span>
              <div className={`max-w-[85%] rounded-2xl p-3 ${isMe ? 'bg-blue-600/20 border border-blue-500/30 text-white rounded-tr-sm' : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-tl-sm'}`}>
                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                {msg.workout_data && renderWorkoutCard(msg.workout_data)}
              </div>
              <span className="text-[8px] text-slate-600 mt-1 mr-1">{new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button when not at bottom */}
      {!isAtBottom && (
        <div className="flex justify-center mb-2">
          <button
            onClick={scrollToBottom}
            className="bg-blue-600/80 border border-blue-500/50 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm hover:bg-blue-600 transition-all flex items-center gap-1.5"
          >
            ↓ Nouveau message
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={sendMessage} className="shrink-0 flex gap-2">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Écris un message..."
          className="input-premium flex-1"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()}
          className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-700 transition-colors shrink-0"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Community;
