/**
 * Provisions three real login accounts (admin / interviewer / candidate) plus
 * a curated set of tasks that exercises every feature, so the app can be
 * demoed by simply logging in. Reproducible: safe to re-run.
 *
 *   npm run seed:demo
 *
 * It talks to the same Firebase project as the app (config from .env.local)
 * and goes through the real auth + Firestore paths, so it also implicitly
 * verifies the security rules. Wipe first for a pristine dataset:
 *
 *   npx firebase-tools firestore:delete --all-collections --force
 *   npm run seed:demo
 */
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as AuthUser,
} from "firebase/auth";
import {
  initializeFirestore,
  doc,
  setDoc,
  addDoc,
  getDocs,
  collection,
} from "firebase/firestore";
import { HUMI_TEMPLATE } from "../lib/humi-templates";
import { taskFieldsFromTemplate, dateInDays, type Task } from "../lib/types";

// --- config from .env.local ------------------------------------------------
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const auth = getAuth(app);
// long-polling is the reliable transport for the Firestore SDK under Node
const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export const DEMO_PASSWORD = "demo1234";
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@humi-demo.com", name: "Hadar Cohen (Admin)" },
  semiAdmin: { email: "semiadmin@humi-demo.com", name: "Omer Ben-David (Semi-admin)" },
  interviewer: { email: "interviewer@humi-demo.com", name: "Roni Bar (Interviewer)" },
  candidate: { email: "candidate@humi-demo.com", name: "Yael Shani (Candidate)" },
};

/** Create the auth account, or sign in if it already exists. Leaves it signed in. */
async function ensureAccount(email: string): Promise<AuthUser> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, DEMO_PASSWORD);
    return cred.user;
  } catch (err) {
    if (err instanceof Error && err.message.includes("email-already-in-use")) {
      const cred = await signInWithEmailAndPassword(auth, email, DEMO_PASSWORD);
      return cred.user;
    }
    throw err;
  }
}

async function writeProfile(uid: string, email: string, name: string, role: string) {
  await setDoc(doc(db, "users", uid), { name, email, role, createdAt: Date.now() });
}

async function main() {
  console.log("Provisioning demo accounts on", env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

  // Non-admin accounts first: each self-creates its own profile while signed in.
  const candidate = await ensureAccount(DEMO_ACCOUNTS.candidate.email);
  await writeProfile(candidate.uid, DEMO_ACCOUNTS.candidate.email, DEMO_ACCOUNTS.candidate.name, "candidate");

  const interviewer = await ensureAccount(DEMO_ACCOUNTS.interviewer.email);
  await writeProfile(interviewer.uid, DEMO_ACCOUNTS.interviewer.email, DEMO_ACCOUNTS.interviewer.name, "interviewer");

  // Admin last, so the (manager-only) writes below run while signed in as admin.
  // Admin-ness is decided by email (ADMIN_EMAILS), so the stored role is just a
  // sensible fallback — semi_admin keeps this account a manager either way.
  const admin = await ensureAccount(DEMO_ACCOUNTS.admin.email);
  await writeProfile(admin.uid, DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.name, "semi_admin");
  // the semi-admin demo account (a real, grantable management role)
  const semiAdmin = await ensureAccount(DEMO_ACCOUNTS.semiAdmin.email);
  await writeProfile(semiAdmin.uid, DEMO_ACCOUNTS.semiAdmin.email, DEMO_ACCOUNTS.semiAdmin.name, "semi_admin");
  // sign back in as admin for the remaining manager-only writes
  await signInWithEmailAndPassword(auth, DEMO_ACCOUNTS.admin.email, DEMO_PASSWORD);

  // Template library (skip any already present).
  const existingTemplates = new Set(
    (await getDocs(collection(db, "templates"))).docs.map((d) => d.data().name)
  );
  for (const t of Object.values(HUMI_TEMPLATE)) {
    if (!existingTemplates.has(t.name)) {
      await addDoc(collection(db, "templates"), { ...t, createdAt: Date.now() });
    }
  }

  // Extra profile-only people (no login) so the admin's views look realistic.
  const extra: Record<string, string> = {};
  for (const [key, p] of Object.entries({
    tomer: { name: "Tomer Azulay", email: "tomer@example.com", role: "candidate" },
    lena: { name: "Lena Ivanova", email: "lena@example.com", role: "candidate" },
    amit: { name: "Amit Peled", email: "amit@example.com", role: "interviewer" },
  })) {
    const ref = await addDoc(collection(db, "users"), { ...p, createdAt: Date.now() });
    extra[key] = ref.id;
  }

  // Curated tasks across every lifecycle state.
  const tasks: Omit<Task, "id" | "createdAt">[] = [
    {
      // candidate can Mark submitted
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.booking),
      candidateId: candidate.uid,
      interviewerId: interviewer.uid,
      dueDate: dateInDays(4),
      submissionUrl: "",
      status: "assigned",
      review: null,
    },
    {
      // interviewer can Start review → Finish review
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.guest),
      candidateId: candidate.uid,
      interviewerId: interviewer.uid,
      dueDate: dateInDays(1),
      submissionUrl: "https://docs.google.com/document/d/localz-scenarios-demo",
      status: "submitted",
      review: null,
    },
    {
      // under review + overdue (red flag in the UI)
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.takeover),
      candidateId: extra.tomer,
      interviewerId: interviewer.uid,
      dueDate: dateInDays(-2),
      submissionUrl: "https://drive.google.com/file/d/takeover-plan-demo",
      status: "under_review",
      review: null,
    },
    {
      // completed with a written verdict
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.sourcing),
      candidateId: extra.lena,
      interviewerId: interviewer.uid,
      dueDate: dateInDays(-6),
      submissionUrl: "https://docs.google.com/document/d/halishka-plan-demo",
      status: "done",
      review: {
        verdict: "pass",
        notes:
          "Strong funnel numbers and a realistic permit timeline. The onboarding handoff with the housing team was especially well thought out. Recommend a final interview.",
        reviewedAt: Date.now() - 2 * 86400000,
      },
    },
    {
      // second candidate task with a different reviewer (makes the admin filter meaningful)
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.logistics),
      candidateId: candidate.uid,
      interviewerId: extra.amit,
      dueDate: dateInDays(3),
      submissionUrl: "",
      status: "assigned",
      review: null,
    },
  ];
  for (const t of tasks) await addDoc(collection(db, "tasks"), { ...t, createdAt: Date.now() });

  await signOut(auth);
  console.log("\nDone. Log in with any of these (password: " + DEMO_PASSWORD + "):");
  for (const a of Object.values(DEMO_ACCOUNTS)) console.log("  " + a.email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
