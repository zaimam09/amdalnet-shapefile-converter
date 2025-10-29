import PDFDocument from 'pdfkit';
import { Polygon } from '../drizzle/schema';

interface PDFMapOptions {
  projectName: string;
  polygon: Polygon;
  coordinateSystem: string;
  userName: string;
  userEmail: string;
}

export async function generateMapPDF(options: PDFMapOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create A3 landscape document (420mm x 297mm = 1191pt x 842pt at 72dpi)
      const doc = new PDFDocument({
        size: [1191, 842], // A3 landscape in points
        margin: 0,
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

      // Layout constants
      const pageWidth = 1191;
      const pageHeight = 842;
      const margin = 20;
      
      // Main map area (left side - 70%)
      const mapX = margin;
      const mapY = margin;
      const mapWidth = 820;
      const mapHeight = pageHeight - (2 * margin);
      
      // Info panel (right side - 30%)
      const panelX = mapX + mapWidth + margin;
      const panelY = margin;
      const panelWidth = pageWidth - panelX - margin;
      const panelHeight = pageHeight - (2 * margin);

      // Draw main map area with border
      drawMapWithBorder(doc, mapX, mapY, mapWidth, mapHeight, options.polygon);

      // Draw right panel
      drawRightPanel(doc, panelX, panelY, panelWidth, panelHeight, options);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawMapWithBorder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  polygon: Polygon
) {
  // Outer border (thick black)
  doc.rect(x, y, width, height)
    .lineWidth(3)
    .strokeColor('#000')
    .stroke();

  // Inner map area with coordinate grid
  const gridMargin = 40; // Space for coordinate labels
  const innerX = x + gridMargin;
  const innerY = y + gridMargin;
  const innerWidth = width - (2 * gridMargin);
  const innerHeight = height - (2 * gridMargin);

  // Draw inner border
  doc.rect(innerX, innerY, innerWidth, innerHeight)
    .lineWidth(2)
    .strokeColor('#000')
    .stroke();

  // Draw grid lines
  doc.strokeColor('#cccccc')
    .lineWidth(0.5);
  
  const gridSteps = 10;
  
  // Vertical grid lines
  for (let i = 1; i < gridSteps; i++) {
    const gridX = innerX + (innerWidth / gridSteps) * i;
    doc.moveTo(gridX, innerY)
      .lineTo(gridX, innerY + innerHeight)
      .stroke();
  }
  
  // Horizontal grid lines
  for (let i = 1; i < gridSteps; i++) {
    const gridY = innerY + (innerHeight / gridSteps) * i;
    doc.moveTo(innerX, gridY)
      .lineTo(innerX + innerWidth, gridY)
      .stroke();
  }

  // Draw polygon
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
      const padding = 0.15;
      const lonRange = maxLon - minLon;
      const latRange = maxLat - minLat;
      minLon -= lonRange * padding;
      maxLon += lonRange * padding;
      minLat -= latRange * padding;
      maxLat += latRange * padding;
      
      // Draw coordinate labels
      doc.fontSize(8)
        .fillColor('#000')
        .font('Helvetica');
      
      // Top and bottom coordinates (longitude)
      const lonLabels = 4;
      for (let i = 0; i <= lonLabels; i++) {
        const lon = minLon + (maxLon - minLon) * (i / lonLabels);
        const labelX = innerX + (innerWidth * i / lonLabels);
        const lonText = formatCoordinate(lon, 'E');
        
        // Top
        doc.text(lonText, labelX - 30, y + 10, { width: 60, align: 'center' });
        // Bottom
        doc.text(lonText, labelX - 30, y + height - 25, { width: 60, align: 'center' });
      }
      
      // Left and right coordinates (latitude)
      const latLabels = 4;
      for (let i = 0; i <= latLabels; i++) {
        const lat = maxLat - (maxLat - minLat) * (i / latLabels);
        const labelY = innerY + (innerHeight * i / latLabels);
        const latText = formatCoordinate(lat, 'S');
        
        // Left
        doc.text(latText, x + 5, labelY - 5, { width: 30, align: 'left' });
        // Right
        doc.text(latText, x + width - 35, labelY - 5, { width: 30, align: 'right' });
      }
      
      // Scale coordinates to map area
      const scaleX = innerWidth / (maxLon - minLon);
      const scaleY = innerHeight / (maxLat - minLat);
      const scale = Math.min(scaleX, scaleY);
      
      // Center the polygon
      const offsetX = innerX + (innerWidth - (maxLon - minLon) * scale) / 2;
      const offsetY = innerY + (innerHeight - (maxLat - minLat) * scale) / 2;
      
      // Draw polygon with yellow fill and black border
      doc.fillColor('#FFD700', 1) // Yellow
        .strokeColor('#000000')
        .lineWidth(2);
      
      coords.forEach(([lon, lat]: [number, number], index: number) => {
        const px = offsetX + (lon - minLon) * scale;
        const py = offsetY + innerHeight - (lat - minLat) * scale; // Flip Y axis
        
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

  // Draw scale bar at bottom left
  const scaleX = innerX + 20;
  const scaleY = innerY + innerHeight - 50;
  drawScaleBar(doc, scaleX, scaleY);

  // Draw north arrow at top right
  const northX = innerX + innerWidth - 50;
  const northY = innerY + 20;
  drawNorthArrow(doc, northX, northY);
}

function drawRightPanel(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PDFMapOptions
) {
  const { projectName, polygon, coordinateSystem } = options;
  
  let currentY = y;
  const sectionPadding = 0; // No padding to eliminate gaps
  
  // Calculate proportional heights to fill entire panel
  const totalHeight = height;
  const section1Height = Math.floor(totalHeight * 0.12); // 12% for title
  doc.rect(x, currentY, width, section1Height)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  doc.fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('PETA LOKASI KEGIATAN', x + 10, currentY + 10, { width: width - 20, align: 'center' });
  
  doc.fontSize(12)
    .text(polygon.pemrakarsa.toUpperCase(), x + 10, currentY + 32, { width: width - 20, align: 'center' });
  
  doc.fontSize(10)
    .font('Helvetica')
    .text(polygon.kegiatan.toUpperCase(), x + 10, currentY + 55, { width: width - 20, align: 'center' });
  
  currentY += section1Height;
  
  // === SECTION 2: Technical Info ===
  const section2Height = Math.floor(totalHeight * 0.13); // 13% for technical info
  doc.rect(x, currentY, width, section2Height)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  let infoY = currentY + 15;
  doc.fontSize(9)
    .font('Helvetica');
  
  const infoItems = [
    { label: 'Skala', value: ': 1:10.000 (A3)' },
    { label: 'Proyeksi', value: ': Transverse Mercator' },
    { label: 'Sistem Grid', value: ': Geografi' },
    { label: 'Datum Horizontal', value: ': WGS84 - Zona 49 S' },
  ];
  
  infoItems.forEach(({ label, value }) => {
    doc.font('Helvetica')
      .text(label, x + 15, infoY, { width: 70, continued: false });
    doc.text(value, x + 85, infoY, { width: width - 100 });
    infoY += 18;
  });
  
  currentY += section2Height;
  
  // === SECTION 3: KETERANGAN + Coordinate Table ===
  const section3Height = Math.floor(totalHeight * 0.35); // 35% for keterangan + table
  doc.rect(x, currentY, width, section3Height)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  let section3Y = currentY + 10;
  
  // KETERANGAN title
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('KETERANGAN', x + 10, section3Y);
  
  section3Y += 20;
  
  // Legend items with bullet points
  const legendItems = [
    { symbol: '•', label: 'Titik ikat Tapak/Lokasi Kegiatan' },
    { symbol: '---', label: 'Batas Kelurahan/Desa' },
    { symbol: '—', label: 'Sungai' },
    { symbol: '—', label: 'Jalan' },
  ];
  
  doc.fontSize(8)
    .font('Helvetica');
  
  legendItems.forEach((item) => {
    doc.text(item.symbol, x + 15, section3Y, { width: 15, continued: false });
    doc.text(item.label, x + 30, section3Y, { width: width - 50 });
    section3Y += 14;
  });
  
  // Polygon symbol
  section3Y += 5;
  doc.rect(x + 15, section3Y - 2, 12, 8)
    .fillColor('#FFD700')
    .strokeColor('#000')
    .lineWidth(1)
    .fillAndStroke();
  
  doc.fillColor('#000')
    .fontSize(8)
    .font('Helvetica')
    .text('Tapak/Lokasi Kegiatan', x + 30, section3Y);
  
  section3Y += 20;
  
  // Coordinate table title
  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text('Titik ikat  Tapak/Lokasi Kegiatan', x + width / 2, section3Y, { width: width, align: 'center' });
  
  section3Y += 18;
  
  // Coordinate table
  const tableX = x + 10;
  const tableWidth = width - 20;
  const colWidths = [tableWidth * 0.15, tableWidth * 0.425, tableWidth * 0.425];
  const tableStartY = section3Y;
  
  // Table header
  doc.rect(tableX, tableStartY, colWidths[0], 16)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.rect(tableX + colWidths[0], tableStartY, colWidths[1], 16)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.rect(tableX + colWidths[0] + colWidths[1], tableStartY, colWidths[2], 16)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.fillColor('#000')
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('No.', tableX + 2, tableStartY + 5, { width: colWidths[0] - 4, align: 'center' })
    .text('X', tableX + colWidths[0] + 2, tableStartY + 5, { width: colWidths[1] - 4, align: 'center' })
    .text('Y', tableX + colWidths[0] + colWidths[1] + 2, tableStartY + 5, { width: colWidths[2] - 4, align: 'center' });
  
  // Table rows (first 4 coordinates like example)
  try {
    const geometry = JSON.parse(polygon.geometry);
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0].slice(0, 4); // First 4 points
      
      let rowY = tableStartY + 16;
      coords.forEach(([lon, lat]: [number, number], index: number) => {
        doc.rect(tableX, rowY, colWidths[0], 14)
          .strokeColor('#000')
          .lineWidth(0.3)
          .stroke();
        
        doc.rect(tableX + colWidths[0], rowY, colWidths[1], 14)
          .strokeColor('#000')
          .lineWidth(0.3)
          .stroke();
        
        doc.rect(tableX + colWidths[0] + colWidths[1], rowY, colWidths[2], 14)
          .strokeColor('#000')
          .lineWidth(0.3)
          .stroke();
        
        doc.fillColor('#000')
          .fontSize(6)
          .font('Helvetica')
          .text((index + 1).toString(), tableX + 2, rowY + 4, { width: colWidths[0] - 4, align: 'center' })
          .text(formatCoordinate(lon, 'E'), tableX + colWidths[0] + 2, rowY + 4, { width: colWidths[1] - 4, align: 'center' })
          .text(formatCoordinate(lat, 'S'), tableX + colWidths[0] + colWidths[1] + 2, rowY + 4, { width: colWidths[2] - 4, align: 'center' });
        
        rowY += 14;
      });
    }
  } catch (error) {
    console.error('Error drawing coordinate table:', error);
  }
  
  currentY += section3Height;
  
  // === SECTION 4: Inset Map (Peta Orientasi Indonesia) ===
  const section4Height = Math.floor(totalHeight * 0.25); // 25% for inset map
  doc.rect(x, currentY, width, section4Height)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  // Draw simplified Indonesia outline
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#666')
    .text('Peta Inset Indonesia', x + width / 2, currentY + section4Height / 2, { width: width, align: 'center' });
  
  // Add coordinate labels
  doc.fontSize(6)
    .text("112°0'0\"E", x + 10, currentY + section4Height - 10)
    .text("112°15'0\"E", x + width / 2, currentY + section4Height - 10, { width: 50, align: 'center' })
    .text("112°30'0\"E", x + width - 40, currentY + section4Height - 10);
  
  currentY += section4Height;
  
  // === SECTION 5: Source & User Info ===
  // Fill remaining space to bottom
  const section5Height = y + height - currentY;
  doc.rect(x, currentY, width, section5Height)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  let section5Y = currentY + 10;
  
  // SUMBER PETA
  doc.fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('SUMBER PETA:', x + 10, section5Y);
  
  section5Y += 20;
  
  // User info box
  doc.rect(x + 10, section5Y, width - 20, 50)
    .fillColor('#f5f5f5')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.fontSize(7)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('Dibuat oleh:', x + 15, section5Y + 5);
  
  doc.fontSize(7)
    .font('Helvetica')
    .text(options.userName, x + 15, section5Y + 17);
  
  if (options.userEmail) {
    doc.text(options.userEmail, x + 15, section5Y + 27);
  }
  
  // Date
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  doc.fontSize(6)
    .text(`Tanggal: ${dateStr}`, x + 15, section5Y + 37);
  
  // Footer
  section5Y += 60;
  doc.fontSize(6)
    .font('Helvetica')
    .fillColor('#999')
    .text('Created by - AMDALNET Shapefile Converter', x + 10, section5Y, { width: width - 20, align: 'center' });
}

function drawScaleBar(doc: PDFKit.PDFDocument, x: number, y: number) {
  const barWidth = 100;
  const barHeight = 8;
  
  // Black section
  doc.rect(x, y, barWidth / 2, barHeight)
    .fillColor('#000')
    .fill();
  
  // White section
  doc.rect(x + barWidth / 2, y, barWidth / 2, barHeight)
    .fillColor('#fff')
    .strokeColor('#000')
    .lineWidth(1)
    .fillAndStroke();
  
  // Border around entire scale bar
  doc.rect(x, y, barWidth, barHeight)
    .strokeColor('#000')
    .lineWidth(1)
    .stroke();
  
  // Labels
  doc.fillColor('#000')
    .fontSize(7)
    .font('Helvetica')
    .text('0', x - 5, y + barHeight + 3)
    .text('500m', x + barWidth / 2 - 15, y + barHeight + 3)
    .text('1km', x + barWidth - 15, y + barHeight + 3);
}

function drawNorthArrow(doc: PDFKit.PDFDocument, x: number, y: number) {
  // Draw a simple north arrow
  const size = 30;
  
  // Arrow triangle
  doc.moveTo(x, y)
    .lineTo(x - 10, y + size)
    .lineTo(x + 10, y + size)
    .closePath()
    .fillColor('#000')
    .fill();
  
  // N label
  doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('N', x - 5, y + size + 5);
}

function formatCoordinate(value: number, direction: 'E' | 'S'): string {
  const degrees = Math.floor(Math.abs(value));
  const minutesDecimal = (Math.abs(value) - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(3);
  
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}
