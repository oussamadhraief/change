"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Plus, History } from "lucide-react"
import { CharacterRenderer } from "./character-renderer"
import { ChangeHistory } from "./change-history"
import { ChainVisualizer } from "./chain-visualizer"

export interface CharNode {
  id: string
  position: string // e.g., "1", "1.1", "1.1.1" for fractional positioning
  value: string
  originalValue: string
  suggestions: Suggestion[]
  changeHistory: ChangeHistoryEntry[]
}

export interface Suggestion {
  id: string
  proposedValue: string
  user: string
  timestamp: string
  status: "pending" | "approved" | "declined"
  reason?: string
  baseValue?: string // What value this suggestion was based on
  appliedValue?: string // What the final result was after applying to current state
}

export interface ChangeHistoryEntry {
  id: string
  fromValue: string
  toValue: string
  user: string
  timestamp: string
  suggestionId: string
}

// Mock API functions
const mockApi = {
  async fetchContent(): Promise<CharNode[]> {
    const sentence = "The forest was dark and silent."
    return sentence.split("").map((char, index) => ({
      id: uuidv4(),
      position: (index + 1).toString(),
      value: char,
      originalValue: char,
      suggestions: [],
      changeHistory: [],
    }))
  },

  async addSuggestion(charId: string, proposedValue: string, user: string): Promise<Suggestion> {
    return {
      id: uuidv4(),
      proposedValue,
      user,
      timestamp: new Date().toISOString(),
      status: "pending",
    }
  },

  async approveSuggestion(charId: string, suggestionId: string): Promise<void> {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 100))
  },
}

