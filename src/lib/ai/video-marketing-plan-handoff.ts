"use client";

export type VideoMarketingPlanProduct = {
  id: string;
  videoName: string;
  name: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  originalImageDataUrl: string | null;
  optimizedImageDataUrl: string | null;
  currentPrice: string;
  promotionalPrice: string;
  productFacts: string;
};

export type VideoMarketingPlanActivity = {
  id: string;
  videoName: string;
  title: string;
  description: string;
  overview: string;
  theme: string;
  referenceImageDataUrl: string | null;
};

export type VideoMarketingPlanDraft = {
  campaignTitle: string;
  strategySummary: string;
  targetAudience: string;
  offerStrategy: string;
  productPlans: Array<{ productName: string; positioning: string; offerRecommendation: string; messageAngle: string }>;
  schedule: Array<{ date: string; platform: string; productName: string; objective: string; concept: string; copy: string; callToAction: string; visualDirection: string; referenceImageDataUrl?: string | null }>;
  budgetStrategy: string;
  successMeasures: string[];
  confirmations: string[];
};

export type VideoMarketingPlanFormValues = {
  goal: string;
  location: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  budget: string;
  notes: string;
  prices: Record<string, { currentPrice: string; promotionalPrice: string; productFacts: string }>;
  activityOfferType: string;
  activityDiscount: string;
  activityTerms: string;
};

export type VideoMarketingPlanHandoff = {
  id: string;
  createdAt: number;
  products: VideoMarketingPlanProduct[];
  activities: VideoMarketingPlanActivity[];
  generatedPlan?: VideoMarketingPlanDraft;
  formValues?: VideoMarketingPlanFormValues;
  customerFacts: string;
  goal: string;
  location: string;
  startDate: string;
  endDate: string;
  platforms: string[];
  notes: string;
};

const DATABASE_NAME = "postory-video-lab";
const STORE_NAME = "marketing-plan-handoffs";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local plan storage"));
  });
}

export async function saveVideoMarketingPlanHandoff(value: Omit<VideoMarketingPlanHandoff, "createdAt">) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ ...value, createdAt: Date.now() } satisfies VideoMarketingPlanHandoff);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save plan data"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not save plan data"));
    });
  } finally {
    database.close();
  }
}

export async function readVideoMarketingPlanHandoff(id: string): Promise<VideoMarketingPlanHandoff | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => {
        const value = request.result as VideoMarketingPlanHandoff | undefined;
        resolve(value ? { ...value, activities: value.activities ?? [] } : null);
      };
      request.onerror = () => reject(request.error ?? new Error("Could not read plan data"));
    });
  } finally {
    database.close();
  }
}

export async function saveGeneratedVideoMarketingPlan(id: string, generatedPlan: VideoMarketingPlanDraft, formValues: VideoMarketingPlanFormValues) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => {
        if (!request.result) {
          transaction.abort();
          return;
        }
        store.put({ ...request.result, generatedPlan, formValues });
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save the generated plan"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not save the generated plan"));
    });
  } finally {
    database.close();
  }
}
