"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import type { CharNode } from "./change-approval-engine"

interface ChainVisualizerProps {
  chars: CharNode[]
}

export function ChainVisualizer({ chars }: ChainVisualizerProps) {
  const charsWithMultipleSuggestions = chars.filter(
    (char) => char.suggestions.length > 1 || char.changeHistory.length > 0,
  )

  if (charsWithMultipleSuggestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Chains</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {charsWithMultipleSuggestions.map((char) => {
            const approvedChanges = char.changeHistory
            const pendingSuggestions = char.suggestions.filter((s) => s.status === "pending")

            if (approvedChanges.length === 0 && pendingSuggestions.length <= 1) return null

            return (
              <div key={char.id} className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Position {char.position} Chain</div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Original value */}
                  <Badge variant="outline">"{char.originalValue}"</Badge>

                  {/* Approved changes */}
                  {approvedChanges.map((change, index) => (
                    <div key={change.id} className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <Badge variant="default">"{change.toValue}"</Badge>
                      <span className="text-xs text-slate-500">by {change.user}</span>
                    </div>
                  ))}

                  {/* Pending suggestions */}
                  {pendingSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <Badge variant="secondary">"{suggestion.proposedValue}"</Badge>
                      <span className="text-xs text-slate-500">pending by {suggestion.user}</span>
                    </div>
                  ))}
                </div>

                {pendingSuggestions.length > 0 && (
                  <div className="text-xs text-blue-600 mt-2">
                    {pendingSuggestions.length} pending suggestion(s) will apply to current value: "{char.value}"
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
