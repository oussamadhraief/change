import { arabicLineUtils } from './lib/line-based-diff'

// Test with the provided example
const originalText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ"

const modifiedText = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ\nالرَّحْمَٰنِ الرَّحِيمِ "

console.log("=== ORIGINAL CHARACTER-BASED APPROACH ===")
console.log("Original text:")
console.log(originalText)
console.log("\nModified text:")
console.log(modifiedText)
console.log("\nCharacter-by-character comparison would show 59 changes!")

console.log("\n=== NEW LINE-BASED APPROACH ===")

// Test the optimized line-based diff
const result = arabicLineUtils.detectLineBasedChanges(originalText, modifiedText)

console.log("Line Changes:")
result.lineChanges.forEach((change, index) => {
  console.log(`${index + 1}. Line ${change.lineNumber}: ${change.type.toUpperCase()}`)
  if (change.type === 'modify') {
    console.log(`   Original: "${change.originalLine}"`)
    console.log(`   Modified: "${change.modifiedLine}"`)
  } else if (change.type === 'insert') {
    console.log(`   Inserted: "${change.content}"`)
  } else if (change.type === 'delete') {
    console.log(`   Deleted: "${change.content}"`)
  }
  console.log()
})

console.log("Change Summary:")
console.log(`- Total line changes: ${result.changeSummary.totalLineChanges}`)
console.log(`- Modified lines: ${result.changeSummary.modifiedLines}`)
console.log(`- Inserted lines: ${result.changeSummary.insertedLines}`)
console.log(`- Deleted lines: ${result.changeSummary.deletedLines}`)
console.log(`- Character changes: ${result.changeSummary.characterChanges.totalCharChanges}`)
console.log(`- Tashkeel changes: ${result.changeSummary.characterChanges.tashkeelChanges}`)
console.log(`- Main character changes: ${result.changeSummary.characterChanges.mainCharChanges}`)

console.log("\n=== COMPARISON ===")
console.log(`Old approach: 59 individual character changes`)
console.log(`New approach: ${result.changeSummary.totalLineChanges} line changes`)
console.log(`Reduction: ${Math.round((1 - result.changeSummary.totalLineChanges / 59) * 100)}% fewer changes to track!`)

// Test with advanced algorithm
console.log("\n=== ADVANCED LCS-BASED APPROACH ===")
const advancedResult = arabicLineUtils.detectAdvancedLineChanges(originalText, modifiedText)

console.log("Advanced Line Changes:")
advancedResult.lineChanges.forEach((change, index) => {
  console.log(`${index + 1}. Line ${change.lineNumber}: ${change.type.toUpperCase()}`)
  if (change.type === 'modify') {
    console.log(`   Original: "${change.originalLine}"`)
    console.log(`   Modified: "${change.modifiedLine}"`)
  } else if (change.type === 'insert') {
    console.log(`   Inserted: "${change.content}"`)
  } else if (change.type === 'delete') {
    console.log(`   Deleted: "${change.content}"`)
  }
  console.log()
})

console.log("Advanced Change Summary:")
console.log(`- Total line changes: ${advancedResult.changeSummary.totalLineChanges}`)
console.log(`- Modified lines: ${advancedResult.changeSummary.modifiedLines}`)
console.log(`- Inserted lines: ${advancedResult.changeSummary.insertedLines}`)
console.log(`- Deleted lines: ${advancedResult.changeSummary.deletedLines}`)
