"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, BookOpen, Edit3, Eye, Clock } from "lucide-react"
import { ArabicChangeHistory } from "./arabic-change-history"
import { ArabicChainVisualizer } from "./arabic-chain-visualizer"
import { ArabicLineDiffViewer } from "./arabic-line-diff-viewer"
import { ArabicAdminPanel } from "./arabic-admin-panel"
import { ArabicTextWithChanges } from "./arabic-text-with-changes"
import { arabicLineUtils, OptimizedChangeRequest, characterDiffUtils, FullTextChangeRequest } from "@/lib/line-based-diff"

export interface ArabicCharNode {
  id: string
  position: string
  value: string
  originalValue: string
  type: "main" | "tashkeel" | "space" | "punctuation"
  suggestions: ArabicSuggestion[]
  changeHistory: ArabicChangeHistoryEntry[]
  lineNumber: number
  wordNumber: number
  sentenceNumber: number
}

export interface ArabicSuggestion {
  id: string
  proposedValue: string
  user: string
  timestamp: string
  status: "pending" | "approved" | "declined"
  reason?: string
  baseValue?: string
  appliedValue?: string
  changeType: "tashkeel" | "main" | "insert" | "delete"
}

export interface ArabicChangeHistoryEntry {
  id: string
  fromValue: string
  toValue: string
  user: string
  timestamp: string
  suggestionId: string
  changeType: "tashkeel" | "main" | "insert" | "delete"
}

export interface ArabicPageData {
  pageId: string
  bookId: string
  pageNumber: number
  content: string
  lines: string[]
  words: string[]
  sentences: string[]
}

export interface ChangeRequestPayload {
  pageId: string
  bookId: string
  userId: string
  timestamp: string
  changes: ArabicChangeRequest[]
  originalText: string
  modifiedText: string
  changeSummary: {
    totalChanges: number
    tashkeelChanges: number
    mainCharChanges: number
    insertions: number
    deletions: number
  }
}

export interface ArabicChangeRequest {
  charId: string
  position: string
  startIndex: number // Add this missing property
  originalValue: string
  proposedValue: string
  changeType: "tashkeel" | "main" | "insert" | "delete"
  lineNumber: number
  wordNumber: number
  sentenceNumber: number
  context: {
    beforeText: string
    afterText: string
    surroundingWords: string[]
  }
}

// Arabic text utilities
const arabicUtils = {
  tashkeel: [
    '\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651', '\u0652', '\u0653', '\u0654', '\u0655', '\u0670',
  ],

  isTashkeel: (char: string) => arabicUtils.tashkeel.includes(char),
  
  isArabicMain: (char: string) => {
    const arabicRange = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRange.test(char) && !arabicUtils.isTashkeel(char)
  },

  isSpace: (char: string) => /\s/.test(char),
  
  isPunctuation: (char: string) => /[،؛؟!\.\-\–\—]/.test(char),

  parseArabicText: (text: string): ArabicCharNode[] => {
    const chars: ArabicCharNode[] = []
    let position = 1
    let lineNumber = 1
    let wordNumber = 1
    let sentenceNumber = 1
    let inWord = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      let charType: "main" | "tashkeel" | "space" | "punctuation" = "main"

      if (arabicUtils.isTashkeel(char)) {
        charType = "tashkeel"
      } else if (arabicUtils.isSpace(char)) {
        charType = "space"
        if (inWord) {
          wordNumber++
          inWord = false
        }
      } else if (arabicUtils.isPunctuation(char)) {
        charType = "punctuation"
        if (char === '.' || char === '؟' || char === '!') {
          sentenceNumber++
        }
      } else {
        if (!inWord) {
          inWord = true
        }
      }

      if (char === '\n') {
        lineNumber++
        wordNumber = 1
        sentenceNumber = 1
      }

      chars.push({
        id: uuidv4(),
        position: position.toString(),
        value: char,
        originalValue: char,
        type: charType,
        suggestions: [],
        changeHistory: [],
        lineNumber,
        wordNumber,
        sentenceNumber,
      })

      position++
    }

    return chars
  },

  detectArabicChanges: (original: string, modified: string): ArabicChangeRequest[] => {
    const originalChars = arabicUtils.parseArabicText(original)
    const modifiedChars = arabicUtils.parseArabicText(modified)
    const changes: ArabicChangeRequest[] = []

    const originalMap = new Map(originalChars.map((char, index) => [index, char]))
    const modifiedMap = new Map(modifiedChars.map((char, index) => [index, char]))

    for (let i = 0; i < Math.max(original.length, modified.length); i++) {
      const originalChar = original[i]
      const modifiedChar = modified[i]

      if (originalChar !== modifiedChar) {
        const originalNode = originalMap.get(i)
        const modifiedNode = modifiedMap.get(i)

        if (originalNode && modifiedNode) {
          changes.push({
            charId: originalNode.id,
            position: originalNode.position,
            startIndex: i, // Add startIndex
            originalValue: originalChar,
            proposedValue: modifiedChar,
            changeType: arabicUtils.isTashkeel(modifiedChar) ? "tashkeel" : "main",
            lineNumber: originalNode.lineNumber,
            wordNumber: originalNode.wordNumber,
            sentenceNumber: originalNode.sentenceNumber,
            context: {
              beforeText: original.slice(Math.max(0, i - 10), i),
              afterText: original.slice(i + 1, i + 11),
              surroundingWords: original.split(/\s+/).filter((_, idx) => 
                Math.abs(idx - originalNode.wordNumber) <= 1
              )
            }
          })
        } else if (originalNode && !modifiedNode) {
          changes.push({
            charId: originalNode.id,
            position: originalNode.position,
            startIndex: i, // Add startIndex
            originalValue: originalChar,
            proposedValue: "",
            changeType: "delete",
            lineNumber: originalNode.lineNumber,
            wordNumber: originalNode.wordNumber,
            sentenceNumber: originalNode.sentenceNumber,
            context: {
              beforeText: original.slice(Math.max(0, i - 10), i),
              afterText: original.slice(i + 1, i + 11),
              surroundingWords: original.split(/\s+/).filter((_, idx) => 
                Math.abs(idx - originalNode.wordNumber) <= 1
              )
            }
          })
        } else if (!originalNode && modifiedNode) {
          changes.push({
            charId: uuidv4(),
            position: `${i}.1`,
            startIndex: i, // Add startIndex
            originalValue: "",
            proposedValue: modifiedChar,
            changeType: "insert",
            lineNumber: modifiedNode.lineNumber,
            wordNumber: modifiedNode.wordNumber,
            sentenceNumber: modifiedNode.sentenceNumber,
            context: {
              beforeText: modified.slice(Math.max(0, i - 10), i),
              afterText: modified.slice(i + 1, i + 11),
              surroundingWords: modified.split(/\s+/).filter((_, idx) => 
                Math.abs(idx - modifiedNode.wordNumber) <= 1
              )
            }
          })
        }
      }
    }

    return changes
  }
}

