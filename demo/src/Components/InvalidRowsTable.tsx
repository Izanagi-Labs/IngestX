import { Box, Typography, Paper } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";

interface InvalidRowsTableProps {
  invalidRows: any[];
  errorsData: any;
}

export default function InvalidRowsTable({
  invalidRows,
  errorsData,
}: InvalidRowsTableProps) {
  if (!invalidRows || invalidRows.length === 0) return null;

  // Prepare columns: Row Number, Error Message
  const columns: GridColDef[] = [
    { field: "rowNumber", headerName: "Row Number", width: 130 },
    {
      field: "errorMessage",
      headerName: "Error Message",
      flex: 1,
      minWidth: 250,
    },
  ];

  // Map invalid rows with their corresponding errors
  const rowsWithIds = useMemo(() => {
    const uniqueErrorRowIndices = Array.from(
      new Set(
        (errorsData?.rowWiseErrors || []).map((e: any) => e.rowIndex as number),
      ),
    );

    return invalidRows.map((_row, index) => {
      const actualRowIndex = uniqueErrorRowIndices[index];
      const errorsForThisRow = (errorsData?.rowWiseErrors || []).filter(
        (e: any) => e.rowIndex === actualRowIndex,
      );
      const errorMsg =
        errorsForThisRow.length > 0
          ? errorsForThisRow
              .map((e: any) => `${e.columnKey}: ${e.errorMessage}`)
              .join(" | ")
          : "Unknown error";

      return {
        id: `invalid-row-${actualRowIndex ?? index}`,
        rowNumber:
          typeof actualRowIndex === "number" ? actualRowIndex + 1 : index + 1,
        errorMessage: errorMsg,
      };
    });
  }, [invalidRows, errorsData]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid #ffcdd2",
        borderRadius: 2,
        bgcolor: "#fffafb",
      }}
    >
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold" }}
        color="error"
        gutterBottom
      >
        Invalid Rows
      </Typography>
      <Box sx={{ height: 400, width: "100%", mt: 2 }}>
        <DataGrid
          rows={rowsWithIds}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          sx={{
            "& .MuiDataGrid-row": {
              color: "#d32f2f",
            },
          }}
        />
      </Box>
    </Paper>
  );
}
