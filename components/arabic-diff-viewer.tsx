"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ArabicChangeRequest } from "./arabic-change-engine"

interface ArabicDiffViewerProps {
  originalText: string
  newText: string
  changes: ArabicChangeRequest[]
}

export function ArabicDiffViewer({ originalText, newText, changes }: ArabicDiffViewerProps) {
  const renderDiffText = (text: string, isOriginal: boolean) => {
    if (changes.length === 0) {
      return <span className="font-arabic text-lg leading-relaxed">{text}</span>
    }

    const segments: { text: string; type: "normal" | "insert" | "delete" | "replace"; level?: string }[] = []
    let currentIndex = 0

    // Sort changes by start index
    const sortedChanges = [...changes].sort((a, b) => {
      const aIndex = parseInt(a.position) || 0
      const bIndex = parseInt(b.position) || 0
      return aIndex - bIndex
    })

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
        if (change.changeType === "delete" || change.changeType === "main" || change.changeType === "tashkeel") {
          segments.push({
            text: change.originalValue || "",
            type: change.changeType === "delete" ? "delete" : "replace",
            level: change.changeType,
          })
          currentIndex = change.startIndex + (change.originalValue?.length || 0)
        } else {
          // Skip insertions in original view
          currentIndex = change.startIndex
        }
      } else {
        // Show new text with insertions and replacements
        if (change.changeType === "insert" || change.changeType === "main" || change.changeType === "tashkeel") {
          segments.push({
            text: change.proposedValue || "",
            type: change.changeType === "insert" ? "insert" : "replace",
            level: change.changeType,
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
      <span className="font-arabic text-lg leading-relaxed">
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

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case "tashkeel": return "تشكيل"
      case "main": return "حرف أساسي"
      case "insert": return "إدراج"
      case "delete": return "حذف"
      default: return changeType
    }
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "tashkeel": return "bg-purple-100 text-purple-800"
      case "main": return "bg-blue-100 text-blue-800"
      case "insert": return "bg-green-100 text-green-800"
      case "delete": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <span className="text-2xl">📊</span>
          عرض الاختلافات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Change Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">{changes.length}</div>
            <div className="text-sm text-blue-700 font-medium">إجمالي التغييرات</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {changes.filter(c => c.changeType === "tashkeel").length}
            </div>
            <div className="text-sm text-purple-700 font-medium">تغييرات التشكيل</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {changes.filter(c => c.changeType === "main").length}
            </div>
            <div className="text-sm text-green-700 font-medium">تغييرات الحروف</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {changes.filter(c => c.changeType === "insert" || c.changeType === "delete").length}
            </div>
            <div className="text-sm text-orange-700 font-medium">إدراج/حذف</div>
          </div>
        </div>

        {/* Text Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Text */}
          <div>
            <h3 className="font-semibold mb-3 text-right text-slate-700">النص الأصلي</h3>
            <div className="p-6 border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white min-h-[300px] text-right">
              {renderDiffText(originalText, true)}
            </div>
          </div>

          {/* Modified Text */}
          <div>
            <h3 className="font-semibold mb-3 text-right text-slate-700">النص المعدل</h3>
            <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white min-h-[300px] text-right">
              {renderDiffText(newText, false)}
            </div>
          </div>
        </div>

        {/* Detailed Changes */}
        {changes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-right text-slate-700">التغييرات التفصيلية</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {changes.map((change, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-right">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getChangeTypeColor(change.changeType)} border-0`}
                    >
                      {getChangeTypeLabel(change.changeType)}
                    </Badge>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      السطر {change.lineNumber} • الكلمة {change.wordNumber}
                    </span>
                  </div>
                  <div className="text-sm font-arabic">
                    <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                      "{change.originalValue || '""'}" → "{change.proposedValue || '""'}"
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-medium mb-4 text-right text-slate-700">دليل الألوان</h4>
          <div className="flex flex-wrap gap-6 justify-end text-sm">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-200 rounded-lg border-2 border-green-300"></span>
              <span className="text-slate-600">إدراج</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-red-200 rounded-lg border-2 border-red-300"></span>
              <span className="text-slate-600">حذف</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-blue-200 rounded-lg border-2 border-blue-300"></span>
              <span className="text-slate-600">استبدال</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-orange-200 rounded-lg border-2 border-orange-300"></span>
              <span className="text-slate-600">نص أصلي محذوف</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
