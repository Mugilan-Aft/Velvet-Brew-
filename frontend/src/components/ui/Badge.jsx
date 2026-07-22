import React from 'react'

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: "bg-[var(--color-surface-3)] text-[var(--color-brand-umber)]",
    caramel: "bg-[var(--color-brand-caramel)] text-white", // rewards/new
    success: "bg-green-100 text-green-800", // in-stock
    danger: "bg-red-100 text-red-800", // out-of-stock
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