// Mock API functions
const mockApi = {
  async fetchArabicPage(pageId: string): Promise<ArabicPageData> {
    const arabicText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ"
    
    return {
      pageId,
      bookId: "book-1",
      pageNumber: 1,
      content: arabicText,
      lines: arabicText.split('\n'),
      words: arabicText.split(/\s+/),
      sentences: arabicText.split(/[.!?؟]/).filter(s => s.trim())
    }
  },

  async submitChangeRequest(payload: ChangeRequestPayload): Promise<{ success: boolean; requestId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return { success: true, requestId: uuidv4() }
  }
}

export function ArabicChangeEngine({ 
  isAdminMode = false, 
  sharedText, 
  onTextChange,
  onSubmitChange,
  submittedChanges,
  onApproveChange,
  onDeclineChange
}: { 
  isAdminMode?: boolean
  sharedText?: string
  onTextChange?: (text: string) => void
  onSubmitChange?: (changeRequest: FullTextChangeRequest) => void
  submittedChanges?: FullTextChangeRequest[]
  onApproveChange?: (requestId: string, changeId: string) => void
  onDeclineChange?: (requestId: string, changeId: string) => void
}) {
  const [pageData, setPageData] = useState<ArabicPageData | null>(null)
  const [chars, setChars] = useState<ArabicCharNode[]>([])
  const [userName, setUserName] = useState("User")
  const [pageId, setPageId] = useState("page-1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const optimizedResult = useMemo(() => {
    if (!pageData) return { lineChanges: [], changeSummary: { totalLineChanges: 0, insertedLines: 0, deletedLines: 0, modifiedLines: 0, characterChanges: { tashkeelChanges: 0, mainCharChanges: 0, totalCharChanges: 0 } } }
    return arabicLineUtils.detectLineBasedChanges(pageData.content, editText)
  }, [pageData, editText])

  useEffect(() => {
    loadPage()
  }, [pageId])

  useEffect(() => {
    if (sharedText && sharedText !== editText) {
      setEditText(sharedText)
    }
  }, [sharedText])

  useEffect(() => {
    if (onTextChange && editText !== sharedText) {
      onTextChange(editText)
    }
  }, [editText, onTextChange])

  const loadPage = async () => {
    const data = await mockApi.fetchArabicPage(pageId)
    setPageData(data)
    setEditText(data.content)
    
    const parsedChars = arabicUtils.parseArabicText(data.content)
    
    // Add some mock suggestions for demo
    if (parsedChars.length > 0) {
      // Add a tashkeel suggestion
      parsedChars[5].suggestions = [
        {
          id: uuidv4(),
          proposedValue: '\u064E', // Fatha
          user: "UserA",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: "pending",
          changeType: "tashkeel"
        }
      ]
      
      // Add a main character suggestion
      parsedChars[15].suggestions = [
        {
          id: uuidv4(),
          proposedValue: 'أ',
          user: "UserB",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          status: "pending",
          changeType: "main"
        }
      ]
    }
    
    setChars(parsedChars)
  }

  const submitChangeRequest = async () => {
    if (!pageData) return

    setIsSubmitting(true)
    
    try {
      // Create full text change request with character-level detection
      const payload = characterDiffUtils.createFullTextChangeRequest(
        pageData.pageId,
        pageData.bookId,
        userName,
        pageData.content,
        editText
      )

      if (onSubmitChange) {
        onSubmitChange(payload)
      }

      // Reset the editor state after submission
      setIsEditing(false)
      setShowDiff(false)
    } catch (error) {
      console.error('Error submitting change request:', error)
      alert('Error submitting change request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            {isAdminMode ? "Admin Panel - Review Changes" : "Arabic Text Editor"}
          </h1>
          <p className="text-slate-600">Page {pageData.pageNumber} • Book {pageData.bookId}</p>
        </div>

        {/* Page Controls */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="pageId" className="text-sm font-medium text-slate-700">Page ID</Label>
                <Input
                  id="pageId"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="Enter page ID"
                  className="mt-1"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="userName" className="text-sm font-medium text-slate-700">Username</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              <Button onClick={loadPage} variant="outline" className="mt-6">
                <BookOpen className="w-4 h-4 mr-2" />
                Load Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Text Editor */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    {isAdminMode ? "Text Viewer" : "Text Editor"}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!isAdminMode && (
                      <Button
                        variant={isEditing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? "Cancel Edit" : "Edit Text"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDiff(!showDiff)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {showDiff ? "Hide" : "View"} Differences
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing && !isAdminMode ? (
                  <div className="space-y-4">
                    <Textarea
                      ref={textareaRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[400px] text-right font-arabic text-lg leading-relaxed resize-none"
                      style={{ direction: 'rtl' }}
                      placeholder="Start writing text here..."
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-500">
                        {editText.length} characters
                      </div>
                      <Button 
                        onClick={submitChangeRequest}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Submitting..." : "Submit Change Request"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="min-h-[400px] p-6 border rounded-lg bg-white text-right font-arabic text-lg leading-relaxed"
                    style={{ direction: 'rtl' }}
                  >
                    {editText || pageData.content}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Change Summary */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Change Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {chars.reduce((acc, char) => acc + char.suggestions.filter(s => s.status === "pending").length, 0)}
                    </div>
                    <div className="text-xs text-blue-600">Pending Suggestions</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {chars.reduce((acc, char) => acc + char.changeHistory.length, 0)}
                    </div>
                    <div className="text-xs text-green-600">Approved Changes</div>
                  </div>
                </div>
                
                {isEditing && !isAdminMode && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-slate-600 mb-2">Detected Changes:</div>
                    <div className="space-y-2">
                      {(() => {
                        const lineChanges = optimizedResult.lineChanges
                        if (lineChanges.length === 0) {
                          return <div className="text-sm text-slate-500 text-center py-2">No changes detected.</div>
                        }
                        return lineChanges.slice(0, 3).map((change, index) => (
                          <div key={index} className="text-xs bg-slate-50 p-2 rounded">
                            <div className="font-medium">
                              Line {change.lineNumber}: {change.type === "insert" ? "Added" : change.type === "delete" ? "Deleted" : "Modified"}
                            </div>
                            <div className="text-slate-500 truncate">
                              {change.content.substring(0, 50)}{change.content.length > 50 ? "..." : ""}
                            </div>
                          </div>
                        ))
                      })()}
                      {(() => {
                        const lineChanges = optimizedResult.lineChanges
                        if (lineChanges.length > 3) {
                          return (
                            <div className="text-xs text-slate-500 text-center">
                              and {lineChanges.length - 3} more changes...
                            </div>
                          )
                        }
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {!isAdminMode && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2"><Send className="w-4 h-4 text-blue-600" />Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Text
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowDiff(!showDiff)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Differences
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.location.reload()}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Reload Page
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Diff View */}
        {showDiff && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                View Differences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ArabicLineDiffViewer
                originalText={pageData.content}
                newText={editText}
                changes={optimizedResult.lineChanges}
              />
            </CardContent>
          </Card>
        )}

        {/* Chain Visualizer */}
        <ArabicChainVisualizer chars={chars} />

        {/* Text with Changes - Only show in admin mode */}
        {isAdminMode && submittedChanges && submittedChanges.length > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Review Text Changes
              </CardTitle>
              <p className="text-sm text-slate-500">
                Click on highlighted characters to review and approve/decline changes
              </p>
            </CardHeader>
            <CardContent>
              <ArabicTextWithChanges
                originalText={pageData?.content || ""}
                changeRequests={submittedChanges}
                onApproveChange={onApproveChange || (() => {})}
                onDeclineChange={onDeclineChange || (() => {})}
                isAdminMode={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Admin Panel - Only show in admin mode */}
        {isAdminMode && submittedChanges && pageData && (
          <ArabicAdminPanel 
            submittedChanges={submittedChanges}
            originalContent={pageData.content}
            onApproveRequest={(requestId) => onApproveChange?.(requestId, '')}
            onDeclineRequest={(requestId) => onDeclineChange?.(requestId, '')}
          />
        )}

        {/* Change History */}
        <ArabicChangeHistory chars={chars} />
      </div>
    </div>
  )
}
