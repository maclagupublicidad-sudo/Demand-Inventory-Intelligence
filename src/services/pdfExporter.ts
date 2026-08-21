import { jsPDF } from 'jspdf';
import { Garment, PurchaseOrder, RawMaterial } from '../types';

export function exportPurchaseOrderToPDF(order: PurchaseOrder, companyName = 'TextilIQ Confecciones S.A.S.') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background: Colombian Textile Forest Sage Green
  doc.setFillColor(45, 70, 50); // #2D4632
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE COMPRA DE MATERIA PRIMA', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName} • Planificación MRP & Manufactura`, 14, 20);

  // Order meta right side
  doc.text(`OC N°: ${order.id}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Fecha: ${order.orderDate}`, pageWidth - 14, 18, { align: 'right' });
  doc.text(`Estado: ${order.status.toUpperCase()}`, pageWidth - 14, 24, { align: 'right' });

  // Supplier Card Box
  doc.setFillColor(250, 248, 245); // Ivory tint
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(14, 34, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setTextColor(28, 33, 29);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL PROVEEDOR:', 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${order.supplierName}`, 18, 48);
  doc.text(`Fecha Estimada de Entrega en Planta: ${order.expectedDeliveryDate}`, 18, 54);

  doc.text(`Total Ítems: ${order.items.length}`, pageWidth - 20, 48, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Total a Pagar: $ ${Math.round(order.totalAmount).toLocaleString('es-CO')} COP`, pageWidth - 20, 54, { align: 'right' });

  // Table Headers
  const startY = 68;
  doc.setFillColor(235, 242, 236); // Sage light
  doc.rect(14, startY, pageWidth - 28, 8, 'F');
  doc.setDrawColor(200, 215, 205);
  doc.line(14, startY + 8, pageWidth - 14, startY + 8);

  doc.setTextColor(45, 70, 50);
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
      doc.setFillColor(250, 248, 245);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
    }

    doc.setTextColor(28, 33, 29);
    doc.text(item.rawMaterialSku, 18, currentY);

    const nameTruncated = item.rawMaterialName.length > 36 ? `${item.rawMaterialName.substring(0, 34)}...` : item.rawMaterialName;
    doc.text(nameTruncated, 48, currentY);
    doc.text(item.category, 115, currentY);
    doc.text(`${item.quantity.toLocaleString()} ${item.unit}`, 145, currentY, { align: 'right' });
    doc.text(`$ ${Math.round(item.unitCost).toLocaleString('es-CO')}`, 165, currentY, { align: 'right' });
    doc.text(`$ ${Math.round(item.subtotal).toLocaleString('es-CO')}`, pageWidth - 18, currentY, { align: 'right' });

    currentY += 8;
  });

  // Table bottom border
  doc.setDrawColor(200, 215, 205);
  doc.line(14, currentY - 2, pageWidth - 14, currentY - 2);

  // Total Summary Box
  const totalBoxY = currentY + 4;
  doc.setFillColor(235, 242, 236);
  doc.roundedRect(pageWidth - 85, totalBoxY, 71, 20, 1, 1, 'F');

  doc.setFontSize(9);
  doc.setTextColor(75, 90, 80);
  doc.text('Subtotal:', pageWidth - 80, totalBoxY + 6);
  doc.text(`$ ${Math.round(order.totalAmount).toLocaleString('es-CO')}`, pageWidth - 18, totalBoxY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(35, 56, 41);
  doc.text('TOTAL OC (COP):', pageWidth - 80, totalBoxY + 14);
  doc.text(`$ ${Math.round(order.totalAmount).toLocaleString('es-CO')} COP`, pageWidth - 18, totalBoxY + 14, { align: 'right' });

  // Notes & Signatures
  const footerY = Math.max(totalBoxY + 28, 235);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 110);
  doc.text('Términos: Entrega en planta de confección. Inspección de rollos conforme a sistema de 4 puntos ASTM.', 14, footerY);

  // Signatures
  doc.setDrawColor(148, 163, 155);
  doc.line(20, footerY + 25, 80, footerY + 25);
  doc.line(pageWidth - 80, footerY + 25, pageWidth - 20, footerY + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Aprobado por: Cadena de Suministro', 50, footerY + 30, { align: 'center' });
  doc.text('Recibido por Proveedor', pageWidth - 50, footerY + 30, { align: 'center' });

  // Save PDF
  doc.save(`OC_${order.id}_${order.supplierName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export function exportGarmentTechPackPDF(garment: Garment, rawMaterials: RawMaterial[], companyName = 'TextilIQ Confecciones S.A.S.') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Bar
  doc.setFillColor(45, 70, 50);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FICHA TÉCNICA DE CONFECCIÓN & MANUFACTURA', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName} • Tech Pack & Standard SAM Routing`, 14, 19);

  doc.text(`SKU: ${garment.sku}`, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Fecha: ${new Date().toISOString().split('T')[0]}`, pageWidth - 14, 19, { align: 'right' });

  // Garment Profile Card
  doc.setFillColor(250, 248, 245);
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(14, 30, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(28, 33, 29);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(garment.name, 18, 38);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Categoría: ${garment.category}`, 18, 44);
  doc.text(`Meta Ciclo: ${garment.targetSales.toLocaleString()} u | Stock: ${garment.finishedGoodsStock} u`, 18, 50);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 70, 50);
  doc.text(`PVP Sugerido: $ ${garment.retailPrice.toLocaleString('es-CO')} COP`, pageWidth - 20, 38, { align: 'right' });
  doc.text(`SAM Total: ${garment.productionTimes?.totalManufacturingMinutes || 25} min`, pageWidth - 20, 44, { align: 'right' });

  // Section 1: BOM
  let y = 60;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(28, 33, 29);
  doc.text('1. ESTRUCTURA DE MATERIALES & CONSUMO (BOM)', 14, y);

  y += 4;
  doc.setFillColor(235, 242, 236);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFontSize(7.5);
  doc.text('INSUMO / MATERIAL', 18, y + 4.8);
  doc.text('TIPO', 85, y + 4.8);
  doc.text('CONSUMO UNIT.', 125, y + 4.8, { align: 'right' });
  doc.text('MERMA %', 150, y + 4.8, { align: 'right' });
  doc.text('COSTO EST.', pageWidth - 18, y + 4.8, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');

  garment.bom.forEach((item, idx) => {
    const mat = rawMaterials.find(m => m.id === item.rawMaterialId);
    const unitCost = mat?.unitCost || 0;
    const effQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
    const cost = effQty * unitCost;

    if (idx % 2 === 1) {
      doc.setFillColor(250, 248, 245);
      doc.rect(14, y - 1, pageWidth - 28, 6, 'F');
    }

    doc.text(item.rawMaterialName.length > 32 ? `${item.rawMaterialName.substring(0, 30)}...` : item.rawMaterialName, 18, y + 3.5);
    doc.text(item.category, 85, y + 3.5);
    doc.text(`${item.quantityPerGarment} ${item.unit}`, 125, y + 3.5, { align: 'right' });
    doc.text(`${item.wastePercent}%`, 150, y + 3.5, { align: 'right' });
    doc.text(`$ ${Math.round(cost).toLocaleString('es-CO')}`, pageWidth - 18, y + 3.5, { align: 'right' });

    y += 6;
  });

  // Section 2: Operations SAM Routing
  if (garment.operationsRouting && garment.operationsRouting.length > 0) {
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 33, 29);
    doc.text('2. RUTA DE OPERACIONES & TIEMPOS ESTÁNDAR (SAM)', 14, y);

    y += 4;
    doc.setFillColor(235, 242, 236);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(7.5);
    doc.text('#', 18, y + 4.8);
    doc.text('OPERACIÓN', 26, y + 4.8);
    doc.text('DPTO', 95, y + 4.8);
    doc.text('MAQUINARIA', 135, y + 4.8);
    doc.text('SAM (MIN)', pageWidth - 18, y + 4.8, { align: 'right' });

    y += 7;
    doc.setFont('helvetica', 'normal');

    garment.operationsRouting.forEach((op, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(250, 248, 245);
        doc.rect(14, y - 1, pageWidth - 28, 6, 'F');
      }

      doc.text(`${op.stepNumber}`, 18, y + 3.5);
      doc.text(op.operationName.length > 34 ? `${op.operationName.substring(0, 32)}...` : op.operationName, 26, y + 3.5);
      doc.text(op.department, 95, y + 3.5);
      doc.text(op.machinery, 135, y + 3.5);
      doc.text(`${op.standardMinutes.toFixed(1)} min`, pageWidth - 18, y + 3.5, { align: 'right' });

      y += 6;
    });
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(110, 120, 115);
  doc.text('TextilIQ Confecciones S.A.S. • Documento Técnico de Producción e Ingeniería Textil', 14, 285);

  doc.save(`FichaTecnica_${garment.sku}_${garment.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}
