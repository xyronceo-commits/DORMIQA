import React from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_UNIVERSITIES } from '../data/mockData';
import { ArrowUpRight } from 'lucide-react';
import { DormiqaLogo } from './DormiqaLogo';

export const Footer: React.FC = () => {
  const { 
    setActiveView, 
    setSelectedUniversity, 
    setSelectedInfoDocId, 
    setAuthModalOpen, 
    setAuthModalTab 
  } = useAuth();

  const openDoc = (docId: string) => {
    setSelectedInfoDocId(docId);
    setActiveView('info_hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-black text-neutral-400 border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & Mission Info */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onClick={() => setActiveView('ambassador_dashboard')} 
              className="cursor-pointer inline-block"
            >
              <DormiqaLogo size="md" textColor="text-white" pinColor="#10b981" />
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm font-normal">
              Official DORMIQA Ambassador Portal. The private campus student acquisition, referral tracking, and commission payout platform for DORMIQA Nigeria.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-neutral-300">
              <button 
                onClick={() => setActiveView('ambassador_dashboard')} 
                className="hover:text-emerald-400 underline"
              >
                Ambassador Dashboard
              </button>
              <span>•</span>
              <button 
                onClick={() => setActiveView('referrals')} 
                className="hover:text-emerald-400 underline"
              >
                Track Leads
              </button>
              <span>•</span>
              <button 
                onClick={() => setActiveView('earnings')} 
                className="hover:text-emerald-400 underline"
              >
                Commission Rates
              </button>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal & Policies</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={() => openDoc('terms-and-conditions')} className="hover:text-emerald-400 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('privacy-policy')} className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('cookie-policy')} className="hover:text-emerald-400 transition-colors">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('acceptable-use')} className="hover:text-emerald-400 transition-colors">
                  Acceptable Use Policy
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('agent-terms')} className="hover:text-emerald-400 transition-colors">
                  Agent Terms & Agreement
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('student-terms')} className="hover:text-emerald-400 transition-colors">
                  Student Terms & Conduct
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('disclaimer')} className="hover:text-emerald-400 transition-colors">
                  Platform Disclaimer
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Safety */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Trust & Safety</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={() => openDoc('community-guidelines')} className="hover:text-emerald-400 transition-colors">
                  Community Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('verification-policy')} className="hover:text-emerald-400 transition-colors">
                  Agent Verification Policy
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('listing-quality')} className="hover:text-emerald-400 transition-colors">
                  Listing Quality Standards
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('review-policy')} className="hover:text-emerald-400 transition-colors">
                  Review & Rating Policy
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('anti-fraud')} className="hover:text-emerald-400 transition-colors">
                  Anti-Fraud & Scam Prevention
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('report-abuse')} className="hover:text-emerald-400 transition-colors">
                  Report Abuse & Violations
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Company */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Support & Company</h4>
            <ul className="space-y-2 text-neutral-400">
              <li>
                <button onClick={() => openDoc('help-centre')} className="hover:text-emerald-400 transition-colors">
                  Help Centre & Guides
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('faq')} className="hover:text-emerald-400 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('contact-us')} className="hover:text-emerald-400 transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('report-problem')} className="hover:text-emerald-400 transition-colors">
                  Report a Problem
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('become-agent')} className="hover:text-emerald-400 transition-colors font-semibold text-emerald-400 flex items-center gap-1">
                  Become a Verified Agent
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <button onClick={() => openDoc('careers')} className="hover:text-emerald-400 transition-colors">
                  Careers (Coming Soon)
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 Dormiqa Africa Inc. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-700">•</span>
            <p className="text-[11px] text-neutral-500">
              Dormiqa is a technology platform connecting students with verified property agents.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => openDoc('privacy-policy')} className="hover:text-neutral-300">Privacy</button>
            <button onClick={() => openDoc('terms-and-conditions')} className="hover:text-neutral-300">Terms</button>
            <button onClick={() => openDoc('verification-policy')} className="hover:text-neutral-300">Verification</button>
            <button onClick={() => openDoc('contact-us')} className="hover:text-neutral-300">Contact</button>
          </div>
        </div>

      </div>
    </footer>
  );
};
