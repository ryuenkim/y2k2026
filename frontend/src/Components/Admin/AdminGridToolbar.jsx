import { GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';

const AdminGridToolbar = () => (
    <GridToolbarContainer className="admin-grid-toolbar">
        <GridToolbarQuickFilter debounceMs={300} aria-label="Search rows" />
    </GridToolbarContainer>
);

export default AdminGridToolbar;
