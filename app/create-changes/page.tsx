"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Edit3, Save, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import * as Diff from 'diff';

// Types for change tracking
interface BookChange {
  id: string;
  field: string;
  originalValue: string;
  newValue: string;
  timestamp: string;
  userId: string;
}

interface PageChange {
  id: string;
  position: number;
  originalText: string;
  newText: string;
  timestamp: string;
  userId: string;
}

// Mock data
const mockBook = {
  title: "فضائل مكة والسكن فيها",
  author: "مكة", 
  publisher: "فضائل مكة",
  description: "البصري [الحسن البصري]",
  pageCount: 40,
  coverImage: "https://via.placeholder.com/150?text=Book+Cover",
  chapters: ["الفصل الأول", "الفصل الثاني", "الفصل الثالث"],
  currentPageContent: `أحيى سبعين ألف ليلة، وكان كعبادة كل مؤمن ومؤمنة، وكأنما حج أربعين حجة مبرورة متقبلة، ومن صل مُقال باب الكفّة أربع رُكّعات فكأنما عيد الله تعالى كعبادة جميع خلفه أصهاfa مضاعفة. وأمته الله تعالى نُؤم القباعة من الفَرْغ الأكبر، وأمر الله عز وجل جبريل وميكائيل وخيم الفَلاكتة عليهم الشام أن يُشفِفُوا رأة إلى نُؤم القباعة.

فاغتنم يا أخي هذا الأخير كله، وإياك أن يفوتك، والسلام عليكم ورحمة الله وبركاته.

تمت الرسالة بحمد الله تعالى وحسن توفيقه، ووافق الفَراغ منها ليلة الإثنين تاسع عشر شوال من شهور سنة أربع وخمسين وألف، وألخُذ لله وحده وصل على لا نبي بعد به.

رسول الله وما حسبت الحِجِم؟ قارَر
وروي عن النبي - صلى الله عليه وسلم - أن من حج مِن مِهْمٍ با رسول الله؟ قال: القراء.
كالقمر ليلة بدر، ويشفع كل واحد منهم في سبعين ألف رجل. فقيل: من مِهْمٍ با رسول الله؟ قال: القراء.
ومن مات في حرم الله تعالى أو حرم رسول الله - صلى الله عليه وسلم أو مات بين مكة والمدينة حاجا أو معتمرا لله يوم القيامة من الآمنين. إلا وأن التضاعع من ماء رمز برآءة من الشافاق.
ومن صل في الحجر ركعتين ناحية الركن الشامي فكأنه`,
};

