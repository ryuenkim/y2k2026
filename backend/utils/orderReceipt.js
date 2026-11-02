const formatMoney = (amount) => `PHP ${Number(amount || 0).toFixed(2)}`;
const getOrderPaymentDescription = require('./orderPaymentStatus');

const escapePdfText = (value) => String(value)
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/([\\()])/g, '\\$1');

const text = (x, y, value, size = 10, color = '24252B', bold = false) => {
    const red = parseInt(color.slice(0, 2), 16) / 255;
    const green = parseInt(color.slice(2, 4), 16) / 255;
    const blue = parseInt(color.slice(4, 6), 16) / 255;
    return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`;
};

const rectangle = (x, y, width, height, color) => {
    const red = parseInt(color.slice(0, 2), 16) / 255;
    const green = parseInt(color.slice(2, 4), 16) / 255;
    const blue = parseInt(color.slice(4, 6), 16) / 255;
    return `${red.toFixed(3)} ${green.toFixed(3)} ${blue.toFixed(3)} rg ${x} ${y} ${width} ${height} re f`;
};

const createReceiptPage = (order, pageItems, pageIndex, pageCount) => {
    const commands = [];
    const continued = pageIndex > 0;
    const tableTop = continued ? 680 : 510;
    const rowHeight = 21;
    const rowStart = tableTop - 34;
    const pageLabel = `PAGE ${pageIndex + 1} OF ${pageCount}`;

    commands.push(rectangle(0, 690, 612, 102, '18191F'));
    commands.push(rectangle(48, 721, 4, 38, 'D94F83'));
    commands.push(text(64, 746, 'Y2K TECH SHOP', 10, 'F4A8C6', true));
    commands.push(text(64, 719, 'PURCHASE RECEIPT', 21, 'FFFFFF', true));
    commands.push(text(470, 743, pageLabel, 8, 'D6D7DB', true));
    commands.push(text(470, 724, order.paymentMethod === 'COD' ? 'CASH ON DELIVERY' : 'ONLINE PAYMENT', 8, 'FFFFFF', true));

    if (!continued) {
        commands.push(text(48, 660, `ORDER  #${order._id}`, 10, '24252B', true));
        commands.push(text(48, 642, `DATE  ${new Date(order.createdAt || Date.now()).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`, 9, '666A73'));
        commands.push(text(48, 624, `PAYMENT  ${getOrderPaymentDescription(order)}`.slice(0, 68), 9, '666A73'));
        commands.push(text(48, 606, `ORDER STATUS  ${order.orderStatus || 'Processing'}`.slice(0, 68), 9, '666A73'));
        commands.push(text(340, 660, 'SHIP TO', 8, '858993', true));
        commands.push(text(340, 643, String(order.shippingInfo?.address || '').slice(0, 38), 9, '24252B'));
        commands.push(text(340, 627, `${order.shippingInfo?.city || ''} ${order.shippingInfo?.postalCode || ''}`.trim().slice(0, 38), 9, '24252B'));
    } else {
        commands.push(text(48, 655, `ORDER  #${order._id}  /  CONTINUED`, 10, '24252B', true));
    }

    commands.push(rectangle(48, tableTop - 20, 516, 25, 'F2F3F5'));
    commands.push(text(58, tableTop - 11, 'ITEM', 8, '666A73', true));
    commands.push(text(382, tableTop - 11, 'QTY', 8, '666A73', true));
    commands.push(text(430, tableTop - 11, 'UNIT PRICE', 8, '666A73', true));
    commands.push(text(510, tableTop - 11, 'AMOUNT', 8, '666A73', true));

    pageItems.forEach((item, index) => {
        const y = rowStart - index * rowHeight;
        const name = String(item.name || 'Product').replace(/[^\x20-\x7E]/g, '?');
        commands.push(text(58, y, name.slice(0, 47), 9, '24252B'));
        commands.push(text(388, y, String(item.quantity), 9, '24252B'));
        commands.push(text(430, y, formatMoney(item.price), 8, '666A73'));
        commands.push(text(510, y, formatMoney(item.price * item.quantity), 8, '24252B', true));
        if (index < pageItems.length - 1) commands.push(rectangle(48, y - 8, 516, 0.6, 'E7E8EB'));
    });

    if (pageIndex === pageCount - 1) {
        const lastItemY = rowStart - Math.max(pageItems.length - 1, 0) * rowHeight;
        const totalsY = Math.min(lastItemY - 38, 150);
        commands.push(rectangle(48, totalsY + 18, 516, 0.8, 'DCDDDF'));
        commands.push(text(360, totalsY, 'Subtotal', 9, '666A73'));
        commands.push(text(490, totalsY, formatMoney(order.itemsPrice), 9, '24252B', true));
        commands.push(text(360, totalsY - 18, 'Shipping', 9, '666A73'));
        commands.push(text(490, totalsY - 18, formatMoney(order.shippingPrice), 9, '24252B', true));
        commands.push(text(360, totalsY - 36, 'Tax', 9, '666A73'));
        commands.push(text(490, totalsY - 36, formatMoney(order.taxPrice), 9, '24252B', true));
        commands.push(rectangle(344, totalsY - 66, 220, 22, '18191F'));
        commands.push(text(356, totalsY - 59, 'GRAND TOTAL', 9, 'FFFFFF', true));
        commands.push(text(490, totalsY - 59, formatMoney(order.totalPrice), 9, 'FFFFFF', true));
        commands.push(text(48, 49, 'Thank you for shopping with Y2K Tech Shop.', 9, '666A73'));
        commands.push(text(48, 34, 'Keep this receipt for your records.', 8, '858993'));
    } else {
        commands.push(text(48, 42, 'Continued on next page.', 8, '858993'));
    }

    commands.push(text(501, 34, pageLabel, 8, '858993'));
    return commands.join('\n');
};

