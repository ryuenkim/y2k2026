import { useState } from 'react';
import {
    Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { useDialog } from '../dialogContext';

const chartColors = ['#8d4665', '#354b63', '#c08497', '#74828e', '#e3b1c2', '#a8afb7'];

const AdminOverview = ({ stats, analytics, analyticsLoading, range, setRange, onApply }) => {
    const revenueShare = analytics.sales.map((item) => ({ ...item, label: item.date, value: item.total }));
    const [rangeError, setRangeError] = useState('');
    const { notify } = useDialog();
    const applyRange = () => {
        if (!range.from || !range.to) {
            const message = 'Choose both dates to filter sales.';
            setRangeError(message);
            notify(message, 'error');
            return;
        }
        if (range.from > range.to) {
            const message = 'Start date must be on or before end date.';
            setRangeError(message);
            notify(message, 'error');
            return;
        }
        setRangeError('');
        onApply();
    };
    return (
        <section className="admin-overview">
            <div className="stat-grid">
                <article><span>Recorded sales</span><strong>PHP {stats.revenue.toLocaleString()}</strong><small>Paid orders in range; online payments are simulated</small></article>
                <article><span>Products</span><strong>{stats.products}</strong><small>Catalog items</small></article>
                <article><span>Customers</span><strong>{stats.users}</strong><small>Registered accounts</small></article>
                <article><span>Pending orders</span><strong>{stats.pending}</strong><small>Needs attention</small></article>
            </div>
            <div className="analytics-toolbar">
                <div><p className="eyebrow">SALES PERFORMANCE</p><h2>Recorded sales analytics</h2></div>
                <div className="date-filter" role="group" aria-label="Sales date range">
                    <label htmlFor="sales-date-from">From</label>
                    <input id="sales-date-from" type="date" required value={range.from} aria-invalid={Boolean(rangeError)} onChange={(event) => { setRange({ ...range, from: event.target.value }); setRangeError(''); }} />
                    <label htmlFor="sales-date-to">To</label>
                    <input id="sales-date-to" type="date" required value={range.to} aria-invalid={Boolean(rangeError)} onChange={(event) => { setRange({ ...range, to: event.target.value }); setRangeError(''); }} />
                    <button type="button" onClick={applyRange} disabled={analyticsLoading}>{analyticsLoading ? 'Loading...' : 'Apply range'}</button>
                </div>
            </div>
            {rangeError && <p className="field-error admin-range-error" role="alert">{rangeError}</p>}
            {analytics.sales.length ? (
                <div className="analytics-grid">
                    <section className="chart-card analytics-card analytics-card-wide">
                        <div className="section-heading"><div><p className="eyebrow">DAILY REVENUE</p><h2>Sales trend</h2></div></div>
                        <div className="recharts-sales-chart"><ResponsiveContainer width="100%" height={340}><LineChart data={analytics.sales} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" /><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} /><YAxis tickFormatter={(value) => `PHP ${value}`} /><Tooltip formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']} /><Line type="monotone" dataKey="total" stroke="#8d4665" strokeWidth={3} dot={{ r: 4, fill: '#354b63' }} /></LineChart></ResponsiveContainer></div>
                    </section>
                    <section className="chart-card analytics-card">
                        <div className="section-heading"><div><p className="eyebrow">REVENUE SHARE</p><h2>Sales distribution</h2></div></div>
                        <div className="recharts-pie-chart"><ResponsiveContainer width="100%" height={340}><PieChart><Pie data={revenueShare} dataKey="value" nameKey="label" cx="50%" cy="48%" outerRadius={112} innerRadius={52} paddingAngle={2} labelLine={false}>{revenueShare.map((item, index) => <Cell key={item.date} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Revenue']} /><Legend formatter={(value) => value.slice(5)} /></PieChart></ResponsiveContainer></div>
                    </section>
                    <section className="chart-card analytics-card analytics-card-full">
                        <div className="section-heading"><div><p className="eyebrow">REVENUE BY DAY</p><h2>Sales volume</h2></div></div>
                        <div className="recharts-sales-chart"><ResponsiveContainer width="100%" height={300}><BarChart data={analytics.sales} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" /><XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} /><YAxis tickFormatter={(value) => `PHP ${value}`} /><Tooltip formatter={(value) => [`PHP ${Number(value).toLocaleString()}`, 'Sales']} /><Bar dataKey="total" fill="#354b63" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
                    </section>
                </div>
            ) : <section className="chart-card analytics-empty"><p className="no-products">{analyticsLoading ? 'Loading sales analytics...' : 'No paid sales in this date range.'}</p></section>}
        </section>
    );
};

export default AdminOverview;
