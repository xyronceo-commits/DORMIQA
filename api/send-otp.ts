import crypto from "crypto";
import nodemailer from "nodemailer";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc 
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json" assert { type: "json" };

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const firestoreDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(firebaseApp);

function hashOtpCode(email: string, code: string): string {
  return crypto.createHash("sha256").update(`${email.trim().toLowerCase()}:${code.trim()}`).digest("hex");
}

async function dispatchEmailOtp(toEmail: string, code: string): Promise<{ success: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM || "Dormiqa Housing <no-reply@dormiqa.com>";

  const subject = `Dormiqa Email Verification Code`;
  const textContent = `DORMIQA\n\nVerify your email address\n\nYour 6-digit verification code is:\n\n${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .logo { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }
          .logo span { color: #10b981; }
          .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-align: center; }
          .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 20px; text-align: center; }
          .code-box { background: #f0fdf4; border: 2px dashed #10b981; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px; }
          .code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #065f46; font-family: monospace; }
          .expiry { font-size: 12px; color: #64748b; text-align: center; margin-top: 16px; }
          .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">DORMIQA<span>.</span></div>
          <div class="title">Verify Your Email Address</div>
          <p class="text">Your 6-digit verification code is:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p class="text" style="font-size: 13px; margin-bottom: 0;">This code expires in <strong>10 minutes</strong>.</p>
          <div class="expiry">If you did not request this code, you can ignore this email.</div>
          <div class="footer">&copy; 2026 Dormiqa Student Housing. All rights reserved.</div>
        </div>
      </body>
    </html>
  `;

  try {
    let transporter;
    if (smtpHost && smtpUser) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass || ""
        }
      });
    } else if (smtpHost) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: process.env.SMTP_SECURE === "true" || smtpPort === 465
      });
    } else {
      const testAccount = await nodemailer.createTestAccount().catch(() => null);
      if (testAccount) {
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
      } else {
        transporter = nodemailer.createTransport({ jsonTransport: true });
      }
    }

    await transporter.sendMail({
      from: emailFrom,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    return { success: true };
  } catch (err: any) {
    console.error("[SMTP ERROR] Failed sending verification email:", err?.message || "Unknown error");
    return {
      success: false,
      error: "Unable to send verification code. Please try again."
    };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { email, userId } = req.body || {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, error: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query active verification records in Firestore for 60s cooldown check
    const verifRef = collection(firestoreDb, "emailVerifications");
    const qActive = query(verifRef, where("email", "==", normalizedEmail), where("used", "==", false));
    const activeSnap = await getDocs(qActive).catch(() => null);

    let lastCreated = 0;
    if (activeSnap) {
      activeSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.createdAt && data.createdAt > lastCreated) {
          lastCreated = data.createdAt;
        }
      });
    }

    // Prevent rapid resend within 60 seconds (Resend Cooldown)
    if (lastCreated > 0 && Date.now() - lastCreated < 60000) {
      const waitSec = Math.ceil((60000 - (Date.now() - lastCreated)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec} seconds before requesting a new code.`,
        cooldownLeft: waitSec
      });
    }

    // Generate cryptographically secure random 6-digit OTP code
    const code = crypto.randomInt(100000, 1000000).toString();

    // Dispatch email through configured SMTP server
    const dispatchResult = await dispatchEmailOtp(normalizedEmail, code);
    if (!dispatchResult.success) {
      return res.status(500).json({
        success: false,
        error: dispatchResult.error || "Unable to send verification code. Please try again."
      });
    }

    // Invalidate any existing active verification records for this email
    if (activeSnap && !activeSnap.empty) {
      for (const docSnap of activeSnap.docs) {
        await updateDoc(docSnap.ref, { used: true, invalidatedAt: Date.now() }).catch(() => {});
      }
    }

    // Save SHA-256 hashed OTP record in Firestore
    const otpHash = hashOtpCode(normalizedEmail, code);
    const createdAt = Date.now();
    const expiresAt = createdAt + 10 * 60 * 1000; // 10 minutes expiry
    const docId = `${normalizedEmail.replace(/[^a-z0-9]/g, '_')}_${createdAt}`;

    await setDoc(doc(firestoreDb, "emailVerifications", docId), {
      email: normalizedEmail,
      userId: userId || "",
      otpHash,
      createdAt,
      expiresAt,
      attempts: 0,
      used: false,
      verified: false
    });

    // Return exact specified payload
    return res.status(200).json({
      success: true,
      message: "Verification code sent"
    });
  } catch (err: any) {
    console.error("[OTP SEND ERROR]", err?.message || err);
    return res.status(500).json({ success: false, error: "Unable to send verification code. Please try again." });
  }
}
