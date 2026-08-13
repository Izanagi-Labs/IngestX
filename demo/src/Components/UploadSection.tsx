import React, { useCallback, useRef } from "react";
import { Box, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface UploadSectionProps {
  onFileDrop: (file: File) => void;
  selectedFile: File | null;
}

export default function UploadSection({
  onFileDrop,
  selectedFile,
}: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileDrop(e.dataTransfer.files[0]);
      }
    },
    [onFileDrop],
  );

  const handleClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileDrop(e.target.files[0]);
      }
      // Reset the input value so selecting the same file again works
      e.target.value = "";
    },
    [onFileDrop],
  );

  return (
    <Box
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed #90caf9",
        borderRadius: 2,
        p: 6,
        textAlign: "center",
        bgcolor: "#f5f5f5",
        cursor: "pointer",
        "&:hover": { bgcolor: "#e3f2fd" },
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 48, color: "#1976d2", mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Drag and drop your file here, or click to select
      </Typography>
      <Typography color="text.secondary">
        {selectedFile
          ? `Selected: ${selectedFile.name}`
          : "Supports CSV and Excel files"}
      </Typography>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept=".csv, .xlsx, .xls"
      />
    </Box>
  );
}
