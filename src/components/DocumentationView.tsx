import React, { useState } from 'react';
import { 
  Database, ShieldCheck, Server, Layers, Code, Key, Cloud, CheckCircle2, 
  Terminal, Lock, Globe, FileText, Copy, Check
} from 'lucide-react';

export const DocumentationView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  const dbSchemaCode = `
-- DORMIQA POSTGRESQL / SUPABASE DATABASE SCHEMA

-- 1. Universities Table
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  campuses TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Users) Table linked to Supabase Auth
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) CHECK (role IN ('student', 'agent', 'admin')) DEFAULT 'student',
  avatar_url TEXT,
  university_id UUID REFERENCES universities(id),
  business_name VARCHAR(255),
  agent_type VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Accommodation Listings Table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hostel', 'self_contain', 'single_room', 'flat_apartment', 'shared_lodge', 'studio')),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  campus VARCHAR(100) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT '₦',
  price_period VARCHAR(20) DEFAULT 'year',
  distance_to_campus_minutes INT NOT NULL,
  distance_to_campus_km NUMERIC(4,2) NOT NULL,
  available_rooms INT DEFAULT 1,
  total_rooms INT DEFAULT 1,
  gender_preference VARCHAR(20) DEFAULT 'coed',
  images TEXT[] DEFAULT '{}',
  video_url TEXT,
  description TEXT NOT NULL,
  facilities TEXT[] DEFAULT '{}',
  rules TEXT[] DEFAULT '{}',
  is_agent_verified BOOLEAN DEFAULT FALSE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Physical Inspection Appointments Table
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  note TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Student Accommodation Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating_security INT CHECK (rating_security BETWEEN 1 AND 5),
  rating_water INT CHECK (rating_water BETWEEN 1 AND 5),
  rating_electricity INT CHECK (rating_electricity BETWEEN 1 AND 5),
  rating_internet INT CHECK (rating_internet BETWEEN 1 AND 5),
  rating_cleanliness INT CHECK (rating_cleanliness BETWEEN 1 AND 5),
  rating_noise INT CHECK (rating_noise BETWEEN 1 AND 5),
  rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
  overall NUMERIC(3,1) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public listings are readable by everyone" ON listings FOR SELECT USING (true);
CREATE POLICY "Agents can manage own listings" ON listings FOR ALL USING (auth.uid() = agent_id);
`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          <FileText className="w-4 h-4 text-amber-400" />
          Technical Architecture & Database Specs
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
          Dormiqa Platform Engineering Specification
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Comprehensive overview of Dormiqa’s database ER schema, API architecture, Supabase integration, Gemini AI prompt pipelines, and deployment instructions.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Architecture */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit">
            <Server className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Full-Stack Architecture</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Built on Vite + React 19 SPA frontend with Express + Node backend. Production builds are bundled with esbuild into CJS for optimized server startup.
          </p>
        </div>

        {/* Gemini AI Integration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit">
            <Code className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Server-Side Gemini 3.6 SDK</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Powered by `@google/genai` SDK executing strictly server-side (`server.ts`) to keep API keys hidden. Features natural language housing search & chatbot.
          </p>
        </div>

        {/* Database & RLS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
          <div className="p-3 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 w-fit">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">PostgreSQL / Supabase Ready</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Normalized tables for Users, Universities, Accommodation Listings, Inspections, and Reviews with strict Row Level Security (RLS).
          </p>
        </div>
      </div>

      {/* SQL Schema Code Viewer */}
      <div className="p-6 rounded-3xl bg-slate-950 text-slate-100 border border-slate-800 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">PostgreSQL Database Schema DDL</h3>
          </div>
          <button
            onClick={() => copyToClipboard(dbSchemaCode, 'ddl')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            {copiedSection === 'ddl' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied DDL!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy DDL SQL
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-2xl bg-slate-900 overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed border border-slate-800">
          <code>{dbSchemaCode.trim()}</code>
        </pre>
      </div>

      {/* Deployment & Deployment Manual */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-500" />
          Deployment Checklist (Vercel / Cloud Run / Supabase)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">1. Environment Variables</span>
            <p className="text-slate-500">Configure `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `JWT_SECRET` in server environment.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">2. Production Build</span>
            <p className="text-slate-500">Execute `npm run build` which runs Vite for client assets and esbuild for server bundling into `dist/server.cjs`.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">3. Port Binding</span>
            <p className="text-slate-500">Express server binds to `0.0.0.0` on port `3000` as required for Cloud Run container ingress.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">4. Supabase Auth & RLS</span>
            <p className="text-slate-500">Run the provided DDL schema above in your Supabase SQL editor to bootstrap tables & RLS security rules.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
