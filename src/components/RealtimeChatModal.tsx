import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Building2, UserCheck, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Message, MessageThread } from '../types';
import { 
  subscribeFirestoreThreads, 
  subscribeFirestoreMessages, 
  sendFirestoreMessage, 
  createOrGetFirestoreThread 
} from '../lib/firebase';

interface RealtimeChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialListing?: {
    id: string;
    title: string;
    agentId: string;
    agentName: string;
  };
  targetThreadId?: string;
}

export const RealtimeChatModal: React.FC<RealtimeChatModalProps> = ({
  isOpen,
  onClose,
  initialListing,
  targetThreadId,
}) => {
  const { user } = useAuth();
  const isAgent = user?.role === 'agent';

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(targetThreadId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load thread if opening from a listing "Message Agent" button
  useEffect(() => {
    if (isOpen && initialListing && user) {
      setLoading(true);
      createOrGetFirestoreThread({
        listingId: initialListing.id,
        listingTitle: initialListing.title,
        studentId: user.id,
        studentName: user.name,
        agentId: initialListing.agentId,
        agentName: initialListing.agentName,
      }).then((tid) => {
        setActiveThreadId(tid);
        setLoading(false);
      }).catch((err) => {
        console.warn('Error establishing thread:', err);
        setLoading(false);
      });
    } else if (isOpen && targetThreadId) {
      setActiveThreadId(targetThreadId);
    }
  }, [isOpen, initialListing, targetThreadId, user]);

  // Subscribe to threads list in real-time
  useEffect(() => {
    if (!isOpen || !user) return;
    const unsubscribe = subscribeFirestoreThreads(user.id, isAgent, (itemThreads) => {
      setThreads(itemThreads);
      if (!activeThreadId && itemThreads.length > 0) {
        setActiveThreadId(itemThreads[0].id);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, user, isAgent]);

  // Subscribe to active thread messages in real-time
  useEffect(() => {
    if (!isOpen || !activeThreadId) return;
    const unsubscribe = subscribeFirestoreMessages(activeThreadId, (itemMsgs) => {
      setMessages(itemMsgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, activeThreadId]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThreadId || !user) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await sendFirestoreMessage({
        threadId: activeThreadId,
        senderId: user.id,
        senderRole: isAgent ? 'agent' : 'student',
        text: textToSend,
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[85vh] max-h-[680px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Dormiqa Live Messenger</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                    Real-time
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAgent ? 'Direct messages from students inquiring about listings' : 'Direct contact with verified agents & landlords'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Threads List */}
            <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col overflow-y-auto shrink-0">
              <div className="p-3 font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Conversations ({threads.length})
              </div>

              {threads.length === 0 ? (
                <div className="p-6 text-center space-y-2 text-slate-400 my-auto">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-xs font-bold">No active conversations</p>
                  <p className="text-[10px]">Messages sent regarding listings will appear here live.</p>
                </div>
              ) : (
                threads.map((t) => {
                  const isActive = t.id === activeThreadId;
                  const partnerName = isAgent ? t.studentName : t.agentName;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveThreadId(t.id)}
                      className={`p-3.5 text-left border-b border-slate-100 dark:border-slate-800/60 transition flex flex-col gap-1 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-l-emerald-500'
                          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {partnerName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{t.listingTitle}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {t.lastMessage}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Chat Conversation Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
              {activeThread ? (
                <>
                  {/* Chat Sub-header */}
                  <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>{isAgent ? activeThread.studentName : activeThread.agentName}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>Re: {activeThread.listingTitle}</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Live Chat
                    </span>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 text-center">
                        <MessageSquare className="w-8 h-8 opacity-40" />
                        <p className="text-xs font-bold">Start the conversation</p>
                        <p className="text-[11px] max-w-xs">Ask questions about price, room condition, electricity, or arrange a private inspection.</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.senderId === user?.id;

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                                isMe
                                  ? 'bg-emerald-600 text-white rounded-br-none font-medium'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
                              }`}
                            >
                              {m.text}
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400 px-1">
                              <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-emerald-500" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Input Footer */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={isAgent ? "Reply to student..." : "Type your inquiry or message..."}
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-0 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shrink-0"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                  <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a conversation</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Choose a message thread from the left sidebar to start chatting live with students or agents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
