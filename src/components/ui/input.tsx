"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-tinta shadow-sm transition-[border-color,box-shadow] duration-150 placeholder:text-tinta/40 focus-visible:outline-none focus-visible:border-azul focus-visible:ring-2 focus-visible:ring-azul/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";