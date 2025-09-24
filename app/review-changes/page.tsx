"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import { Check, X, Eye, Clock, CheckCircle, User, FileText, Hash, Filter } from "lucide-react";
import * as Diff from 'diff';

// Types for change tracking
interface BookCorrection {
  id: string;
  bookCorrectionName: { language: string; value: string }[];
  sanad: { language: string; value: string }[];
  description: { language: string; value: string }[];
  writer: { language: string; value: string }[];
  availableLanguages: string[];
  bookCorrectionFiles: string[];
  validationStatus: "invalidated" | "validated" | "pending";
  createdby: string;
  verifiedBy: string;
  linkedtoBookID: string;
  notes: string;
  timestamp: string;
  changes: DetailedChange[];
}

interface PageCorrection {
  id: string;
  bookCorrectionId: string;
  bookCorrectionPageNumber: number;
  fehraseName: { language: string; value: string }[];
  content: { language: string; value: string }[];
  createdby: string;
  verifiedBy: string;
  linkedtoBookPageID: string;
  notes: string;
  timestamp: string;
  changes: DetailedChange[];
}

interface DetailedChange {
  id: string;
  type: 'word' | 'sentence' | 'paragraph';
  position: { start: number; end: number };
  originalText: string;
  proposedText: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  category: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'content';
  submittedBy: string;
  timestamp: string;
  relatedChanges?: string[]; // IDs of related changes on same text
}

// Mock data for demonstration
const mockBookCorrections: BookCorrection[] = [
  {
    id: "book_correction_1",
    bookCorrectionName: [{ language: "ar", value: "فضائل مكة والسكن فيها - مُصحح" }],
    sanad: [{ language: "ar", value: "البصري [الحسن البصري]" }],
    description: [{ language: "ar", value: "كتاب في فضائل مكة المكرمة" }],
    writer: [{ language: "ar", value: "الحسن البصري" }],
    availableLanguages: ["ar"],
    bookCorrectionFiles: ["file1.pdf"],
    validationStatus: "pending",
    createdby: "user123",
    verifiedBy: "",
    linkedtoBookID: "book_original_1",
    notes: "تصحيحات متعددة على العنوان والمؤلف",
    timestamp: "2024-01-15T10:30:00Z",
    changes: [
      {
        id: "change_1",
        type: 'word',
        position: { start: 0, end: 12 },
        originalText: "فضائل مكة",
        proposedText: "فضائل مكة المكرمة",
        status: 'pending',
        confidence: 0.95,
        category: 'content',
        submittedBy: "user123",
        timestamp: "2024-01-15T10:30:00Z",
        relatedChanges: ["change_2"]
      },
      {
        id: "change_2", 
        type: 'word',
        position: { start: 0, end: 12 },
        originalText: "فضائل مكة",
        proposedText: "فضائل مكة الشريفة",
        status: 'pending',
        confidence: 0.88,
        category: 'style',
        submittedBy: "user456",
        timestamp: "2024-01-15T11:15:00Z",
        relatedChanges: ["change_1"]
      }
    ]
  }
];

