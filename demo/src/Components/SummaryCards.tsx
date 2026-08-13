import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface SummaryCardsProps {
  validCount: number;
  invalidCount: number;
  invalidRows: any[];
  errorsData: any;
  originalFileName: string;
}

export default function SummaryCards({
  validCount,
  invalidCount,
  invalidRows,
  errorsData,
  originalFileName,
}: SummaryCardsProps) {
  const handleDownload = () => {
    if (invalidRows.length === 0) return;

    // We add the error messages as a column for better context in the downloaded file
    const uniqueErrorRowIndices = Array.from(
      new Set(
        (errorsData?.rowWiseErrors || []).map((e: any) => e.rowIndex as number),
      ),
    );

    const dataToExport = invalidRows.map((row, idx) => {
      const actualRowIndex = uniqueErrorRowIndices[idx];
      const errorsForThisRow = (errorsData?.rowWiseErrors || []).filter(
        (e: any) => e.rowIndex === actualRowIndex,
      );
      const errorMsg =
        errorsForThisRow.length > 0
          ? errorsForThisRow
              .map((e: any) => `${e.columnKey}: ${e.errorMessage}`)
              .join(" | ")
          : "Unknown error";
      return { ...row, _Error: errorMsg };
    });

    const isExcel =
      originalFileName.endsWith(".xlsx") || originalFileName.endsWith(".xls");

    if (isExcel) {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invalid Rows");
      XLSX.writeFile(workbook, `invalid_rows_${originalFileName}`);
    } else {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `invalid_rows_${originalFileName}`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          sx={{
            border: "1px solid #e0e0e0",
            boxShadow: "none",
            height: "100%",
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Valid Rows
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {validCount.toLocaleString()}
              </Typography>
            </Box>
            <CheckCircleIcon sx={{ fontSize: 48, color: "#4caf50" }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid #e0e0e0", boxShadow: "none" }}>
          <CardContent
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography color="text.secondary" gutterBottom>
                Invalid Rows
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                {invalidCount.toLocaleString()}
              </Typography>
              {invalidCount > 0 && (
                <Button
                  variant="text"
                  color="error"
                  size="small"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  sx={{
                    mt: 1,
                    p: 0,
                    "&:hover": {
                      bgcolor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Download Invalid Rows
                </Button>
              )}
            </Box>
            <ErrorIcon sx={{ fontSize: 48, color: "#f44336" }} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
