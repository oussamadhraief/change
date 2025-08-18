"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { DetectedChange } from "./change-creator"

interface DiffViewerProps {
  originalText: string
  newText: string
  changes: DetectedChange[]
}

export function DiffViewer({ originalText, newText, changes }: DiffViewerProps) {
  const renderDiffText = (text: string, isOriginal: boolean) => {
    if (changes.length === 0) {
      return <span className="font-mono">{text}</span>
    }

    const segments: { text: string; type: "normal" | "insert" | "delete" | "replace"; level?: string }[] = []
    let currentIndex = 0

    // Sort changes by start index
    const sortedChanges = [...changes].sort((a, b) => a.startIndex - b.startIndex)

    for (const change of sortedChanges) {
      // Add text before this change
      if (change.startIndex > currentIndex) {
        segments.push({
          text: text.slice(currentIndex, change.startIndex),
          type: "normal",
        })
      }

      if (isOriginal) {
        // Show original text with deletions and replacements
        if (change.type === "delete" || change.type === "replace") {
          segments.push({
            text: change.originalValue || "",
            type: change.type,
            level: change.level,
          })
          currentIndex = change.endIndex || change.startIndex + (change.originalValue?.length || 0)
        } else {
          // Skip insertions in original view
          currentIndex = change.startIndex
        }
      } else {
        // Show new text with insertions and replacements
        if (change.type === "insert" || change.type === "replace") {
          segments.push({
            text: change.newValue || "",
            type: change.type,
            level: change.level,
          })
        }
        // For deletions, we skip the text in the new view
        currentIndex = change.startIndex + (change.originalValue?.length || 0)
      }
    }

    // Add remaining text
    if (currentIndex < text.length) {
      segments.push({
        text: text.slice(currentIndex),
        type: "normal",
      })
    }

    return (
      <span className="font-mono">
        {segments.map((segment, index) => {
          const className =
            segment.type === "insert"
              ? "bg-green-200 text-green-800 px-1 rounded"
              : segment.type === "delete"
                ? "bg-red-200 text-red-800 line-through px-1 rounded"
                : segment.type === "replace"
                  ? isOriginal
                    ? "bg-orange-200 text-orange-800 line-through px-1 rounded"
                    : "bg-blue-200 text-blue-800 px-1 rounded"
                  : ""

          return (
            <span
              key={index}
              className={className}
              title={segment.level ? `${segment.level}-level ${segment.type}` : undefined}
            >
              {segment.text}
            </span>
          )
        })}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diff View</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Original</Badge>
              <span className="text-sm text-slate-500">{originalText.length} characters</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-red-300 min-h-24">
              {renderDiffText(originalText, true)}
            </div>
          </div>

          {/* New Text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">Modified</Badge>
              <span className="text-sm text-slate-500">{newText.length} characters</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-green-300 min-h-24">
              {renderDiffText(newText, false)}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-mono">text</span>
            <span>Inserted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-200 text-red-800 px-2 py-1 rounded font-mono line-through">text</span>
            <span>Deleted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded font-mono">text</span>
            <span>Replaced</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
