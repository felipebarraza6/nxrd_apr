"use client";

import { create } from "zustand";
import {
  formatDemoBlockedMessage,
  looksLikeDemoBlockedError,
} from "@/lib/cauce-demo";
import { STORAGE } from "@/lib/storage-keys";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  /** Botón de acción opcional (p. ej. "Recargar" en update de la PWA). */
  action?: { label: string; onClick: () => void };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

/** En sesión demo, DTE / Flow / emails → mensaje amigable. */
function remapDemoErrorMessage(message: string): string {
  if (typeof window === "undefined") return message;
  if (!window.localStorage.getItem(STORAGE.demoExpiresAt)) return message;
  if (!looksLikeDemoBlockedError(new Error(message))) {
    if (!/dte|sii|flow|email|correo|demo|boleta|factura/i.test(message)) {
      return message;
    }
  }
  return formatDemoBlockedMessage(message);
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration ?? 4000);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    success: (message: string, duration?: number) =>
      addToast({ message, variant: "success", duration }),
    error: (message: string, duration?: number) =>
      addToast({
        message: remapDemoErrorMessage(message),
        variant: "error",
        duration,
      }),
    warning: (message: string, duration?: number) =>
      addToast({ message, variant: "warning", duration }),
    info: (message: string, duration?: number) =>
      addToast({ message, variant: "info", duration }),
  };
}
