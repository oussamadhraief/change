"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LineChange } from "@/lib/line-based-diff"

interface ArabicLineDiffViewerProps {
  originalText: string
  newText: string
  changes: LineChange[]
}

export function ArabicLineDiffViewer({ originalText, newText, changes }: ArabicLineDiffViewerProps) {
  const originalLines = originalText.split('\n')
  const newLines = newText.split('\n')

  const renderLineWithChanges = (lines: string[], changes: LineChange[], isOriginal: boolean) => {
    return lines.map((line, index) => {
      const lineNumber = index + 1
      const change = changes.find(c => c.lineNumber === lineNumber)
      
      if (!change) {
        return (
          <div key={index} className="flex">
            <div className="w-12 text-xs text-slate-400 text-right pr-2 py-1 select-none">
              {lineNumber}
            </div>
            <div className="flex-1 py-1 px-3 font-arabic text-lg leading-relaxed">
              {line}
            </div>
          </div>
        )
      }

      let className = "flex-1 py-1 px-3 font-arabic text-lg leading-relaxed "
      let lineNumberClass = "w-12 text-xs text-right pr-2 py-1 select-none "
      
      if (change.type === "insert" && !isOriginal) {
        className += "bg-green-100 border-l-4 border-green-500"
        lineNumberClass += "bg-green-50 text-green-700"
      } else if (change.type === "delete" && isOriginal) {
        className += "bg-red-100 border-l-4 border-red-500"
        lineNumberClass += "bg-red-50 text-red-700"
      } else if (change.type === "modify") {
        if (isOriginal) {
          className += "bg-orange-100 border-l-4 border-orange-500"
          lineNumberClass += "bg-orange-50 text-orange-700"
        } else {
          className += "bg-blue-100 border-l-4 border-blue-500"
          lineNumberClass += "bg-blue-50 text-blue-700"
        }
      }

      if ((change.type === "delete" && !isOriginal) || (change.type === "insert" && isOriginal)) {
        return null
      }

      return (
        <div key={index} className="flex">
          <div className={lineNumberClass}>
            {lineNumber}
          </div>
          <div className={className}>
            {(isOriginal && change.type === 'modify') ? line : change.content}
          </div>
        </div>
      )
    }).filter(Boolean)
  }

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case "insert": return "Insert Line"
      case "delete": return "Delete Line"
      case "modify": return "Modify Line"
      default: return changeType
    }
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "insert": return "bg-green-100 text-green-800"
      case "delete": return "bg-red-100 text-red-800"
      case "modify": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Optimized Difference View
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Change Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {changes.filter(c => c.type === "insert").length}
            </div>
            <div className="text-sm text-green-700 font-medium">Lines Inserted</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
            <div className="text-3xl font-bold text-red-600 mb-1">
              {changes.filter(c => c.type === "delete").length}
            </div>
            <div className="text-sm text-red-700 font-medium">Lines Deleted</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {changes.filter(c => c.type === "modify").length}
            </div>
            <div className="text-sm text-blue-700 font-medium">Lines Modified</div>
          </div>
        </div>

        {/* Performance Improvement Notice */}
        {changes.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="font-semibold text-emerald-800">Performance Improvement</div>
                <div className="text-sm text-emerald-700">
                  Tracking reduced from character-level to line-level — only {changes.length} changes instead of hundreds!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Text */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-700">Original Text</h3>
            <div className="border-2 border-slate-200 rounded-xl bg-gradient-to-br from-slate-50 to-white min-h-[300px] overflow-auto">
              {renderLineWithChanges(originalLines, changes, true)}
            </div>
          </div>

          {/* Modified Text */}
          <div>
            <h3 className="font-semibold mb-3 text-slate-700">Modified Text</h3>
            <div className="border-2 border-blue-200 rounded-xl bg-gradient-to-br from-blue-50 to-white min-h-[300px] overflow-auto">
              {renderLineWithChanges(newLines, changes, false)}
            </div>
          </div>
        </div>

        {/* Detailed Changes */}
        {changes.length > 0 && (
          <div>
            <h3 className="font-semibold mb-4 text-slate-700">Detailed Changes</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {changes.map((change, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getChangeTypeColor(change.type)} border-0`}
                    >
                      {getChangeTypeLabel(change.type)}
                    </Badge>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      Line {change.lineNumber}
                    </span>
                  </div>
                  <div className="text-sm font-arabic max-w-md truncate">
                    {change.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-medium mb-4 text-slate-700">Color Legend</h4>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-green-200 rounded-lg border-2 border-green-300"></span>
              <span className="text-slate-600">Inserted Line</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-red-200 rounded-lg border-2 border-red-300"></span>
              <span className="text-slate-600">Deleted Line</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-blue-200 rounded-lg border-2 border-blue-300"></span>
              <span className="text-slate-600">Modified Line</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 bg-orange-200 rounded-lg border-2 border-orange-300"></span>
              <span className="text-slate-600">Original Version</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
