import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Drawer,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ColumnConfig } from "@parallelbytes/ingestx";
import type { DemoConfig } from "../types";
import {
  generateSampleCsv,
  downloadBlobAsCsv,
} from "../utils/generateSampleCsv";

interface ConfigurationSidebarProps {
  config: DemoConfig;
  onChange: (config: DemoConfig) => void;
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function ConfigurationSidebar({
  config,
  onChange,
  open,
  onClose,
  isMobile,
}: ConfigurationSidebarProps) {
  const updateOptions = (key: keyof DemoConfig["options"], value: boolean) => {
    onChange({
      ...config,
      options: {
        ...config.options,
        [key]: value,
      },
    });
  };

  const updateColumnConfig = (index: number, newColConfig: ColumnConfig) => {
    const newConfigs = [...config.columnConfigs];
    newConfigs[index] = newColConfig;
    onChange({
      ...config,
      columnConfigs: newConfigs,
    });
  };

  const addColumn = () => {
    onChange({
      ...config,
      columnConfigs: [
        ...config.columnConfigs,
        {
          key: `new_col_${config.columnConfigs.length + 1}`,
          displayNames: [],
          type: "string",
          validationRequired: false,
        } as ColumnConfig,
      ],
    });
  };

  const removeColumn = (index: number) => {
    const newConfigs = [...config.columnConfigs];
    newConfigs.splice(index, 1);
    onChange({
      ...config,
      columnConfigs: newConfigs,
    });
  };

  const generatedConfigString = JSON.stringify(
    {
      chunkSize: config.chunkSize,
      options: config.options,
      columnConfigs: config.columnConfigs,
    },
    null,
    2,
  );

  const drawerContent = (
    <Box
      sx={{
        width: 340,
        height: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          height: 73,
          boxSizing: "border-box",
          borderBottom: "1px solid #e0e0e0",
          position: "sticky",
          top: 0,
          bgcolor: "#ffffff",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
            Configuration
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block" }}
          >
            Settings apply to the next ingestion run
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" edge="end">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: "bold",
            color: "text.secondary",
            display: "block",
            mb: 2,
          }}
        >
          Processing
        </Typography>

        <TextField
          label="Chunk Size"
          type="number"
          size="small"
          fullWidth
          value={config.chunkSize}
          onChange={(e) =>
            onChange({
              ...config,
              chunkSize: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={config.options.trimValues}
                onChange={(e) => updateOptions("trimValues", e.target.checked)}
              />
            }
            label={<Typography variant="body2">Trim Values</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={config.options.trimHeaders}
                onChange={(e) => updateOptions("trimHeaders", e.target.checked)}
              />
            }
            label={<Typography variant="body2">Trim Headers</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={config.options.caseInsensitiveHeaders}
                onChange={(e) =>
                  updateOptions("caseInsensitiveHeaders", e.target.checked)
                }
              />
            }
            label={
              <Typography variant="body2">Case Insensitive Headers</Typography>
            }
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={config.options.shouldAccumulateResult}
                onChange={(e) =>
                  updateOptions("shouldAccumulateResult", e.target.checked)
                }
              />
            }
            label={<Typography variant="body2">Accumulate Results</Typography>}
          />
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: "bold",
            color: "text.secondary",
            display: "block",
            mb: 2,
          }}
        >
          Columns
        </Typography>

        {config.columnConfigs.map((col, idx) => (
          <Accordion
            key={col.key}
            disableGutters
            elevation={0}
            sx={{
              border: "1px solid #e0e0e0",
              "&:not(:last-child)": { mb: 1 },
              borderRadius: 1,
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ bgcolor: "#fafafa", borderRadius: 1 }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  pr: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {col.key}
                </Typography>
                <Chip
                  label={col.type}
                  size="small"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                  color={
                    col.type === "string"
                      ? "primary"
                      : col.type === "number"
                        ? "success"
                        : "warning"
                  }
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails
              sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  label="Key"
                  size="small"
                  fullWidth
                  value={col.key}
                  onChange={(e) =>
                    updateColumnConfig(idx, { ...col, key: e.target.value })
                  }
                />
                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={col.type}
                    label="Type"
                    onChange={(e) => {
                      const newType = e.target.value as
                        "string" | "number" | "boolean";
                      if (newType === col.type) return;
                      const newCol = { ...col, type: newType };
                      if (newType !== "string") {
                        if ("regex" in newCol) delete newCol.regex;
                      }
                      if (newType !== "number") {
                        if ("min" in newCol) delete newCol.min;
                        if ("max" in newCol) delete newCol.max;
                      }
                      if (newType !== "boolean") {
                        if ("trueValues" in newCol) delete newCol.trueValues;
                        if ("falseValues" in newCol) delete newCol.falseValues;
                      }
                      if ("allowedValues" in newCol)
                        delete newCol.allowedValues;
                      delete newCol.defaultValue;

                      updateColumnConfig(idx, newCol as ColumnConfig);
                    }}
                  >
                    <MenuItem value="string">String</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="boolean">Boolean</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <TextField
                label="Display Names (comma separated)"
                size="small"
                fullWidth
                value={col.displayNames.join(", ")}
                onChange={(e) =>
                  updateColumnConfig(idx, {
                    ...col,
                    displayNames: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={col.validationRequired}
                      onChange={(e) =>
                        updateColumnConfig(idx, {
                          ...col,
                          validationRequired: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">Validation Required</Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={col.isDuplicatesAllowed ?? false}
                      onChange={(e) =>
                        updateColumnConfig(idx, {
                          ...col,
                          isDuplicatesAllowed: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">Allow Duplicates</Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={col.fallbackToDefaultValue ?? false}
                      onChange={(e) =>
                        updateColumnConfig(idx, {
                          ...col,
                          fallbackToDefaultValue: e.target.checked,
                        })
                      }
                    />
                  }
                  label={
                    <Typography variant="body2">Fallback to Default</Typography>
                  }
                />
              </Box>

              <TextField
                label="Default Value"
                size="small"
                fullWidth
                value={col.defaultValue ?? ""}
                onChange={(e) => {
                  let val: string | number | boolean = e.target.value;
                  if (col.type === "number") val = Number(val);
                  if (col.type === "boolean") val = val === "true";
                  updateColumnConfig(idx, {
                    ...col,
                    defaultValue: e.target.value ? val : undefined,
                  });
                }}
              />

              {col.type === "string" && (
                <>
                  <TextField
                    label="Allowed Values (comma separated)"
                    size="small"
                    fullWidth
                    value={col.allowedValues?.join(", ") || ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        allowedValues: e.target.value
                          ? e.target.value.split(",").map((s) => s.trim())
                          : undefined,
                      })
                    }
                  />
                  <TextField
                    label="Regex"
                    size="small"
                    fullWidth
                    value={col.regex || ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        regex: e.target.value || undefined,
                      })
                    }
                  />
                </>
              )}

              {col.type === "number" && (
                <>
                  <TextField
                    label="Minimum"
                    type="number"
                    size="small"
                    fullWidth
                    value={col.min ?? ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        min: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <TextField
                    label="Maximum"
                    type="number"
                    size="small"
                    fullWidth
                    value={col.max ?? ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        max: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <TextField
                    label="Allowed Values (comma separated)"
                    size="small"
                    fullWidth
                    value={col.allowedValues?.join(", ") || ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        allowedValues: e.target.value
                          ? e.target.value
                              .split(",")
                              .map((s) => Number(s.trim()))
                          : undefined,
                      })
                    }
                  />
                </>
              )}

              {col.type === "boolean" && (
                <>
                  <TextField
                    label="True Values (comma separated)"
                    size="small"
                    fullWidth
                    value={col.trueValues?.join(", ") || ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        trueValues: e.target.value
                          ? e.target.value.split(",").map((s) => s.trim())
                          : undefined,
                      })
                    }
                  />
                  <TextField
                    label="False Values (comma separated)"
                    size="small"
                    fullWidth
                    value={col.falseValues?.join(", ") || ""}
                    onChange={(e) =>
                      updateColumnConfig(idx, {
                        ...col,
                        falseValues: e.target.value
                          ? e.target.value.split(",").map((s) => s.trim())
                          : undefined,
                      })
                    }
                    sx={{ mt: 2 }}
                  />
                </>
              )}

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                size="small"
                onClick={() => removeColumn(idx)}
                sx={{ mt: 1 }}
              >
                Delete Column
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          fullWidth
          onClick={addColumn}
          sx={{ mt: 2 }}
        >
          Add Column
        </Button>
      </Box>

      <Divider />

      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<DownloadIcon />}
          fullWidth
          sx={{ mb: 2 }}
          onClick={() => {
            const csvData = generateSampleCsv(config.columnConfigs);
            downloadBlobAsCsv(csvData, "sample_data.csv");
          }}
        >
          Download Sample CSV
        </Button>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: "#fafafa", borderRadius: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Generated Configuration
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{ p: 0, bgcolor: "#f5f5f5", overflowX: "auto" }}
          >
            <SyntaxHighlighter
              language="json"
              style={materialLight}
              customStyle={{
                margin: 0,
                padding: "16px",
                fontSize: "12px",
                borderRadius: "0 0 4px 4px",
              }}
            >
              {generatedConfigString}
            </SyntaxHighlighter>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? 340 : 0,
        flexShrink: 0,
        transition: "width 0.2s",
        "& .MuiDrawer-paper": {
          width: 340,
          boxSizing: "border-box",
          bgcolor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
