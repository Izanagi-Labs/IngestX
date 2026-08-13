import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import CloseIcon from "@mui/icons-material/Close";

interface ProcessingControlsProps {
  asyncProcessing: boolean;
  onToggleAsync: (val: boolean) => void;
  isProcessing: boolean;
  isPaused: boolean;
  progress: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  file: File | null;
  isCompleted: boolean;
}

export default function ProcessingControls({
  asyncProcessing,
  onToggleAsync,
  isProcessing,
  isPaused,
  progress,
  onStart,
  onPause,
  onResume,
  onCancel,
  file,
  isCompleted,
}: ProcessingControlsProps) {
  // For a real app, you might mock the total record count or read it early.
  // We'll just show the progress percentage for simplicity.
  const statusText = isCompleted
    ? "Completed"
    : isPaused
      ? "Paused"
      : isProcessing
        ? "Processing..."
        : "Ready";

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={asyncProcessing}
            onChange={(e) => onToggleAsync(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography sx={{ fontWeight: "bold" }}>
            Enable Async Processing
          </Typography>
        }
        sx={{ mb: 2 }}
      />

      {asyncProcessing && (
        <Box sx={{ bgcolor: "#f4f9fd", p: 3, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Current Status:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {isProcessing && !isPaused && <CircularProgress size={16} />}
              <Typography variant="body2" color="text.secondary">
                {statusText}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5, mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 4, mb: 3 }}>
            <Typography variant="body2">
              Processed: <strong>{progress.toFixed(0)}%</strong>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            {!isProcessing && !isPaused && !isCompleted && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onStart}
                disabled={!file}
                fullWidth
                sx={{ py: 1.5, height: 48, fontWeight: "bold" }}
              >
                START
              </Button>
            )}

            {isProcessing && !isPaused && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PauseIcon />}
                onClick={onPause}
                fullWidth
                sx={{
                  py: 1.5,
                  height: 48,
                  fontWeight: "bold",
                  bgcolor: "#0d47a1",
                  "&:hover": { bgcolor: "#002171" },
                }}
              >
                PAUSE
              </Button>
            )}

            {isPaused && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onResume}
                fullWidth
                sx={{ py: 1.5, height: 48, fontWeight: "bold" }}
              >
                RESUME
              </Button>
            )}

            {isCompleted && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onStart}
                disabled={!file}
                fullWidth
                sx={{ py: 1.5, height: 48, fontWeight: "bold" }}
              >
                RESTART
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              onClick={onCancel}
              disabled={!isProcessing && !isPaused}
              sx={{
                px: 4,
                py: 1.5,
                height: 48,
                fontWeight: "bold",
                bgcolor: "white",
                "&.Mui-disabled": { bgcolor: "#f5f5f5" },
              }}
            >
              CANCEL
            </Button>
          </Box>
        </Box>
      )}

      {!asyncProcessing && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={
              isProcessing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <PlayArrowIcon />
              )
            }
            onClick={onStart}
            disabled={!file || isProcessing}
            fullWidth
            sx={{ py: 1.5, height: 48, fontWeight: "bold" }}
          >
            {isProcessing ? "Processing..." : "PROCESS IMMEDIATELY"}
          </Button>
        </Box>
      )}
    </Box>
  );
}
