import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "./ui/input";
import debounce from "lodash/debounce";

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PDFViewerProps = {
  pdfUrl: string;
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
};

const PDFViewer = ({ pdfUrl, pageNumber, setPageNumber }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPage) => {
      const newPage = prevPage + offset;
      return numPages ? Math.max(1, Math.min(newPage, numPages)) : prevPage;
    });
  };

  const jumpToPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newPage = parseInt(e.target.value);
    if (!isNaN(newPage) && newPage >= 1 && numPages && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  return (
    <div className="w-1/2 bg-muted p-4 overflow-auto">
      <div className="flex flex-col items-center">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="max-w-full"
        >
          <Page
            pageNumber={pageNumber}
            width={Math.min(600, window.innerWidth * 0.45)}
            className="shadow-lg"
          />
        </Document>

        {/* Page Navigation Controls */}
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {pageNumber} of {numPages}
            </span>
            <Input
              onChange={debounce(jumpToPage, 500)}
              type="text"
              className="w-16 text-center"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => changePage(1)}
            disabled={!numPages || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
