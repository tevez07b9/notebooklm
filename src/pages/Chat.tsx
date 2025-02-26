import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatBox from "@/components/ChatBox";
import { API_URL } from "@/api";
import PDFViewer from "@/components/PDFViewer";

const ChatPage = () => {
  const [pageNumber, setPageNumber] = useState(1);
  const location = useLocation();
  const navigate = useNavigate();
  const pdfFileName = location.state?.pdfFileName;
  const pdfUrl = `${API_URL}/uploads/${pdfFileName}`;

  useEffect(() => {
    // If there's no PDF URL, redirect back to home
    if (!pdfUrl) {
      navigate("/");
    }

    // Cleanup function to revoke the object URL when component unmounts
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl, navigate]);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Section */}
      <ChatBox setPageNumber={setPageNumber} pdfFileName={pdfFileName} />

      {/* PDF Viewer Section */}
      <PDFViewer
        pageNumber={pageNumber}
        pdfUrl={pdfUrl}
        setPageNumber={setPageNumber}
      />
    </div>
  );
};

export default ChatPage;
