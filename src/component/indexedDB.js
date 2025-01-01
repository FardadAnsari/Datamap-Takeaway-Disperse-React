import { openDB } from "idb";

const dbPromise = openDB("DataMapDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("companies")) {
      const store = db.createObjectStore("companies", {
        keyPath: "id",
      });
      store.createIndex("timestamp", "timestamp");
    }
  },
});

export const getCachedCompanyData = async (companyId) => {
  const db = await dbPromise;
  const data = await db.get("companies", companyId);
  return data ? data.data : null;
};

export const setCachedCompanyData = async (companyId, data) => {
  const db = await dbPromise;
  await db.put("companies", {
    id: companyId,
    data,
    timestamp: Date.now(),
  });
};

export const clearOldCaches = async (ttl = 24 * 60 * 60 * 1000) => {
  const db = await dbPromise;
  const allRecords = await db.getAll("companies");
  const now = Date.now();

  for (const record of allRecords) {
    if (now - record.timestamp > ttl) {
      await db.delete("companies", record.id);
    }
  }
};