export function ChangeApprovalEngine() {
  const [chars, setChars] = useState<CharNode[]>([])
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [newSuggestion, setNewSuggestion] = useState("")
  const [userName, setUserName] = useState("Admin")

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    const content = await mockApi.fetchContent()
    // Add some mock suggestions for demo
    content[15].suggestions = [
      {
        id: uuidv4(),
        proposedValue: "daaaark",
        user: "UserA",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: "pending",
      },
      {
        id: uuidv4(),
        proposedValue: "bright",
        user: "UserB",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: "pending",
      },
    ]
    setChars(content)
  }

  const approveSuggestion = async (charId: string, suggestionId: string) => {
    await mockApi.approveSuggestion(charId, suggestionId)

    setChars((prevChars) => {
      return prevChars.map((char) => {
        if (char.id !== charId) return char

        const suggestion = char.suggestions.find((s) => s.id === suggestionId)
        if (!suggestion || suggestion.status !== "pending") return char

        // Create history entry
        const historyEntry: ChangeHistoryEntry = {
          id: uuidv4(),
          fromValue: char.value,
          toValue: suggestion.proposedValue,
          user: userName,
          timestamp: new Date().toISOString(),
          suggestionId,
        }

        // Mark this suggestion as approved (don't decline others)
        const updatedSuggestions = char.suggestions.map((s) => ({
          ...s,
          status: s.id === suggestionId ? ("approved" as const) : s.status,
        }))

        // Update remaining pending suggestions to use the new value as their base
        const updatedSuggestionsWithNewBase = updatedSuggestions.map((s) => {
          if (s.status === "pending" && s.id !== suggestionId) {
            // Apply this suggestion to the new current value instead of original
            return {
              ...s,
              baseValue: suggestion.proposedValue, // Track what this suggestion is based on
            }
          }
          return s
        })

        return {
          ...char,
          value: suggestion.proposedValue,
          suggestions: updatedSuggestionsWithNewBase,
          changeHistory: [...char.changeHistory, historyEntry],
        }
      })
    })
  }

  const declineSuggestion = (charId: string, suggestionId: string) => {
    setChars((prevChars) => {
      return prevChars.map((char) => {
        if (char.id !== charId) return char

        const updatedSuggestions = char.suggestions.map((s) => ({
          ...s,
          status: s.id === suggestionId ? ("declined" as const) : s.status,
        }))

        return {
          ...char,
          suggestions: updatedSuggestions,
        }
      })
    })
  }

  const addSuggestion = async (charId: string, proposedValue: string, user: string) => {
    const suggestion = await mockApi.addSuggestion(charId, proposedValue, user)

    setChars((prevChars) => {
      return prevChars.map((char) => {
        if (char.id !== charId) return char
        return {
          ...char,
          suggestions: [...char.suggestions, suggestion],
        }
      })
    })
  }

  const insertCharacter = (afterCharId: string, newValue: string) => {
    setChars((prevChars) => {
      const charIndex = prevChars.findIndex((c) => c.id === afterCharId)
      if (charIndex === -1) return prevChars

      const currentChar = prevChars[charIndex]
      const nextChar = prevChars[charIndex + 1]

      // Generate fractional position
      let newPosition: string
      if (nextChar) {
        // Insert between current and next
        newPosition = `${currentChar.position}.1`
      } else {
        // Insert at end
        newPosition = `${Number.parseInt(currentChar.position) + 1}`
      }

      const newChar: CharNode = {
        id: uuidv4(),
        position: newPosition,
        value: newValue,
        originalValue: newValue,
        suggestions: [],
        changeHistory: [],
      }

      const newChars = [...prevChars]
      newChars.splice(charIndex + 1, 0, newChar)
      return newChars
    })
  }

  const getCurrentText = () => {
    return chars.map((char) => char.value).join("")
  }

  const getWordBoundaries = () => {
    const words: { start: number; end: number; text: string }[] = []
    let currentWord = ""
    let wordStart = 0

    chars.forEach((char, index) => {
      if (char.value === " " || char.value === "." || char.value === "," || char.value === "!") {
        if (currentWord) {
          words.push({
            start: wordStart,
            end: index - 1,
            text: currentWord,
          })
          currentWord = ""
        }
        wordStart = index + 1
      } else {
        currentWord += char.value
      }
    })

    if (currentWord) {
      words.push({
        start: wordStart,
        end: chars.length - 1,
        text: currentWord,
      })
    }

    return words
  }

  const selectedChar = chars.find((c) => c.id === selectedCharId)

  return (
    <div className="space-y-6">
      {/* Main Content Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Document Content</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg leading-relaxed font-mono bg-slate-50 p-4 rounded-lg">
            {chars.map((char, index) => (
              <CharacterRenderer
                key={char.id}
                char={char}
                index={index}
                isSelected={selectedCharId === char.id}
                onSelect={setSelectedCharId}
                onApproveSuggestion={approveSuggestion}
                onDeclineSuggestion={declineSuggestion}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ChangeHistory chars={chars} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chain Visualizer */}
      <ChainVisualizer chars={chars} />

      {/* Selected Character Details */}
      {selectedChar && (
        <Card>
          <CardHeader>
            <CardTitle>Character Details: "{selectedChar.value}"</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Position</Label>
                <div className="font-mono">{selectedChar.position}</div>
              </div>
              <div>
                <Label>Original Value</Label>
                <div className="font-mono">"{selectedChar.originalValue}"</div>
              </div>
            </div>

            <Separator />

            <div>
              <Label>Suggestions ({selectedChar.suggestions.length})</Label>
              <div className="space-y-2 mt-2">
                {selectedChar.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">"{suggestion.proposedValue}"</span>
                        <Badge
                          variant={
                            suggestion.status === "approved"
                              ? "default"
                              : suggestion.status === "declined"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {suggestion.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        by {suggestion.user} • {new Date(suggestion.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {suggestion.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveSuggestion(selectedChar.id, suggestion.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => declineSuggestion(selectedChar.id, suggestion.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Input
                placeholder="New suggestion..."
                value={newSuggestion}
                onChange={(e) => setNewSuggestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSuggestion.trim()) {
                    addSuggestion(selectedChar.id, newSuggestion.trim(), userName)
                    setNewSuggestion("")
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (newSuggestion.trim()) {
                    addSuggestion(selectedChar.id, newSuggestion.trim(), userName)
                    setNewSuggestion("")
                  }
                }}
                disabled={!newSuggestion.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls - Multiple Approval Chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Chain Example: "dark" → "daaaark" → "daaaarks"</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Find the 'd' in 'dark'
                    const darkIndex = chars.findIndex(
                      (c, i) =>
                        c.value === "d" &&
                        chars[i + 1]?.value === "a" &&
                        chars[i + 2]?.value === "r" &&
                        chars[i + 3]?.value === "k",
                    )
                    if (darkIndex !== -1) {
                      // Add suggestion to change 'd' to 'daaaa'
                      addSuggestion(chars[darkIndex].id, "daaaa", "UserA")
                    }
                  }}
                >
                  1. Suggest "d" → "daaaa"
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Find the 'k' in 'dark' (or current state)
                    const darkKIndex = chars.findIndex((c, i) => chars[i - 1]?.value === "r" && c.value === "k")
                    if (darkKIndex !== -1) {
                      addSuggestion(chars[darkKIndex].id, "ks", "UserB")
                    }
                  }}
                >
                  2. Suggest "k" → "ks"
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Find the 'a' in current 'dark' state
                    const darkAIndex = chars.findIndex((c, i) => chars[i - 1]?.value === "d" && c.value === "a")
                    if (darkAIndex !== -1) {
                      addSuggestion(chars[darkAIndex].id, "aaa", "UserC")
                    }
                  }}
                >
                  3. Suggest "a" → "aaa"
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Word Replacement Chain</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add multiple suggestions to the same word
                    const forestIndex = chars.findIndex(
                      (c, i) => c.value === "f" && chars[i + 1]?.value === "o" && chars[i + 2]?.value === "r",
                    )
                    if (forestIndex !== -1) {
                      addSuggestion(chars[forestIndex].id, "F", "UserD")
                      addSuggestion(chars[forestIndex + 1].id, "OREST", "UserE")
                    }
                  }}
                >
                  Multiple on "forest"
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-medium">Current State Analysis</Label>
            <div className="bg-slate-50 p-3 rounded text-sm font-mono">
              <div>
                <strong>Original:</strong> The forest was dark and silent.
              </div>
              <div>
                <strong>Current:</strong> {getCurrentText()}
              </div>
              <div>
                <strong>Total Changes:</strong> {chars.reduce((acc, char) => acc + char.changeHistory.length, 0)}
              </div>
              <div>
                <strong>Pending Suggestions:</strong>{" "}
                {chars.reduce((acc, char) => acc + char.suggestions.filter((s) => s.status === "pending").length, 0)}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            💡 <strong>How it works:</strong> Each approval updates the character value and keeps other pending
            suggestions. When you approve multiple suggestions on the same character, they chain together: "dark" →
            approve "d→daaaa" = "daaaark" → approve "k→ks" = "daaaarks"
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
