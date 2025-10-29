import PDFDocument from 'pdfkit';
import { Polygon } from '../drizzle/schema';

interface PDFMapOptions {
  projectName: string;
  polygon: Polygon;
  coordinateSystem: string;
}

export async function generateMapPDF(options: PDFMapOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create A3 landscape document (420mm x 297mm = 1191pt x 842pt at 72dpi)
      const doc = new PDFDocument({
        size: [1191, 842], // A3 landscape in points
        margin: 40,
        info: {
          Title: `Peta Tapak Proyek - ${options.projectName}`,
          Author: 'AMDALNET Shapefile Converter',
          Subject: 'Peta Tapak Proyek AMDALNET',
          Creator: 'AMDALNET Shapefile Converter',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      drawHeader(doc, options.projectName);

      // Main content area
      const contentY = 120;
      
      // Map area (left side - 60% width)
      const mapWidth = 680;
      const mapHeight = 500;
      const mapX = 50;
      const mapY = contentY;
      
      drawMapArea(doc, mapX, mapY, mapWidth, mapHeight, options.polygon);

      // Info panel (right side - 35% width)
      const panelX = mapX + mapWidth + 30;
      const panelWidth = 380;
      
      drawInfoPanel(doc, panelX, mapY, panelWidth, options);

      // Legend
      drawLegend(doc, mapX, mapY + mapHeight + 20);

      // Scale bar
      drawScaleBar(doc, mapX + 20, mapY + mapHeight - 40);

      // North arrow
      drawNorthArrow(doc, mapX + mapWidth - 60, mapY + 20);

      // Attribute table
      drawAttributeTable(doc, mapX, mapY + mapHeight + 80, mapWidth, options.polygon);

      // Footer
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, projectName: string) {
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .text('PETA TAPAK PROYEK', 50, 40, { align: 'center' });
  
  doc.fontSize(14)
    .font('Helvetica')
    .text(projectName, 50, 70, { align: 'center' });
  
  // Horizontal line
  doc.strokeColor('#2563eb')
    .lineWidth(2)
    .moveTo(50, 100)
    .lineTo(1141, 100)
    .stroke();
}

function drawMapArea(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  polygon: Polygon
) {
  // Draw map border
  doc.rect(x, y, width, height)
    .strokeColor('#333')
    .lineWidth(1)
    .stroke();

  // Draw grid background
  doc.strokeColor('#e5e7eb')
    .lineWidth(0.5);
  
  // Vertical grid lines
  for (let i = 0; i <= 10; i++) {
    const gridX = x + (width / 10) * i;
    doc.moveTo(gridX, y)
      .lineTo(gridX, y + height)
      .stroke();
  }
  
  // Horizontal grid lines
  for (let i = 0; i <= 10; i++) {
    const gridY = y + (height / 10) * i;
    doc.moveTo(x, gridY)
      .lineTo(x + width, gridY)
      .stroke();
  }

  // Draw polygon representation (simplified)
  try {
    const geometry = JSON.parse(polygon.geometry);
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0];
      
      // Calculate bounds
      let minLon = Infinity, maxLon = -Infinity;
      let minLat = Infinity, maxLat = -Infinity;
      
      coords.forEach(([lon, lat]: [number, number]) => {
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
      
      // Add padding
      const padding = 0.1;
      const lonRange = maxLon - minLon;
      const latRange = maxLat - minLat;
      minLon -= lonRange * padding;
      maxLon += lonRange * padding;
      minLat -= latRange * padding;
      maxLat += latRange * padding;
      
      // Scale coordinates to map area
      const scaleX = width / (maxLon - minLon);
      const scaleY = height / (maxLat - minLat);
      const scale = Math.min(scaleX, scaleY);
      
      // Center the polygon
      const offsetX = x + (width - (maxLon - minLon) * scale) / 2;
      const offsetY = y + (height - (maxLat - minLat) * scale) / 2;
      
      // Draw polygon
      doc.fillColor('#22c55e', 0.3)
        .strokeColor('#16a34a')
        .lineWidth(2);
      
      coords.forEach(([lon, lat]: [number, number], index: number) => {
        const px = offsetX + (lon - minLon) * scale;
        const py = offsetY + height - (lat - minLat) * scale; // Flip Y axis
        
        if (index === 0) {
          doc.moveTo(px, py);
        } else {
          doc.lineTo(px, py);
        }
      });
      
      doc.closePath()
        .fillAndStroke();
    }
  } catch (error) {
    console.error('Error drawing polygon:', error);
  }

  // Map title
  doc.fontSize(10)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Peta Lokasi Tapak Proyek', x + 10, y + 10);
}

function drawInfoPanel(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  options: PDFMapOptions
) {
  const { polygon, coordinateSystem } = options;
  
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('INFORMASI TAPAK PROYEK', x, y);
  
  let currentY = y + 25;
  const lineHeight = 20;
  
  const info = [
    { label: 'Nama Layer', value: polygon.layer },
    { label: 'Sistem Koordinat', value: coordinateSystem },
    { label: 'Luas Total', value: `${parseFloat(polygon.area).toFixed(2)} ha` },
    { label: 'ID Tapak Proyek', value: polygon.objectId.toString() },
    { label: 'Pemrakarsa', value: polygon.pemrakarsa },
    { label: 'Kegiatan', value: polygon.kegiatan },
    { label: 'Tahun', value: polygon.tahun.toString() },
    { label: 'Provinsi', value: polygon.provinsi },
  ];
  
  doc.fontSize(9).font('Helvetica');
  
  info.forEach(({ label, value }) => {
    doc.font('Helvetica-Bold')
      .text(label + ':', x, currentY, { width: width, continued: false });
    
    doc.font('Helvetica')
      .text(value, x, currentY + 12, { width: width });
    
    currentY += lineHeight + 12;
  });
  
  // Keterangan section
  currentY += 10;
  doc.font('Helvetica-Bold')
    .text('Keterangan:', x, currentY);
  
  doc.font('Helvetica')
    .fontSize(8)
    .text(polygon.keterangan, x, currentY + 15, { 
      width: width,
      align: 'justify',
    });
}

function drawLegend(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('LEGENDA', x, y);
  
  // Polygon symbol
  doc.rect(x, y + 20, 30, 20)
    .fillColor('#22c55e', 0.3)
    .strokeColor('#16a34a')
    .lineWidth(2)
    .fillAndStroke();
  
  doc.fillColor('#000')
    .font('Helvetica')
    .fontSize(9)
    .text('Tapak Proyek', x + 40, y + 25);
}

function drawScaleBar(doc: PDFKit.PDFDocument, x: number, y: number) {
  const barWidth = 100;
  const barHeight = 10;
  
  // Scale bar
  doc.rect(x, y, barWidth / 2, barHeight)
    .fillColor('#000')
    .fill();
  
  doc.rect(x + barWidth / 2, y, barWidth / 2, barHeight)
    .fillColor('#fff')
    .strokeColor('#000')
    .lineWidth(1)
    .fillAndStroke();
  
  // Labels
  doc.fillColor('#000')
    .fontSize(8)
    .font('Helvetica')
    .text('0', x - 5, y + barHeight + 5)
    .text('1 km', x + barWidth - 15, y + barHeight + 5);
  
  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text('SKALA', x + 15, y - 15);
}

function drawNorthArrow(doc: PDFKit.PDFDocument, x: number, y: number) {
  // Simple north arrow
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('↑', x, y);
  
  doc.fontSize(8)
    .font('Helvetica')
    .text('U', x + 5, y + 25);
}

function drawAttributeTable(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  polygon: Polygon
) {
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('TABEL ATRIBUT', x, y);
  
  const tableY = y + 20;
  const rowHeight = 20;
  const colWidths = [150, width - 150];
  
  const attributes = [
    ['OBJECTID_1', polygon.objectId.toString()],
    ['PEMRAKARSA', polygon.pemrakarsa],
    ['KEGIATAN', polygon.kegiatan],
    ['TAHUN', polygon.tahun.toString()],
    ['PROVINSI', polygon.provinsi],
    ['KETERANGAN', polygon.keterangan],
    ['LAYER', polygon.layer],
    ['AREA (ha)', parseFloat(polygon.area).toFixed(11)],
  ];
  
  // Table header
  doc.rect(x, tableY, colWidths[0], rowHeight)
    .fillColor('#2563eb')
    .fill();
  
  doc.rect(x + colWidths[0], tableY, colWidths[1], rowHeight)
    .fillColor('#2563eb')
    .fill();
  
  doc.fillColor('#fff')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Field', x + 5, tableY + 6)
    .text('Value', x + colWidths[0] + 5, tableY + 6);
  
  // Table rows
  let currentY = tableY + rowHeight;
  
  attributes.forEach(([field, value], index) => {
    const fillColor = index % 2 === 0 ? '#f3f4f6' : '#fff';
    
    doc.rect(x, currentY, colWidths[0], rowHeight)
      .fillColor(fillColor)
      .fill();
    
    doc.rect(x + colWidths[0], currentY, colWidths[1], rowHeight)
      .fillColor(fillColor)
      .fill();
    
    // Borders
    doc.rect(x, currentY, colWidths[0], rowHeight)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();
    
    doc.rect(x + colWidths[0], currentY, colWidths[1], rowHeight)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();
    
    doc.fillColor('#000')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(field, x + 5, currentY + 6, { width: colWidths[0] - 10 });
    
    doc.font('Helvetica')
      .text(value, x + colWidths[0] + 5, currentY + 6, { width: colWidths[1] - 10 });
    
    currentY += rowHeight;
  });
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const footerY = 802;
  
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#666')
    .text(
      `Tanggal Pembuatan: ${new Date().toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      })}`,
      50,
      footerY,
      { align: 'left' }
    );
  
  doc.text(
    'Sumber Data: AMDALNET Shapefile Converter',
    50,
    footerY,
    { align: 'right' }
  );
}
