
import { app } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  writeBatch,
  serverTimestamp,
  getFirestore,
} from "firebase/firestore";

// Function to get the Firestore instance, ensuring it's called only when needed.
export function getFirestoreInstance() {
  if (typeof window !== 'undefined') {
    return getFirestore(app);
  }
  return undefined; // Or throw an error if db access is strictly required on client.
}

// Generic types (remain unchanged)
export interface Campaign {
  id: string;
  name: string;
  status: "Scheduled" | "Active" | "Finished";
  rewardType: string;
  rewardValue: string;
  inventoryId?: string;
  redemptions: number;
  startDate: string;
  endDate: string;
  flyerImage?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthdate: string;
  redemptions: Record<string, string>;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock: number | "Unlimited";
  category: string;
  image: string;
  aiHint: string;
}


// Campaigns
export async function getCampaigns(): Promise<Campaign[]> {
  const db = getFirestoreInstance();
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, "campaigns"));
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Campaign));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const db = getFirestoreInstance();
  if (!db) return null;
  const docRef = doc(db, "campaigns", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {id: docSnap.id, ...docSnap.data()} as Campaign;
  }
  return null;
}

export async function addCampaign(campaignData: Omit<Campaign, "id">): Promise<string> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, "campaigns"), campaignData);
  return docRef.id;
}

export async function updateCampaign(id: string, campaignData: Partial<Campaign>): Promise<void> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "campaigns", id);
  await updateDoc(docRef, campaignData);
}

export async function deleteCampaign(id: string): Promise<void> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "campaigns", id);
  await deleteDoc(docRef);
}


// Customers
export async function getCustomers(): Promise<Customer[]> {
  const db = getFirestoreInstance();
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, "customers"));
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Customer));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const db = getFirestoreInstance();
  if (!db) return null;
  const docRef = doc(db, "customers", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {id: docSnap.id, ...docSnap.data()} as Customer;
  }
  return null;
}

export async function findCustomerByEmail(email: string): Promise<Customer | null> {
  const db = getFirestoreInstance();
  if (!db) return null;
  const q = query(collection(db, "customers"), where("email", "==", email), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return {id: docSnap.id, ...docSnap.data()} as Customer;
  }
  return null;
}

export async function addCustomer(customerData: Omit<Customer, "id">): Promise<string> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, "customers"), customerData);
  return docRef.id;
}

export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<void> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "customers", id);
  await updateDoc(docRef, customerData);
}


// Inventory
export async function getInventory(): Promise<InventoryItem[]> {
  const db = getFirestoreInstance();
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, "inventory"));
  return querySnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as InventoryItem));
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const db = getFirestoreInstance();
  if (!db) return null;
  const docRef = doc(db, "inventory", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return {id: docSnap.id, ...docSnap.data()} as InventoryItem;
  }
  return null;
}

export async function addInventoryItem(itemData: Omit<InventoryItem, "id">): Promise<string> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, "inventory"), itemData);
  return docRef.id;
}

export async function updateInventoryItem(id: string, itemData: Partial<InventoryItem>): Promise<void> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, "inventory", id);
  await updateDoc(docRef, itemData);
}

// Complex Transactions
export async function redeemReward(customerId: string, campaign: Campaign): Promise<void> {
  const db = getFirestoreInstance();
  if (!db) throw new Error("Firestore not initialized");
  const batch = writeBatch(db);

  const redemptionData = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    rewardValue: campaign.rewardValue,
    redeemedAt: serverTimestamp(),
  };

  const redemptionRef = doc(collection(db, `customers/${customerId}/redemptions`));
  batch.set(redemptionRef, redemptionData);

  const campaignRef = doc(db, "campaigns", campaign.id);
  batch.update(campaignRef, {redemptions: (campaign.redemptions || 0) + 1});

  await batch.commit();
}

export async function getActiveCampaign(): Promise<Campaign | null> {
  const db = getFirestoreInstance();
  if (!db) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split("T")[0];

  const q = query(
    collection(db, "campaigns"),
    where("status", "==", "Active"),
    where("startDate", "<=", today)
  );

  const querySnapshot = await getDocs(q);

  const activeCampaigns = querySnapshot.docs
    .map((doc) => ({id: doc.id, ...doc.data()} as Campaign))
    .filter((c) => c.endDate >= today);

  return activeCampaigns.length > 0 ? activeCampaigns[0] : null;
}
