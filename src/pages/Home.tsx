import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import UploadModal from "@/components/UploadModal";
import { Badge } from "@/components/ui/badge";
import { deletePdf, getPdfs } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";

type PDF = {
  title: string;
  fileName: string;
  summary: string;
  keywords: string;
  onDelete: (fileName: string) => void;
};
const PdfCard = ({ title, summary, fileName, keywords, onDelete }: PDF) => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const keywordsArr = keywords.split(",").map((k) => k.trim());

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setDeleting(true);
      await deletePdf(fileName);
      toast.success("PDF deleted successfully!");
      onDelete(fileName);
    } catch (error) {
      console.error("Failed to delete PDF", error);
      toast.error("Failed to delete PDF");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      onClick={() => {
        navigate("/chat", {
          state: { pdfFileName: fileName },
        });
      }}
      className="w-full shadow-md hover:shadow-lg transition border rounded-2xl cursor-pointer relative"
    >
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-3 right-3"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-4 items-center gap-2 w-full flex-wrap">
          {keywordsArr.map((k) => (
            <Badge key={k} variant="outline">
              {k}
            </Badge>
          ))}
        </div>
        <p>{summary}</p>
      </CardContent>
    </Card>
  );
};

const Home = () => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);

  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await getPdfs();
        setPdfs(response);
      } catch (error) {
        console.error("Failed to fetch PDFs", error);
      }
    };
    fetchPdfs();
  }, []);

  const handleDelete = (fileName: string) => {
    setPdfs((prev) => prev.filter((pdf) => pdf.fileName !== fileName));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Uploaded PDFs</h1>
          <UploadModal />
        </div>

        {pdfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pdfs.map((pdf) => (
              <PdfCard
                key={pdf.fileName}
                fileName={pdf.fileName}
                title={pdf.title}
                summary={pdf.summary}
                keywords={pdf.keywords}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No PDFs uploaded.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
