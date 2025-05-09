import { openDB } from "idb";

const dbPromise = openDB("DataMapDB", 4, {
  upgrade(db) {
    const stores = ["companies", "cuisine", "categories", "postcode", "region"];

    for (const storeName of stores) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: "id",
        });
        store.createIndex("timestamp", "timestamp");
      }
    }
  },
});

// Safe get with fallback for missing object stores
const safeGet = async (storeName, id) => {
  const db = await dbPromise;
  if (!db.objectStoreNames.contains(storeName)) return null;
  try {
    const data = await db.get(storeName, id);
    return data ? data.data : null;
  } catch (err) {
    console.error(`Failed to get from ${storeName}:`, err);
    return null;
  }
};

const safePut = async (storeName, id, data) => {
  const db = await dbPromise;
  if (!db.objectStoreNames.contains(storeName)) return;
  try {
    await db.put(storeName, {
      id,
      data,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(`Failed to put to ${storeName}:`, err);
  }
};

// Company
export const getCachedCompanyData = (id) => safeGet("companies", id);
export const setCachedCompanyData = (id, data) =>
  safePut("companies", id, data);

// Cuisine
export const getCachedCuisineData = (id) => safeGet("cuisine", id);
export const setCachedCuisineData = (id, data) => safePut("cuisine", id, data);

// Categories
export const getCachedFacebookCategoryData = (id) => safeGet("categories", id);
export const setCachedFacebookCategoryData = (id, data) =>
  safePut("categories", id, data);

// Postcode
export const getCachedPostcodeData = (id) => safeGet("postcode", id);
export const setCachedPostcodeData = (id, data) =>
  safePut("postcode", id, data);

// Region
export const getCachedRegionData = (id) => safeGet("region", id);
export const setCachedRegionData = (id, data) => safePut("region", id, data);

// Clear old data
export const clearOldCaches = async (ttl = 24 * 60 * 60 * 1000) => {
  const db = await dbPromise;
  const now = Date.now();

  const clearStore = async (storeName) => {
    if (!db.objectStoreNames.contains(storeName)) return;
    const records = await db.getAll(storeName);
    for (const record of records) {
      if (now - record.timestamp > ttl) {
        await db.delete(storeName, record.id);
      }
    }
  };

  const stores = ["companies", "cuisine", "categories", "postcode", "region"];

  for (const store of stores) {
    await clearStore(store);
  }
};
