"use client"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import type { ArabicCharNode } from "./arabic-change-engine"

interface ArabicSuggestionTooltipProps {
  char: ArabicCharNode
  onApproveSuggestion: (charId: string, suggestionId: string) => void
  onDeclineSuggestion: (charId: string, suggestionId: string) => void
}

export function ArabicSuggestionTooltip({ 
  char, 
  onApproveSuggestion, 
  onDeclineSuggestion 
}: ArabicSuggestionTooltipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2"
      style={{ direction: 'rtl' }}
    >
      <Card className="w-80 shadow-lg border-2">
        <CardContent className="p-3">
          <div className="text-xs font-medium text-slate-600 mb-2 text-right">
            الحرف: "{char.value}" (الموضع: {char.position})
          </div>

          <div className="space-y-2">
            {char.suggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 justify-end">
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
                      {suggestion.status === "approved" ? "مقبول" : 
                       suggestion.status === "declined" ? "مرفوض" : "في الانتظار"}
                    </Badge>
                    {suggestion.status === "pending" && char.changeHistory.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        سيتسلسل
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate text-right">
                    {suggestion.user} • {new Date(suggestion.timestamp).toLocaleTimeString('ar-SA')}
                    {suggestion.baseValue && suggestion.baseValue !== char.originalValue && (
                      <span className="mr-2 text-orange-600">(مبني على: "{suggestion.baseValue}")</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    نوع التغيير: {suggestion.changeType === "tashkeel" ? "تشكيل" : 
                                 suggestion.changeType === "main" ? "حرف أساسي" : 
                                 suggestion.changeType === "insert" ? "إدراج" : "حذف"}
                  </div>
                </div>

                {suggestion.status === "pending" && (
                  <div className="flex gap-1 mr-2">
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
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded text-right">
                💡 الاقتراحات المتعددة في الانتظار ستتسلسل عند الموافقة عليها بالتتابع
              </div>
            )}
          </div>

          {char.changeHistory.length > 0 && (
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs font-medium text-slate-600 mb-2 text-right">سجل التغييرات:</div>
              <div className="space-y-1">
                {char.changeHistory.slice(-3).reverse().map((entry) => (
                  <div key={entry.id} className="text-xs text-slate-500 text-right">
                    "{entry.fromValue}" → "{entry.toValue}" بواسطة {entry.user}
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
