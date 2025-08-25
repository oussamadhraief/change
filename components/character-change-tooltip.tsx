"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Eye } from "lucide-react"
import type { WordChange } from "@/lib/line-based-diff"

interface WordChangeTooltipProps {
  character: string
  changes: WordChange[]
  position: number
  onApproveChange: (wordChangeId: string) => void
  onDeclineChange: (wordChangeId: string) => void
  isAdminMode?: boolean
}

export function CharacterChangeTooltip({
  character,
  changes,
  position,
  onApproveChange,
  onDeclineChange,
  isAdminMode = false
}: WordChangeTooltipProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const pendingChanges = changes.filter(change => change.status === 'pending')
  const approvedChanges = changes.filter(change => change.status === 'approved')
  const declinedChanges = changes.filter(change => change.status === 'declined')

  const hasChanges = changes.length > 0
  const hasPendingChanges = pendingChanges.length > 0

  if (!hasChanges) {
    return <span>{character}</span>
  }

  const getCharacterStyle = () => {
    if (hasPendingChanges) {
      return "bg-yellow-200 border-b-2 border-yellow-400 cursor-pointer"
    }
    if (approvedChanges.length > 0) {
      return "bg-green-200 border-b-2 border-green-400"
    }
    if (declinedChanges.length > 0) {
      return "bg-red-200 border-b-2 border-red-400"
    }
    return ""
  }

  const renderChangePreview = (change: WordChange) => {
    switch (change.changeType) {
      case 'insert':
        return (
          <span className="text-green-600 font-semibold">
            +'{change.newWord}'
          </span>
        )
      case 'delete':
        return (
          <span className="text-red-600 line-through">
            '{change.originalWord}'
          </span>
        )
      case 'modify':
        return (
          <span>
            <span className="text-red-600 line-through">'{change.originalWord}'</span>
            <span className="mx-1">→</span>
            <span className="text-green-600 font-semibold">'{change.newWord}'</span>
          </span>
        )
      default:
        return null
    }
  }

  const getWordChangePreview = () => {
    if (changes.length === 0) return null
    
    // Group changes by type for word-level display
    const insertions = changes.filter(c => c.changeType === 'insert')
    const deletions = changes.filter(c => c.changeType === 'delete')
    const modifications = changes.filter(c => c.changeType === 'modify')
    
    return (
      <div className="text-xs text-slate-600 mb-2">
        {modifications.length} modified, {insertions.length} inserted, {deletions.length} deleted
      </div>
    )
  }

  return (
    <span 
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className={`relative ${getCharacterStyle()}`}
        onClick={() => isAdminMode && setShowTooltip(!showTooltip)}
      >
        {character}
        {hasPendingChanges && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </span>

      <AnimatePresence>
        {(isHovered || showTooltip) && isAdminMode && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2"
          >
            <Card className="w-80 shadow-lg border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Word Change</h4>
                    <Badge variant="outline" className="text-xs">
                      Position {position}
                    </Badge>
                  </div>
                  {getWordChangePreview()}

                  {/* Pending Changes */}
                  {pendingChanges.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-yellow-700 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Pending Word Changes
                      </h5>
                      {pendingChanges.map((change) => (
                        <div key={change.id} className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded border">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {change.changeType}
                              </Badge>
                              <div className="text-sm font-mono">
                                {renderChangePreview(change)}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeclineChange(change.id)
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-green-600 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onApproveChange(change.id)
                                }}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {change.characterChanges.length > 0 && (
                            <div className="ml-4 text-xs text-slate-500">
                              Character changes: {change.characterChanges.map(cc => 
                                cc.changeType === 'modify' 
                                  ? `'${cc.originalChar}' → '${cc.newChar}'`
                                  : cc.changeType === 'insert'
                                  ? `+'${cc.newChar}'`
                                  : `-'${cc.originalChar}'`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Approved Changes */}
                  {approvedChanges.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-green-700 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Approved ({approvedChanges.length})
                      </h5>
                      {approvedChanges.map((change) => (
                        <div key={change.id} className="flex items-center justify-between p-2 bg-green-50 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {change.changeType}
                            </Badge>
                            <div className="text-sm font-mono">
                              {renderChangePreview(change)}
                            </div>
                          </div>
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            Approved
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Declined Changes */}
                  {declinedChanges.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-red-700 flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Declined ({declinedChanges.length})
                      </h5>
                      {declinedChanges.map((change) => (
                        <div key={change.id} className="flex items-center justify-between p-2 bg-red-50 rounded border">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {change.changeType}
                            </Badge>
                            <div className="text-sm font-mono">
                              {renderChangePreview(change)}
                            </div>
                          </div>
                          <Badge variant="destructive" className="bg-red-100 text-red-800 text-xs">
                            Declined
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
