import React from 'react'

export function Button({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center rounded-[8px] font-medium transition-colors tap-highlight-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-caramel disabled:opacity-50 disabled:pointer-events-none"
  
  const variants = {
    primary: "bg-[var(--color-brand-cherry)] text-white hover:bg-[var(--color-brand-cherry-light)]",
    secondary: "bg-[var(--color-brand-espresso)] text-white hover:bg-[var(--color-brand-espresso-light)]",
    ghost: "text-[var(--color-brand-caramel)] hover:bg-[var(--color-surface-2)]",
    outline: "border border-[var(--color-outline)] text-[var(--color-brand-umber)] hover:bg-[var(--color-surface-2)]"
  }
  
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4",
    lg: "h-14 px-6 text-lg"
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
