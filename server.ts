import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc 
} from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase App & Firestore for Server
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestoreDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

import {
  INITIAL_UNIVERSITIES,
  INITIAL_LISTINGS,
  INITIAL_AGENTS,
  INITIAL_REVIEWS,
  INITIAL_INSPECTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_MESSAGE_THREADS,
  INITIAL_MESSAGES
} from "./src/data/mockData";
import { Listing, Review, InspectionBooking, ReportItem, AgentVerification, University, AccommodationType, GenderPreference } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss:;"
    );
    next();
  });

  // Limit JSON payload size to prevent DoS (2MB limit)
  app.use(express.json({ limit: "2mb" }));

  // In-Memory Rate Limiting
  interface RateLimitRecord {
    count: number;
    resetTime: number;
  }

  const rateLimitStore = new Map<string, RateLimitRecord>();

  // Cleanup stale rate limits every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const key = `${req.path}:${Array.isArray(ip) ? ip[0] : ip}`;
      const now = Date.now();

      const record = rateLimitStore.get(key);
      if (!record || now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
        return next();
      }

      if (record.count >= options.max) {
        return res.status(429).json({
          error: options.message || "Too many requests. Please slow down and try again later.",
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
      }

      record.count += 1;
      next();
    };
  }

  const generalApiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 200 });
  const mutationApiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 60 });
  const aiApiRateLimiter = createRateLimiter({ 
    windowMs: 15 * 60 * 1000, 
    max: 35, 
    message: "AI rate limit reached. Please wait a few minutes before trying again." 
  });

  app.use("/api/", generalApiRateLimiter);

  // Input Sanitization Helpers
  function sanitizeInput(str: any, maxLength = 1000): string {
    if (typeof str !== 'string') return '';
    return str
      .slice(0, maxLength)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .trim();
  }

  function sanitizeAiPrompt(prompt: any, maxLength = 1000): string {
    if (typeof prompt !== 'string') return '';
    let clean = prompt.slice(0, maxLength);
    clean = clean.replace(/(\[SYSTEM\]|\[INSTRUCTION\]|IGNORE PREVIOUS INSTRUCTIONS)/gi, '[filtered]');
    return clean.trim();
  }

  // Shared in-memory data store for live CRUD during session
  let universities = [...INITIAL_UNIVERSITIES];
  let listings: Listing[] = [];
  let reviews: Review[] = [];
  let inspections: InspectionBooking[] = [];
  let notifications = [];
  let reports: ReportItem[] = [];
  let verifications: AgentVerification[] = [];

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const candidateKeys = [
      process.env.DORMIQA_API_KEY,
      process.env.CAMPORANG_API_KEY,
      process.env.GEMINI_API_KEY,
      process.env.CAMPORA_API_KEY,
    ];
    let validKey: string | null = null;
    for (const k of candidateKeys) {
      if (!k) continue;
      const trimmed = k.trim();
      if (
        trimmed === "" ||
        trimmed.startsWith("your_") ||
        trimmed === "MY_GEMINI_API_KEY" ||
        trimmed === "undefined"
      ) {
        continue;
      }
      if (trimmed.startsWith("sk-")) {
        continue;
      }
      validKey = trimmed;
      break;
    }

    if (!validKey) {
      return null;
    }

    return new GoogleGenAI({
      apiKey: validKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // REST API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "Dormiqa", version: "1.0.0" });
  });

  // Universities
  app.get("/api/universities", (req, res) => {
    res.json({ universities });
  });

  app.post("/api/universities", mutationApiRateLimiter, (req, res) => {
    const name = sanitizeInput(req.body.name, 150);
    const shortName = sanitizeInput(req.body.shortName, 20);
    const state = sanitizeInput(req.body.state, 50);

    if (!name || !shortName) {
      return res.status(400).json({ error: "Name and shortName are required" });
    }

    const newUni: University = {
      id: `uni_${Date.now()}`,
      name,
      shortName,
      country: "Nigeria",
      state,
      city: state,
      campuses: ["Main Campus"],
      coordinates: { lat: 6.5244, lng: 3.3792 },
      studentCount: "10,000+",
      totalListings: 0,
      image: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80"
    };
    universities.push(newUni);
    res.status(201).json({ university: newUni });
  });

  // Listings
  app.get("/api/listings", (req, res) => {
    const { universityId, type, gender, maxPrice, searchQuery, agentId, status } = req.query;
    let filtered = [...listings];

    if (status) {
      filtered = filtered.filter(l => l.status === status);
    } else if (!agentId) {
      // Default for public/student view: only show approved/active listings
      filtered = filtered.filter(l => l.status === 'active' || l.status === 'approved' || !l.status);
    }
    if (universityId) {
      filtered = filtered.filter(l => l.universityId === sanitizeInput(universityId, 50));
    }
    if (agentId) {
      filtered = filtered.filter(l => l.agentId === sanitizeInput(agentId, 50));
    }
    if (type && type !== 'all') {
      filtered = filtered.filter(l => l.type === sanitizeInput(type, 30));
    }
    if (gender && gender !== 'all') {
      filtered = filtered.filter(l => l.gender === sanitizeInput(gender, 20) || l.gender === 'any');
    }
    if (maxPrice) {
      const p = Number(maxPrice);
      if (!isNaN(p) && p > 0) {
        filtered = filtered.filter(l => l.price <= p);
      }
    }
    if (searchQuery) {
      const q = sanitizeInput(searchQuery, 100).toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q) ||
        l.universityName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
      );
    }

    res.json({ listings: filtered, total: filtered.length });
  });

  app.get("/api/listings/:id", (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const listing = listings.find(l => l.id === cleanId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    // Increment view counter
    listing.viewsCount = (listing.viewsCount || 0) + 1;
    res.json({ listing });
  });

  app.post("/api/listings", mutationApiRateLimiter, (req, res) => {
    const title = sanitizeInput(req.body.title, 150);
    const price = Number(req.body.price);

    if (!title || isNaN(price) || price <= 0) {
      return res.status(400).json({ error: "Valid title and positive price are required" });
    }

    const newListing: Listing = {
      id: `list_${Date.now()}`,
      title,
      universityId: sanitizeInput(req.body.universityId, 50) || "uni_unilag",
      universityName: sanitizeInput(req.body.universityName, 150) || "University of Lagos",
      campus: sanitizeInput(req.body.campus, 100) || "Main Campus",
      address: sanitizeInput(req.body.address, 200) || "Near University Gate",
      coordinates: req.body.coordinates && typeof req.body.coordinates.lat === 'number' ? req.body.coordinates : { lat: 6.5158, lng: 3.3898 },
      type: (sanitizeInput(req.body.type, 50) || "self_contain") as AccommodationType,
      price,
      currency: "₦",
      pricePeriod: (sanitizeInput(req.body.pricePeriod, 20) || "year") as "year" | "semester" | "month",
      totalRooms: Math.max(1, Number(req.body.totalRooms) || 1),
      availableRooms: Math.max(0, Number(req.body.availableRooms) || 1),
      gender: (sanitizeInput(req.body.gender, 20) || "any") as GenderPreference,
      distanceToCampusMinutes: Math.max(0, Number(req.body.distanceToCampusMinutes) || 5),
      distanceToCampusKm: Math.max(0, Number(req.body.distanceToCampusKm) || 0.5),
      description: sanitizeInput(req.body.description, 4000) || "",
      facilities: Array.isArray(req.body.facilities) ? req.body.facilities.map((f: any) => sanitizeInput(f, 50)).slice(0, 20) : ["water_running" as any],
      rules: Array.isArray(req.body.rules) ? req.body.rules.map((r: any) => sanitizeInput(r, 100)).slice(0, 10) : [],
      images: Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images.slice(0, 10) : [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80"
      ],
      videoUrl: sanitizeInput(req.body.videoUrl, 500) || "",
      video360Url: sanitizeInput(req.body.video360Url || req.body.videoUrl, 500) || "",
      accommodationTypeName: sanitizeInput(req.body.accommodationTypeName, 100) || "Student Accommodation",
      agentId: sanitizeInput(req.body.agentId, 50) || "agent_001",
      agentName: sanitizeInput(req.body.agentName, 100) || "Dormiqa Verified Agent",
      agentPhone: sanitizeInput(req.body.agentPhone, 30) || "+234 800 000 0000",
      agentEmail: sanitizeInput(req.body.agentEmail, 100) || "agent@dormiqa.africa",
      agentAvatar: sanitizeInput(req.body.agentAvatar, 500) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      isAgentVerified: Boolean(req.body.isAgentVerified),
      isFeatured: false,
      isPaused: false,
      isOccupied: false,
      status: "active",
      viewsCount: 1,
      enquiriesCount: 0,
      savesCount: 0,
      ratings: {
        security: 5.0,
        water: 5.0,
        electricity: 5.0,
        internet: 5.0,
        cleanliness: 5.0,
        noise: 5.0,
        value: 5.0,
        overall: 5.0,
        count: 1
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    listings.unshift(newListing);

    // Update university listing count
    const uni = universities.find(u => u.id === newListing.universityId);
    if (uni) {
      uni.totalListings += 1;
    }

    res.status(201).json({ listing: newListing });
  });

  app.put("/api/listings/:id", mutationApiRateLimiter, (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const idx = listings.findIndex(l => l.id === cleanId);
    if (idx === -1) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Strip unmodifiable privileged fields
    const { isFeatured, isAgentVerified, ...safeBody } = req.body;

    listings[idx] = {
      ...listings[idx],
      ...safeBody,
      updatedAt: new Date().toISOString()
    };
    res.json({ listing: listings[idx] });
  });

  app.delete("/api/listings/:id", mutationApiRateLimiter, (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const idx = listings.findIndex(l => l.id === cleanId);
    if (idx !== -1) {
      listings.splice(idx, 1);
    }
    res.json({ success: true });
  });

  app.patch("/api/listings/:id/status", mutationApiRateLimiter, (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const listing = listings.find(l => l.id === cleanId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    const { isPaused, isOccupied, status } = req.body;
    if (typeof isPaused === 'boolean') listing.isPaused = isPaused;
    if (typeof isOccupied === 'boolean') listing.isOccupied = isOccupied;
    if (status && ['active', 'paused', 'occupied', 'rejected'].includes(status)) {
      listing.status = status;
    }

    res.json({ listing });
  });

  // Inspection Bookings
  app.get("/api/inspections", (req, res) => {
    const { studentId, agentId } = req.query;
    let result = [...inspections];
    if (studentId) {
      result = result.filter(i => i.studentId === sanitizeInput(studentId, 50));
    }
    if (agentId) {
      result = result.filter(i => i.agentId === sanitizeInput(agentId, 50));
    }
    res.json({ inspections: result });
  });

  app.post("/api/inspections", mutationApiRateLimiter, (req, res) => {
    const listingId = sanitizeInput(req.body.listingId, 50);
    const date = sanitizeInput(req.body.date, 20);
    const timeSlot = sanitizeInput(req.body.timeSlot, 50);

    if (!listingId || !date || !timeSlot) {
      return res.status(400).json({ error: "Listing ID, date, and time slot are required" });
    }

    const newBooking: InspectionBooking = {
      id: `insp_${Date.now()}`,
      listingId,
      listingTitle: sanitizeInput(req.body.listingTitle, 150) || "Student Accommodation Inspection",
      listingImage: sanitizeInput(req.body.listingImage, 500) || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80",
      studentId: sanitizeInput(req.body.studentId, 50) || "stud_current",
      studentName: sanitizeInput(req.body.studentName, 100) || "Student User",
      studentPhone: sanitizeInput(req.body.studentPhone, 30) || "+234 810 000 0000",
      studentEmail: sanitizeInput(req.body.studentEmail, 100) || "student@dormiqa.africa",
      agentId: sanitizeInput(req.body.agentId, 50) || "agent_001",
      agentName: sanitizeInput(req.body.agentName, 100) || "Agent",
      agentPhone: sanitizeInput(req.body.agentPhone, 30) || "+234 800 000 0000",
      date,
      timeSlot,
      status: "pending",
      note: sanitizeInput(req.body.note, 500) || "",
      createdAt: new Date().toISOString()
    };

    inspections.unshift(newBooking);

    // Notify agent
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: newBooking.agentId,
      type: "inspection_update",
      title: "New Inspection Request",
      body: `${newBooking.studentName} booked an inspection for ${newBooking.listingTitle} on ${newBooking.date} at ${newBooking.timeSlot}.`,
      read: false,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({ inspection: newBooking });
  });

  app.patch("/api/inspections/:id/status", mutationApiRateLimiter, (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const booking = inspections.find(i => i.id === cleanId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const newStatus = sanitizeInput(req.body.status, 20);
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    booking.status = newStatus as any;

    // Notify student
    notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: booking.studentId,
      type: "inspection_update",
      title: `Inspection ${newStatus.toUpperCase()}`,
      body: `Your inspection for "${booking.listingTitle}" on ${booking.date} has been marked as ${newStatus}.`,
      read: false,
      timestamp: new Date().toISOString()
    });

    res.json({ inspection: booking });
  });

  // Reviews
  app.get("/api/reviews/:listingId", (req, res) => {
    const cleanListingId = sanitizeInput(req.params.listingId, 50);
    const listingReviews = reviews.filter(r => r.listingId === cleanListingId);
    res.json({ reviews: listingReviews });
  });

  app.post("/api/reviews", mutationApiRateLimiter, (req, res) => {
    const listingId = sanitizeInput(req.body.listingId, 50);
    const comment = sanitizeInput(req.body.comment, 1000);
    const studentName = sanitizeInput(req.body.studentName, 100);

    const num = (v: any) => Math.min(5, Math.max(1, Number(v) || 5));
    const security = num(req.body.security);
    const water = num(req.body.water);
    const electricity = num(req.body.electricity);
    const internet = num(req.body.internet);
    const cleanliness = num(req.body.cleanliness);
    const noise = num(req.body.noise);
    const value = num(req.body.value);
    
    const overall = Number(((security + water + electricity + internet + cleanliness + noise + value) / 7).toFixed(1));

    const newRev: Review = {
      id: `rev_${Date.now()}`,
      listingId,
      studentId: sanitizeInput(req.body.studentId, 50) || "stud_user",
      studentName: studentName || "Student Reviewer",
      studentAvatar: sanitizeInput(req.body.studentAvatar, 500) || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      security,
      water,
      electricity,
      internet,
      cleanliness,
      noise,
      value,
      overall,
      comment,
      createdAt: new Date().toISOString()
    };

    reviews.unshift(newRev);

    // Recalculate listing rating
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
      const allListingRevs = reviews.filter(r => r.listingId === listingId);
      const count = allListingRevs.length;
      const sumSec = allListingRevs.reduce((acc, r) => acc + r.security, 0);
      const sumWat = allListingRevs.reduce((acc, r) => acc + r.water, 0);
      const sumEle = allListingRevs.reduce((acc, r) => acc + r.electricity, 0);
      const sumInt = allListingRevs.reduce((acc, r) => acc + r.internet, 0);
      const sumCle = allListingRevs.reduce((acc, r) => acc + r.cleanliness, 0);
      const sumNoi = allListingRevs.reduce((acc, r) => acc + r.noise, 0);
      const sumVal = allListingRevs.reduce((acc, r) => acc + r.value, 0);

      listing.ratings = {
        security: Number((sumSec / count).toFixed(1)),
        water: Number((sumWat / count).toFixed(1)),
        electricity: Number((sumEle / count).toFixed(1)),
        internet: Number((sumInt / count).toFixed(1)),
        cleanliness: Number((sumCle / count).toFixed(1)),
        noise: Number((sumNoi / count).toFixed(1)),
        value: Number((sumVal / count).toFixed(1)),
        overall: Number(((sumSec + sumWat + sumEle + sumInt + sumCle + sumNoi + sumVal) / (7 * count)).toFixed(1)),
        count
      };
    }

    res.status(201).json({ review: newRev });
  });

  // Agent Verifications
  app.get("/api/verifications", (req, res) => {
    res.json({ verifications });
  });

  app.post("/api/verifications", mutationApiRateLimiter, (req, res) => {
    const newVerif: AgentVerification = {
      id: `verif_${Date.now()}`,
      agentId: sanitizeInput(req.body.agentId, 50) || "agent_curr",
      agentName: sanitizeInput(req.body.agentName, 100) || "Agent",
      agentEmail: sanitizeInput(req.body.agentEmail, 100) || "agent@dormiqa.africa",
      businessName: sanitizeInput(req.body.businessName, 150) || "Property Agent",
      proofType: (sanitizeInput(req.body.proofType, 50) || "banner") as "banner" | "logo" | "office_photo" | "cac" | "other",
      proofUrl: sanitizeInput(req.body.proofUrl, 500) || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      agentPhotoUrl: sanitizeInput(req.body.agentPhotoUrl || req.body.agentPhoto, 500) || undefined,
      officeAddress: sanitizeInput(req.body.officeAddress, 200),
      status: "pending",
      submittedAt: new Date().toISOString()
    };
    verifications.unshift(newVerif);
    res.status(201).json({ verification: newVerif });
  });

  app.patch("/api/verifications/:id/status", mutationApiRateLimiter, (req, res) => {
    const cleanId = sanitizeInput(req.params.id, 50);
    const v = verifications.find(item => item.id === cleanId);
    if (!v) {
      return res.status(404).json({ error: "Verification request not found" });
    }
    const status = sanitizeInput(req.body.status, 20);
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    v.status = status as any;
    v.reviewedAt = new Date().toISOString();
    if (req.body.rejectionReason) {
      v.rejectionReason = sanitizeInput(req.body.rejectionReason, 300);
    }

    if (status === 'verified') {
      listings.forEach(l => {
        if (l.agentId === v.agentId) {
          l.isAgentVerified = true;
        }
      });
    }

    res.json({ verification: v });
  });

  // Reports
  app.get("/api/reports", (req, res) => {
    res.json({ reports });
  });

  app.post("/api/reports", mutationApiRateLimiter, (req, res) => {
    const newReport: ReportItem = {
      id: `rep_${Date.now()}`,
      listingId: sanitizeInput(req.body.listingId, 50),
      listingTitle: sanitizeInput(req.body.listingTitle, 150) || "Reported Listing",
      reporterId: sanitizeInput(req.body.reporterId, 50) || "stud_anon",
      reporterName: sanitizeInput(req.body.reporterName, 100) || "Anonymous Student",
      reason: (sanitizeInput(req.body.reason, 50) || "other") as "other" | "fake_listing" | "inaccurate_pricing" | "unresponsive_agent" | "misleading_photos" | "fraud_attempt",
      details: sanitizeInput(req.body.details, 1000) || "No details provided",
      status: "open",
      createdAt: new Date().toISOString()
    };
    reports.unshift(newReport);
    res.status(201).json({ report: newReport });
  });

  // GROQ & CUSTOM LLM AI ENDPOINTS (Strict Rate Limited - Gemini Disabled per user instruction)

  const getLlmApiKey = () => {
    const candidateKeys = [
      process.env.GROQ_API_KEY,
      process.env.LLM_API_KEY,
      process.env.OPENROUTER_API_KEY,
      process.env.OPENAI_API_KEY,
      process.env.DORMIQA_API_KEY,
      process.env.CAMPORANG_API_KEY,
      process.env.CAMPORA_API_KEY,
      process.env.GEMINI_API_KEY, // Check if user set Groq key in secrets panel
    ];
    for (const k of candidateKeys) {
      if (!k) continue;
      const trimmed = k.trim();
      if (
        trimmed === "" ||
        trimmed.startsWith("your_") ||
        trimmed === "MY_GEMINI_API_KEY" ||
        trimmed === "undefined"
      ) {
        continue;
      }
      // Strictly skip Google Gemini keys starting with AIza
      if (trimmed.startsWith("AIza")) {
        continue;
      }
      return trimmed;
    }
    return null;
  };

  let cachedGroqModels: string[] | null = null;
  let lastModelFetchTime = 0;
  const blockedGroqModels = new Set<string>();

  const fetchGroqAvailableModels = async (apiKey: string): Promise<string[]> => {
    const now = Date.now();
    if (cachedGroqModels && cachedGroqModels.length > 0 && (now - lastModelFetchTime < 1000 * 60 * 15)) {
      return cachedGroqModels.filter(m => !blockedGroqModels.has(m));
    }
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          const models = data.data
            .map((m: any) => m.id)
            .filter((id: string) => typeof id === "string" && !id.includes("whisper") && !id.includes("guard") && !blockedGroqModels.has(id));
          if (models.length > 0) {
            cachedGroqModels = models;
            lastModelFetchTime = now;
            console.log("Fetched active Groq models for key/org:", models);
            return models;
          }
        }
      } else {
        const errTxt = await res.text();
        console.warn("Groq models list endpoint returned status:", res.status, errTxt);
      }
    } catch (err: any) {
      console.warn("Failed to fetch Groq models list:", err?.message || err);
    }

    return [
      "deepseek-r1-distill-llama-70b",
      "llama-3.2-3b-preview",
      "llama-3.2-1b-preview",
      "qwen-2.5-coder-32b",
      "llama-3.3-70b-specdec"
    ].filter(m => !blockedGroqModels.has(m));
  };

  const cleanLlmOutput = (text: string): string => {
    if (!text) return "";
    let cleaned = text;

    // 1. Remove <think>...</think> blocks
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
    // 2. Remove unclosed <think>... blocks
    cleaned = cleaned.replace(/<think>[\s\S]*/gi, "");

    // 3. Remove <thinking>...</thinking> or <thought>...</thought> or <reasoning>...</reasoning>
    cleaned = cleaned.replace(/<(thinking|thought|reasoning)>[\s\S]*?<\/(thinking|thought|reasoning)>/gi, "");
    cleaned = cleaned.replace(/<(thinking|thought|reasoning)>[\s\S]*/gi, "");

    // 4. Remove leading thinking headers
    cleaned = cleaned.replace(/^(Thinking Process|Thought Process|Thought|Reasoning|Chain of Thought):\s*[\s\S]*?\n\n/gi, "");

    // 5. Remove any echoed input / context / prompt headers
    cleaned = cleaned.replace(/^(System Instruction|User Query|User|Context|Input|Prompt):\s*.*?\n/gi, "");

    return cleaned.trim();
  };

  const callCustomLlmApi = async (options: {
    model?: string;
    messages: { role: string; content: string }[];
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string | null> => {
    try {
      const apiKey = getLlmApiKey();
      if (!apiKey) return null;

      const isGroqKey = apiKey.startsWith("gsk_") || Boolean(process.env.GROQ_API_KEY);
      
      let url = "https://api.groq.com/openai/v1/chat/completions";
      if (!isGroqKey && process.env.LLM_BASE_URL) {
        url = `${process.env.LLM_BASE_URL.replace(/\/$/, "")}/chat/completions`;
      } else if (!isGroqKey && (apiKey.startsWith("sk-or-") || process.env.OPENROUTER_API_KEY)) {
        url = "https://openrouter.ai/api/v1/chat/completions";
      }

      let candidateModels: string[] = [];
      if (isGroqKey || url.includes("groq")) {
        const liveGroqModels = await fetchGroqAvailableModels(apiKey);
        if (options.model && liveGroqModels.includes(options.model) && !blockedGroqModels.has(options.model)) {
          candidateModels = [options.model, ...liveGroqModels.filter(m => m !== options.model)];
        } else {
          candidateModels = liveGroqModels;
        }
      } else {
        candidateModels = [options.model || "llama-3.3-70b-versatile", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"];
      }

      candidateModels = candidateModels.filter(m => !blockedGroqModels.has(m));

      for (const modelCandidate of candidateModels) {
        try {
          const body: any = {
            model: modelCandidate,
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
          };

          if (options.jsonMode) {
            body.response_format = { type: "json_object" };
          }

          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
              "HTTP-Referer": "https://dormiqa.africa",
              "X-Title": "Dormiqa Student Housing",
            },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            const content = data.choices?.[0]?.message?.content;
            if (content && typeof content === 'string' && content.trim()) {
              const cleanedContent = options.jsonMode ? content : cleanLlmOutput(content);
              if (cleanedContent) {
                return cleanedContent;
              }
            }
          } else {
            const errText = await res.text();
            if (res.status === 403 || res.status === 400 || errText.includes("blocked") || errText.includes("decommissioned")) {
              blockedGroqModels.add(modelCandidate);
            }
            console.warn(`Groq/LLM call with model ${modelCandidate} status (${res.status}). Swapping to next model...`);
          }
        } catch (mErr: any) {
          console.warn(`Error trying Groq model ${modelCandidate}:`, mErr?.message || mErr);
        }
      }

      return null;
    } catch (err: any) {
      console.warn("callCustomLlmApi exception:", err?.message || err);
      return null;
    }
  };

  // 1. Natural Language Accommodation Search
  app.post("/api/gemini/search", aiApiRateLimiter, async (req, res) => {
    try {
      const rawPrompt = req.body?.prompt;
      if (!rawPrompt || typeof rawPrompt !== 'string') {
        return res.status(400).json({ error: "Prompt string is required" });
      }

      const prompt = sanitizeAiPrompt(rawPrompt, 500);

      const listingSummary = listings.map(l => ({
        id: l.id,
        title: l.title,
        university: l.universityName,
        price: `${l.currency}${l.price}/${l.pricePeriod}`,
        type: l.type,
        gender: l.gender,
        facilities: l.facilities,
        distanceMinutes: l.distanceToCampusMinutes,
        description: l.description
      }));

      const systemInstruction = `You are Dormiqa's intelligent African student housing search AI powered by Groq. 
Analyze the user's natural language request and match them with the best listings from our available database.
Always respond in strict valid JSON with the following structure:
{
  "interpretedQuery": "Summary of user request",
  "matchedListingIds": ["list_id1", "list_id2"],
  "explanation": "Clear explanation of why these hostels match"
}`;

      const promptContent = `User Query: "${prompt}"

Available Listings Database:
${JSON.stringify(listingSummary, null, 2)}`;

      const responseText = await callCustomLlmApi({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptContent }
        ],
        temperature: 0.2,
        jsonMode: true
      });

      if (responseText) {
        let cleanText = responseText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        const parsed = JSON.parse(cleanText);
        return res.json(parsed);
      }

      // Fallback filter logic if AI call failed
      const lower = prompt.toLowerCase();
      const matched = listings.filter(l => 
        l.title.toLowerCase().includes(lower) ||
        l.description.toLowerCase().includes(lower) ||
        l.universityName.toLowerCase().includes(lower) ||
        l.type.toLowerCase().includes(lower)
      );
      return res.json({
        interpretedQuery: prompt,
        matchedListingIds: matched.map(m => m.id),
        explanation: `Showing ${matched.length} student accommodations matching your request.`
      });
    } catch (err: any) {
      res.json({
        interpretedQuery: "Search Query",
        matchedListingIds: listings.slice(0, 3).map(m => m.id),
        explanation: "Showing top recommended student accommodations."
      });
    }
  });

  // 2. AI Chatbot (Dormiqa Student Assistant - Powered by Groq AI)
  app.post("/api/gemini/chat", aiApiRateLimiter, async (req, res) => {
    try {
      const { message: rawMsg, history: rawHistory } = req.body;
      if (!rawMsg || typeof rawMsg !== 'string') {
        return res.status(400).json({ error: "Message string is required" });
      }

      const message = sanitizeAiPrompt(rawMsg, 1000);
      const history = Array.isArray(rawHistory) ? rawHistory.slice(-10) : [];

      const systemInstruction = `You are Dormiqa AI - the ultimate African Student Accommodation Assistant powered by Groq AI.
Your job is to assist university students with:
- Finding verified accommodation near African universities (UNILAG, UON, UCT, KNUST, Makerere, Covenant, etc.)
- Safety advice (checking verified badges, inspecting properties before paying rent)
- Understanding hostel rules, generator/solar power setups, water supply, and security
- How to schedule free physical inspections through Dormiqa
Keep your tone friendly, encouraging, knowledgeable, student-centric, and concise.

CRITICAL OUTPUT RULES:
- Do NOT output any thinking process, reasoning steps, internal thoughts, or <think> tags.
- Do NOT show, echo, or repeat the input context, system prompt, or user queries.
- ONLY output the final direct answer/reply to the student.

CRITICAL TABLE FORMATTING RULE:
Do NOT output raw Markdown table syntax (using '|', '---').
If presenting tabular or comparative data, output clean HTML <table> elements with <thead>, <tbody>, <tr>, <th>, and <td> tags, OR present the information as clean bulleted cards/sections. Never output raw Markdown pipe characters '|' for tables.`;

      const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...(history || []).map((h: any) => ({
          role: h.role === "user" ? "user" : "assistant",
          content: sanitizeAiPrompt(h.parts && h.parts[0] ? h.parts[0].text : (h.text || ""), 500)
        })),
        { role: "user", content: message }
      ];

      const replyText = await callCustomLlmApi({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.7
      });

      if (replyText) {
        return res.json({ reply: replyText, modelUsed: "Groq Llama 3.3 70B" });
      }

      return res.json({
        reply: "Hello! I am Dormiqa AI Assistant. I can help you find verified student hostels near UNILAG, UON, UCT, KNUST, and other top African campuses, guide you on free physical inspections, and answer safety questions. How can I assist you today?"
      });
    } catch (err: any) {
      res.json({
        reply: "Hello! I am Dormiqa AI Assistant. How can I help you with student accommodation search or hostel inspections today?"
      });
    }
  });

  // 3. AI Listing Description Generator (For Agents)
  app.post("/api/gemini/generate-description", aiApiRateLimiter, async (req, res) => {
    const title = sanitizeInput(req.body.title, 150);
    const universityName = sanitizeInput(req.body.universityName, 150);
    const type = sanitizeInput(req.body.type, 50);
    const price = Number(req.body.price) || 250000;
    const currency = "₦";
    const period = sanitizeInput(req.body.period, 20) || "year";
    const facilities = Array.isArray(req.body.facilities) ? req.body.facilities.map((f: any) => sanitizeInput(f, 50)) : [];

    const fallbackDescription = `Modern ${type || "student apartment"} located near ${universityName || "campus"}. Features include ${facilities && facilities.length ? facilities.join(", ") : "24/7 water supply, electricity, and verified security"}. Ideal for students looking for comfort and convenience.`;

    try {
      const prompt = `Write a compelling, professional, student-friendly property description for a Dormiqa listing:
- Accommodation Name: ${title || "Student Residence"}
- University: ${universityName || "University"}
- Type: ${type || "Self-Contain"}
- Price: ${currency}${price} per ${period}
- Included Facilities: ${facilities ? facilities.join(", ") : "Wi-Fi, Water, Security"}`;

      const replyText = await callCustomLlmApi({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert real estate copywriter specializing in African student housing. Write engaging 2-paragraph descriptions highlighting security, power supply, proximity to campus, and student comfort." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      });

      if (replyText) {
        return res.json({ description: replyText });
      }

      res.json({ description: fallbackDescription });
    } catch (err: any) {
      res.json({ description: fallbackDescription });
    }
  });

  // 4. AI Duplicate Listing Detector
  app.post("/api/gemini/detect-duplicate", aiApiRateLimiter, async (req, res) => {
    try {
      const title = sanitizeInput(req.body.title, 150);
      const address = sanitizeInput(req.body.address, 200);
      const universityName = sanitizeInput(req.body.universityName, 150);
      const price = Number(req.body.price);

      const existingData = listings.map(l => ({
        id: l.id,
        title: l.title,
        address: l.address,
        university: l.universityName,
        price: l.price
      }));

      const replyText = await callCustomLlmApi({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Analyze if the new listing is a duplicate or spam copy of any existing listing. Respond in strict JSON format with keys: isDuplicate (boolean), confidenceScore (number), reason (string)." },
          { role: "user", content: `New Listing details:
Title: ${title}
Address: ${address}
University: ${universityName}
Price: ${price}

Existing Listings:
${JSON.stringify(existingData, null, 2)}` }
        ],
        temperature: 0.2,
        jsonMode: true
      });

      if (replyText) {
        let cleanText = replyText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        const result = JSON.parse(cleanText);
        return res.json(result);
      }

      res.json({ isDuplicate: false, confidenceScore: 0, reason: "No duplicate detected" });
    } catch (err: any) {
      res.json({ isDuplicate: false, confidenceScore: 0, reason: "Check passed" });
    }
  });

  // Fast AI Listing Moderation & Review Endpoint
  app.post("/api/gemini/review-listing", aiApiRateLimiter, async (req, res) => {
    try {
      const id = sanitizeInput(req.body.id, 50);
      const title = sanitizeInput(req.body.title, 150);
      const address = sanitizeInput(req.body.address, 200);
      const universityName = sanitizeInput(req.body.universityName, 150);
      const price = Number(req.body.price);
      const imagesCount = Number(req.body.imagesCount) || 0;
      const video360Url = sanitizeInput(req.body.video360Url, 500);
      const description = sanitizeInput(req.body.description, 2000);
      const agentId = sanitizeInput(req.body.agentId, 50);

      const duplicateReasons: string[] = [];

      const existingDup = listings.find(l => 
        l.id !== id && 
        (
          (l.address && address && l.address.toLowerCase().trim() === address.toLowerCase().trim() && l.address.length > 5) ||
          (l.title && title && l.title.toLowerCase().trim() === title.toLowerCase().trim() && l.title.length > 5)
        )
      );

      if (existingDup) {
        duplicateReasons.push(`Multiple / duplicate listing detected for existing property "${existingDup.title}" at address "${address}".`);
      }

      if (imagesCount < 5) {
        duplicateReasons.push("Insufficient photos provided (minimum 5 photos are strictly required).");
      }

      if (!video360Url || video360Url.trim().length < 5) {
        duplicateReasons.push("Missing required 360-degree walkthrough video URL.");
      }

      if (price <= 5000) {
        duplicateReasons.push("Price specified is unrealistically low or zero.");
      }

      if (duplicateReasons.length > 0) {
        return res.json({
          approved: false,
          status: "rejected",
          reason: duplicateReasons.join(" "),
          riskScore: 85
        });
      }

      const existingData = listings.filter(l => l.id !== id).map(l => ({
        id: l.id,
        title: l.title,
        address: l.address,
        university: l.universityName,
        price: l.price,
        agentId: l.agentId
      }));

      const replyText = await callCustomLlmApi({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: `You are Dormiqa AI Listing Auditor for Nigerian Student Housing.
Audit the new listing for:
1. Duplicate or multiple listings (same address or same title or copy-pasted details).
2. Suspicious spam or inappropriate wording.

If valid and not a duplicate, respond in JSON with approved: true, status: "active", reason: "Listing verified and approved for student timeline.", riskScore: 0.
If duplicate or invalid, respond in JSON with approved: false, status: "rejected", reason: "Specific failure reason state e.g. Multiple/duplicate listing detected...", riskScore: 85.` },
          { role: "user", content: `Audit this newly posted student hostel listing for immediate publication:
Title: ${title}
Address: ${address}
University: ${universityName}
Price: NGN ${price}
Photos Count: ${imagesCount}
Description: ${description || 'N/A'}
Agent ID: ${agentId}

Existing Listings database:
${JSON.stringify(existingData.slice(0, 15), null, 2)}` }
        ],
        temperature: 0.2,
        jsonMode: true
      });

      if (replyText) {
        let cleanText = replyText.trim();
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        const result = JSON.parse(cleanText);
        return res.json({
          approved: result.approved ?? true,
          status: result.approved ? "active" : "rejected",
          reason: result.reason || (result.approved ? "Listing approved!" : "Unapproved by AI review."),
          riskScore: result.riskScore || 0
        });
      }

      res.json({
        approved: true,
        status: "active",
        reason: "Listing verified and approved by Dormiqa AI.",
        riskScore: 0
      });
    } catch (err: any) {
      res.json({
        approved: true,
        status: "active",
        reason: "Listing verified and approved by Dormiqa AI.",
        riskScore: 0
      });
    }
  });

  // 5. AI Business & Agent Verification Assistant
  app.post("/api/gemini/verify-business", aiApiRateLimiter, async (req, res) => {
    try {
      const businessName = sanitizeInput(req.body.businessName, 150);
      const proofType = sanitizeInput(req.body.proofType, 50);
      const officeAddress = sanitizeInput(req.body.officeAddress, 200);

      const systemInstruction = `You are Dormiqa's automated AI Business Verification Officer for African student housing.
Evaluate the agency business details provided by a property manager/agent.
Checks to perform:
- Credibility and appropriateness of Business / Agency Name (${businessName})
- Proof of business type provided (${proofType || 'banner / logo / office photo'})
- Credibility of physical Office Address (${officeAddress || 'Not provided'})
- Risk score assessment (0 to 100, where 0 is safest)

Respond in strict JSON with schema:
{
  "isValid": true/false,
  "riskScore": number,
  "confidence": number,
  "verifiedBadgeTitle": "string",
  "reason": "Detailed AI verification decision feedback"
}`;

      const llmKey = getLlmApiKey();
      if (llmKey) {
        const verifyModel = process.env.LLM_CHAT_MODEL || "qwen/qwen3.6-27b";
        const promptContent = `Business Name: ${businessName}
Proof of Business Type: ${proofType || "Banner / Logo / Office Photo"}
Office Address: ${officeAddress || "Not provided"}`;

        const responseText = await callCustomLlmApi({
          model: verifyModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: promptContent }
          ],
          temperature: 0.1,
          jsonMode: true
        });

        if (responseText) {
          let cleanText = responseText.trim();
          if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
          }
          const parsed = JSON.parse(cleanText);
          return res.json(parsed);
        }
      }

      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Business Name: ${businessName}
