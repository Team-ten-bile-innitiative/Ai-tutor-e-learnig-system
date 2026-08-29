import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-indigo-700 shadow-sm",
        gradient: "bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white hover:from-[#6D28D9] hover:to-[#4F46E5] shadow-[0_10px_24px_rgba(124,58,237,0.35)]",
        secondary: "bg-white text-[#111827] border border-slate-200 hover:bg-slate-50",
        ghost: "hover:bg-primary-soft text-ink",
        danger: "bg-danger text-white hover:bg-red-700",
        ai: "bg-ai text-white hover:bg-violet-700",
        success: "bg-success text-white hover:bg-emerald-700",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
