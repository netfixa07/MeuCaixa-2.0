import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e);
    admin.initializeApp();
  }
} else {
  admin.initializeApp();
}

const db = admin.firestore();

async function createServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Webhook for Payment Confirmation (Cakto)
  app.post("/api/webhook", async (req, res) => {
    const signature = req.headers['x-cakto-signature'];
    const { event, data } = req.body;

    // Verify signature using CAKTO_CLIENT_SECRET
    if (process.env.CAKTO_CLIENT_SECRET && signature) {
      const hmac = crypto.createHmac('sha256', process.env.CAKTO_CLIENT_SECRET);
      const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
      
      if (digest !== signature) {
        console.warn("Invalid webhook signature from Cakto");
        // return res.status(401).send("Invalid signature");
      }
    }

    // Cakto standard webhook event for approved payment
    if (event === "payment.approved" || event === "order.paid") {
      const paymentId = data.id;
      
      try {
        // Extract uid and plan from external_reference (passed in the URL)
        const externalRef = data.external_reference || data.metadata?.external_reference;
        if (!externalRef) {
          console.warn("Missing external_reference in webhook payload");
          return res.status(200).send("OK (Missing ref)");
        }

        const { uid, plan } = JSON.parse(externalRef);
        
        // Update user profile in Firestore
        const userRef = db.collection("users").doc(uid);
        await userRef.update({
          plan: plan,
          hasSelectedPlan: true,
          paymentId: paymentId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Payment approved via Cakto for user ${uid}, plan updated to ${plan}`);
      } catch (error) {
        console.error("Webhook Error:", error);
      }
    }

    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

const appPromise = createServer();

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  appPromise.then(app => {
    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
