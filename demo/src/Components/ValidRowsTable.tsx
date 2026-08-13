import { Box, Typography, Paper } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useMemo } from "react";
import type { GridColDef } from "@mui/x-data-grid";

interface ValidRowsTableProps {
  rows: any[];
}

export default function ValidRowsTable({ rows }: ValidRowsTableProps) {
  if (!rows || rows.length === 0) return null;

  // Extract columns dynamically from the first valid row
  const columns: GridColDef[] = Object.keys(rows[0]).map((key) => ({
    field: key,
    headerName: key.charAt(0).toUpperCase() + key.slice(1),
    flex: 1,
    minWidth: 150,
  }));

  // Ensure each row has a unique id for DataGrid
  const rowsWithIds = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      id: row.id !== undefined ? row.id : `valid-row-${index}`,
    }));
  }, [rows]);

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
        Valid Rows
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
        />
      </Box>
    </Paper>
  );
}
