"use client";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Copy, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const MODES = ["Normal", "Grammar", "Translate"] as const;

type Mode = (typeof MODES)[number];

export default function Home() {
  const [mode, setMode] = useState<Mode>("Normal");
  const [promptValue, setPromptValue] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  const debouncedPromptValue = useDebounce(promptValue);

  const parsePrompt = useCallback(
    (prompt: string) => {
      const prefix: Record<Mode, string> = {
        Normal: "",
        Grammar:
          "Correct the following text for grammatical accuracy. Use contractions wherever appropriate. When possible, improve the text to make it sound more like native English. Return only the corrected text without including the original text or any HTML.\n",
        Translate:
          "Translate the following text into English, using contractions where appropriate and ensuring it sounds like native English. Maintain a professional tone and avoid slang. Return only the translated text without including the original text or any HTML.\n",
      };

      return `${prefix[mode]}${prompt}`;
    },
    [mode]
  );

  const canGenerateAi = async () => {
    if (!window.ai) return false;

    const canGenerate = await window.ai.canCreateTextSession();

    return canGenerate === "readily";
  };

  const handlePrompt = useCallback(
    async (prompt: string) => {
      try {
        const canGenerate = await canGenerateAi();

        if (!canGenerate) {
          const guide = `
Browser not supported. Please use the latest version of Chrome Canary and follow the steps below:

1. Download the latest version of Google Canary.
2. Navigate to chrome://flags/ and search for "Prompt API for Gemini Nano", enable it and relaunch your chrome.
3. Back to the flags again and search "Enables optimization guide on device", for this feature you'll need to select "Enable ByPassPerfRequirement". Update and relaunch your chrome.
4. At last, navigate to chrome://components and search for "Optimization Guide On Device Model", update it and see the status is downloading.
        `;
          alert(guide);
          return;
        }

        console.log("start", prompt);

        setIsLoading(true);

        const session = await window.ai.createTextSession();

        const parsedPrompt = parsePrompt(prompt);

        const answer = await session.prompt(parsedPrompt);

        setResponse(answer);

        console.log("end", answer);

        session.destroy();
      } catch (error) {
        console.error(error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [parsePrompt]
  );

  const handleCopy = useCallback(() => {
    const content = responseRef.current?.textContent ?? "";
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  }, []);

  useEffect(() => {
    if (!debouncedPromptValue.trim()) {
      setResponse("");
      return;
    }

    handlePrompt(debouncedPromptValue);
  }, [debouncedPromptValue, handlePrompt]);

  return (
    <main className="w-full max-w-[1000px] p-10 flex flex-col mx-auto">
      <header className="w-full flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Local Gemini</h1>
        <ModeToggle />
      </header>

      <div className="bg-secondary rounded-lg p-1.5 w-max flex gap-2">
        {MODES.map((item) => {
          const isActive = item === mode;
          return (
            <Button
              key={`mode-${item}`}
              variant={isActive ? "outline" : "ghost"}
              onClick={() => setMode(item)}
            >
              {item}
            </Button>
          );
        })}
      </div>

      <Textarea
        className="my-6 text-2xl"
        rows={8}
        value={promptValue}
        onChange={({ target }) => setPromptValue(target.value)}
      />

      <p
        ref={responseRef}
        className={cn(
          "text-3xl font-bold outline-none",
          isLoading &&
            "animate-pulse bg-secondary text-transparent min-h-9 rounded"
        )}
        contentEditable
      >
        {response}
      </p>

      {!!response && (
        <div className="flex items-center gap-4 mt-5">
          <Button onClick={handleCopy} variant="outline" size="icon">
            <Copy className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <Button
            onClick={() => handlePrompt(promptValue)}
            variant="outline"
            size="icon"
          >
            <RefreshCw className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </div>
      )}
    </main>
  );
}