const createReceiptPdf = (order) => {
    const orderItems = order.orderItems || [];
    const itemsPerPage = 16;
    const pageCount = Math.max(1, Math.ceil(orderItems.length / itemsPerPage));
    const pages = Array.from({ length: pageCount }, (_, index) =>
        createReceiptPage(order, orderItems.slice(index * itemsPerPage, (index + 1) * itemsPerPage), index, pageCount)
    );
    const pagesId = 2;
    const fontRegularId = 3 + pageCount * 2;
    const fontBoldId = fontRegularId + 1;
    const pageReferences = pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pageReferences}] /Count ${pageCount} >>`
    ];

    pages.forEach((stream, index) => {
        const pageId = 3 + index * 2;
        const contentId = pageId + 1;
        objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
        objects.push(`<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`);
    });

    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(Buffer.byteLength(pdf, 'ascii'));
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index += 1) {
        pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'ascii');
};

const createOrderEmailMessage = (order, customerName, statusUpdate = false) => {
    const paymentMessage = getOrderPaymentDescription(order);
    const itemLines = (order.orderItems || []).map((item) =>
        `${item.quantity} x ${item.name} @ ${formatMoney(item.price)} = ${formatMoney(item.price * item.quantity)}`
    );
    const orderDetails = [
        `Order status: ${order.orderStatus}`,
        `Payment status: ${paymentMessage}`,
        '',
        'Items:',
        ...itemLines,
        `Subtotal: ${formatMoney(order.itemsPrice)}`,
        `Shipping: ${formatMoney(order.shippingPrice)}`,
        `Tax: ${formatMoney(order.taxPrice)}`,
        `Grand total: ${formatMoney(order.totalPrice)}`
    ].join('\n');

    return `Hi ${customerName},\n\n${statusUpdate ? 'Your order has been updated.' : 'Your order is confirmed.'}\n\n${orderDetails}\n\nYour PDF receipt is attached.`;
};

module.exports = { createReceiptPdf, createOrderEmailMessage, formatMoney };