const mockPageCorrections: PageCorrection[] = [
  {
    id: "page_correction_1",
    bookCorrectionId: "book_correction_1",
    bookCorrectionPageNumber: 1,
    fehraseName: [{ language: "ar", value: "الصفحة الأولى" }],
    content: [{ language: "ar", value: "أحيى سبعين ألف ليلة، وكان كعبادة كل مؤمن ومؤمنة، وكأنما حج أربعين حجة مبرورة متقبلة..." }],
    createdby: "user123",
    verifiedBy: "",
    linkedtoBookPageID: "page_1",
    notes: "تصحيحات نحوية وإملائية",
    timestamp: "2024-01-15T10:45:00Z",
    changes: [
      {
        id: "page_change_1",
        type: 'word',
        position: { start: 45, end: 52 },
        originalText: "وكان",
        proposedText: "وكانت",
        status: 'pending',
        confidence: 0.92,
        category: 'grammar',
        submittedBy: "user123",
        timestamp: "2024-01-15T10:45:00Z"
      },
      {
        id: "page_change_2",
        type: 'word', 
        position: { start: 45, end: 52 },
        originalText: "وكان",
        proposedText: "وكان قد",
        status: 'pending',
        confidence: 0.78,
        category: 'style',
        submittedBy: "user789",
        timestamp: "2024-01-15T11:30:00Z"
      },
      {
        id: "page_change_3",
        type: 'sentence',
        position: { start: 20, end: 80 },
        originalText: "أحيى سبعين ألف ليلة، وكان كعبادة كل مؤمن ومؤمنة",
        proposedText: "أحيا سبعين ألف ليلة، وكان كعبادة كل مؤمن ومؤمنة",
        status: 'pending',
        confidence: 0.96,
        category: 'spelling',
        submittedBy: "user456",
        timestamp: "2024-01-15T12:00:00Z"
      }
    ]
  }
];