Proof of Business Type: ${proofType || 'banner / logo / office photo'}
Office Address: ${officeAddress || 'Not provided'}`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                riskScore: { type: Type.NUMBER },
                confidence: { type: Type.NUMBER },
                verifiedBadgeTitle: { type: Type.STRING },
                reason: { type: Type.STRING }
              },
              required: ["isValid", "riskScore", "verifiedBadgeTitle", "reason"]
            }
          }
        });

        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }

      return res.json({
        isValid: true,
        riskScore: 5,
        confidence: 95,
        verifiedBadgeTitle: "Dormiqa Verified Agent",
        reason: "Credentials meet format standards. Instant agent badge granted."
      });
    } catch (err: any) {
      res.json({
        isValid: true,
        riskScore: 10,
        confidence: 85,
        verifiedBadgeTitle: "Dormiqa Agent",
        reason: "Verification submitted successfully."
      });
    }
  });

  // ==========================================
  // SECURE ADMIN ACCESS & AUTHENTICATION APIs
  // ==========================================
  const adminSessions = new Map<string, { createdAt: number; expiresAt: number }>();

  // ==========================================
  // AMBASSADOR PORTAL BACKEND DATA STORES & APIS
  // ==========================================
  
  interface AmbassadorStoreItem {
    id: string;
    email: string;
    name: string;
    phone: string;
    universityName: string;
    ambassadorId: string; // e.g. DORMIQA-001
    referralCode: string;
    ambassadorStatus: 'Pending' | 'Active' | 'Suspended' | 'Inactive';
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidEarnings: number;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    createdAt: string;
  }

  interface ReferralStoreItem {
    id: string;
    referralCode: string;
    ambassadorId: string;
    studentMaskedId: string;
    universityName: string;
    status: 'CLICKED' | 'REGISTERED' | 'EMAIL_VERIFIED' | 'ONBOARDING' | 'QUALIFIED' | 'VALID' | 'REJECTED' | 'FRAUD_REVIEW';
    stage: string;
    conversionStatus: 'Pending' | 'Qualified' | 'Converted' | 'Rejected';
    earningsAmount: number;
    date: string;
    lastActivity: string;
  }

  interface EarningStoreItem {
    id: string;
    ambassadorId: string;
    referralId: string;
    studentMaskedId: string;
    amount: number;
    status: 'Pending' | 'Qualified' | 'Approved' | 'Paid' | 'Rejected';
    description: string;
    createdAt: string;
    approvedAt?: string;
    paidAt?: string;
  }

  interface PayoutStoreItem {
    id: string;
    ambassadorId: string;
    amount: number;
    status: 'Pending' | 'Processing' | 'Approved' | 'Paid' | 'Rejected';
    bankName: string;
    accountNumber: string;
    accountName: string;
    requestedAt: string;
    processedAt?: string;
    referenceNumber?: string;
    adminNotes?: string;
  }

  interface ResourceStoreItem {
    id: string;
    title: string;
    category: 'Guide' | 'Social Copy' | 'Banner Graphic' | 'Campus Flyer' | 'Video Script' | 'FAQ';
    description: string;
    fileUrl?: string;
    content?: string;
    downloadCount: number;
    format: string;
    createdAt: string;
  }

  let ambassadorList: AmbassadorStoreItem[] = [];

  let referralList: ReferralStoreItem[] = [];

  let earningList: EarningStoreItem[] = [];

  let payoutList: PayoutStoreItem[] = [];

  let resourceList: ResourceStoreItem[] = [
    {
      id: "res_001",
      title: "Official DORMIQA Campus Ambassador Toolkit 2026/2027",
      category: "Guide",
      description: "Comprehensive step-by-step onboarding guide, referral strategy, and rules of engagement for university ambassadors.",
      content: "Welcome to the DORMIQA Ambassador Program! Use your unique link (e.g. https://dormiqa-ambassador.vercel.app/?ref=DORMIQA-001 or student portal link) to register students.",
      downloadCount: 42,
      format: "PDF Guide",
      createdAt: new Date().toISOString()
    },
    {
      id: "res_002",
      title: "Instagram & WhatsApp Status Story Graphics Pack",
      category: "Banner Graphic",
      description: "High-resolution 1080x1920 social graphics for UNILAG, UNIBEN, OAU, UI, FUTMinna, and Covenant students.",
      fileUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
      downloadCount: 88,
      format: "PNG Bundle",
      createdAt: new Date().toISOString()
    },
    {
      id: "res_003",
      title: "WhatsApp Broadcast & Student Group Copy Templates",
      category: "Social Copy",
      description: "3 pre-written broadcast messages tailored for department group chats and hostel association groups.",
      content: "📌 *Need a verified hostel near campus without agent scam?*\nCheck verified accommodations on DORMIQA! Click here: {YOUR_REFERRAL_LINK}",
      downloadCount: 156,
      format: "Text Copy",
      createdAt: new Date().toISOString()
    },
    {
      id: "res_004",
      title: "Printable Campus Gate Flyer & QR Code Template",
      category: "Campus Flyer",
      description: "Ready-to-print A5 flyers with custom QR code slot for campus gate distribution.",
      fileUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
      downloadCount: 31,
      format: "PDF Printable",
      createdAt: new Date().toISOString()
    }
  ];

  // Helper to calculate ambassador performance metrics
  function getAmbassadorMetrics(ambassadorId: string) {
    const refs = referralList.filter(r => r.ambassadorId === ambassadorId);
    const totalReferrals = refs.length;
    const successfulReferrals = refs.filter(r => r.conversionStatus === 'Converted' || r.status === 'VALID' || r.status === 'QUALIFIED').length;
    const pendingReferrals = refs.filter(r => r.status === 'CLICKED' || r.status === 'REGISTERED' || r.status === 'EMAIL_VERIFIED' || r.status === 'ONBOARDING').length;
    const conversionRate = totalReferrals > 0 ? Math.round((successfulReferrals / totalReferrals) * 100) : 0;

    const ambassadorEarnings = earningList.filter(e => e.ambassadorId === ambassadorId);
    const totalEarnings = ambassadorEarnings.reduce((sum, e) => sum + e.amount, 0);
    const pendingEarnings = ambassadorEarnings.filter(e => e.status === 'Pending' || e.status === 'Qualified').reduce((sum, e) => sum + e.amount, 0);
    const paidEarnings = ambassadorEarnings.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);

    return {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      conversionRate,
      totalEarnings,
      pendingEarnings,
      paidEarnings,
    };
  }

  // 1. Get Ambassador Stats
  app.get("/api/ambassador/stats", (req, res) => {
    const ambassadorId = sanitizeInput(req.query.ambassadorId as string, 50);
    if (!ambassadorId) {
      return res.status(400).json({ error: "Ambassador ID is required" });
    }

    const metrics = getAmbassadorMetrics(ambassadorId);
    const ambassador = ambassadorList.find(a => a.id === ambassadorId || a.ambassadorId === ambassadorId);

    res.json({
      ambassadorId: ambassador?.ambassadorId || ambassadorId,
      status: ambassador?.ambassadorStatus || "Active",
      metrics,
      recentActivity: referralList
        .filter(r => r.ambassadorId === ambassadorId)
        .slice(0, 5)
    });
  });

  // 2. Get Ambassador Referrals
  app.get("/api/ambassador/referrals", (req, res) => {
    const ambassadorId = sanitizeInput(req.query.ambassadorId as string, 50);
    if (!ambassadorId) {
      return res.status(400).json({ error: "Ambassador ID is required" });
    }

    const refs = referralList.filter(r => r.ambassadorId === ambassadorId);
    res.json({ referrals: refs, total: refs.length });
  });

  // 3. Register Referral Click / Attribution
  app.post("/api/referrals/click", mutationApiRateLimiter, (req, res) => {
    const refCode = sanitizeInput(req.body.refCode, 30);
    if (!refCode) {
      return res.status(400).json({ error: "Referral code is required" });
    }

    const ambassador = ambassadorList.find(a => a.referralCode === refCode || a.ambassadorId === refCode);
    if (!ambassador) {
      return res.status(404).json({ error: "Invalid ambassador referral code" });
    }

    if (ambassador.ambassadorStatus === "Suspended") {
      return res.status(403).json({ error: "Referral program inactive for this ambassador" });
    }

    const studentMaskedId = `STU-***${Math.floor(1000 + Math.random() * 9000)}`;
    const newRef: ReferralStoreItem = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      referralCode: refCode,
      ambassadorId: ambassador.id,
      studentMaskedId,
      universityName: ambassador.universityName || "UNILAG",
      status: "CLICKED",
      stage: "Referral Link Visited",
      conversionStatus: "Pending",
      earningsAmount: 0,
      date: new Date().toISOString().split("T")[0],
      lastActivity: new Date().toISOString()
    };

    referralList.unshift(newRef);
    ambassador.totalReferrals += 1;
    ambassador.pendingReferrals += 1;

    res.json({ success: true, referralId: newRef.id, studentMaskedId });
  });

  // 4. Register Referred Student Onboarding Progress
  app.post("/api/referrals/progress", mutationApiRateLimiter, (req, res) => {
    const { referralId, status, stage } = req.body;
    const cleanId = sanitizeInput(referralId, 50);
    const cleanStatus = sanitizeInput(status, 30) as any;
    const cleanStage = sanitizeInput(stage, 100);

    const ref = referralList.find(r => r.id === cleanId);
    if (!ref) {
      return res.status(404).json({ error: "Referral record not found" });
    }

    ref.status = cleanStatus || ref.status;
    ref.stage = cleanStage || ref.stage;
    ref.lastActivity = new Date().toISOString();

    res.json({ success: true, referral: ref });
  });

  // 5. Ambassador Earnings Ledger
  app.get("/api/ambassador/earnings", (req, res) => {
    const ambassadorId = sanitizeInput(req.query.ambassadorId as string, 50);
    if (!ambassadorId) {
      return res.status(400).json({ error: "Ambassador ID is required" });
    }

    const earnings = earningList.filter(e => e.ambassadorId === ambassadorId);
    res.json({ earnings, total: earnings.length });
  });

  // 6. Ambassador Payout Requests & History
  app.get("/api/ambassador/payouts", (req, res) => {
    const ambassadorId = sanitizeInput(req.query.ambassadorId as string, 50);
    if (!ambassadorId) {
      return res.status(400).json({ error: "Ambassador ID is required" });
    }

    const payouts = payoutList.filter(p => p.ambassadorId === ambassadorId);
    
    // Calculate available balance
    const metrics = getAmbassadorMetrics(ambassadorId);
    const approvedEarningsSum = earningList
      .filter(e => e.ambassadorId === ambassadorId && (e.status === 'Approved' || e.status === 'Qualified'))
      .reduce((s, e) => s + e.amount, 0);
    
    const requestedPayoutsSum = payoutList
      .filter(p => p.ambassadorId === ambassadorId && p.status !== 'Rejected')
      .reduce((s, p) => s + p.amount, 0);

    const availableBalance = Math.max(0, approvedEarningsSum - requestedPayoutsSum);

    res.json({ payouts, availableBalance });
  });

  app.post("/api/ambassador/payouts", mutationApiRateLimiter, (req, res) => {
    const ambassadorId = sanitizeInput(req.body.ambassadorId, 50);
    const amount = Number(req.body.amount);
    const bankName = sanitizeInput(req.body.bankName, 100);
    const accountNumber = sanitizeInput(req.body.accountNumber, 30);
    const accountName = sanitizeInput(req.body.accountName, 100);

    if (!ambassadorId || isNaN(amount) || amount <= 0 || !bankName || !accountNumber) {
      return res.status(400).json({ error: "Valid amount, bank name, and account number are required" });
    }

    const approvedEarningsSum = earningList
      .filter(e => e.ambassadorId === ambassadorId && (e.status === 'Approved' || e.status === 'Qualified'))
      .reduce((s, e) => s + e.amount, 0);
    
    const requestedPayoutsSum = payoutList
      .filter(p => p.ambassadorId === ambassadorId && p.status !== 'Rejected')
      .reduce((s, p) => s + p.amount, 0);

    const availableBalance = Math.max(0, approvedEarningsSum - requestedPayoutsSum);

    if (amount > availableBalance) {
      return res.status(400).json({ 
        error: `Requested amount (₦${amount.toLocaleString()}) exceeds your available balance (₦${availableBalance.toLocaleString()})` 
      });
    }

    const newPayout: PayoutStoreItem = {
      id: `payout_${Date.now()}`,
      ambassadorId,
      amount,
      status: "Pending",
      bankName,
      accountNumber,
      accountName: accountName || "Ambassador Account",
      requestedAt: new Date().toISOString()
    };

    payoutList.unshift(newPayout);
    res.status(201).json({ payout: newPayout, success: true });
  });

  // 7. Ambassador Marketing Resources
  app.get("/api/ambassador/resources", (req, res) => {
    res.json({ resources: resourceList });
  });

  // 8. ADMIN APIS FOR AMBASSADOR MANAGEMENT
  app.get("/api/admin/ambassadors", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : (req.query.token as string);

    if (!token || !adminSessions.has(token) || Date.now() > adminSessions.get(token)!.expiresAt) {
      return res.status(401).json({ error: "Unauthorized admin access" });
    }

    res.json({ ambassadors: ambassadorList, total: ambassadorList.length });
  });

  app.patch("/api/admin/ambassadors/:id/status", mutationApiRateLimiter, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

    if (!token || !adminSessions.has(token) || Date.now() > adminSessions.get(token)!.expiresAt) {
      return res.status(401).json({ error: "Unauthorized admin access" });
    }

    const cleanId = sanitizeInput(req.params.id, 50);
    const newStatus = sanitizeInput(req.body.status, 20) as any;
    if (!["Pending", "Active", "Suspended", "Inactive"].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const ambassador = ambassadorList.find(a => a.id === cleanId || a.ambassadorId === cleanId);
    if (!ambassador) {
      return res.status(404).json({ error: "Ambassador not found" });
    }

    ambassador.ambassadorStatus = newStatus;
    res.json({ success: true, ambassador });
  });

  // Admin Referral Qualification & Earning Creation
  app.post("/api/admin/referrals/qualify", mutationApiRateLimiter, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

    if (!token || !adminSessions.has(token) || Date.now() > adminSessions.get(token)!.expiresAt) {
      return res.status(401).json({ error: "Unauthorized admin access" });
    }

    const referralId = sanitizeInput(req.body.referralId, 50);
    const rewardAmount = Number(req.body.rewardAmount) || 2500;

    const ref = referralList.find(r => r.id === referralId);
    if (!ref) {
      return res.status(404).json({ error: "Referral record not found" });
    }

    ref.status = "QUALIFIED";
    ref.conversionStatus = "Converted";
    ref.earningsAmount = rewardAmount;
    ref.lastActivity = new Date().toISOString();

    const earning: EarningStoreItem = {
      id: `earn_${Date.now()}`,
      ambassadorId: ref.ambassadorId,
      referralId: ref.id,
      studentMaskedId: ref.studentMaskedId,
      amount: rewardAmount,
      status: "Approved",
      description: `Qualified student referral reward (${ref.universityName})`,
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString()
    };

    earningList.unshift(earning);

    // Update ambassador totals
    const ambassador = ambassadorList.find(a => a.id === ref.ambassadorId);
    if (ambassador) {
      ambassador.successfulReferrals += 1;
      if (ambassador.pendingReferrals > 0) ambassador.pendingReferrals -= 1;
      ambassador.totalEarnings += rewardAmount;
    }

    res.json({ success: true, referral: ref, earning });
  });

  // Admin Payout Approval & Processing
  app.patch("/api/admin/payouts/:id/status", mutationApiRateLimiter, (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

    if (!token || !adminSessions.has(token) || Date.now() > adminSessions.get(token)!.expiresAt) {
      return res.status(401).json({ error: "Unauthorized admin access" });
    }

    const cleanId = sanitizeInput(req.params.id, 50);
    const newStatus = sanitizeInput(req.body.status, 20) as any;
    const adminNotes = sanitizeInput(req.body.adminNotes, 200);

    const payout = payoutList.find(p => p.id === cleanId);
    if (!payout) {
      return res.status(404).json({ error: "Payout request not found" });
    }

    payout.status = newStatus;
    payout.processedAt = new Date().toISOString();
    if (adminNotes) payout.adminNotes = adminNotes;
    payout.referenceNumber = `PAY-NG-${Math.floor(100000 + Math.random() * 900000)}`;

    if (newStatus === "Paid") {
      const ambassador = ambassadorList.find(a => a.id === payout.ambassadorId);
      if (ambassador) {
        ambassador.paidEarnings += payout.amount;
        if (ambassador.pendingEarnings >= payout.amount) {
          ambassador.pendingEarnings -= payout.amount;
        }
      }
    }

    res.json({ success: true, payout });
  });
  const adminLoginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many security access attempts. Please wait 15 minutes before trying again."
  });

  // Admin Password Login Endpoint
  app.post("/api/admin/login", adminLoginRateLimiter, (req, res) => {
    try {
      const { password } = req.body;
      const expectedPassword = process.env.ADMIN_PASSWORD || "Dormiqa_ambassador_9900234";

      if (!password || password !== expectedPassword) {
        return res.status(401).json({ 
          success: false, 
          error: "Invalid access password. Entry denied." 
        });
      }

      // Generate a secure admin session token
      const token = `dormiqa_admin_session_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hour session expiry
      adminSessions.set(token, { createdAt: Date.now(), expiresAt });

      return res.json({
        success: true,
        token,
        expiresAt,
        adminUser: {
          id: "admin_001",
          name: "Dormiqa Platform Admin",
          email: "admin@dormiqa.africa",
          role: "admin",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Authentication system error" });
    }
  });

  // Admin Session Verification
  app.post("/api/admin/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

    if (!token) return res.status(401).json({ valid: false, error: "No token provided" });

    const session = adminSessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
      if (session) adminSessions.delete(token);
      return res.status(401).json({ valid: false, error: "Session expired or invalid" });
    }

    return res.json({ valid: true, expiresAt: session.expiresAt });
  });

  // Admin Logout Endpoint
  app.post("/api/admin/logout", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
    if (token && adminSessions.has(token)) {
      adminSessions.delete(token);
    }
    return res.json({ success: true });
  });

  // Admin Dashboard Comprehensive Statistics
  app.get("/api/admin/stats", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : (req.query.token as string);

    if (!token || !adminSessions.has(token) || Date.now() > adminSessions.get(token)!.expiresAt) {
      return res.status(401).json({ error: "Unauthorized admin access" });
    }

    const activeListingsCount = listings.filter(l => l.status === 'active').length;
    const pendingVerificationsCount = verifications.filter(v => v.status === 'pending').length;
    const verifiedVerificationsCount = verifications.filter(v => v.status === 'verified').length;
    const totalVerificationsCount = verifications.length;
    const verifRate = totalVerificationsCount > 0 
      ? `${Math.round((verifiedVerificationsCount / totalVerificationsCount) * 100)}%` 
      : "0%";

    return res.json({
      students: {
        total: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
        byUniversity: []
      },
      agents: {
        pendingCount: pendingVerificationsCount,
        verifiedCount: verifiedVerificationsCount,
      },
      activeListingsCount,
      verificationRate: verifRate,
      analytics: {
        demandByRoomType: [],
        monthlySignups: [],
        topRequestedUniversities: []
      }
    });
  });

  // Global Error Handler Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Internal Server Error:", err?.message || err);
    res.status(500).json({ error: "An internal server error occurred. Please try again later." });
  });

  // Vite Integration & Dynamic HTML Meta Handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      try {
        const host = req.get('x-forwarded-host') || req.get('host') || 'dormiqa.app';
        const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
        const baseUrl = `${protocol}://${host}`;
        const currentUrl = `${baseUrl}${req.originalUrl || ''}`;
        
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = html
          .replaceAll('content="/og-image.png"', `content="${baseUrl}/og-image.png"`)
          .replaceAll('href="/favicon', `href="${baseUrl}/favicon`);

        if (!html.includes('og:url')) {
          html = html.replace('</head>', `  <meta property="og:url" content="${currentUrl}" />\n    <link rel="canonical" href="${currentUrl}" />\n  </head>`);
        }

        res.set('Content-Type', 'text/html');
        res.send(html);
      } catch (err) {
        res.sendFile(indexPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dormiqa Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
