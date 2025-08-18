"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CharNode } from "./change-approval-engine"

interface ChangeHistoryProps {
  chars: CharNode[]
}

export function ChangeHistory({ chars }: ChangeHistoryProps) {
  const allChanges = chars
    .flatMap((char) =>
      char.changeHistory.map((entry) => ({
        ...entry,
        charPosition: char.position,
        charId: char.id,
      })),
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
      </CardHeader>
      <CardContent>
        {allChanges.length === 0 ? (
          <div className="text-slate-500 text-center py-4">No changes have been approved yet</div>
        ) : (
          <div className="space-y-3">
            {allChanges.map((change) => (
              <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      "{change.fromValue}" → "{change.toValue}"
                    </span>
                    <Badge variant="outline">Position {change.charPosition}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Approved by {change.user} • {new Date(change.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