// Tooltip component for change details
const ChangeTooltip = ({ 
  change, 
  onApprove, 
  onReject, 
  relatedChanges = [] 
}: { 
  change: DetailedChange;
  onApprove: (changeId: string) => void;
  onReject: (changeId: string) => void;
  relatedChanges?: DetailedChange[];
}) => {
  return (
    <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-80 max-w-96" dir="rtl">
      <div className="space-y-3">
        {/* Change Header */}
        <div className="flex justify-between items-start">
          <div>
            <Badge variant={change.category === 'grammar' ? 'default' : 
                          change.category === 'spelling' ? 'destructive' : 
                          change.category === 'style' ? 'secondary' : 'outline'}>
              {change.category === 'grammar' ? 'نحو' :
               change.category === 'spelling' ? 'إملاء' :
               change.category === 'style' ? 'أسلوب' :
               change.category === 'punctuation' ? 'ترقيم' : 'محتوى'}
            </Badge>
            <div className="text-xs text-gray-500 mt-1">
              الثقة: {Math.round(change.confidence * 100)}%
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(change.timestamp).toLocaleDateString('ar')}
          </div>
        </div>

        {/* Change Content */}
        <div className="space-y-2">
          <div>
            <div className="text-xs font-medium text-gray-700 mb-1">النص الأصلي:</div>
            <div className="text-sm bg-red-50 p-2 rounded border-r-2 border-red-300">
              {change.originalText}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700 mb-1">النص المقترح:</div>
            <div className="text-sm bg-green-50 p-2 rounded border-r-2 border-green-300">
              {change.proposedText}
            </div>
          </div>
        </div>

        {/* Related Changes */}
        {relatedChanges.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">
              اقتراحات أخرى لنفس النص ({relatedChanges.length}):
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {relatedChanges.map((relatedChange) => (
                <div key={relatedChange.id} className="text-xs bg-blue-50 p-2 rounded">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-800">{relatedChange.proposedText}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(relatedChange.confidence * 100)}%
                    </Badge>
                  </div>
                  <div className="text-blue-600 text-xs mt-1">
                    بواسطة: {relatedChange.submittedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submitter Info */}
        <div className="text-xs text-gray-600 border-t pt-2">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>المُرسل: {change.submittedBy}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-600 hover:bg-red-50"
            onClick={() => onReject(change.id)}
          >
            <X className="w-3 h-3 ml-1" />
            رفض
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(change.id)}
          >
            <Check className="w-3 h-3 ml-1" />
            موافقة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ReviewChangesPage() {
  const [bookCorrections, setBookCorrections] = useState(mockBookCorrections);
  const [pageCorrections, setPageCorrections] = useState(mockPageCorrections);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [hoveredChange, setHoveredChange] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Handle change approval
  const handleApproveChange = (changeId: string, type: 'book' | 'page') => {
    if (type === 'book') {
      setBookCorrections(prev => prev.map(correction => ({
        ...correction,
        changes: correction.changes.map(change => 
          change.id === changeId ? { ...change, status: 'approved' as const } : change
        )
      })));
    } else {
      setPageCorrections(prev => prev.map(correction => ({
        ...correction,
        changes: correction.changes.map(change => 
          change.id === changeId ? { ...change, status: 'approved' as const } : change
        )
      })));
    }
  };

  // Handle change rejection
  const handleRejectChange = (changeId: string, type: 'book' | 'page') => {
    if (type === 'book') {
      setBookCorrections(prev => prev.map(correction => ({
        ...correction,
        changes: correction.changes.map(change => 
          change.id === changeId ? { ...change, status: 'rejected' as const } : change
        )
      })));
    } else {
      setPageCorrections(prev => prev.map(correction => ({
        ...correction,
        changes: correction.changes.map(change => 
          change.id === changeId ? { ...change, status: 'rejected' as const } : change
        )
      })));
    }
  };

  // Handle mouse hover for tooltips
  const handleChangeHover = (changeId: string, event: React.MouseEvent) => {
    setHoveredChange(changeId);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  // Render text with highlighted changes
  const renderTextWithChanges = (text: string, changes: DetailedChange[], type: 'book' | 'page') => {
    if (changes.length === 0) return text;

    const sortedChanges = [...changes].sort((a, b) => a.position.start - b.position.start);
    let result = [];
    let lastIndex = 0;

    sortedChanges.forEach((change, index) => {
      // Add text before change
      if (change.position.start > lastIndex) {
        result.push(text.slice(lastIndex, change.position.start));
      }

      // Find related changes for this position
      const relatedChanges = changes.filter(c => 
        c.id !== change.id && 
        c.position.start === change.position.start && 
        c.position.end === change.position.end
      );

      // Add highlighted change
      result.push(
        <span
          key={change.id}
          className={`relative cursor-pointer px-1 rounded transition-colors ${
            change.status === 'approved' ? 'bg-green-200 text-green-800' :
            change.status === 'rejected' ? 'bg-red-200 text-red-800' :
            'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
          }`}
          onMouseEnter={(e) => handleChangeHover(change.id, e)}
          onMouseLeave={() => setHoveredChange(null)}
        >
          {change.originalText}
          {relatedChanges.length > 0 && (
            <Badge className="absolute -top-2 -right-1 text-xs bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
              {relatedChanges.length + 1}
            </Badge>
          )}
          {hoveredChange === change.id && (
            <div
              style={{
                position: 'fixed',
                left: tooltipPosition.x + 10,
                top: tooltipPosition.y - 10,
                zIndex: 1000
              }}
            >
              <ChangeTooltip
                change={change}
                onApprove={(id) => handleApproveChange(id, type)}
                onReject={(id) => handleRejectChange(id, type)}
                relatedChanges={relatedChanges}
              />
            </div>
          )}
        </span>
      );

      lastIndex = change.position.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  const allChanges = [
    ...bookCorrections.flatMap(bc => bc.changes),
    ...pageCorrections.flatMap(pc => pc.changes)
  ];

  const pendingChanges = allChanges.filter(c => c.status === 'pending').length;
  const approvedChanges = allChanges.filter(c => c.status === 'approved').length;
  const rejectedChanges = allChanges.filter(c => c.status === 'rejected').length;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مراجعة التغييرات</h1>
          <p className="text-gray-600 mt-1">راجع واعتمد التغييرات المقترحة على الكتب والصفحات</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-yellow-50">
            <Clock className="w-3 h-3 ml-1" />
            معلق: {pendingChanges}
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            <CheckCircle className="w-3 h-3 ml-1" />
            مُعتمد: {approvedChanges}
          </Badge>
          <Badge variant="outline" className="bg-red-50">
            <X className="w-3 h-3 ml-1" />
            مرفوض: {rejectedChanges}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            تصفية التغييرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'approved', 'rejected', 'grammar', 'spelling', 'style'].map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={selectedFilter === filter ? 'default' : 'outline'}
                onClick={() => setSelectedFilter(filter)}
              >
                {filter === 'all' ? 'الكل' :
                 filter === 'pending' ? 'معلق' :
                 filter === 'approved' ? 'مُعتمد' :
                 filter === 'rejected' ? 'مرفوض' :
                 filter === 'grammar' ? 'نحو' :
                 filter === 'spelling' ? 'إملاء' : 'أسلوب'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Book Corrections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">تصحيحات الكتب</h2>
        {bookCorrections.map((correction) => (
          <Card key={correction.id} className="border border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {correction.bookCorrectionName[0]?.value}
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    المؤلف: {correction.writer[0]?.value}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={correction.validationStatus === 'pending' ? 'secondary' : 
                                 correction.validationStatus === 'validated' ? 'default' : 'destructive'}>
                    {correction.validationStatus === 'pending' ? 'معلق' :
                     correction.validationStatus === 'validated' ? 'مُعتمد' : 'غير صالح'}
                  </Badge>
                  <Badge variant="outline">
                    {correction.changes.length} تغيير
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Book Title with Changes */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">العنوان:</div>
                  <div className="text-lg leading-relaxed">
                    {renderTextWithChanges(
                      correction.bookCorrectionName[0]?.value || '',
                      correction.changes,
                      'book'
                    )}
                  </div>
                </div>

                {/* Change Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {correction.changes.filter(c => c.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">معلق</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {correction.changes.filter(c => c.status === 'approved').length}
                    </div>
                    <div className="text-sm text-gray-600">مُعتمد</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {correction.changes.filter(c => c.status === 'rejected').length}
                    </div>
                    <div className="text-sm text-gray-600">مرفوض</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page Corrections */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">تصحيحات الصفحات</h2>
        {pageCorrections.map((correction) => (
          <Card key={correction.id} className="border border-gray-200">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {correction.fehraseName[0]?.value} - صفحة {correction.bookCorrectionPageNumber}
                  </CardTitle>
                  <div className="text-sm text-gray-600 mt-1">
                    بواسطة: {correction.createdby}
                  </div>
                </div>
                <Badge variant="outline">
                  {correction.changes.length} تغيير
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Page Content with Changes */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">محتوى الصفحة:</div>
                  <div className="text-base leading-relaxed p-4 bg-gray-50 rounded-lg">
                    {renderTextWithChanges(
                      correction.content[0]?.value || '',
                      correction.changes,
                      'page'
                    )}
                  </div>
                </div>

                {/* Change Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {correction.changes.filter(c => c.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-600">معلق</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {correction.changes.filter(c => c.status === 'approved').length}
                    </div>
                    <div className="text-sm text-gray-600">مُعتمد</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {correction.changes.filter(c => c.status === 'rejected').length}
                    </div>
                    <div className="text-sm text-gray-600">مرفوض</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>إجراءات جماعية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Approve all pending changes
                setBookCorrections(prev => prev.map(correction => ({
                  ...correction,
                  changes: correction.changes.map(change => 
                    change.status === 'pending' ? { ...change, status: 'approved' as const } : change
                  )
                })));
                setPageCorrections(prev => prev.map(correction => ({
                  ...correction,
                  changes: correction.changes.map(change => 
                    change.status === 'pending' ? { ...change, status: 'approved' as const } : change
                  )
                })));
              }}
            >
              <Check className="w-4 h-4 ml-2" />
              اعتماد جميع التغييرات المعلقة
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => {
                // Reject all pending changes
                setBookCorrections(prev => prev.map(correction => ({
                  ...correction,
                  changes: correction.changes.map(change => 
                    change.status === 'pending' ? { ...change, status: 'rejected' as const } : change
                  )
                })));
                setPageCorrections(prev => prev.map(correction => ({
                  ...correction,
                  changes: correction.changes.map(change => 
                    change.status === 'pending' ? { ...change, status: 'rejected' as const } : change
                  )
                })));
              }}
            >
              <X className="w-4 h-4 ml-2" />
              رفض جميع التغييرات المعلقة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
