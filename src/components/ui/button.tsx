import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-md",
        outline: "border border-stone-300 bg-transparent hover:bg-stone-100 text-stone-700",
        secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200",
        ghost: "hover:bg-stone-100 hover:text-stone-950 text-stone-700",
        destructive: "bg-red-50 text-red-600 hover:bg-red-100",
        premium: "bg-natural-accent text-natural-primary font-bold uppercase tracking-wider shadow-lg shadow-natural-accent/15 hover:bg-natural-accent-hover",
        natural: "bg-natural-primary text-white font-bold uppercase tracking-wider shadow-lg shadow-natural-primary/15 hover:opacity-90",
      },
      size: {
        default: "h-11 px-6",
        xs: "h-8 px-3 text-xs rounded-xl",
        sm: "h-9 px-4 text-xs rounded-xl",
        lg: "h-12 px-8 text-base rounded-2xl",
        xl: "h-14 px-10 text-lg rounded-3xl",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
