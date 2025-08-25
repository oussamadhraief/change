"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle } from "lucide-react"
import { motion } from "framer-motion"
import type { ArabicCharNode } from "./arabic-change-engine"

interface ArabicChangeHistoryProps {
  chars: ArabicCharNode[]
}

export function ArabicChangeHistory({ chars }: ArabicChangeHistoryProps) {
  const allChanges = chars
    .flatMap((char) =>
      char.changeHistory.map((entry) => ({
        ...entry,
        charPosition: char.position,
        charId: char.id,
        charType: char.type,
        lineNumber: char.lineNumber,
        wordNumber: char.wordNumber,
        sentenceNumber: char.sentenceNumber,
      })),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (allChanges.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            سجل التغييرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">لم يتم الموافقة على أي تغييرات بعد</p>
            <p className="text-slate-400 text-sm mt-2">ستظهر هنا جميع التغييرات المعتمدة</p>
          </div>
        </CardContent>
      </Card>
    )
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

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case "tashkeel": return "🔤"
      case "main": return "📝"
      case "insert": return "➕"
      case "delete": return "➖"
      default: return "📄"
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          سجل التغييرات
          <Badge variant="secondary" className="ml-2">
            {allChanges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allChanges.map((change) => (
            <motion.div
              key={change.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-sm text-right hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">
                  {getChangeTypeIcon(change.changeType)}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getChangeTypeColor(change.changeType)}`}
                    >
                      {change.changeType === "tashkeel" ? "تشكيل" : 
                       change.changeType === "main" ? "حرف أساسي" : 
                       change.changeType === "insert" ? "إدراج" : "حذف"}
                    </Badge>
                    <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      السطر {change.lineNumber} • الكلمة {change.wordNumber}
                    </span>
                  </div>
                  <div className="text-sm font-arabic">
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded-lg">
                      "{change.fromValue}" → "{change.toValue}"
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  تمت الموافقة بواسطة {change.user}
                </div>
                <div className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                  {new Date(change.timestamp).toLocaleString('ar-SA', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">
                {allChanges.filter(c => c.changeType === "tashkeel").length}
              </div>
              <div className="text-xs text-green-700">تشكيل</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">
                {allChanges.filter(c => c.changeType === "main").length}
              </div>
              <div className="text-xs text-blue-700">حروف أساسية</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-600">
                {allChanges.filter(c => c.changeType === "insert").length}
              </div>
              <div className="text-xs text-green-700">إدراج</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <div className="text-lg font-bold text-red-600">
                {allChanges.filter(c => c.changeType === "delete").length}
              </div>
              <div className="text-xs text-red-700">حذف</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
