import { openDB } from "idb";

const dbPromise = openDB("DataMapDB", 3, {
  upgrade(db) {
    // Create the "companies" object store if it doesn't exist
    if (!db.objectStoreNames.contains("companies")) {
      const store = db.createObjectStore("companies", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }

    // Create the "cuisine" object store if it doesn't exist
    if (!db.objectStoreNames.contains("cuisine")) {
      const store = db.createObjectStore("cuisine", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }

    // Create the "categories" object store if it doesn't exist
    if (!db.objectStoreNames.contains("categories")) {
      const store = db.createObjectStore("categories", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }

    // Create the "postcode" object store if it doesn't exist
    if (!db.objectStoreNames.contains("postcode")) {
      const store = db.createObjectStore("postcode", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }

    // Create the "region" object store if it doesn't exist
    if (!db.objectStoreNames.contains("region")) {
      const store = db.createObjectStore("region", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }
  },
});

// Function to get cached companies data
export const getCachedCompanyData = async (companyId) => {
  const db = await dbPromise;
  const data = await db.get("companies", companyId);
  return data ? data.data : null;
};

// Function to set cached companies data
export const setCachedCompanyData = async (companyId, data) => {
  const db = await dbPromise;
  await db.put("companies", {
    id: companyId,
    data,
    timestamp: Date.now(),
  });
};

// Function to get cached cuisine data
export const getCachedCuisineData = async (cuisineId) => {
  const db = await dbPromise;
  const data = await db.get("cuisine", cuisineId);
  return data ? data.data : null;
};

// Function to set cached cuisine data
export const setCachedCuisineData = async (cuisineId, data) => {
  const db = await dbPromise;
  await db.put("cuisine", {
    id: cuisineId,
    data,
    timestamp: Date.now(),
  });
};

// Function to get cached categories data
export const getCachedFacebookCategoryData = async (categoryId) => {
  const db = await dbPromise;

  const data = await db.get("categories", categoryId);
  return data ? data.data : null;
};

// Function to set cached categories data
export const setCachedFacebookCategoryData = async (categoryId, data) => {
  const db = await dbPromise;
  await db.put("categories", {
    id: categoryId,
    data,
    timestamp: Date.now(),
  });
};

// Function to get cached postcode data
export const getCachedPostcodeData = async (postcodeId) => {
  const db = await dbPromise;
  const data = await db.get("postcode", postcodeId);
  return data ? data.data : null;
};

// Function to set cached postcode data
export const setCachedPostcodeData = async (postcodeId, data) => {
  const db = await dbPromise;
  await db.put("postcode", {
    id: postcodeId,
    data,
    timestamp: Date.now(),
  });
};

// Function to get cached region data
export const getCachedRegionData = async (regionId) => {
  const db = await dbPromise;
  const data = await db.get("region", regionId);
  return data ? data.data : null;
};

// Function to set cached region data
export const setCachedRegionData = async (regionId, data) => {
  const db = await dbPromise;
  await db.put("region", {
    id: regionId,
    data,
    timestamp: Date.now(),
  });
};

// Clear all caches
export const clearOldCaches = async (ttl = 24 * 60 * 60 * 1000) => {
  const db = await dbPromise;

  const clearStore = async (storeName) => {
    const records = await db.getAll(storeName);
    const now = Date.now();
    for (const record of records) {
      if (now - record.timestamp > ttl) {
        await db.delete(storeName, record.id);
      }
    }
  };

  await clearStore("companies"); // Clear companies data
  await clearStore("cuisine"); // Clear cuisine data
  await clearStore("categories"); // Clear cuisine data
  await clearStore("postcode"); // Clear postcode data
  await clearStore("region"); // Clear region data
};
