# Advanced Arabic Text Editing System

## Overview

This system is an advanced solution for editing Arabic texts with full support for Tashkeel (diacritics) and chained approvals. It is specifically designed for Arabic books that require high precision in editing and review.

## Key Features

### 🎯 Character-Level Accuracy
- Track each character separately with a unique ID
- Full support for Tashkeel (vowels) as separate elements
- Track the exact positions of each change

### 🔄 Chained Approval System
- Possibility of multiple suggestions for the same character
- Approve changes sequentially
- Automatic update of pending suggestions based on approved changes

### 📝 Supported Change Types
- **Tashkeel**: Add or modify diacritics (Fatha, Kasra, Damma, etc.)
- **Main Characters**: Change Arabic letters
- **Insertion**: Add new texts
- **Deletion**: Remove existing texts

### 🌐 Full Arabic Language Support
- Right-to-left (RTL) text direction
- High-quality Arabic fonts
- Special handling for connected words

## How to Use

### 1. Load Page
- Enter the Page ID
- Enter the username
- Click "Load Page"

### 2. Edit Text
- Click on any character to select it
- Add new suggestions through the side control panel
- You can suggest changes for Tashkeel or main characters

### 3. Approve Changes
- Click on any character to see suggestions
- Press ✓ to approve or ✗ to reject
- Changes will be approved sequentially

### 4. Submit Change Request
- Click "Submit Change Request"
- An object containing all changes will be created
- This object can be sent to the backend server

## Technical Architecture

### Main Components

#### `ArabicChangeEngine`
- The main engine of the system
- Manages the state of the text and suggestions
- Handles server API interactions

#### `ArabicTextRenderer`
- Renders Arabic text with RTL support
- Shows visual indicators for changes
- Supports user interaction

#### `ArabicChainVisualizer`
- Displays change chains
- Illustrates how suggestions are linked
- Helps in understanding the approval flow

#### `ArabicDiffViewer`
- Displays differences between the original and modified text
- Color coding for changes
- Statistical summary of changes

### Data Structure

#### `ArabicCharNode`
```typescript
interface ArabicCharNode {
  id: string;                    // Unique ID for the character
  position: string;             // Position (1, 1.1, 1.1.1)
  value: string;                // Current value
  originalValue: string;        // Original value
  type: "main" | "tashkeel" | "space" | "punctuation";
  suggestions: ArabicSuggestion[];
  changeHistory: ArabicChangeHistoryEntry[];
  lineNumber: number;           // Line number
  wordNumber: number;           // Word number
  sentenceNumber: number;       // Sentence number
}
```

#### `ChangeRequestPayload`
```typescript
interface ChangeRequestPayload {
  pageId: string;
  bookId: string;
  userId: string;
  timestamp: string;
  changes: ArabicChangeRequest[];
  originalText: string;
  modifiedText: string;
  changeSummary: {
    totalChanges: number;
    tashkeelChanges: number;
    mainCharChanges: number;
    insertions: number;
    deletions: number;
  };
}
```

## Installation and Running

### Requirements
- Node.js 18+
- pnpm (or npm)

### Installation
```bash
# Clone the project
git clone <repository-url>
cd change

# Install dependencies
pnpm install

# Run the local server
pnpm dev
```

### Access
- Home page: `http://localhost:3000`
- Create Changes page: `http://localhost:3000/create-changes`
- Demo: `http://localhost:3000/demo`

## Customization

### Adding New Arabic Fonts
```css
@import url('https://fonts.googleapis.com/css2?family=Your+Arabic+Font:wght@400;500;600;700&display=swap');

.font-arabic {
  font-family: 'Your Arabic Font', serif;
}
```

### Modifying Change Types
You can add new change types in `arabicUtils` and update the relevant interfaces.

### Linking Server API
Replace `mockApi` in `arabic-change-engine.tsx` with actual API calls.

## Use Cases

### Religious Books
- Editing the Holy Quran
- Reviewing Hadiths
- Correcting Islamic texts

### Literary Books
- Reviewing Arabic poetry
- Editing literary texts
- Correcting stories and novels

### Historical Documents
- Editing ancient manuscripts
- Reviewing historical texts
- Preserving Arab heritage

## Contribution

We welcome contributions! Please:
1. Fork the project
2. Create a new feature branch
3. Submit a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please:
- Open an Issue on GitHub
- Contact the development team
- Review the documentation

---

**Note**: This system is designed to work in the browser and does not require data storage on a backend server. All operations are performed on the front end to ensure speed and security.
