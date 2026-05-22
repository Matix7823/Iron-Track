import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { showNotification } from "../utils/native";
import { motion } from "framer-motion";
import { Send, Trophy, Clock, Dumbbell, Flame, Target, Users, ImagePlus, X, Loader2 } from "lucide-react";

const Community = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop lourde (max 5 Mo)");
        return;
      }
      setSelectedImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !user || isUploading) return;

    setIsUploading(true);
    let imageUrl = null;

    try {
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-photos')
          .upload(filePath, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('chat-photos')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const messageText = newMessage;
      setNewMessage("");
      removeImage();

      await supabase.from('messages').insert([
        {
          user_id: user.id,
          user_email: capitalizedName,
          content: messageText,
          image_url: imageUrl
        }
      ]);
    } catch (err) {
      console.error("Erreur lors de l'envoi :", err);
      alert("Erreur lors de l'envoi de l'image. As-tu bien configuré le bucket 'chat-photos' ?");
    } finally {
      setIsUploading(false);
    }
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
    <div className="flex flex-col h-[100dvh] pt-4 sm:pt-6 pb-[80px] sm:pb-4 px-3 sm:px-4 max-w-3xl mx-auto w-full relative z-10">
      
      
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

      {/* Chat Messages — iOS scroll fix: overflow-y-auto + overscrollBehavior:auto */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto glass-card border-white/5 p-4 mb-4 space-y-4 relative"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "auto", minHeight: 0 }}
        onScroll={handleScroll}
      >
        {messages.map((msg, idx) => {
          const isMe = msg.user_id === user?.id;
          const showAvatarAndName = idx === 0 || messages[idx - 1].user_id !== msg.user_id;
          const initial = msg.user_email ? msg.user_email.charAt(0).toUpperCase() : "U";
          
          return (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${showAvatarAndName ? 'mt-4' : 'mt-1'}`}
            >
              {!isMe && (
                <div className="flex flex-col items-center mr-2 shrink-0 w-8">
                  {showAvatarAndName ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md text-xs">
                      {initial}
                    </div>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}
              
              <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                {showAvatarAndName && (
                  <span className={`text-[10px] text-slate-500 mb-1 font-bold ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {isMe ? 'Moi' : msg.user_email}
                  </span>
                )}
                
                <div 
                  className={`p-3 relative ${isMe 
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_4px_15px_rgba(37,99,235,0.2)]' 
                    : 'bg-slate-800 border border-white/5 text-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.2)]'} 
                  ${showAvatarAndName && isMe ? 'rounded-2xl rounded-tr-sm' : ''}
                  ${showAvatarAndName && !isMe ? 'rounded-2xl rounded-tl-sm' : ''}
                  ${!showAvatarAndName ? 'rounded-2xl' : ''}`}
                >
                  {msg.image_url && (
                    <div className="mb-2 rounded-xl overflow-hidden bg-black/40 border border-white/10 relative group">
                      <img src={msg.image_url} alt="Uploaded" className="w-full h-auto max-h-64 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105" onClick={() => window.open(msg.image_url, '_blank')} />
                    </div>
                  )}
                  {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                  {msg.workout_data && renderWorkoutCard(msg.workout_data)}
                </div>
                <span className={`text-[8px] text-slate-600 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="shrink-0 flex flex-col gap-2">
        {selectedImage && (
          <div className="relative self-start mb-1 ml-1">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500 relative">
              <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            <button 
              type="button" 
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform shadow-lg"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            className="hidden" 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${selectedImage ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600'}`}
          >
            <ImagePlus size={20} />
          </button>
          
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={selectedImage ? "Ajouter une description..." : "Écris un message..."}
            className="input-premium flex-1"
          />
          
          <button 
            type="submit" 
            disabled={(!newMessage.trim() && !selectedImage) || isUploading}
            className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-700 transition-colors shrink-0"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Community;
