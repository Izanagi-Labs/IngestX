import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  Box,
  Container,
  Typography,
  CssBaseline,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useIngestion } from '@parallelbytes/ingestx/react';
import type { ColumnConfig } from '@parallelbytes/ingestx';

import UploadSection from './Components/UploadSection';
import ProcessingControls from './Components/ProcessingControls';
import SummaryCards from './Components/SummaryCards';
import ValidRowsTable from './Components/ValidRowsTable';
import InvalidRowsTable from './Components/InvalidRowsTable';
import ConfigurationSidebar from './Layout/ConfigurationSidebar';
import type { DemoConfig } from './types';

// Dummy column configs for the demo
const initialColumnConfigs: ColumnConfig[] = [
  {
    key: 'id',
    displayNames: ['id', 'user_id', 'ID'],
    type: 'number',
    validationRequired: true,
  },
  {
    key: 'name',
    displayNames: ['name', 'full name', 'Name'],
    type: 'string',
    validationRequired: true,
  },
  {
    key: 'email',
    displayNames: ['email', 'email address', 'Email'],
    type: 'string',
    validationRequired: true,
  },
  {
    key: 'department',
    displayNames: ['department', 'dept', 'Department'],
    type: 'string',
    validationRequired: false,
  },
  {
    key: 'status',
    displayNames: ['status', 'Status'],
    type: 'string',
    validationRequired: false,
  },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [asyncProcessing, setAsyncProcessing] = useState(false);
  const [headersMismatch, setHeadersMismatch] = useState<{
    headersRequired: string[];
    headersSent: string[];
  } | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const [ingestionConfig, setIngestionConfig] = useState<DemoConfig>({
    chunkSize: 500,
    options: {
      trimValues: false,
      trimHeaders: false,
      caseInsensitiveHeaders: false,
      shouldAccumulateResult: true,
    },
    columnConfigs: initialColumnConfigs,
  });

  const {
    isProcessing,
    isPaused,
    progress,
    result,
    startIngestion,
    pause,
    resume,
    cancel,
  } = useIngestion({
    columnConfigs: ingestionConfig.columnConfigs,
    chunkSize: ingestionConfig.chunkSize,
    options: {
      trimValues: ingestionConfig.options.trimValues,
      trimHeaders: ingestionConfig.options.trimHeaders,
      caseInsensitiveHeaders: ingestionConfig.options.caseInsensitiveHeaders,
      shouldAccumulateResult: ingestionConfig.options.shouldAccumulateResult,
    },
  });

  const handleFileDrop = (droppedFile: File) => {
    setFile(droppedFile);
  };

  const handleStart = async () => {
    if (!file) return;
    const res = await startIngestion(file);
    if (res?.headersMismatch) {
      setHeadersMismatch(res.headersMismatch);
    }
  };

  const isCompleted = result !== null && !isProcessing;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <CssBaseline />
      <Analytics />

      <ConfigurationSidebar
        config={ingestionConfig}
        onChange={setIngestionConfig}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
      />

      <Box sx={{ flexGrow: 1, height: '100vh', overflowY: 'auto', pb: 8 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 0,
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: 40,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!sidebarOpen && (
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={() => setSidebarOpen(true)}
                  sx={{ mr: 1 }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                IngestX
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ border: '1px solid #ccc', borderRadius: 4, px: 1 }}
              >
                CSV & Excel Processing Engine
              </Typography>
            </Box>
          </Container>
        </Paper>

        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold' }} gutterBottom>
              Ingest Massive CSV & Excel Files Without Losing Control
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Validate, transform, pause, resume, and process datasets with
              granular control.
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{ p: 4, borderRadius: 2, border: '1px solid #e0e0e0', mb: 4 }}
          >
            <UploadSection onFileDrop={handleFileDrop} selectedFile={file} />

            <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #e0e0e0' }}>
              <ProcessingControls
                asyncProcessing={asyncProcessing}
                onToggleAsync={(val) => setAsyncProcessing(val)}
                isProcessing={isProcessing}
                isPaused={isPaused}
                progress={progress}
                onStart={handleStart}
                onPause={pause}
                onResume={resume}
                onCancel={cancel}
                file={file}
                isCompleted={isCompleted}
              />
            </Box>
          </Paper>

          {result && (
            <Box sx={{ mt: 4 }}>
              <SummaryCards
                validCount={result.validRowsCount}
                invalidCount={result.invalidRowsCount}
                invalidRows={result.invalidRows}
                errorsData={result.errorsData}
                originalFileName={file?.name || 'upload.csv'}
              />

              <Box sx={{ mt: 4 }}>
                <ValidRowsTable rows={result.validRows} />
              </Box>

              {result.invalidRowsCount > 0 && (
                <Box sx={{ mt: 4 }}>
                  <InvalidRowsTable
                    invalidRows={result.invalidRows}
                    errorsData={result.errorsData}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Headers Mismatch Modal */}
          <Dialog
            open={!!headersMismatch}
            onClose={() => setHeadersMismatch(null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>
              Headers Mismatch
            </DialogTitle>
            <DialogContent dividers>
              <Typography gutterBottom>
                The uploaded file is missing some required headers. Please check
                your file and try again.
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{ mt: 2, fontWeight: 'bold' }}
              >
                Missing Required Headers:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {headersMismatch?.headersRequired.map((header) => (
                  <Box
                    key={header}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: '#ffebee',
                      color: '#c62828',
                      borderRadius: 1,
                      border: '1px solid #ef9a9a',
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>

              <Typography
                variant="subtitle1"
                sx={{ mt: 3, fontWeight: 'bold' }}
              >
                Headers Found in File:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {headersMismatch?.headersSent.map((header, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: '#f5f5f5',
                      color: '#424242',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHeadersMismatch(null)} color="inherit">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}
