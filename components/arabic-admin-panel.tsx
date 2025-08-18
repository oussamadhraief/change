"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, X, Eye, Clock, CheckCircle, User, FileText, Hash } from "lucide-react"
import { arabicLineUtils, type OptimizedChangeRequest } from "@/lib/line-based-diff"
import { ArabicLineDiffViewer } from "./arabic-line-diff-viewer"

interface ArabicAdminPanelProps {
  submittedChanges: OptimizedChangeRequest[]
  originalContent: string
  onApproveRequest: (requestId: string) => void
  onDeclineRequest: (requestId: string) => void
}

export function ArabicAdminPanel({ 
  submittedChanges,
  originalContent,
  onApproveRequest,
  onDeclineRequest
}: ArabicAdminPanelProps) {

  if (submittedChanges.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Review Change Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-500 py-8">No pending change requests to review.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          Review Change Requests
        </CardTitle>
        <p className="text-sm text-slate-500 pt-2">
          Reviewing {submittedChanges.length} submitted change request(s).
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {submittedChanges.map((request) => {
            const newText = arabicLineUtils.applyLineChanges(originalContent, request.lineChanges)
            return (
            <AccordionItem key={request.id} value={request.id} className="border-0 shadow-sm rounded-lg overflow-hidden">
              <Card className="bg-white">
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">Change Request</div>
                        <div className="text-xs text-slate-500 flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {request.userId}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(request.timestamp).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {request.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                                        <div className="flex items-center gap-2">
                      <Badge variant={request.status === "approved" ? "default" : "secondary"} className={
                        request.status === "approved" ? "bg-green-600 text-white" :
                        request.status === "declined" ? "bg-red-600 text-white" :
                        "bg-yellow-400 text-white"
                      }>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Detailed Changes:</h4>
                    <ArabicLineDiffViewer 
                      originalText={originalContent} 
                      newText={newText}
                      changes={request.lineChanges} 
                    />
                                        <div className="flex justify-end gap-2 mt-4">
                      {request.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => onDeclineRequest(request.id)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => onApproveRequest(request.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </>
                      )} 
                    </div>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          )})}
        </Accordion>
      </CardContent>
    </Card>
  )
}
