import { EquipmentItem } from '../types/inventory';
import { calculateItemProfitMetrics } from './calculations';

/**
 * Escapes a single CSV field value according to RFC 4180
 */
function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export a list of equipment items to a formatted CSV file and trigger download
 */
export function exportInventoryToCsv(items: EquipmentItem[], filename?: string): void {
  const headers = [
    'ID',
    'Item Name',
    'Category',
    'Brand',
    'Model',
    'Serial Number',
    'Condition',
    'Status',
    'Quantity',
    'Purchase Price (Br)',
    'Retail Listing Price (Br)',
    'Sold Price (Br)',
    'Profit / Loss (Br)',
    'Margin %',
    'Sold Date',
    'Customer Name',
    'Customer Phone',
    'Location',
    'Warranty (Months)',
    'Notes',
    'Created At'
  ];

  const rows = items.map((item) => {
    const metrics = calculateItemProfitMetrics(item);
    return [
      escapeCsvCell(item.id),
      escapeCsvCell(item.name),
      escapeCsvCell(item.category),
      escapeCsvCell(item.brand),
      escapeCsvCell(item.model || ''),
      escapeCsvCell(item.serial_number || ''),
      escapeCsvCell(item.condition),
      escapeCsvCell(item.status),
      escapeCsvCell(item.quantity),
      escapeCsvCell(item.purchase_price),
      escapeCsvCell(item.retail_price),
      escapeCsvCell(item.sold_price !== null ? item.sold_price : ''),
      escapeCsvCell(metrics.profit.toFixed(2)),
      escapeCsvCell(metrics.marginPercent.toFixed(1) + '%'),
      escapeCsvCell(item.sold_at || ''),
      escapeCsvCell(item.customer_name || ''),
      escapeCsvCell(item.customer_phone || ''),
      escapeCsvCell(item.location || ''),
      escapeCsvCell(item.warranty_period_months),
      escapeCsvCell(item.notes || ''),
      escapeCsvCell(item.created_at)
    ].join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', filename || `shop-inventory-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
