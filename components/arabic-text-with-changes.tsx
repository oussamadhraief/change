"use client"

import { useMemo } from "react"
import { CharacterChangeTooltip } from "./character-change-tooltip"
import type { FullTextChangeRequest, WordChange } from "@/lib/line-based-diff"

interface ArabicTextWithChangesProps {
  originalText: string
  changeRequests: FullTextChangeRequest[]
  onApproveChange: (requestId: string, wordChangeId: string) => void
  onDeclineChange: (requestId: string, wordChangeId: string) => void
  isAdminMode?: boolean
}

export function ArabicTextWithChanges({
  originalText,
  changeRequests,
  onApproveChange,
  onDeclineChange,
  isAdminMode = false
}: ArabicTextWithChangesProps) {
  
  // Get the latest modified text from the most recent request
  const latestRequest = changeRequests[changeRequests.length - 1]
  const displayText = latestRequest ? latestRequest.modifiedText : originalText
  
  // Get all word changes from requests
  const allWordChanges = useMemo(() => {
    const changes: (WordChange & { requestId: string })[] = []
    
    changeRequests.forEach(request => {
      request.wordChanges.forEach(wordChange => {
        changes.push({
          ...wordChange,
          requestId: request.id
        })
      })
    })
    
    return changes
  }, [changeRequests])

  const handleApproveChange = (wordChangeId: string) => {
    // Find which request this word change belongs to
    for (const request of changeRequests) {
      const wordChange = request.wordChanges.find(wc => wc.id === wordChangeId)
      if (wordChange) {
        onApproveChange(request.id, wordChangeId)
        break
      }
    }
  }

  const handleDeclineChange = (wordChangeId: string) => {
    // Find which request this word change belongs to
    for (const request of changeRequests) {
      const wordChange = request.wordChanges.find(wc => wc.id === wordChangeId)
      if (wordChange) {
        onDeclineChange(request.id, wordChangeId)
        break
      }
    }
  }

  const renderTextWithChanges = () => {
    // Split the display text by lines and words to preserve Arabic text shaping
    const lines = displayText.split('\n')
    
    return lines.map((line, lineIndex) => {
      const words = line.split(' ')
      
      return (
        <div key={lineIndex} className="mb-2">
          {words.map((word, wordIndex) => {
            // Find word changes for this specific word position
            const wordChangesForPosition = allWordChanges.filter(
              wc => wc.lineNumber === lineIndex + 1 && wc.wordIndex === wordIndex
            )
            
            const hasChanges = wordChangesForPosition.length > 0
            
            return (
              <span key={wordIndex} className="inline-block">
                {hasChanges ? (
                  <CharacterChangeTooltip
                    character={word}
                    changes={wordChangesForPosition}
                    position={lineIndex * 1000 + wordIndex}
                    onApproveChange={handleApproveChange}
                    onDeclineChange={handleDeclineChange}
                    isAdminMode={isAdminMode}
                  />
                ) : (
                  <span>{word}</span>
                )}
                {wordIndex < words.length - 1 && ' '}
              </span>
            )
          })}
        </div>
      )
    })
  }

  return (
    <div 
      className="text-right text-lg leading-relaxed p-6 border rounded-lg bg-white min-h-[400px]"
      style={{ 
        direction: 'rtl',
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        lineHeight: '1.8'
      }}
    >
      {renderTextWithChanges()}
    </div>
  )
}
