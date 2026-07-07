import { collection, getDocs } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { HUMI_TEMPLATE } from "./humi-templates";
import { dateInDays, taskFieldsFromTemplate, type Task, type Template, type User } from "./types";

interface Store {
  addTemplate(d: Omit<Template, "id" | "createdAt">): Promise<string>;
  addUser(d: Omit<User, "id" | "createdAt">): Promise<string>;
  addTask(d: Omit<Task, "id" | "createdAt">): Promise<string>;
}

/**
 * Insert the HUMI preset templates that aren't in Firestore yet.
 * Deduping against a fresh server read (not local snapshot state) so a
 * lagging templates subscription can't cause duplicate inserts.
 */
export async function seedTemplates(store: Pick<Store, "addTemplate">) {
  const existing = await getDocs(collection(getFirebase().db, "templates"));
  const existingNames = new Set(existing.docs.map((d) => d.data().name));
  await Promise.all(
    Object.values(HUMI_TEMPLATE)
      .filter((t) => !existingNames.has(t.name))
      .map((t) => store.addTemplate(t))
  );
}

/**
 * Populate the store with a realistic HUMI demo dataset: the template
 * library, a hiring team, candidates in progress, and tasks created from
 * the actual templates in every lifecycle state.
 *
 * Seeded people are profile records (no login accounts) — real accounts
 * are created through the Register page or the Firebase console.
 */
export async function seedDemoData(store: Store) {
  await seedTemplates(store);

  // hiring team (interviewers)
  const [rotem, amit, shira] = await Promise.all([
    store.addUser({ name: "Rotem Avidan", email: "rotem@humi.co.il", role: "interviewer" }),
    store.addUser({ name: "Amit Peled", email: "amit@humi.co.il", role: "interviewer" }),
    store.addUser({ name: "Shira Golan", email: "shira@humi.co.il", role: "interviewer" }),
  ]);

  // candidates currently in process
  const [daniel, maya, tomer, lena] = await Promise.all([
    store.addUser({ name: "Daniel Katz", email: "daniel.katz@gmail.com", role: "candidate" }),
    store.addUser({ name: "Maya Rosen", email: "maya.rosen@gmail.com", role: "candidate" }),
    store.addUser({ name: "Tomer Azulay", email: "tomer.azulay@gmail.com", role: "candidate" }),
    store.addUser({ name: "Lena Ivanova", email: "lena.ivanova@gmail.com", role: "candidate" }),
  ]);

  // tasks are snapshots of the templates, like the "Assign to candidate…" flow makes
  const tasks: Omit<Task, "id" | "createdAt">[] = [
    {
      // fresh in the pipeline
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.booking),
      candidateId: daniel,
      interviewerId: rotem,
      submissionUrl: "",
      status: "assigned",
      review: null,
    },
    {
      // submitted, waiting for the reviewer to pick it up
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.guest),
      candidateId: maya,
      interviewerId: shira,
      dueDate: dateInDays(1),
      submissionUrl: "https://docs.google.com/document/d/localz-scenarios-maya",
      status: "submitted",
      review: null,
    },
    {
      // review in progress, already past due — shows the overdue flag
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.takeover),
      candidateId: tomer,
      interviewerId: amit,
      dueDate: dateInDays(-2),
      submissionUrl: "https://drive.google.com/file/d/takeover-plan-tomer",
      status: "under_review",
      review: null,
    },
    {
      // completed with a written verdict
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.sourcing),
      candidateId: lena,
      interviewerId: shira,
      dueDate: dateInDays(-6),
      submissionUrl: "https://docs.google.com/document/d/halishka-plan-lena",
      status: "done",
      review: {
        verdict: "pass",
        notes:
          "Strong funnel numbers and a realistic permit timeline. The onboarding handoff with the housing team was especially well thought out. Recommend moving to a final interview.",
        reviewedAt: Date.now() - 2 * 86400000,
      },
    },
    {
      // second assignment for an active candidate
      ...taskFieldsFromTemplate(HUMI_TEMPLATE.logistics),
      candidateId: daniel,
      interviewerId: amit,
      submissionUrl: "",
      status: "assigned",
      review: null,
    },
  ];
  await Promise.all(tasks.map((t) => store.addTask(t)));
}
