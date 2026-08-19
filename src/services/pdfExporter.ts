import { jsPDF } from 'jspdf';
import { PurchaseOrder } from '../types';

export function exportPurchaseOrderToPDF(order: PurchaseOrder, companyName = 'TextilIQ Confecciones S.A.S.') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE COMPRA DE MATERIA PRIMA', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName} • Demand & Inventory Intelligence`, 14, 20);

  // Order meta right side
  doc.text(`OC N°: ${order.id}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Fecha: ${order.orderDate}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(`Estado: ${order.status.toUpperCase()}`, pageWidth - 14, 24, { align: 'right' });

  // Supplier Card Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(14, 34, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PROVEEDOR:', 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${order.supplierName}`, 18, 48);
  doc.text(`Fecha Estimada de Llegada a Planta: ${order.expectedDeliveryDate}`, 18, 54);

  doc.text(`Total Ítems: ${order.items.length}`, pageWidth - 20, 48, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Total a Pagar: $ ${Math.round(order.totalAmount).toLocaleString('es-CO')} COP`, pageWidth - 20, 54, { align: 'right' });

  // Table Headers
  const startY = 68;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, pageWidth - 28, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(14, startY + 8, pageWidth - 14, startY + 8);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SKU', 18, startY + 5.5);
  doc.text('DESCRIPCIÓN DE MATERIA PRIMA', 48, startY + 5.5);
  doc.text('CATEGORÍA', 115, startY + 5.5);
  doc.text('CANTIDAD', 145, startY + 5.5, { align: 'right' });
  doc.text('P. UNIT', 165, startY + 5.5, { align: 'right' });
  doc.text('SUBTOTAL', pageWidth - 18, startY + 5.5, { align: 'right' });

  let currentY = startY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  order.items.forEach((item, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(item.rawMaterialSku, 18, currentY);

    const nameTruncated = item.rawMaterialName.length > 38 ? `${item.rawMaterialName.substring(0, 36)}...` : item.rawMaterialName;
    doc.text(nameTruncated, 48, currentY);
    doc.text(item.category, 115, currentY);
    doc.text(`${item.quantity.toLocaleString()} ${item.unit}`, 145, currentY, { align: 'right' });
    doc.text(`$ ${Math.round(item.unitCost).toLocaleString('es-CO')}`, 165, currentY, { align: 'right' });
    doc.text(`$ ${Math.round(item.subtotal).toLocaleString('es-CO')}`, pageWidth - 18, currentY, { align: 'right' });

    currentY += 8;
  });

  // Table bottom border
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);

  // Total Summary Box
  const totalBoxY = currentY + 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(pageWidth - 85, totalBoxY, 71, 20, 1, 1, 'F');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', pageWidth - 80, totalBoxY + 6);
  doc.text(`$ ${Math.round(order.totalAmount).toLocaleString('es-CO')}`, pageWidth - 18, totalBoxY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL OC (COP):', pageWidth - 80, totalBoxY + 14);
  doc.text(`$ ${Math.round(order.totalAmount).toLocaleString('es-CO')} COP`, pageWidth - 18, totalBoxY + 14, { align: 'right' });

  // Notes & Signatures
  const footerY = Math.max(totalBoxY + 28, 235);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Términos: Entrega en planta de confección textil. Inspección de rollos conforme a sistema de 4 puntos ASTM.', 14, footerY);

  // Signatures
  doc.setDrawColor(148, 163, 184);
  doc.line(20, footerY + 25, 80, footerY + 25);
  doc.line(pageWidth - 80, footerY + 25, pageWidth - 20, footerY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Aprobado por: Compras y Cadena de Suministro', 50, footerY + 30, { align: 'center' });
  doc.text('Recibido / Aceptado por Proveedor', pageWidth - 50, footerY + 30, { align: 'center' });

  // Save PDF
  doc.save(`OC_${order.id}_${order.supplierName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
