'use client';

import { useEffect, useState } from 'react';
import type { ToastVariant } from '@/components/ui/toast';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(toasts));
}

export function toast(input: Omit<ToastItem, 'id'>): void {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, ...input }];
  emit();
  setTimeout(() => dismiss(id), 5000);
}

export function dismiss(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToast() {
  const [state, setState] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return { toasts: state, toast, dismiss };
}
