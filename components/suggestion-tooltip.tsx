"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import type { CharNode } from "./change-approval-engine"

interface SuggestionTooltipProps {
  char: CharNode
  onApproveSuggestion: (charId: string, suggestionId: string) => void
  onDeclineSuggestion: (charId: string, suggestionId: string) => void
}

export function SuggestionTooltip({ char, onApproveSuggestion, onDeclineSuggestion }: SuggestionTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2"
    >
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-3">
          <div className="text-xs font-medium text-slate-600 mb-2">
            Character: "{char.value}" (Position: {char.position})
          </div>

          <div className="space-y-2">
            {char.suggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      "{char.value}" → "{suggestion.proposedValue}"
                    </span>
                    <Badge
                      variant={
                        suggestion.status === "approved"
                          ? "default"
                          : suggestion.status === "declined"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {suggestion.status}
                    </Badge>
                    {suggestion.status === "pending" && char.changeHistory.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Will chain
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {suggestion.user} • {new Date(suggestion.timestamp).toLocaleTimeString()}
                    {suggestion.baseValue && suggestion.baseValue !== char.originalValue && (
                      <span className="ml-2 text-orange-600">(based on: "{suggestion.baseValue}")</span>
                    )}
                  </div>
                </div>

                {suggestion.status === "pending" && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 bg-green-50 hover:bg-green-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onApproveSuggestion(char.id, suggestion.id)
                      }}
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 bg-red-50 hover:bg-red-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeclineSuggestion(char.id, suggestion.id)
                      }}
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {char.suggestions.filter((s) => s.status === "pending").length > 1 && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Multiple pending suggestions will chain when approved in sequence
              </div>
            )}
          </div>

          {char.changeHistory.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs font-medium text-slate-600 mb-1">Change History</div>
              <div className="space-y-1">
                {char.changeHistory.slice(-3).map((entry) => (
                  <div key={entry.id} className="text-xs text-slate-500">
                    "{entry.fromValue}" → "{entry.toValue}" by {entry.user}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
