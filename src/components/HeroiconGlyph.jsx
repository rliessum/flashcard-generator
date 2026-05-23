import React from 'react'
import { getHeroiconDefinition } from '../js/heroicons'

export default function HeroiconGlyph({ iconId, className = 'w-5 h-5' }) {
  const icon = getHeroiconDefinition(iconId)
  if (!icon.paths.length) return null

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      {icon.paths.map((path) => (
        <path key={path} strokeLinecap="round" strokeLinejoin="round" d={path} />
      ))}
    </svg>
  )
}
