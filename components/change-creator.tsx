"use client"

import { useState, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { RefreshCw, Eye, EyeOff, FileText, Send } from "lucide-react"
import { DiffViewer } from "./diff-viewer"
import { Separator } from "@/components/ui/separator"

export interface DetectedChange {
  id: string
  type: "insert" | "delete" | "replace"
  level: "character" | "word" | "sentence" | "line"
  startIndex: number // Character position in original text
  endIndex?: number // For deletions/replacements
  originalValue?: string
  newValue?: string
  context?: {
    beforeText: string
    afterText: string
  }
}

interface SubmissionPayload {
  pageId: string
  userId: string
  changes: DetectedChange[]
  originalText: string
  newText: string
  timestamp: string
}

// Mock original content from backend
const mockOriginalContent = "The forest was dark and silent. Birds chirped in the distance."

export function ChangeCreator() {
  const [originalText, setOriginalText] = useState("")
  const [currentText, setCurrentText] = useState("")
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([])
  const [showDiff, setShowDiff] = useState(true)
  const [userId, setUserId] = useState("user123")
  const [pageId, setPageId] = useState("page-1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadOriginalContent()
  }, [])

  const loadOriginalContent = () => {
    setOriginalText(mockOriginalContent)
    setCurrentText(mockOriginalContent)
  }

  const detectChanges = (newText: string): DetectedChange[] => {
    const changes: DetectedChange[] = []

    // First, try sentence-level detection
    const sentenceChanges = detectSentenceChanges(originalText, newText)
    if (sentenceChanges.length > 0 && isSignificantChange(sentenceChanges, originalText, newText)) {
      return sentenceChanges
    }

    // Then try word-level detection
    const wordChanges = detectWordChanges(originalText, newText)
    if (wordChanges.length > 0 && isSignificantChange(wordChanges, originalText, newText)) {
      return wordChanges
    }

    // Fall back to character-level for small changes
    return detectCharacterChanges(originalText, newText)
  }

  const isSignificantChange = (changes: DetectedChange[], original: string, modified: string): boolean => {
    // If the change affects more than 30% of the text, use higher-level grouping
    const totalChangedChars = changes.reduce((acc, change) => {
      return acc + (change.originalValue?.length || 0) + (change.newValue?.length || 0)
    }, 0)

    return totalChangedChars > original.length * 0.3
  }

  const detectSentenceChanges = (original: string, modified: string): DetectedChange[] => {
    const changes: DetectedChange[] = []

    // Split by sentence boundaries
    const originalSentences = original.split(/([.!?]+\s*)/).filter((s) => s.trim())
    const modifiedSentences = modified.split(/([.!?]+\s*)/).filter((s) => s.trim())

    let originalIndex = 0
    let modifiedIndex = 0
    let charPosition = 0

    while (originalIndex < originalSentences.length || modifiedIndex < modifiedSentences.length) {
      const origSentence = originalSentences[originalIndex]
      const modSentence = modifiedSentences[modifiedIndex]

      if (!origSentence && modSentence) {
        // Sentence insertion
        changes.push({
          id: uuidv4(),
          type: "insert",
          level: "sentence",
          startIndex: charPosition,
          newValue: modSentence,
          context: {
            beforeText: originalSentences[originalIndex - 1] || "",
            afterText: originalSentences[originalIndex + 1] || "",
          },
        })
        modifiedIndex++
      } else if (origSentence && !modSentence) {
        // Sentence deletion
        changes.push({
          id: uuidv4(),
          type: "delete",
          level: "sentence",
          startIndex: charPosition,
          endIndex: charPosition + origSentence.length,
          originalValue: origSentence,
          context: {
            beforeText: originalSentences[originalIndex - 1] || "",
            afterText: originalSentences[originalIndex + 1] || "",
          },
        })
        charPosition += origSentence.length
        originalIndex++
      } else if (origSentence && modSentence) {
        if (origSentence.trim() !== modSentence.trim()) {
          // Sentence replacement
          changes.push({
            id: uuidv4(),
            type: "replace",
            level: "sentence",
            startIndex: charPosition,
            endIndex: charPosition + origSentence.length,
            originalValue: origSentence,
            newValue: modSentence,
            context: {
              beforeText: originalSentences[originalIndex - 1] || "",
              afterText: originalSentences[originalIndex + 1] || "",
            },
          })
        }
        charPosition += origSentence.length
        originalIndex++
        modifiedIndex++
      }
    }

    return changes
  }

  const detectWordChanges = (original: string, modified: string): DetectedChange[] => {
    const changes: DetectedChange[] = []
    const originalWords = original.split(/(\s+)/)
    const modifiedWords = modified.split(/(\s+)/)

    let charPosition = 0
    let originalIndex = 0
    let modifiedIndex = 0

    while (originalIndex < originalWords.length || modifiedIndex < modifiedWords.length) {
      const origWord = originalWords[originalIndex]
      const modWord = modifiedWords[modifiedIndex]

      if (!origWord && modWord) {
        // Word insertion
        changes.push({
          id: uuidv4(),
          type: "insert",
          level: "word",
          startIndex: charPosition,
          newValue: modWord,
          context: {
            beforeText: originalWords[originalIndex - 1] || "",
            afterText: originalWords[originalIndex + 1] || "",
          },
        })
        modifiedIndex++
      } else if (origWord && !modWord) {
        // Word deletion
        changes.push({
          id: uuidv4(),
          type: "delete",
          level: "word",
          startIndex: charPosition,
          endIndex: charPosition + origWord.length,
          originalValue: origWord,
          context: {
            beforeText: originalWords[originalIndex - 1] || "",
            afterText: originalWords[originalIndex + 1] || "",
          },
        })
        charPosition += origWord.length
        originalIndex++
      } else if (origWord && modWord) {
        if (origWord !== modWord) {
          // Word replacement
          changes.push({
            id: uuidv4(),
            type: "replace",
            level: "word",
            startIndex: charPosition,
            endIndex: charPosition + origWord.length,
            originalValue: origWord,
            newValue: modWord,
            context: {
              beforeText: originalWords[originalIndex - 1] || "",
              afterText: originalWords[originalIndex + 1] || "",
            },
          })
        }
        charPosition += origWord.length
        originalIndex++
        modifiedIndex++
      }
    }

    return changes
  }

  const detectCharacterChanges = (original: string, modified: string): DetectedChange[] => {
    const changes: DetectedChange[] = []
    let originalIndex = 0
    let modifiedIndex = 0

    while (originalIndex < original.length || modifiedIndex < modified.length) {
      const originalChar = original[originalIndex]
      const modifiedChar = modified[modifiedIndex]

      if (originalChar === modifiedChar) {
        originalIndex++
        modifiedIndex++
      } else if (originalIndex >= original.length) {
        // Character insertion at end
        changes.push({
          id: uuidv4(),
          type: "insert",
          level: "character",
          startIndex: originalIndex,
          newValue: modifiedChar,
        })
        modifiedIndex++
      } else if (modifiedIndex >= modified.length) {
        // Character deletion
        changes.push({
          id: uuidv4(),
          type: "delete",
          level: "character",
          startIndex: originalIndex,
          endIndex: originalIndex + 1,
          originalValue: originalChar,
        })
        originalIndex++
      } else {
        // Character replacement
        changes.push({
          id: uuidv4(),
          type: "replace",
          level: "character",
          startIndex: originalIndex,
          endIndex: originalIndex + 1,
          originalValue: originalChar,
          newValue: modifiedChar,
        })
        originalIndex++
        modifiedIndex++
      }
    }

    return changes
  }

  const handleTextChange = (newText: string) => {
    setCurrentText(newText)
    const changes = detectChanges(newText)
    setDetectedChanges(changes)
  }

  const resetChanges = () => {
    setCurrentText(originalText)
    setDetectedChanges([])
  }

  const submitChanges = async () => {
    if (detectedChanges.length === 0) {
      alert("No changes to submit!")
      return
    }

    setIsSubmitting(true)

    const payload: SubmissionPayload = {
      pageId,
      userId,
      changes: detectedChanges,
      originalText,
      newText: currentText,
      timestamp: new Date().toISOString(),
    }

    try {
      // Mock API call
      console.log("Submitting changes:", payload)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful response
      alert(`Successfully submitted ${detectedChanges.length} changes!`)

      // Reset the form
      resetChanges()
    } catch (error) {
      console.error("Failed to submit changes:", error)
      alert("Failed to submit changes. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getChangeStats = () => {
    const stats = {
      insertions: detectedChanges.filter((c) => c.type === "insert").length,
      deletions: detectedChanges.filter((c) => c.type === "delete").length,
      replacements: detectedChanges.filter((c) => c.type === "replace").length,
      byLevel: {
        sentence: detectedChanges.filter((c) => c.level === "sentence").length,
        word: detectedChanges.filter((c) => c.level === "word").length,
        character: detectedChanges.filter((c) => c.level === "character").length,
        line: detectedChanges.filter((c) => c.level === "line").length,
      },
    }
    return stats
  }

  const stats = getChangeStats()

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
              />
            </div>
            <div>
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="Enter page ID"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Original Text Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Original Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border-l-4 border-slate-300">{originalText}</div>
        </CardContent>
      </Card>

      {/* Text Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Text</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDiff(!showDiff)}>
                {showDiff ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showDiff ? "Hide" : "Show"} Diff
              </Button>
              <Button variant="outline" size="sm" onClick={resetChanges}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            ref={textareaRef}
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Edit the text here..."
            className="min-h-32 font-mono text-sm"
            rows={6}
          />

          {/* Change Statistics */}
          <div className="flex gap-2 flex-wrap mt-4">
            <Badge variant={stats.insertions > 0 ? "default" : "secondary"}>+{stats.insertions} insertions</Badge>
            <Badge variant={stats.deletions > 0 ? "destructive" : "secondary"}>-{stats.deletions} deletions</Badge>
            <Badge variant={stats.replacements > 0 ? "default" : "secondary"}>~{stats.replacements} replacements</Badge>
            <Separator orientation="vertical" className="h-6" />
            <Badge variant="outline">{stats.byLevel.sentence} sentences</Badge>
            <Badge variant="outline">{stats.byLevel.word} words</Badge>
            <Badge variant="outline">{stats.byLevel.character} chars</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Diff Viewer */}
      <AnimatePresence>
        {showDiff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <DiffViewer originalText={originalText} newText={currentText} changes={detectedChanges} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Details */}
      {detectedChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detected Changes ({detectedChanges.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {detectedChanges.map((change, index) => (
                <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        change.type === "insert" ? "default" : change.type === "delete" ? "destructive" : "secondary"
                      }
                    >
                      {change.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {change.level}
                    </Badge>
                    <span className="font-mono">
                      Position: {change.startIndex}
                      {change.endIndex && `-${change.endIndex}`}
                    </span>
                    <span className="font-mono max-w-md truncate">
                      {change.type === "insert" && `+ "${change.newValue}"`}
                      {change.type === "delete" && `- "${change.originalValue}"`}
                      {change.type === "replace" && `"${change.originalValue}" → "${change.newValue}"`}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {change.originalValue?.length || change.newValue?.length || 0} chars
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Payload Preview */}
      {detectedChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Backend Payload Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
              {JSON.stringify(
                {
                  pageId,
                  userId,
                  changes: detectedChanges,
                  originalText,
                  newText: currentText,
                  timestamp: new Date().toISOString(),
                },
                null,
                2,
              )}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button
              onClick={submitChanges}
              disabled={detectedChanges.length === 0 || isSubmitting}
              size="lg"
              className="min-w-48"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit {detectedChanges.length} Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
