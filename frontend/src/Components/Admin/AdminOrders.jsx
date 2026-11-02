import { DataGrid } from '@mui/x-data-grid';
import { getPaymentStatusLabel } from '../../utils/paymentStatus';
import AdminGridToolbar from './AdminGridToolbar';

const AdminOrders = ({ orders, onUpdate }) => {
    const columns = [
        { field: 'id', headerName: 'Order', width: 120, valueGetter: (_, row) => `#${row._id.slice(-8)}` },
        { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 180, valueGetter: (_, row) => row.user?.email || 'Customer' },
        { field: 'created', headerName: 'Date', width: 130, valueGetter: (_, row) => new Date(row.createdAt).toLocaleDateString() },
        { field: 'items', headerName: 'Products', width: 360, sortable: false, renderCell: ({ row }) => <div className="admin-order-items">{row.orderItems?.map((item) => <div className="admin-order-item" key={item.product}>
            <div className="admin-order-gallery">{(item.images?.length ? item.images : [item.image]).filter(Boolean).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${item.name} ${index + 1}`} />)}</div>
            <span title={`${item.name} × ${item.quantity}`}>{item.name} × {item.quantity}<small>PHP {(item.price * item.quantity).toFixed(2)}</small></span>
        </div>)}</div> },
        { field: 'paymentMethod', headerName: 'Payment method', width: 170, valueGetter: (_, row) => row.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online simulation' },
        { field: 'totalPrice', headerName: 'Total', width: 110, valueFormatter: (value) => `PHP ${Number(value).toFixed(2)}` },
        { field: 'orderStatus', headerName: 'Order status', width: 145, renderCell: ({ row }) => <select value={row.orderStatus} onChange={(event) => onUpdate(row, 'status', event.target.value)}><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select> },
        { field: 'transactionStatus', headerName: 'Payment status', width: 230, valueGetter: (_, row) => getPaymentStatusLabel(row), renderCell: ({ row }) => <select aria-label={`Payment status for order ${row._id.slice(-8)}`} value={row.transactionStatus || row.paymentInfo?.status || 'pending'} onChange={(event) => onUpdate(row, 'transactionStatus', event.target.value)}><option value="pending">{getPaymentStatusLabel({ ...row, transactionStatus: 'pending' })}</option><option value="paid" disabled={row.paymentMethod === 'COD' && row.orderStatus !== 'Delivered'}>{row.paymentMethod === 'COD' ? 'Paid on delivery' : 'Paid (simulation)'}</option><option value="refunded">Refund status marked (simulated)</option><option value="failed">Payment failed</option>{row.transactionStatus === 'voided' && <option value="voided" disabled>Cancelled — no refund issued</option>}</select> }
    ];
    return <section className="data-card"><div className="table-toolbar"><div><h2>Orders</h2><span>{orders.length} orders · search, filter, and paginate</span></div></div><div className="admin-product-grid"><DataGrid rows={orders} columns={columns} getRowId={(row) => row._id} getRowHeight={() => 'auto'} disableRowSelectionOnClick showToolbar slots={{ toolbar: AdminGridToolbar }} pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} /></div></section>;
};

export default AdminOrders;
