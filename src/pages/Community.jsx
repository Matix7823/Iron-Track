import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { showNotification } from "../utils/native";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Trophy, Dumbbell, Users, ImagePlus, X, Loader2, Sparkles, MessageCircle, ChevronDown, Flame } from "lucide-react";

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
      
    if (!error && data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
    
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(current => {
          // Eviter les doublons potentiels liés au websocket
          if (current.some(m => m.id === payload.new.id)) return current;
          return [...current, payload.new];
        });
        if (payload.new.user_id !== user?.id) {
          showNotification(`Message de ${payload.new.user_email}`, payload.new.content || "Nouveau partage");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Autoscroll intelligent
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

      // On simule l'insertion optimiste pour la fluidité (optionnel mais recommandé pour les chats)
      // Ici on attend la confirmation Supabase.
      await supabase.from('messages').insert([{
        user_id: user.id,
        user_email: capitalizedName,
        content: messageText,
        image_url: imageUrl
      }]);
      
      scrollToBottom();
    } catch (err) {
      console.error("Erreur lors de l'envoi :", err);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderWorkoutCard = (workoutData) => {
    if (!workoutData) return null;
    return (
      <div className="mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-white/10 shadow-2xl w-[260px] sm:w-[300px]">
        {/* Decorative background flare */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] -z-10 rounded-full" />
        
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Trophy size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Séance Validée</p>
              <p className="text-sm font-black text-white truncate max-w-[150px]">{workoutData.sessionTitle || "Entraînement"}</p>
            </div>
          </div>
          <Flame size={20} className={workoutData.rank === 'super' ? 'text-amber-500' : workoutData.rank === 'medium' ? 'text-blue-500' : 'text-slate-500'} />
        </div>
        
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Tonnage</p>
            <p className="text-sm font-black text-white">{workoutData.tonnage} <span className="text-[10px] text-slate-400 font-normal">kg</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Performance</p>
            <p className={`text-sm font-black ${workoutData.rank === 'super' ? 'text-amber-400' : workoutData.rank === 'medium' ? 'text-blue-400' : 'text-slate-400'}`}>
              {workoutData.rank === 'super' ? 'Légendaire' : workoutData.rank === 'medium' ? 'Solide' : 'Normal'}
            </p>
          </div>
        </div>
        
        {workoutData.exercises && workoutData.exercises.length > 0 && (
          <div className="px-4 pb-4 space-y-2">
            {workoutData.exercises.slice(0,3).map((exo, i) => (
              <div key={i} className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300 truncate pr-2">
                  <Dumbbell size={10} className="text-blue-400 shrink-0" />
                  <span className="truncate font-semibold">{exo.name}</span>
                </div>
                <span className="text-slate-500 font-bold whitespace-nowrap bg-white/5 px-2 py-0.5 rounded-full">{exo.sets} séries</span>
              </div>
            ))}
            {workoutData.exercises.length > 3 && (
              <p className="text-[10px] text-slate-500 font-bold italic text-center pt-1">+ {workoutData.exercises.length - 3} autres exos</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 pt-safe pb-[80px] sm:pb-[20px] flex flex-col items-center z-10 overflow-hidden bg-[#020617]">
      {/* Dynamic Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex flex-col w-full max-w-4xl h-full relative">
        
        {/* PREMIUM HEADER */}
        <header className="px-4 sm:px-6 pt-5 pb-4 shrink-0 flex items-center justify-between border-b border-white/5 bg-slate-950/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/10">
                <Users size={20} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight flex items-center gap-1.5">
                Le Repaire <Sparkles size={14} className="text-amber-400" />
              </h1>
              <p className="text-[11px] text-slate-500 font-semibold">Live Social Feed</p>
            </div>
          </div>
          
          {profile?.role === 'admin' && (
            <button 
              onClick={async () => {
                if (window.confirm("Vider toute la conversation ? Action irréversible.")) {
                  await supabase.from('messages').delete().not('id', 'is', null);
                  setMessages([]);
                }
              }}
              className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border border-red-500/20"
            >
              Vider
            </button>
          )}
        </header>

        {/* CHAT MESSAGES AREA */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 relative min-h-0 custom-scrollbar"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "auto" }}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <MessageCircle size={48} className="text-slate-600 mb-3" />
              <p className="text-slate-400 font-bold text-sm">Aucun message pour le moment</p>
              <p className="text-slate-500 text-xs">Sois le premier à briser la glace !</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => {
                const isMe = msg.user_id === user?.id;
                const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;
                const initial = msg.user_email ? msg.user_email.charAt(0).toUpperCase() : "U";
                const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${showAvatar ? 'mt-6' : 'mt-1'}`}
                  >
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md ${isMe ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-slate-600 to-slate-800 border border-white/10'}`}>
                          {initial}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{isMe ? 'Moi' : msg.user_email}</span>
                        <span className="text-[9px] text-slate-600 font-medium">{time}</span>
                      </div>
                    )}
                    
                    <div className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl ${isMe ? 'rounded-tr-sm bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20' : 'rounded-tl-sm bg-slate-800/80 backdrop-blur-md border border-white/5 text-slate-200'}`}>
                      
                      {msg.content && (
                        <p className="px-4 py-2.5 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.content}
                        </p>
                      )}
                      
                      {msg.image_url && (
                        <div className="p-1">
                          <img 
                            src={msg.image_url} 
                            alt="Upload" 
                            className="rounded-xl max-w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                            onClick={() => window.open(msg.image_url, '_blank')}
                          />
                        </div>
                      )}
                      
                      {msg.workout_data && (
                        <div className="px-1 pb-1">
                          {renderWorkoutCard(msg.workout_data)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-2 w-full" />
        </div>

        {/* FLOATING ACTION BOTTOM AREA */}
        <div className="shrink-0 p-3 sm:p-4 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent relative z-20">
          
          <AnimatePresence>
            {!isAtBottom && messages.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={scrollToBottom}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500/20 backdrop-blur-xl border border-blue-500/40 text-blue-400 p-2 rounded-full shadow-xl hover:bg-blue-500/30 transition-colors"
              >
                <ChevronDown size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="glass-card rounded-3xl p-1.5 border border-white/10 shadow-2xl flex flex-col bg-slate-900/60 backdrop-blur-2xl">
            {/* Image Preview */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="px-3 pt-3 pb-1"
                >
                  <div className="relative inline-block">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Preview" 
                      className="h-20 w-auto rounded-xl object-cover border border-white/10 shadow-lg" 
                    />
                    <button 
                      type="button" 
                      onClick={removeImage} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="flex items-end gap-2 relative">
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-2xl transition-all shrink-0"
              >
                <ImagePlus size={20} />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Écris un message..."
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 py-3 px-2 focus:outline-none resize-none max-h-32 min-h-[44px]"
                rows={1}
                style={{ scrollbarWidth: 'none' }}
              />
              
              <button 
                type="submit"
                disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:grayscale transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
