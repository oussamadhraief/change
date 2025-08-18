"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, GitBranch } from "lucide-react"
import type { ArabicCharNode } from "./arabic-change-engine"

interface ArabicChainVisualizerProps {
  chars: ArabicCharNode[]
}

export function ArabicChainVisualizer({ chars }: ArabicChainVisualizerProps) {
  const charsWithMultipleSuggestions = chars.filter(
    (char) => char.suggestions.length > 1 || char.changeHistory.length > 0,
  )

  if (charsWithMultipleSuggestions.length === 0) {
    return null
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "tashkeel": return "bg-purple-100 text-purple-800 border-purple-200"
      case "main": return "bg-blue-100 text-blue-800 border-blue-200"
      case "insert": return "bg-green-100 text-green-800 border-green-200"
      case "delete": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-600" />
          سلاسل التغييرات
          <Badge variant="secondary" className="ml-2">
            {charsWithMultipleSuggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {charsWithMultipleSuggestions.map((char) => {
            const approvedChanges = char.changeHistory
            const pendingSuggestions = char.suggestions.filter((s) => s.status === "pending")

            if (approvedChanges.length === 0 && pendingSuggestions.length <= 1) return null

            return (
              <div key={char.id} className="p-6 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{char.position}</span>
                  </div>
                  <div className="text-lg font-semibold text-slate-700">
                    سلسلة الموضع {char.position}
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {approvedChanges.length + pendingSuggestions.length} تغيير
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Original value */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-600">أ</span>
                    </div>
                    <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                      "{char.originalValue}"
                    </Badge>
                    <span className="text-sm text-slate-500">القيمة الأصلية</span>
                  </div>

                  {/* Approved changes */}
                  {approvedChanges.map((change, index) => (
                    <div key={change.id} className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">✓</span>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        "{change.toValue}"
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">بواسطة {change.user}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getChangeTypeColor(change.changeType)}`}
                        >
                          {change.changeType === "tashkeel" ? "تشكيل" : 
                           change.changeType === "main" ? "حرف أساسي" : 
                           change.changeType === "insert" ? "إدراج" : "حذف"}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {/* Pending suggestions */}
                  {pendingSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-600">⏳</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        "{suggestion.proposedValue}"
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">في الانتظار بواسطة {suggestion.user}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getChangeTypeColor(suggestion.changeType)}`}
                        >
                          {suggestion.changeType === "tashkeel" ? "تشكيل" : 
                           suggestion.changeType === "main" ? "حرف أساسي" : 
                           suggestion.changeType === "insert" ? "إدراج" : "حذف"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {pendingSuggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <span className="text-lg">💡</span>
                      <span className="text-sm font-medium">
                        {pendingSuggestions.length} اقتراح(ات) في الانتظار ستطبق على القيمة الحالية: "{char.value}"
                      </span>
                    </div>
                  </div>
                )}

                {/* Current state */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-600">ح</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      "{char.value}"
                    </Badge>
                    <span className="text-sm text-slate-500">القيمة الحالية</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