// Inline editing component for book fields
const InlineEditField = ({ 
  label, 
  value, 
  onSave, 
  fieldName 
}: { 
  label: string; 
  value: string; 
  onSave: (newValue: string) => void;
  fieldName: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col space-y-2">
      <Label className="text-right text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative group">
        {!isEditing ? (
          <div 
            className="w-full h-10 px-3 py-2 text-right border border-gray-300 rounded-md bg-white cursor-pointer hover:bg-gray-50 flex items-center justify-between"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>{value}</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="flex-1 text-right"
              style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CreateChangesPage() {
  const [bookData, setBookData] = useState(mockBook);
  const [originalBookData] = useState(mockBook);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookChanges, setBookChanges] = useState<BookChange[]>([]);
  const [pageChanges, setPageChanges] = useState<PageChange[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rich text editor for page content
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: bookData.currentPageContent,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      handlePageContentChange(newContent);
    },
  });

  // Handle book field changes
  const handleBookFieldChange = (field: keyof typeof bookData, newValue: string) => {
    const originalValue = originalBookData[field] as string;
    
    if (originalValue !== newValue) {
      const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const change: BookChange = {
        id: changeId,
        field,
        originalValue,
        newValue,
        timestamp: new Date().toISOString(),
        userId: 'current_user'
      };

      setBookChanges(prev => {
        const filtered = prev.filter(c => c.field !== field);
        return [...filtered, change];
      });
    } else {
      setBookChanges(prev => prev.filter(c => c.field !== field));
    }

    setBookData(prev => ({ ...prev, [field]: newValue }));
  };

  // Handle page content changes
  const handlePageContentChange = (newContent: string) => {
    const plainNewContent = newContent.replace(/<[^>]*>/g, ''); // Strip HTML for comparison
    const plainOriginalContent = originalBookData.currentPageContent;
    
    if (plainNewContent !== plainOriginalContent) {
      const changes = Diff.diffWords(plainOriginalContent, plainNewContent);
      const pageChangesList: PageChange[] = [];
      let position = 0;

      changes.forEach((part, index) => {
        if (part.added || part.removed) {
          const changeId = `page_change_${Date.now()}_${index}`;
          pageChangesList.push({
            id: changeId,
            position,
            originalText: part.removed ? part.value : '',
            newText: part.added ? part.value : '',
            timestamp: new Date().toISOString(),
            userId: 'current_user'
          });
        }
        if (!part.removed) {
          position += part.value.length;
        }
      });

      setPageChanges(pageChangesList);
    }

    setBookData(prev => ({ ...prev, currentPageContent: plainNewContent }));
  };

  // Generate submission data
  const generateSubmissionData = () => {
    const bookCorrectionData = {
      bookCorrectionName: [{ language: "ar", value: bookData.title }],
      sanad: [{ language: "ar", value: bookData.description }],
      description: [{ language: "ar", value: bookData.description }],
      writer: [{ language: "ar", value: bookData.author }],
      availableLanguages: ["ar"],
      bookCorrectionFiles: ["string"],
      validationStatus: "invalidated" as const,
      createdby: "current_user",
      verifiedBy: "",
      linkedtoBookID: "book_123",
      notes: `Changes made: ${bookChanges.length} book field changes, ${pageChanges.length} page content changes`
    };

    const pageCorrectionData = {
      bookCorrectionId: "correction_123",
      bookCorrectionPageNumber: currentPage,
      fehraseName: [{ language: "ar", value: `الصفحة ${currentPage}` }],
      content: [{ language: "ar", value: bookData.currentPageContent }],
      createdby: "current_user",
      verifiedBy: "",
      linkedtoBookPageID: `page_${currentPage}`,
      notes: `Page content changes: ${pageChanges.length} modifications`
    };

    return { bookCorrectionData, pageCorrectionData };
  };

  // Submit changes
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const submissionData = generateSubmissionData();
    
    console.log('Submitting changes:', submissionData);
    // Here you would send the data to your API
    
    setTimeout(() => {
      alert('Changes submitted successfully!');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Book Info Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Book Metadata */}
        <div className="flex-1">
          <Card className="border border-gray-200 bg-white shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-800">الكتاب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InlineEditField
                label="الكتاب"
                value={bookData.title}
                onSave={(newValue) => handleBookFieldChange("title", newValue)}
                fieldName="title"
              />
              
              <InlineEditField
                label="المؤلف"
                value={bookData.author}
                onSave={(newValue) => handleBookFieldChange("author", newValue)}
                fieldName="author"
              />
              
              <InlineEditField
                label="الناشر"
                value={bookData.publisher}
                onSave={(newValue) => handleBookFieldChange("publisher", newValue)}
                fieldName="publisher"
              />
              
              <InlineEditField
                label="عدد الصفحات"
                value={bookData.pageCount.toString()}
                onSave={(newValue) => handleBookFieldChange("pageCount", (parseInt(newValue) || 0).toString())}
                fieldName="pageCount"
              />
              
              {/* Changes Summary */}
              {(bookChanges.length > 0 || pageChanges.length > 0) && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">التغييرات المقترحة</h4>
                  <div className="text-xs text-blue-600">
                    <p>تغييرات الكتاب: {bookChanges.length}</p>
                    <p>تغييرات المحتوى: {pageChanges.length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Cover Image */}
        <div className="flex-shrink-0 w-48">
          <div className="relative">
            <img
              src={mockBook.coverImage}
              alt="Book Cover"
              className="w-full h-auto object-cover rounded-lg border border-gray-300"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2 text-center">
              فضائل مكة - الحسن<br />البصري [الحسن البصري]
            </div>
          </div>
        </div>
      </div>

      {/* Page Content & Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          <Card className="border border-gray-200 bg-white shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-800">محتوى الصفحة</CardTitle>
              <p className="text-sm text-gray-600">انقر في أي مكان لتحرير النص</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative min-h-[400px] max-w-3xl mx-auto">
                <div className="prose prose-sm max-w-none text-right" dir="rtl">
                  <EditorContent 
                    editor={editor}
                    className="min-h-[350px] p-4 border border-gray-200 rounded-lg focus-within:border-green-500 transition-colors"
                    style={{ 
                      fontFamily: 'Arial, sans-serif', 
                      lineHeight: '1.8',
                      fontSize: '14px'
                    }}
                  />
                </div>
                
                {/* Editor Toolbar */}
                {editor && (
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant={editor.isActive('bold') ? 'default' : 'outline'}
                      onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                      <strong>ب</strong>
                    </Button>
                    <Button
                      size="sm"
                      variant={editor.isActive('italic') ? 'default' : 'outline'}
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                      <em>م</em>
                    </Button>
                    <Button
                      size="sm"
                      variant={editor.isActive('highlight') ? 'default' : 'outline'}
                      onClick={() => editor.chain().focus().toggleHighlight().run()}
                    >
                      تمييز
                    </Button>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 text-gray-600 hover:text-gray-800"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {[1, 2, 3, 4].map((p) => (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 text-sm ${
                      p === currentPage ? "bg-gray-800 text-white" : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage(Math.min(4, currentPage + 1))}
                  disabled={currentPage === 4}
                  className="w-8 h-8 text-gray-600 hover:text-gray-800"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Live Changes */}
        <div className="w-full lg:w-80">
          <Card className="border border-gray-200 bg-white shadow-sm rounded-lg">
            <CardHeader>
              <CardTitle className="text-center text-sm font-medium text-gray-800">التغييرات المباشرة</CardTitle>
              <div className="flex justify-end items-center">
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {bookChanges.length + pageChanges.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-96 overflow-y-auto">
              {/* Book Changes */}
              {bookChanges.map((change) => (
                <div key={change.id} className="border-r-4 border-blue-500 pr-3 py-2 bg-blue-50 rounded-md">
                  <div className="text-xs font-medium text-blue-800 mb-1">
                    تغيير في: {change.field === 'title' ? 'العنوان' : 
                              change.field === 'author' ? 'المؤلف' : 
                              change.field === 'publisher' ? 'الناشر' : 'عدد الصفحات'}
                  </div>
                  <div className="text-xs">
                    <p className="text-red-600 line-through">{change.originalValue}</p>
                    <p className="text-green-600">{change.newValue}</p>
                  </div>
                </div>
              ))}

              {/* Page Changes */}
              {pageChanges.map((change) => (
                <div key={change.id} className="border-r-4 border-green-500 pr-3 py-2 bg-green-50 rounded-md">
                  <div className="text-xs font-medium text-green-800 mb-1">تغيير في المحتوى</div>
                  <div className="text-xs">
                    {change.originalText && (
                      <p className="text-red-600 line-through">{change.originalText.substring(0, 50)}...</p>
                    )}
                    {change.newText && (
                      <p className="text-green-600">{change.newText.substring(0, 50)}...</p>
                    )}
                  </div>
                </div>
              ))}

              {(bookChanges.length === 0 && pageChanges.length === 0) && (
                <div className="text-center text-gray-500 py-8 text-sm">
                  لم يتم إجراء أي تغييرات بعد
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-6">
        <div className="text-sm text-gray-600">
          إجمالي التغييرات: {bookChanges.length + pageChanges.length}
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="text-sm font-medium border-gray-300 hover:bg-gray-100"
            onClick={() => window.history.back()}
          >
            إلغاء
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2"
            onClick={handleSubmit}
            disabled={isSubmitting || (bookChanges.length === 0 && pageChanges.length === 0)}
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </Button>
        </div>
      </div>
    </div>
  );
}