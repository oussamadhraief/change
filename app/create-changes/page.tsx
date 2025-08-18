"use client"

import { ArabicChangeEngine } from "@/components/arabic-change-engine"

export default function CreateChangesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Changes</h1>
          <p className="text-slate-600">Edit Arabic text and submit change requests for approval</p>
        </div>
        <ArabicChangeEngine isAdminMode={false} />
      </div>
    </div>
  )
}
