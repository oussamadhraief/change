"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, X, Eye, Clock, CheckCircle, User, FileText, Hash } from "lucide-react"
import { arabicLineUtils, characterDiffUtils, type FullTextChangeRequest, type WordChange } from "@/lib/line-based-diff"
import { ArabicLineDiffViewer } from "./arabic-line-diff-viewer"

interface ArabicAdminPanelProps {
  submittedChanges: FullTextChangeRequest[]
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
  const [localChanges, setLocalChanges] = useState<FullTextChangeRequest[]>(submittedChanges)
  
  const handleApproveWordChange = (requestId: string, wordChangeId: string) => {
    setLocalChanges(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            wordChanges: request.wordChanges.map(change => 
              change.id === wordChangeId 
                ? { ...change, status: 'approved' as const }
                : change
            )
          }
        : request
    ))
  }
  
  const handleDeclineWordChange = (requestId: string, wordChangeId: string) => {
    setLocalChanges(prev => prev.map(request => 
      request.id === requestId 
        ? {
            ...request,
            wordChanges: request.wordChanges.map(change => 
              change.id === wordChangeId 
                ? { ...change, status: 'declined' as const }
                : change
            )
          }
        : request
    ))
  }

  if (localChanges.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
          Review Change Requests
        </CardTitle>
        <p className="text-sm text-slate-500 pt-2">
          Reviewing {submittedChanges.length} submitted change request(s).
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {localChanges.map((request, index) => {
            const newText = request.modifiedText
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
                    <h4 className="font-semibold mb-2">Word Changes:</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {request.wordChanges.map((change, changeIndex) => (
                        <div key={change.id} className="p-2 bg-slate-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={change.changeType === 'insert' ? 'default' : change.changeType === 'delete' ? 'destructive' : 'secondary'}>
                                {change.changeType}
                              </Badge>
                              <span className="text-sm font-mono">
                                {change.changeType === 'delete' ? (
                                  <span className="line-through text-red-600">'{change.originalWord}'</span>
                                ) : change.changeType === 'insert' ? (
                                  <span className="text-green-600">'{change.newWord}'</span>
                                ) : (
                                  <>
                                    <span className="line-through text-red-600">'{change.originalWord}'</span>
                                    <span className="mx-1">→</span>
                                    <span className="text-green-600">'{change.newWord}'</span>
                                  </>
                                )}
                              </span>
                              <span className="text-xs text-slate-500">Line {change.lineNumber}, Word {change.wordIndex + 1}</span>
                            </div>
                            <div className="flex gap-1">
                              {change.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeclineWordChange(request.id, change.id)}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-green-600 hover:bg-green-50"
                                    onClick={() => handleApproveWordChange(request.id, change.id)}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                              {change.status === 'approved' && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" />Approved
                                </Badge>
                              )}
                              {change.status === 'declined' && (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">
                                  <X className="w-3 h-3 mr-1" />Declined
                                </Badge>
                              )}
                            </div>
                          </div>
                          {change.characterChanges.length > 0 && (
                            <div className="text-xs text-slate-500 ml-6">
                              Character details: {change.characterChanges.map(cc => 
                                cc.changeType === 'modify' 
                                  ? `'${cc.originalChar}' → '${cc.newChar}'`
                                  : cc.changeType === 'insert'
                                  ? `+'${cc.newChar}'`
                                  : `-'${cc.originalChar}'`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
