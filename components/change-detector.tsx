"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ChangeDetectorProps {
  originalText: string
  currentText: string
  onChangesDetected: (changes: any[]) => void
}

export function ChangeDetector({ originalText, currentText, onChangesDetected }: ChangeDetectorProps) {
  // This component could contain more sophisticated diff algorithms
  // For now, it's mainly used for the interface

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Detection Engine</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Original Length:</span>
            <Badge variant="outline">{originalText.length} chars</Badge>
          </div>
          <div className="flex justify-between">
            <span>Current Length:</span>
            <Badge variant="outline">{currentText.length} chars</Badge>
          </div>
          <div className="flex justify-between">
            <span>Difference:</span>
            <Badge variant={currentText.length > originalText.length ? "default" : "destructive"}>
              {currentText.length - originalText.length > 0 ? "+" : ""}
              {currentText.length - originalText.length} chars
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
