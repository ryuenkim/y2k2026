import { DataGrid } from '@mui/x-data-grid';
import AdminGridToolbar from './AdminGridToolbar';

const AdminReviews = ({ products, onDelete }) => {
    const rows = products.flatMap((product) => (product.reviews || []).map((review) => ({ ...review, productName: product.name, productId: product._id })));
    const columns = [
        { field: 'productName', headerName: 'Product', flex: 1, minWidth: 160 },
        { field: 'name', headerName: 'Reviewer', width: 140 },
        { field: 'rating', headerName: 'Rating', width: 90, valueFormatter: (value) => `${value}/5` },
        { field: 'comment', headerName: 'Comment', flex: 2, minWidth: 240 },
        { field: 'verifiedPurchase', headerName: 'Verified', width: 100, valueGetter: (value) => value ? 'Yes' : 'No' },
        { field: 'actions', headerName: 'Actions', width: 100, sortable: false, renderCell: ({ row }) => <button type="button" onClick={() => onDelete(row.productId, row._id)}>Remove</button> }
    ];
    return <section className="data-card"><div className="table-toolbar"><div><h2>Reviews</h2><span>{rows.length} reviews · search, filter, and paginate</span></div></div><div className="admin-product-grid"><DataGrid rows={rows} columns={columns} getRowId={(row) => row._id} disableRowSelectionOnClick showToolbar slots={{ toolbar: AdminGridToolbar }} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} /></div></section>;
};

export default AdminReviews;
