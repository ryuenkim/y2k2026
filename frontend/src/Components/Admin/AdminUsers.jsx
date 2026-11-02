import { DataGrid } from '@mui/x-data-grid';
import AdminGridToolbar from './AdminGridToolbar';

const AdminUsers = ({ users, onUpdate }) => {
    const columns = [
        { field: 'avatar', headerName: 'Profile', width: 85, sortable: false, filterable: false, renderCell: ({ row }) => row.avatar?.url ? <img className="admin-user-avatar" src={row.avatar.url} alt={`${row.name} profile`} /> : <span className="admin-user-avatar-fallback">{row.name?.charAt(0)?.toUpperCase() || '?'}</span> },
        { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
        { field: 'role', headerName: 'Role', width: 100 },
        { field: 'accountStatus', headerName: 'Status', width: 110, valueGetter: (_, row) => row.isActive === false ? 'Inactive' : 'Active' },
        { field: 'actions', headerName: 'Actions', width: 210, sortable: false, renderCell: ({ row }) => <><button type="button" onClick={() => onUpdate(row)}>Role</button><button type="button" onClick={() => onUpdate(row, { isActive: row.isActive === false, role: row.role })}>{row.isActive !== false ? 'Deactivate' : 'Activate'}</button></> }
    ];
    return <section className="data-card"><div className="table-toolbar"><div><h2>Customers</h2><span>{users.length} accounts · search, filter, and paginate</span></div></div><div className="admin-product-grid"><DataGrid rows={users} columns={columns} getRowId={(row) => row._id} disableRowSelectionOnClick showToolbar slots={{ toolbar: AdminGridToolbar }} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} /></div></section>;
};

export default AdminUsers;
