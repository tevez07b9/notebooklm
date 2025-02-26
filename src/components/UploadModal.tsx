import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadPdf } from "@/api";

const UploadModal = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Invalid file type", {
        description: "Only PDF files are allowed.",
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await uploadPdf(formData);

      // Close modal only after successful upload
      setOpen(false);

      navigate("/chat", {
        state: { pdfFileName: response.fileName },
      });
    } catch {
      toast.error("Upload failed", {
        description: "There was an error uploading your file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        className="w-full sm:w-auto"
        size="lg"
        onClick={() => setOpen(true)}
      >
        Upload PDF
      </Button>
      <Dialog
        open={open}
        onOpenChange={(state) => !isUploading && setOpen(state)}
      >
        <DialogContent
          className="sm:max-w-xl"
          onInteractOutside={(e) => isUploading && e.preventDefault()} // Prevent closing by clicking outside
          onEscapeKeyDown={(e) => isUploading && e.preventDefault()} // Prevent closing with Escape key
        >
          <DialogHeader>
            <DialogTitle>Upload your PDF</DialogTitle>
            <DialogDescription>
              Drag and drop a PDF or click to select one.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-100"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <input {...getInputProps()} />
              <p>
                {file
                  ? file.name
                  : isDragActive
                  ? "Drop the PDF here..."
                  : "Drag and drop a PDF or click to select one"}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!file || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UploadModal;
