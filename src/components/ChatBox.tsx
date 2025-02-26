import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { askQuestion } from "@/api";
import { Input } from "./ui/input";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const LoadingDots = () => (
  <div className="flex justify-start">
    <div className="bg-muted rounded-lg p-3 mr-4">
      <span className="inline-flex animate-pulse space-x-1">
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
      </span>
    </div>
  </div>
);

type ChatBoxProps = {
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  pdfFileName: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const ChatBox = ({ setPageNumber, pdfFileName }: ChatBoxProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const parseMessageWithCitations = (message: string) => {
    return message.split(/(\[Page \d+\])/g).map((part, index) => {
      const match = part.match(/\[Page (\d+)\]/);
      if (match) {
        const page = parseInt(match[1], 10);
        return (
          <Button
            key={index}
            variant="outline"
            onClick={() => setPageNumber(page)}
          >
            {part}
          </Button>
        );
      }
      return part;
    });
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const question = formData.get("question") as string;
    if (!question.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: question }]);

    try {
      setLoading(true);
      const response = await askQuestion(question, pdfFileName);
      // Add AI message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer },
      ]);
    } catch {
      toast.error("Failed to answer question, API Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-1/2 border-r">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                    max-w-[80%] rounded-lg p-3
                    ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground ml-4"
                        : "bg-muted mr-4"
                    }
                  `}
              >
                {parseMessageWithCitations(message.content)}
              </div>
            </div>
          ))}

          {loading && <LoadingDots />}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            name="question"
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
