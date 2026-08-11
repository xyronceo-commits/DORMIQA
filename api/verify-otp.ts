import crypto from "crypto";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { email, userId } = req.body || {};
    const submittedOtp = (req.body?.otp || req.body?.code || "").toString().trim();

    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: "Email is required." });
    }

    if (!submittedOtp || submittedOtp.length !== 6 || !/^\d{6}$/.test(submittedOtp)) {
      return res.status(400).json({ success: false, error: "Please enter a valid 6-digit verification code." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query active verification records in Firestore for this email
    const verifRef = collection(firestoreDb, "emailVerifications");
    const qActive = query(verifRef, where("email", "==", normalizedEmail), where("used", "==", false));
    const activeSnap = await getDocs(qActive).catch(() => null);

    if (!activeSnap || activeSnap.empty) {
      return res.status(400).json({
        success: false,
        error: "No active verification code found for this email. Please request a new code."
      });
    }

    // Pick the latest active record
    let activeDoc = activeSnap.docs[0];
    let activeData = activeDoc.data();
    for (const docSnap of activeSnap.docs) {
      const d = docSnap.data();
      if (d.createdAt > activeData.createdAt) {
        activeDoc = docSnap;
        activeData = d;
      }
    }

    // Check expiry (10 minutes)
    if (Date.now() > activeData.expiresAt) {
      await updateDoc(activeDoc.ref, { used: true, expired: true }).catch(() => {});
      return res.status(400).json({
        success: false,
        expired: true,
        error: "This code has expired. Request a new code."
      });
    }

    // Check maximum attempts (5 attempts limit)
    if (activeData.attempts >= 5) {
      await updateDoc(activeDoc.ref, { used: true }).catch(() => {});
      return res.status(400).json({
        success: false,
        expired: true,
        error: "Maximum verification attempts exceeded. Please request a new code."
      });
    }

    // Hash submitted OTP and compare with stored SHA-256 hash
    const submittedHash = hashOtpCode(normalizedEmail, submittedOtp);

    if (submittedHash !== activeData.otpHash) {
      const newAttempts = (activeData.attempts || 0) + 1;
      const isMaxed = newAttempts >= 5;
      await updateDoc(activeDoc.ref, {
        attempts: newAttempts,
        used: isMaxed
      }).catch(() => {});

      if (isMaxed) {
        return res.status(400).json({
          success: false,
          expired: true,
          error: "Maximum verification attempts exceeded. Please request a new code."
        });
      }

      const remaining = 5 - newAttempts;
      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      });
    }

    // SUCCESS: Mark verification record as used & verified
    await updateDoc(activeDoc.ref, {
      used: true,
      verified: true,
      verifiedAt: Date.now()
    });

    // Update emailVerified in target user document in Firestore if userId exists
    const targetUserId = userId || activeData.userId;
    if (targetUserId) {
      await updateDoc(doc(firestoreDb, "users", targetUserId), {
        emailVerified: true
      }).catch(() => {});
    }

    // Also update emailVerified in users collection matching normalizedEmail
    const usersRef = collection(firestoreDb, "users");
    const qUser = query(usersRef, where("email", "==", normalizedEmail));
    const userSnap = await getDocs(qUser).catch(() => null);
    if (userSnap && !userSnap.empty) {
      for (const uDoc of userSnap.docs) {
        await updateDoc(uDoc.ref, { emailVerified: true }).catch(() => {});
      }
    }

    return res.status(200).json({
      success: true,
      message: "Email address verified successfully!",
      verified: true
    });
  } catch (err: any) {
    console.error("[OTP VERIFY ERROR]", err?.message || err);
    return res.status(500).json({ success: false, error: "Verification system error." });
  }
}
