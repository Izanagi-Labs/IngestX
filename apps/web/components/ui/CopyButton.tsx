"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { IconButton } from "./IconButton";

interface CopyButtonProps {
  value: string;
  className?: string;
}

export function CopyButton({ value, className = "" }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const onCopy = React.useCallback(() => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [value]);

  return (
    <IconButton
      size="sm"
      variant="ghost"
      className={`text-foreground-muted hover:text-foreground ${className}`}
      onClick={onCopy}
      aria-label={hasCopied ? "Copied" : "Copy to clipboard"}
    >
      {hasCopied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </IconButton>
  );
}
