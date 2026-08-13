import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, Building2, ShieldCheck, UserCheck, ArrowRight, 
  Lock, CheckCircle2, Sparkles, FileText, ArrowLeft, Shield
} from 'lucide-react';
import { motion } from 'motion/react';

export const OnboardingRoleSelect: React.FC = () => {
  const { setRole, login, setActiveView, setAuthModalOpen, setAuthModalTab, addToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

  const handleSelectRole = (roleType: 'student' | 'agent', actionType: 'login' | 'signup') => {
    if (roleType === 'agent') {
      if (actionType === 'signup') {
        setAuthModalTab('agent_signup');
      } else {
        setAuthModalTab('login');
      }
      setAuthModalOpen(true);
    } else {
      if (actionType === 'signup') {
        setAuthModalTab('student_signup');
      } else {
        setAuthModalTab('login');
      }
      setAuthModalOpen(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      
      {/* Top Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => setActiveView('home')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Landing Page
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Welcome to <span className="text-indigo-600 dark:text-indigo-400">Dormiqa</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Select your role below to sign in or create an account. Choose whether you are a Tertiary Student or a Property Agent / Business Landlord.
        </p>

        {/* Action Toggle (Sign In vs Sign Up) */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('signup')}
            className={`px-6 py-2.5 rounded-xl transition-all ${
              activeTab === 'signup'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            New Account (Sign Up)
          </button>
          <button
            onClick={() => setActiveTab('signin')}
            className={`px-6 py-2.5 rounded-xl transition-all ${
              activeTab === 'signin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Existing User (Sign In)
          </button>
        </div>
      </div>

      {/* Role Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Card 1: Student */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200/80 dark:border-slate-700 hover:border-emerald-500 shadow-md flex flex-col justify-between space-y-6 transition-all relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 w-fit">
              <GraduationCap className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                Student Portal
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                Tertiary Student
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Find verified hostels near UNILAG, OAU, ABU, FUTA, UI, LASU & 40+ tertiary institutions across Nigeria. Book physical viewings & roommate listings.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Direct physical viewings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verified power & water ratings</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>AI roommate compatibility match</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => handleSelectRole('student', activeTab === 'signup' ? 'signup' : 'login')}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <span>{activeTab === 'signup' ? 'Register Student Account' : 'Sign In as Student'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Card 2: Property Agent / Landlord (With Business Verification) */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 shadow-lg flex flex-col justify-between space-y-6 transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Agency
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 w-fit">
              <Building2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black uppercase">
                Hostel Owner / Agent
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                Property Business & Agent
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                List student hostel apartments, manage room availability, receive inspection appointments, and register your agency business name & proof.
              </p>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Agency Name & Proof of Business verification</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Automated marketing description tools</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>WhatsApp student inspection desk</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => handleSelectRole('agent', activeTab === 'signup' ? 'signup' : 'login')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <span>{activeTab === 'signup' ? 'Register Agent (Business Profile)' : 'Sign In as Agent'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

      </div>

      {/* Business Verification Information Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-base text-white">Agency & Business Verification Standard</h4>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Dormiqa ensures student trust on campus. All hostel managers & property agents register their Business / Agency Name and upload proof of business (banner photo, logo, office building, or CAC) to obtain the Verified Gold Badge.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setAuthModalTab('agent_signup');
            setAuthModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 transition-colors shadow-lg shadow-amber-500/20"
        >
          Verify Agency Business Now
        </button>
      </div>

    </div>
  );
};
