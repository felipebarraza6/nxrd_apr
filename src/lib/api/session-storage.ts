import { STORAGE, migrateFrigStorageKeys } from "@/lib/storage-keys";

migrateFrigStorageKeys();

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  migrateFrigStorageKeys();
  return window.localStorage.getItem(STORAGE.token);
};

export const setToken = (token: string): void => {
  migrateFrigStorageKeys();
  window.localStorage.setItem(STORAGE.token, token);
  window.localStorage.removeItem("frig.token");
};

export const clearToken = (): void => {
  window.localStorage.removeItem(STORAGE.token);
  window.localStorage.removeItem("frig.token");
};

export const getBranchId = (): string | null => {
  if (typeof window === "undefined") return null;
  migrateFrigStorageKeys();
  return window.localStorage.getItem(STORAGE.branchId);
};

export const setBranchId = (id: string | number): void => {
  migrateFrigStorageKeys();
  window.localStorage.setItem(STORAGE.branchId, String(id));
  window.localStorage.removeItem("frig.branch_id");
};

export const clearBranchId = (): void => {
  window.localStorage.removeItem(STORAGE.branchId);
  window.localStorage.removeItem("frig.branch_id");
};
