import React, { useState, useMemo } from 'react';
import { 
  ALL_INFO_DOCS, 
  CATEGORIES_META, 
  getDocById, 
  getDocsByCategory, 
  InfoDoc 
} from '../data/info';
import { 
  FileText, 
  Shield, 
  Cookie, 
  AlertOctagon, 
  Briefcase, 
  GraduationCap, 
  AlertTriangle, 
  Award, 
  Lock, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  Star, 
  ShieldAlert, 
  Flag, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  AlertCircle, 
  Building, 
  Target, 
  Eye, 
  Compass, 
  UserCheck, 
  Newspaper, 
  Search, 
  ArrowRight, 
  ChevronRight, 
  Printer, 
  Copy, 
  Check,
  Building2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface InfoHubProps {
  initialDocId?: string;
  onClose?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FileText,
  Shield,
  Cookie,
  AlertOctagon,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  Award,
  Lock,
  Users,
  ShieldCheck,
  CheckCircle,
  Star,
  ShieldAlert,
  Flag,
  HelpCircle,
  MessageSquare,
  Mail,
  AlertCircle,
  Building,
  Target,
  Eye,
  Compass,
  UserCheck,
  Newspaper
};

export const InfoHub: React.FC<InfoHubProps> = ({ initialDocId = 'terms-and-conditions' }) => {
  const { addToast, setAuthModalOpen, setAuthModalTab, user } = useAuth();
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [activeCategory, setActiveCategory] = useState<string>('legal');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const currentDoc = useMemo(() => {
    return getDocById(selectedDocId) || ALL_INFO_DOCS[0];
  }, [selectedDocId]);

  // Sync active category when currentDoc changes
  React.useEffect(() => {
    if (currentDoc) {
      setActiveCategory(currentDoc.category);
    }
  }, [currentDoc]);

  // Filter docs based on search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return ALL_INFO_DOCS;
    const query = searchQuery.toLowerCase();
    return ALL_INFO_DOCS.filter(doc => 
      doc.title.toLowerCase().includes(query) ||
      doc.subtitle.toLowerCase().includes(query) ||
      doc.sections.some(s => 
        s.title.toLowerCase().includes(query) ||
        s.content.some(c => c.toLowerCase().includes(query))
      )
    );
  }, [searchQuery]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    addToast('Link Copied', 'Document reference URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const IconComponent = currentDoc ? (ICON_MAP[currentDoc.iconName] || FileText) : FileText;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header & Search Banner */}
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 border border-neutral-800 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Dormiqa Knowledge Base & Legal Documentation</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Legal, Safety & Operational Governance
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-normal">
            Read complete, transparent guidelines for students, verified property agents, and partners across Nigerian and African university campuses.
          </p>

          {/* Search Input */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search terms, privacy, agent verification, refund policies..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-neutral-800/90 text-white placeholder:text-neutral-400 text-xs sm:text-sm border border-neutral-700 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Sidebar - Categories & Document Index */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Category Tabs */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-2 space-y-1">
            {CATEGORIES_META.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const firstInCat = getDocsByCategory(cat.id)[0];
                  if (firstInCat) setSelectedDocId(firstInCat.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold transition-all text-left ${
                  activeCategory === cat.id 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' 
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`p-1.5 rounded-lg ${activeCategory === cat.id ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                    {cat.id === 'legal' && <FileText className="w-4 h-4" />}
                    {cat.id === 'safety' && <ShieldCheck className="w-4 h-4" />}
                    {cat.id === 'support' && <HelpCircle className="w-4 h-4" />}
                    {cat.id === 'company' && <Building className="w-4 h-4" />}
                  </span>
                  <div>
                    <span>{cat.name}</span>
                    <span className="block text-[10px] opacity-75 font-normal line-clamp-1">{cat.description}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-60" />
              </button>
            ))}
          </div>

          {/* Document List inside Active Category or Search Results */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              {searchQuery ? `Search Results (${filteredDocs.length})` : 'Documents'}
            </h3>

            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {(searchQuery ? filteredDocs : getDocsByCategory(activeCategory)).map(doc => {
                const ItemIcon = ICON_MAP[doc.iconName] || FileText;
                const isSelected = doc.id === selectedDocId;

                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all text-xs font-semibold ${
                      isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200' 
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{doc.title}</p>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate font-normal">{doc.subtitle}</p>
                    </div>
                  </button>
                );
              })}

              {searchQuery && filteredDocs.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-400">
                  No matching documents found for "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* Quick Support Callout */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Need Direct Assistance?</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
              Have questions regarding agent verification, terms, or incident reports? Our safety team responds within 24 hours.
            </p>
            <a
              href="mailto:support@dormiqa.ng"
              className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold hover:underline text-[11px]"
            >
              <span>Email support@dormiqa.ng</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Right Pane - Selected Document View */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-10 space-y-8 shadow-sm">
            
            {/* Document Header */}
            <div className="space-y-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
                    <IconComponent className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    {currentDoc.category.toUpperCase()} DOCUMENT
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Copy Document Link"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {currentDoc.title}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                  {currentDoc.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                <span>Last Updated: {currentDoc.lastUpdated}</span>
                <span>•</span>
                <span>Version 2.4 (Production)</span>
              </div>
            </div>

            {/* Platform Role Mandatory Callout */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Dormiqa Technology Platform Notice</span>
              </div>
              <p className="leading-relaxed font-normal text-[11px] text-amber-800 dark:text-amber-300">
                Dormiqa is an independent technology search platform connecting students with verified property agents. Dormiqa does not own, rent, manage, or collect rental fees for properties. All tenancy agreements and financial payments occur directly between students and verified agents following physical inspections.
              </p>
            </div>

            {/* Document Sections */}
            <div className="space-y-8 text-neutral-800 dark:text-neutral-200">
              {currentDoc.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                    {section.title}
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 font-normal">
                    {section.content.map((paragraph, pIdx) => (
                      <p key={pIdx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Document Footer Call-To-Action */}
            <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-neutral-500">
                <span>Still have questions about this policy?</span>
              </div>
              <div className="flex items-center gap-3">
                {!user && (
                  <button
                    onClick={() => {
                      setAuthModalTab('student_signup');
                      setAuthModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    Join as Student
                  </button>
                )}
                <a
                  href="mailto:legal@dormiqa.ng"
                  className="px-4 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Contact Legal Team
                </a>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
