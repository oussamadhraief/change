"use client"

import { useState } from "react"
import { ArabicChangeEngine } from "@/components/arabic-change-engine"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit3, Eye } from "lucide-react"
import type { OptimizedChangeRequest } from "@/lib/line-based-diff"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"create" | "review">("create")
  const [sharedText, setSharedText] = useState("")
  const [submittedChanges, setSubmittedChanges] = useState<OptimizedChangeRequest[]>([])

  const handleSubmitChange = (changeRequest: OptimizedChangeRequest) => {
    setSubmittedChanges(prev => [...prev, changeRequest]);
    setActiveTab("review");
  };

  const handleApproveChange = (changeId: string) => {
    setSubmittedChanges(prev =>
      prev.map(change =>
        change.id === changeId ? { ...change, status: "approved" } : change
      )
    );
  };

  const handleDeclineChange = (changeId: string) => {
    setSubmittedChanges(prev =>
      prev.map(change =>
        change.id === changeId ? { ...change, status: "declined" } : change
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Arabic Text Change Management Demo</h1>
          <p className="text-slate-600">Create changes and review them in one unified interface</p>
        </div>

        {/* Tab Navigation */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex gap-2 justify-center">
              <Button
                variant={activeTab === "create" ? "default" : "outline"}
                onClick={() => setActiveTab("create")}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Create Changes
              </Button>
              <Button
                variant={activeTab === "review" ? "default" : "outline"}
                onClick={() => setActiveTab("review")}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Review Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <ArabicChangeEngine 
          isAdminMode={activeTab === "review"} 
          sharedText={sharedText}
          onTextChange={setSharedText}
          onSubmitChange={handleSubmitChange}
          submittedChanges={submittedChanges}
          onApproveChange={handleApproveChange}
          onDeclineChange={handleDeclineChange}
        />
      </div>
    </div>
  )
}
