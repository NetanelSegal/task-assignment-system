"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirebase, isFirebaseConfigured } from "./firebase";
import { canManage, type Role, type Task, type Template, type User } from "./types";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

interface Store {
  users: User[];
  tasks: Task[];
  /** Loaded for managers only (security rules restrict access). */
  templates: Template[];
  ready: boolean;
  /** Signed in with Firebase Auth (profile may still be loading). */
  hasSession: boolean;
  currentUser: User | null;
  connectionError: string | null;

  register(data: RegisterData): Promise<void>;
  /** For auth accounts without a profile doc (e.g. created in the Firebase dashboard). */
  completeProfile(name: string, role: Role): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;

  addUser(data: Omit<User, "id" | "createdAt">): Promise<string>;
  updateUserRole(id: string, role: Role): Promise<void>;
  deleteUser(id: string): Promise<void>;

  addTask(data: Omit<Task, "id" | "createdAt">): Promise<string>;
  updateTask(id: string, data: Partial<Task>): Promise<void>;
  deleteTask(id: string): Promise<void>;

  addTemplate(data: Omit<Template, "id" | "createdAt">): Promise<string>;
  updateTemplate(id: string, data: Partial<Template>): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

/**
 * Create the signed-in user's profile doc (id = auth uid) with a
 * self-selectable role. Admin is decided by email (ADMIN_EMAILS), never here,
 * so no account can self-assign a management role.
 */
async function writeOwnProfile(name: string, role: Role) {
  const { db, auth } = getFirebase();
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in.");
  await setDoc(doc(db, "users", user.uid), {
    name,
    email: user.email ?? "",
    role,
    createdAt: Date.now(),
  });
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(
    isFirebaseConfigured ? null : "Missing NEXT_PUBLIC_FIREBASE_* environment variables."
  );

  // Firebase touches browser APIs, so everything starts after mount, never during SSR.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(getFirebase().auth, (u) => {
      setUserId(u?.uid ?? null);
      setAuthReady(true);
      if (!u) {
        // Security rules require auth, so signed out means no data. Firebase
        // always emits null between two different users, so clearing here
        // (batched with the userId change) guarantees one session's data
        // never renders under another session.
        setUsers([]);
        setTasks([]);
        setTemplates([]);
        setDataReady(false);
      }
    });
  }, []);

  // Firestore subscriptions live only while signed in (rules deny anonymous reads).
  useEffect(() => {
    if (!isFirebaseConfigured || !userId) return;
    const { db } = getFirebase();
    const loaded = new Set<string>();
    const onError = (err: Error) => setConnectionError(err.message);
    const sub = <T,>(name: string, set: (items: T[]) => void, normalize: (item: T) => T) =>
      onSnapshot(
        collection(db, name),
        (snap) => {
          set(snap.docs.map((d) => normalize({ id: d.id, ...d.data() } as T)));
          loaded.add(name);
          if (loaded.size === 2) setDataReady(true);
          setConnectionError(null);
        },
        onError
      );
    const unsubs = [
      sub<User>("users", setUsers, (u) => u),
      // Firestore has no schema — default fields that older/partial docs may lack
      sub<Task>("tasks", setTasks, (t) => ({ ...t, links: t.links ?? [], review: t.review ?? null })),
    ];
    return () => unsubs.forEach((u) => u());
  }, [userId]);

  // templates are manager-only in the security rules, so subscribe only as one
  const manages = canManage(users.find((u) => u.id === userId));
  useEffect(() => {
    if (!manages) return;
    const { db } = getFirebase();
    return onSnapshot(
      collection(db, "templates"),
      (snap) =>
        setTemplates(
          snap.docs.map((d) => {
            const t = { id: d.id, ...d.data() } as Template;
            return { ...t, links: t.links ?? [] };
          })
        ),
      (err) => setConnectionError(err.message)
    );
  }, [manages]);

  const store = useMemo<Store>(
    () => ({
      users,
      tasks,
      templates,
      ready: authReady && (!userId || dataReady),
      hasSession: userId !== null,
      currentUser: users.find((u) => u.id === userId) ?? null,
      connectionError,

      async register({ name, email, password, role }) {
        await createUserWithEmailAndPassword(getFirebase().auth, email, password);
        await writeOwnProfile(name, role);
      },
      completeProfile: writeOwnProfile,
      async login(email, password) {
        await signInWithEmailAndPassword(getFirebase().auth, email, password);
      },
      async logout() {
        await signOut(getFirebase().auth);
      },

      async addUser(data) {
        const ref = await addDoc(collection(getFirebase().db, "users"), {
          ...data,
          createdAt: Date.now(),
        });
        return ref.id;
      },
      async updateUserRole(id, role) {
        await updateDoc(doc(getFirebase().db, "users", id), { role });
      },
      async deleteUser(id) {
        await deleteDoc(doc(getFirebase().db, "users", id));
      },

      async addTask(data) {
        const ref = await addDoc(collection(getFirebase().db, "tasks"), {
          ...data,
          createdAt: Date.now(),
        });
        return ref.id;
      },
      async updateTask(id, data) {
        await updateDoc(doc(getFirebase().db, "tasks", id), data);
      },
      async deleteTask(id) {
        await deleteDoc(doc(getFirebase().db, "tasks", id));
      },

      async addTemplate(data) {
        const ref = await addDoc(collection(getFirebase().db, "templates"), {
          ...data,
          createdAt: Date.now(),
        });
        return ref.id;
      },
      async updateTemplate(id, data) {
        await updateDoc(doc(getFirebase().db, "templates", id), data);
      },
      async deleteTemplate(id) {
        await deleteDoc(doc(getFirebase().db, "templates", id));
      },
    }),
    [users, tasks, templates, dataReady, authReady, userId, connectionError]
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside <StoreProvider>");
  return store;
}
