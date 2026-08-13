import React, { useRef, useEffect } from 'react';
import { Printer, X, Download, FileText } from 'lucide-react';

export interface DocumentPreviewProps {
  open: boolean;
  htmlContent: string;
  title: string;
  onClose: () => void;
  filename?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  open,
  htmlContent,
  title,
  onClose,
  filename,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
      } catch (e) {
        console.error('Error triggering iframe print:', e);
        window.print();
      }
    } else {
      window.print();
    }
  };

  // Build iframe HTML document with embedded printable styles & A4 settings
  const fullHtmlDocument = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title || 'Document Preview'}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            color: #0f172a;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @media print {
            body {
              padding: 0;
              background-color: #ffffff;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent || '<p style="color: #64748b;">No document content provided.</p>'}
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden document-preview-modal">
      {/* Print CSS style override for host window */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          body > *:not(.document-preview-modal) {
            display: none !important;
          }
          .document-preview-modal {
            position: absolute !important;
            inset: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          .document-preview-chrome {
            display: none !important;
          }
          .document-preview-container {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
          }
          .document-preview-iframe {
            height: 100vh !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity document-preview-chrome"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden z-10 document-preview-container">
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 document-preview-chrome">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 truncate max-w-md">
                {title}
              </h2>
              {filename && (
                <p className="text-[11px] text-slate-400 font-mono">
                  {filename}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg shadow transition flex items-center space-x-1.5 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with iframe */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
          <iframe
            ref={iframeRef}
            title={title}
            srcDoc={fullHtmlDocument}
            className="w-full h-full bg-white rounded shadow-inner border border-slate-700 document-preview-iframe"
          />
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 document-preview-chrome">
          <span className="hidden sm:inline">
            Use system dialog to select PDF Printer or Save to Disk
          </span>
          <div className="flex items-center space-x-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded transition flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
