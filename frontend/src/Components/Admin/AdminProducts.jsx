import { DataGrid } from '@mui/x-data-grid';
import AdminGridToolbar from './AdminGridToolbar';

const categories = ['Laptops', 'Accessories', 'Headphones', 'Cell Phones', 'Cameras', 'Gaming', 'Y2K Gadgets'];

const AdminProducts = ({
    products, selected, setSelected, productForm, setProductForm, productErrors,
    setProductErrors, editingProduct, actionLoading, onSubmit, onEdit, onCancelEdit,
    onSeed, onDeleteSelected
}) => {
    const setField = (field, value) => {
        setProductForm((current) => ({ ...current, [field]: value }));
        setProductErrors((current) => ({
            ...current,
            [field]: '',
            ...(field === 'newImages' ? { images: '' } : {})
        }));
    };
    const fieldProps = (field) => ({
        'aria-invalid': Boolean(productErrors[field]),
        'aria-describedby': productErrors[field] ? `product-${field}-error` : undefined
    });
    const fieldError = (field) => productErrors[field]
        ? <small id={`product-${field}-error`} className="field-error" role="alert">{productErrors[field]}</small>
        : null;
    const columns = [
        { field: 'image', headerName: 'Image', width: 76, sortable: false, renderCell: ({ row }) => <img className="admin-grid-image" src={row.images?.[0]?.url || ''} alt="" /> },
        { field: 'name', headerName: 'Product', flex: 1, minWidth: 180 },
        { field: 'category', headerName: 'Category', width: 140 },
        { field: 'stock', headerName: 'Stock', width: 90 },
        { field: 'price', headerName: 'Price', width: 110, valueFormatter: (value) => `PHP ${Number(value).toLocaleString()}` },
        { field: 'actions', headerName: 'Actions', width: 100, sortable: false, renderCell: ({ row }) => <button type="button" onClick={() => onEdit(row)}>Edit</button> }
    ];

    return (
        <section className="admin-section modern-section">
            <form className="admin-form" onSubmit={onSubmit} noValidate>
                <div className="admin-form-heading">
                    <div><p className="eyebrow">{editingProduct ? 'CATALOG UPDATE' : 'NEW CATALOG ITEM'}</p><h2>{editingProduct ? 'Edit product' : 'Add product'}</h2></div>
                    <span className="admin-required-note">* Required fields</span>
                </div>
                <label className="admin-field" htmlFor="admin-product-name"><span className="admin-field-label">Product name <b aria-hidden="true">*</b></span>
                    <input id="admin-product-name" required maxLength={100} placeholder="e.g. Y2K flip phone" value={productForm.name} {...fieldProps('name')} onChange={(event) => setField('name', event.target.value)} />
                    {fieldError('name')}
                </label>
                <div className="form-row">
                    <label className="admin-field" htmlFor="admin-product-price"><span className="admin-field-label">Price (PHP) <b aria-hidden="true">*</b></span>
                        <input id="admin-product-price" required min="0" step="0.01" type="number" placeholder="0.00" value={productForm.price} {...fieldProps('price')} onChange={(event) => setField('price', event.target.value)} />
                        {fieldError('price')}
                    </label>
                    <label className="admin-field" htmlFor="admin-product-stock"><span className="admin-field-label">Stock quantity <b aria-hidden="true">*</b></span>
                        <input id="admin-product-stock" required min="0" step="1" type="number" placeholder="0" value={productForm.stock} {...fieldProps('stock')} onChange={(event) => setField('stock', event.target.value)} />
                        {fieldError('stock')}
                    </label>
                </div>
                <label className="admin-field" htmlFor="admin-product-seller"><span className="admin-field-label">Seller <b aria-hidden="true">*</b></span>
                    <input id="admin-product-seller" required placeholder="Seller or store name" value={productForm.seller} {...fieldProps('seller')} onChange={(event) => setField('seller', event.target.value)} />
                    {fieldError('seller')}
                </label>
                <label className="admin-field" htmlFor="admin-product-category"><span className="admin-field-label">Category <b aria-hidden="true">*</b></span>
                    <select id="admin-product-category" required value={productForm.category} {...fieldProps('category')} onChange={(event) => setField('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
                    {fieldError('category')}
                </label>
                <label className="admin-field" htmlFor="admin-product-description"><span className="admin-field-label">Description <b aria-hidden="true">*</b></span>
                    <textarea id="admin-product-description" required minLength={5} placeholder="Describe the product and its key details" value={productForm.description} {...fieldProps('description')} onChange={(event) => setField('description', event.target.value)} />
                    {fieldError('description')}
                </label>
                <label className="admin-field admin-image-upload" htmlFor="admin-product-images"><span className="admin-field-label">Product photos <b aria-hidden="true">*</b></span><small>Add up to 8 images. Each image must be 10 MB or smaller.</small>
                    <input id="admin-product-images" type="file" accept="image/*" multiple aria-invalid={Boolean(productErrors.images)} aria-describedby={productErrors.images ? 'product-images-error' : undefined} onChange={(event) => {
                        const files = Array.from(event.target.files || []);
                        const totalImages = (productForm.images?.length || 0) + (productForm.newImages?.length || 0) + files.length;
                        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
                        const invalidType = files.some((file) => !allowedTypes.has(file.type));
                        const oversized = files.some((file) => file.size > 10 * 1024 * 1024);
                        const imageError = totalImages > 8
                            ? 'A product can have up to 8 images.'
                            : invalidType
                                ? 'Choose image files only.'
                                : oversized
                                    ? 'Each product image must be 10 MB or smaller.'
                                    : '';
                        if (imageError) {
                            setProductErrors((current) => ({ ...current, images: imageError }));
                        } else {
                            setField('newImages', [...(productForm.newImages || []), ...files]);
                        }
                        event.target.value = '';
                }} /></label>
                {fieldError('images')}
                <div className="image-preview">
                    {(productForm.images || []).map((image) => <div className="admin-image-preview" key={image.public_id}><img src={image.url} alt="Current product" /><button type="button" aria-label="Remove current image" onClick={() => setField('images', productForm.images.filter((item) => item.public_id !== image.public_id))}>×</button></div>)}
                    {(productForm.newImages || []).map((file, index) => <div className="admin-image-file" key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setField('newImages', productForm.newImages.filter((_, fileIndex) => fileIndex !== index))}>×</button></div>)}
                </div>
                <div className="admin-form-actions">
                    {editingProduct && <button className="admin-cancel-button" type="button" onClick={onCancelEdit} disabled={actionLoading}>Cancel</button>}
                    <button className="view-btn" type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : editingProduct ? 'Save product' : 'Create product'}</button>
                </div>
            </form>
            <section className="data-card">
                <div className="table-toolbar"><div><p className="eyebrow">INVENTORY</p><h2>Products</h2><span>{products.length} items · {selected.length} selected</span></div><div className="admin-table-actions"><button type="button" onClick={onSeed} disabled={actionLoading}>Add sample items</button><button type="button" disabled={!selected.length || actionLoading} onClick={onDeleteSelected}>Delete selected</button></div></div>
                {!selected.length && products.length > 0 && <p className="admin-table-hint">Select product rows to enable bulk deletion.</p>}
                <div className="admin-product-grid"><DataGrid rows={products} columns={columns} getRowId={(row) => row._id} checkboxSelection disableRowSelectionOnClick showToolbar slots={{ toolbar: AdminGridToolbar }} rowSelectionModel={{ type: 'include', ids: new Set(selected) }} onRowSelectionModelChange={(model) => setSelected([...model.ids])} pageSizeOptions={[10, 25, 50]} localeText={{ noRowsLabel: 'No products yet. Add a product using the form.' }} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} /></div>
            </section>
        </section>
    );
};

export default AdminProducts;
