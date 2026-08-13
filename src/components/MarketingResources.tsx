import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Copy, Check, MessageSquare, Share2, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

export const MarketingResources: React.FC = () => {
  const { user, addNotification } = useAuth();
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const referralCode = user?.referralCode || user?.ambassadorId || 'DORMIQA-001';
  const referralUrl = `https://dormiqa-ambassador.vercel.app/r/${referralCode}`;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    addNotification({
      title: 'Template Copied',
      message: 'Broadcast text copied to clipboard. Ready to paste on WhatsApp or Telegram!',
      type: 'info'
    });
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const templates = [
    {
      id: 'whatsapp_group',
      title: 'WhatsApp Group Broadcast (Short)',
      text: `Hey guys! 👋 Looking for verified student hostels near campus without paying crazy agent scam fees?\n\nCheck out DORMIQA — search verified accommodation, view real photos, and connect directly with verified hostel managers!\n\nUse my link to join: ${referralUrl}`
    },
    {
      id: 'whatsapp_status',
      title: 'WhatsApp Status / Instagram Story Caption',
      text: `No more hostel stress! 🏠 Find affordable lodges and self-contain apartments near campus on DORMIQA. \n\nClick my link to get started: ${referralUrl}`
    },
    {
      id: 'freshers_guide',
      title: 'Freshers Accommodation Guide Text',
      text: `Welcome to Campus! 🎉 Need housing advice or verified student hostels near UNILAG / OAU / UI / YABATECH?\n\nDORMIQA is the official student accommodation platform. Browse verified listings and chat directly with verified housing agents.\n\nRegister here: ${referralUrl}`
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
          AMBASSADOR COLLATERAL KIT
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Marketing Collateral & Promotional Assets
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Download high-resolution flyers, copy conversion broadcast scripts, and share on campus student channels.
        </p>
      </div>

      {/* Copyable Broadcast Templates */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <span>WhatsApp & Social Media Broadcast Templates</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">{tpl.title}</h4>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap border border-slate-200/60 dark:border-slate-800">
                  {tpl.text}
                </div>
              </div>

              <button
                onClick={() => copyText(tpl.text, tpl.id)}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                {copiedTemplate === tpl.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTemplate === tpl.id ? 'Copied to Clipboard!' : 'Copy Script Text'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Downloadable Graphics & Flyers */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          <span>Official Campus Promotional Graphics</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-3 p-4">
            <div className="h-44 bg-gradient-to-tr from-emerald-600 to-teal-800 rounded-2xl flex items-center justify-center text-white p-6 text-center space-y-2">
              <div>
                <Sparkles className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                <div className="font-black text-lg">Verified Hostels Near You</div>
                <div className="text-[10px] text-emerald-100">DORMIQA Campus Flyer 2026</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Square Flyer (1080x1080)</div>
                <p className="text-[10px] text-slate-400">Best for WhatsApp & Instagram feed</p>
              </div>
              <button 
                onClick={() => addNotification({ title: 'Downloading Asset', message: 'Downloading DORMIQA flyer asset...', type: 'info' })}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-3 p-4">
            <div className="h-44 bg-gradient-to-tr from-blue-600 to-slate-900 rounded-2xl flex items-center justify-center text-white p-6 text-center space-y-2">
              <div>
                <FileText className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <div className="font-black text-lg">Freshers Accommodation Guide</div>
                <div className="text-[10px] text-blue-100">Campus Orientation Deck</div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">PDF Guide & Slide Deck</div>
                <p className="text-[10px] text-slate-400">Share with new campus students</p>
              </div>
              <button 
                onClick={() => addNotification({ title: 'Downloading Asset', message: 'Downloading Orientation Deck...', type: 'info' })}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
