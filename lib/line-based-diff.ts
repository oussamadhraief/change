import { v4 as uuidv4 } from "uuid"

export interface LineChange {
  type: 'insert' | 'delete' | 'modify'
  lineNumber: number
  content: string
}

export interface OptimizedChangeSummary {
  totalLineChanges: number
  insertedLines: number
  deletedLines: number
  modifiedLines: number
  characterChanges: {
    tashkeelChanges: number
    mainCharChanges: number
    totalCharChanges: number
  }
}

export interface OptimizedChangeRequest {
  id: string
  pageId: string
  bookId: string
  userId: string
  timestamp: string
  status: "pending" | "approved" | "declined"
  lineChanges: LineChange[]
  changeSummary: OptimizedChangeSummary
}

// Arabic text utilities for line-based processing
export const arabicLineUtils = {
  tashkeel: [
    '\u064B', '\u064C', '\u064D', '\u064E', '\u064F', '\u0650', '\u0651', '\u0652', '\u0653', '\u0654', '\u0655', '\u0670',
  ],

  isTashkeel: (char: string) => arabicLineUtils.tashkeel.includes(char),
  
  isArabicMain: (char: string) => {
    const arabicRange = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
    return arabicRange.test(char) && !arabicLineUtils.isTashkeel(char)
  },

  // Count character-level changes within a line for detailed analysis
  analyzeLineChanges: (originalLine: string, modifiedLine: string) => {
    let tashkeelChanges = 0
    let mainCharChanges = 0
    let totalCharChanges = 0

    const maxLength = Math.max(originalLine.length, modifiedLine.length)
    
    for (let i = 0; i < maxLength; i++) {
      const originalChar = originalLine[i] || ''
      const modifiedChar = modifiedLine[i] || ''
      
      if (originalChar !== modifiedChar) {
        totalCharChanges++
        
        // Determine if this is a tashkeel or main character change
        if (arabicLineUtils.isTashkeel(originalChar) || arabicLineUtils.isTashkeel(modifiedChar)) {
          tashkeelChanges++
        } else if (arabicLineUtils.isArabicMain(originalChar) || arabicLineUtils.isArabicMain(modifiedChar)) {
          mainCharChanges++
        }
      }
    }

    return { tashkeelChanges, mainCharChanges, totalCharChanges }
  },

  // Main function to detect line-based changes
  detectLineBasedChanges: (originalText: string, modifiedText: string): OptimizedChangeRequest => {
    const originalLines = originalText.split('\n')
    const modifiedLines = modifiedText.split('\n')
    const lineChanges: LineChange[] = []
    
    let totalTashkeelChanges = 0
    let totalMainCharChanges = 0
    let totalCharChanges = 0

    // Use a simple diff algorithm to detect line changes
    const maxLines = Math.max(originalLines.length, modifiedLines.length)
    
    // Track which lines have been processed
    const processedOriginal = new Set<number>()
    const processedModified = new Set<number>()

    // First pass: find exact matches and modifications
    for (let i = 0; i < Math.min(originalLines.length, modifiedLines.length); i++) {
      const originalLine = originalLines[i]
      const modifiedLine = modifiedLines[i]

      if (originalLine === modifiedLine) {
        // Lines are identical, no change
        processedOriginal.add(i)
        processedModified.add(i)
      } else {
        // Lines are different, this is a modification
        const charAnalysis = arabicLineUtils.analyzeLineChanges(originalLine, modifiedLine)
        
        totalTashkeelChanges += charAnalysis.tashkeelChanges
        totalMainCharChanges += charAnalysis.mainCharChanges
        totalCharChanges += charAnalysis.totalCharChanges

        lineChanges.push({
          type: 'modify',
          lineNumber: i + 1,
          content: modifiedLine
        })
        
        processedOriginal.add(i)
        processedModified.add(i)
      }
    }

    // Second pass: handle insertions (more modified lines than original)
    if (modifiedLines.length > originalLines.length) {
      for (let i = originalLines.length; i < modifiedLines.length; i++) {
        const modifiedLine = modifiedLines[i]
        
        // Count characters in inserted lines
        for (const char of modifiedLine) {
          totalCharChanges++
          if (arabicLineUtils.isTashkeel(char)) {
            totalTashkeelChanges++
          } else if (arabicLineUtils.isArabicMain(char)) {
            totalMainCharChanges++
          }
        }

        lineChanges.push({
          type: 'insert',
          lineNumber: i + 1,
          content: modifiedLine
        })
      }
    }

    // Third pass: handle deletions (more original lines than modified)
    if (originalLines.length > modifiedLines.length) {
      for (let i = modifiedLines.length; i < originalLines.length; i++) {
        const originalLine = originalLines[i]
        
        // Count characters in deleted lines
        for (const char of originalLine) {
          totalCharChanges++
          if (arabicLineUtils.isTashkeel(char)) {
            totalTashkeelChanges++
          } else if (arabicLineUtils.isArabicMain(char)) {
            totalMainCharChanges++
          }
        }

        lineChanges.push({
          type: 'delete',
          lineNumber: i + 1,
          content: originalLine
        })
      }
    }

    const changeSummary: OptimizedChangeSummary = {
      totalLineChanges: lineChanges.length,
      insertedLines: lineChanges.filter(c => c.type === 'insert').length,
      deletedLines: lineChanges.filter(c => c.type === 'delete').length,
      modifiedLines: lineChanges.filter(c => c.type === 'modify').length,
      characterChanges: {
        tashkeelChanges: totalTashkeelChanges,
        mainCharChanges: totalMainCharChanges,
        totalCharChanges: totalCharChanges
      }
    }

    return {
      id: uuidv4(),
      pageId: '',
      bookId: '',
      userId: '',
      timestamp: new Date().toISOString(),
      status: "pending",
      lineChanges,
      changeSummary
    }
  },

  // Advanced diff algorithm using Longest Common Subsequence (LCS)
  detectAdvancedLineChanges: (originalText: string, modifiedText: string): OptimizedChangeRequest => {
    const originalLines = originalText.split('\n')
    const modifiedLines = modifiedText.split('\n')
    
    // Use LCS to find the optimal diff
    const lcs = arabicLineUtils.longestCommonSubsequence(originalLines, modifiedLines)
    const lineChanges: LineChange[] = []
    
    let totalTashkeelChanges = 0
    let totalMainCharChanges = 0
    let totalCharChanges = 0

    let originalIndex = 0
    let modifiedIndex = 0
    let lineNumber = 1

    while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
      const originalLine = originalLines[originalIndex]
      const modifiedLine = modifiedLines[modifiedIndex]

      if (originalIndex < originalLines.length && modifiedIndex < modifiedLines.length) {
        if (originalLine === modifiedLine) {
          // Lines match, move both pointers
          originalIndex++
          modifiedIndex++
          lineNumber++
        } else {
          // Check if this is a modification or insertion/deletion
          const nextOriginalInModified = modifiedLines.indexOf(originalLine, modifiedIndex)
          const nextModifiedInOriginal = originalLines.indexOf(modifiedLine, originalIndex)

          if (nextOriginalInModified === -1 && nextModifiedInOriginal === -1) {
            // This is a modification
            const charAnalysis = arabicLineUtils.analyzeLineChanges(originalLine, modifiedLine)
            
            totalTashkeelChanges += charAnalysis.tashkeelChanges
            totalMainCharChanges += charAnalysis.mainCharChanges
            totalCharChanges += charAnalysis.totalCharChanges

            lineChanges.push({
              type: 'modify',
              lineNumber,
              content: modifiedLine
            })
            
            originalIndex++
            modifiedIndex++
            lineNumber++
          } else if (nextOriginalInModified > nextModifiedInOriginal || nextModifiedInOriginal === -1) {
            // This is an insertion
            for (const char of modifiedLine) {
              totalCharChanges++
              if (arabicLineUtils.isTashkeel(char)) {
                totalTashkeelChanges++
              } else if (arabicLineUtils.isArabicMain(char)) {
                totalMainCharChanges++
              }
            }

            lineChanges.push({
              type: 'insert',
              lineNumber,
              content: modifiedLine
            })
            
            modifiedIndex++
            lineNumber++
          } else {
            // This is a deletion
            for (const char of originalLine) {
              totalCharChanges++
              if (arabicLineUtils.isTashkeel(char)) {
                totalTashkeelChanges++
              } else if (arabicLineUtils.isArabicMain(char)) {
                totalMainCharChanges++
              }
            }

            lineChanges.push({
              type: 'delete',
              lineNumber,
              content: originalLine
            })
            
            originalIndex++
            lineNumber++
          }
        }
      } else if (originalIndex < originalLines.length) {
        // Remaining lines are deletions
        const originalLine = originalLines[originalIndex]
        
        for (const char of originalLine) {
          totalCharChanges++
          if (arabicLineUtils.isTashkeel(char)) {
            totalTashkeelChanges++
          } else if (arabicLineUtils.isArabicMain(char)) {
            totalMainCharChanges++
          }
        }

        lineChanges.push({
          type: 'delete',
          lineNumber,
          content: originalLine
        })
        
        originalIndex++
        lineNumber++
      } else {
        // Remaining lines are insertions
        const modifiedLine = modifiedLines[modifiedIndex]
        
        for (const char of modifiedLine) {
          totalCharChanges++
          if (arabicLineUtils.isTashkeel(char)) {
            totalTashkeelChanges++
          } else if (arabicLineUtils.isArabicMain(char)) {
            totalMainCharChanges++
          }
        }

        lineChanges.push({
          type: 'insert',
          lineNumber,
          content: modifiedLine
        })
        
        modifiedIndex++
        lineNumber++
      }
    }

    const changeSummary: OptimizedChangeSummary = {
      totalLineChanges: lineChanges.length,
      insertedLines: lineChanges.filter(c => c.type === 'insert').length,
      deletedLines: lineChanges.filter(c => c.type === 'delete').length,
      modifiedLines: lineChanges.filter(c => c.type === 'modify').length,
      characterChanges: {
        tashkeelChanges: totalTashkeelChanges,
        mainCharChanges: totalMainCharChanges,
        totalCharChanges: totalCharChanges
      }
    }

    return {
      id: uuidv4(),
      pageId: '',
      bookId: '',
      userId: '',
      timestamp: new Date().toISOString(),
      status: "pending",
      lineChanges,
      changeSummary
    }
  },

  // Helper function for LCS algorithm
  applyLineChanges: (originalText: string, changes: LineChange[]): string => {
    const originalLines = originalText.split('\n');
    const newLines = [...originalLines];

    // Apply deletions first, from bottom to top to not mess up line indices
    const deletions = changes.filter(c => c.type === 'delete').sort((a, b) => b.lineNumber - a.lineNumber);
    for (const change of deletions) {
      newLines.splice(change.lineNumber - 1, 1);
    }

    // Apply modifications
    const modifications = changes.filter(c => c.type === 'modify');
    for (const change of modifications) {
      const deletionIndex = deletions.findIndex(d => d.lineNumber === change.lineNumber);
      if (deletionIndex === -1) { // only modify if not deleted
        const offset = deletions.filter(d => d.lineNumber < change.lineNumber).length;
        newLines[change.lineNumber - 1 - offset] = change.content;
      }
    }

    // Apply insertions, from bottom to top
    const insertions = changes.filter(c => c.type === 'insert').sort((a, b) => b.lineNumber - a.lineNumber);
    for (const change of insertions) {
        const offset = deletions.filter(d => d.lineNumber < change.lineNumber).length;
        newLines.splice(change.lineNumber - 1 - offset, 0, change.content);
    }

    return newLines.join('\n');
  },

  longestCommonSubsequence: (arr1: string[], arr2: string[]): number[][] => {
    const m = arr1.length
    const n = arr2.length
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        }
      }
    }

    return dp
  }
}
