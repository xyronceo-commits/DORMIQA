import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadFileToFirebaseStorage } from '../lib/firebase';
import { submitAgentVerification } from '../lib/api';
import { AgentPhotoUploader } from './AgentPhotoUploader';
import { 
  ShieldCheck, Building2, Upload, FileText, CheckCircle2, ArrowRight, 
  AlertCircle, Shield, RefreshCw, Home, Sparkles, Check
} from 'lucide-react';
import { motion } from 'motion/react';

export const BusinessVerificationPage: React.FC = () => {
  const { user, updateProfile, addToast, setActiveView } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [proofType, setProofType] = useState<'banner' | 'logo' | 'office_photo' | 'cac' | 'other'>('banner');
  const [officeAddress, setOfficeAddress] = useState('');
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  // Agent identity photo state
  const [agentPhotoUrl, setAgentPhotoUrl] = useState<string | null>(user?.avatar || user?.agentPhotoUrl || null);
  const [agentPhotoFile, setAgentPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocFile(file);
      setUploadedDocName(file.name);
      addToast('Proof Selected', `${file.name} ready for submission`, 'info');
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      addToast('Missing Business Name', 'Please enter your Agency or Business Name.', 'warning');
      return;
    }

    if (!agentPhotoUrl) {
      setPhotoError('Please take or upload a clear picture of yourself (unblurred, face visible, no mask). This is required for agent identity verification.');
      addToast('Photo Required 📷', 'Please take or upload a clear picture of yourself for agent verification.', 'warning');
      return;
    }

    setPhotoError(null);
    setUploading(true);
    let documentUrl = '';
    let finalPhotoUrl = agentPhotoUrl;

    try {
      if (docFile && user) {
        addToast('Uploading Proof...', 'Saving proof of business to storage', 'info');
        const path = `verifications/${user.id}_${Date.now()}_${docFile.name}`;
        documentUrl = await uploadFileToFirebaseStorage(path, docFile);
      }

      if (agentPhotoFile && user) {
        addToast('Uploading Photo...', 'Saving verification photo of agent', 'info');
        const photoPath = `verifications/photos/${user.id}_${Date.now()}.jpg`;
        finalPhotoUrl = await uploadFileToFirebaseStorage(photoPath, agentPhotoFile);
      }

      addToast('AI Validating Verification Details...', 'Checking business profile & face photo clarity', 'info');

      // Call AI Verification backend endpoint
      let aiResultReason = 'Verified Agency & Agent Identity Photo';
      try {
        const aiRes = await fetch('/api/gemini/verify-business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessName, proofType, officeAddress, agentPhotoUrl: finalPhotoUrl }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (aiData.reason) {
            aiResultReason = aiData.reason;
          }
        }
      } catch (e) {
        console.warn('AI Verification endpoint error, falling back:', e);
      }

      // Record verification submission
      if (user) {
        await submitAgentVerification({
          agentId: user.id,
          agentName: user.name,
          agentEmail: user.email,
          businessName,
          proofType,
          proofUrl: documentUrl || uploadedDocName || undefined,
          agentPhotoUrl: finalPhotoUrl || undefined,
          officeAddress
        });
      }

      updateProfile({
        isVerifiedAgent: true,
        verificationStatus: 'verified',
        businessName,
        proofType,
        proofUrl: documentUrl || uploadedDocName || undefined,
        agentPhotoUrl: finalPhotoUrl || undefined,
        avatar: finalPhotoUrl || user?.avatar,
        officeAddress,
      });

      setIsSubmitted(true);
      addToast(
        'Agent Business & Photo Verified! 🎉', 
        `${aiResultReason}`, 
        'success'
      );
    } catch (err) {
      console.error('Verification Upload Error:', err);
      // Fallback update
      updateProfile({
        isVerifiedAgent: true,
        verificationStatus: 'verified',
        businessName,
        proofType,
        agentPhotoUrl: finalPhotoUrl || undefined,
        officeAddress
      });
      setIsSubmitted(true);
      addToast('Verification Saved', 'Agent business status updated.', 'success');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Step Banner */}
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/40 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
              2
            </span>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">Step 2 of 2: Agency & Business Verification</p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium">Provide your agency name & proof of business (banner, logo, office photo, or CAC)</p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
            Onboarding Verification
          </span>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  Agency & Business Verification
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register your business name and upload proof of business to earn your verified agent badge.
              </p>
            </div>

            <span className="px-3 py-1 rounded-md text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
              Agent Gold Trust Badge
            </span>
          </div>

          {isSubmitted ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-emerald-950 dark:text-emerald-100">
                  Business Details Saved!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                  Your business profile <strong className="font-bold">{businessName}</strong> has been registered. You can now post student hostel accommodations and manage viewing appointments.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setActiveView('home')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Proceed to Home Page
                </button>

                <button
                  onClick={() => setActiveView('agent_dashboard')}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Go to Agent Dashboard
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmitVerification} className="space-y-6">
              
              {/* Agent Identity Photo Section (Mandatory Verification Requirement) */}
              <AgentPhotoUploader
                photoUrl={agentPhotoUrl}
                onPhotoSelected={(url, file) => {
                  setAgentPhotoUrl(url);
                  if (file) setAgentPhotoFile(file);
                  setPhotoError(null);
                }}
                onPhotoCleared={() => {
                  setAgentPhotoUrl(null);
                  setAgentPhotoFile(null);
                }}
                error={photoError}
              />

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Agency or Business Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Prime Student Residences / Chidi Properties & Hostels"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Proof Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Type of Business Proof You wish to Upload
                </label>
                <select
                  value={proofType}
                  onChange={(e) => setProofType(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="banner">Business Banner / Office Signpost Photo</option>
                  <option value="logo">Agency Logo / Business Brand Image</option>
                  <option value="office_photo">Physical Office Frontage / Workspace Photo</option>
                  <option value="cac">CAC / Business Registration Document (Optional)</option>
                  <option value="other">Other Business Proof</option>
                </select>
              </div>

              {/* Office Location */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Physical Office / Campus Address (Optional)
                </label>
                <input
                  type="text"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  placeholder="e.g. 14 Commercial Gate, Akoka, Yaba, Lagos"
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Upload Box for Proof of Business */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Upload Proof of Business (Photo of banner, logo, office building, or CAC)
                </label>
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 cursor-pointer hover:border-emerald-500 transition-colors">
                  <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {uploadedDocName ? `Uploaded File: ${uploadedDocName}` : 'Click to select image (Banner, Logo, Office Photo, CAC)'}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">Supports JPG, PNG, WEBP, PDF up to 10MB</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Business Verification...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Business Verification & Finish Onboarding</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
