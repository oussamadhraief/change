"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { CharNode } from "./change-approval-engine"
import { SuggestionTooltip } from "./suggestion-tooltip"

interface CharacterRendererProps {
  char: CharNode
  index: number
  isSelected: boolean
  onSelect: (charId: string) => void
  onApproveSuggestion: (charId: string, suggestionId: string) => void
  onDeclineSuggestion: (charId: string, suggestionId: string) => void
}

export function CharacterRenderer({
  char,
  index,
  isSelected,
  onSelect,
  onApproveSuggestion,
  onDeclineSuggestion,
}: CharacterRendererProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const hasSuggestions = char.suggestions.length > 0
  const hasPendingSuggestions = char.suggestions.some((s) => s.status === "pending")
  const hasApprovedChanges = char.changeHistory.length > 0

  const getCharacterStyle = () => {
    if (isSelected) return "bg-blue-200 border-blue-400"
    if (hasPendingSuggestions) return "bg-yellow-100 border-yellow-300"
    if (hasApprovedChanges) return "bg-green-100 border-green-300"
    if (hasSuggestions) return "bg-gray-100 border-gray-300"
    return "hover:bg-slate-100"
  }

  return (
    <div className="relative inline-block">
      <motion.span
        className={`
          relative cursor-pointer px-0.5 py-0.5 rounded border border-transparent
          transition-all duration-200 ${getCharacterStyle()}
        `}
        whileHover={{ scale: 1.1 }}
        onClick={() => onSelect(char.id)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {char.value === " " ? "\u00A0" : char.value}

        {/* Indicators */}
        {hasPendingSuggestions && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {hasApprovedChanges && <div className="absolute -top-1 -left-1 w-2 h-2 bg-green-400 rounded-full" />}
      </motion.span>

      {/* Tooltip */}
      {showTooltip && hasSuggestions && (
        <SuggestionTooltip
          char={char}
          onApproveSuggestion={onApproveSuggestion}
          onDeclineSuggestion={onDeclineSuggestion}
        />
      )}
    </div>
  )
}
