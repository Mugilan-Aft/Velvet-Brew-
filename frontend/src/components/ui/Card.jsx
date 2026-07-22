import React from 'react'

export function Card({ children, className = '', hoverable = false, ...props }) {
  return (
    <div 
      className={`
        bg-[var(--color-surface-1)] 
        rounded-[16px] 
        shadow-[var(--shadow-brown-sm)] 
        overflow-hidden
        ${hoverable ? 'transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-brown)] cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export function AdminCard({ children, className = '', ...props }) {
  // Admin cards have 8px radius, 1px border, no shadow
  return (
    <div 
      className={`
        bg-white 
        rounded-[8px] 
        border border-[var(--color-outline-subtle)]
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
