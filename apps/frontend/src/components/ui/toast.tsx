'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn('fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm', className)}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const toastVariants = cva(
  'group relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[var(--radius)] border p-4 shadow-lg',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        destructive: 'border-destructive/40 bg-destructive text-destructive-foreground',
        success: 'border-success/40 bg-success text-success-foreground'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />);
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => <ToastPrimitive.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />);
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100', className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose };
export type ToastVariant = VariantProps<typeof toastVariants>['variant'];
