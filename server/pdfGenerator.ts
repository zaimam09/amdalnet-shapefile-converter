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
  
  // Title box
  doc.rect(x, currentY, width, 80)
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
    .text(projectName.toUpperCase(), x + 10, currentY + 35, { width: width - 20, align: 'center' });
  
  doc.fontSize(10)
    .font('Helvetica')
    .text(polygon.kegiatan.toUpperCase(), x + 10, currentY + 55, { width: width - 20, align: 'center' });
  
  currentY += 90;
  
  // Info section
  doc.rect(x, currentY, width, 120)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  const infoY = currentY + 10;
  doc.fontSize(9)
    .font('Helvetica');
  
  const infoItems = [
    { label: 'Skala', value: '1:10,000 (A3)' },
    { label: 'Proyeksi', value: 'Transverse Mercator' },
    { label: 'Sistem Grid', value: 'Geografis' },
    { label: 'Datum Horizontal', value: coordinateSystem },
  ];
  
  let infoLineY = infoY;
  infoItems.forEach(({ label, value }) => {
    doc.font('Helvetica')
      .text(label, x + 15, infoLineY, { width: 80, continued: true })
      .text(': ' + value, { width: width - 100 });
    infoLineY += 20;
  });
  
  currentY += 130;
  
  // Legend section
  doc.rect(x, currentY, width, 120)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .text('KETERANGAN', x + 10, currentY + 10);
  
  currentY += 35;
  
  // Legend items
  const legendItems = [
    { color: '#000000', label: 'Batas Kelurahan/Desa', type: 'line' },
    { color: '#0000FF', label: 'Sungai', type: 'line' },
    { color: '#808080', label: 'Jalan', type: 'line' },
    { color: '#FFD700', label: 'Tapak/Lokasi Kegiatan', type: 'polygon' },
  ];
  
  legendItems.forEach((item) => {
    if (item.type === 'line') {
      doc.moveTo(x + 15, currentY + 5)
        .lineTo(x + 35, currentY + 5)
        .strokeColor(item.color)
        .lineWidth(2)
        .stroke();
    } else {
      doc.rect(x + 15, currentY, 20, 10)
        .fillColor(item.color)
        .strokeColor('#000')
        .lineWidth(1)
        .fillAndStroke();
    }
    
    doc.fillColor('#000')
      .fontSize(8)
      .font('Helvetica')
      .text(item.label, x + 45, currentY + 2);
    
    currentY += 18;
  });
  
  currentY += 10;
  
  // Coordinate table
  const tableY = currentY;
  const tableHeight = height - (currentY - y) - 150;
  
  doc.rect(x, tableY, width, tableHeight)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  doc.fontSize(9)
    .font('Helvetica-Bold')
    .text('Titik Ikat Tapak/Lokasi Kegiatan', x + 10, tableY + 10);
  
  // Draw coordinate table
  const tableStartY = tableY + 30;
  const colWidths = [30, (width - 60) / 2, (width - 60) / 2];
  
  // Table header
  doc.rect(x, tableStartY, colWidths[0], 20)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.rect(x + colWidths[0], tableStartY, colWidths[1], 20)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.rect(x + colWidths[0] + colWidths[1], tableStartY, colWidths[2], 20)
    .fillColor('#e0e0e0')
    .fill()
    .strokeColor('#000')
    .lineWidth(0.5)
    .stroke();
  
  doc.fillColor('#000')
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('No.', x + 5, tableStartY + 6, { width: colWidths[0] - 10, align: 'center' })
    .text('X', x + colWidths[0] + 5, tableStartY + 6, { width: colWidths[1] - 10, align: 'center' })
    .text('Y', x + colWidths[0] + colWidths[1] + 5, tableStartY + 6, { width: colWidths[2] - 10, align: 'center' });
  
  // Table rows (first 10 coordinates)
  try {
    const geometry = JSON.parse(polygon.geometry);
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates[0]) {
      const coords = geometry.coordinates[0].slice(0, 10); // First 10 points
      
      let rowY = tableStartY + 20;
      coords.forEach(([lon, lat]: [number, number], index: number) => {
        const fillColor = index % 2 === 0 ? '#ffffff' : '#f5f5f5';
        
        doc.rect(x, rowY, colWidths[0], 18)
          .fillColor(fillColor)
          .fill()
          .strokeColor('#000')
          .lineWidth(0.5)
          .stroke();
        
        doc.rect(x + colWidths[0], rowY, colWidths[1], 18)
          .fillColor(fillColor)
          .fill()
          .strokeColor('#000')
          .lineWidth(0.5)
          .stroke();
        
        doc.rect(x + colWidths[0] + colWidths[1], rowY, colWidths[2], 18)
          .fillColor(fillColor)
          .fill()
          .strokeColor('#000')
          .lineWidth(0.5)
          .stroke();
        
        doc.fillColor('#000')
          .fontSize(6)
          .font('Helvetica')
          .text((index + 1).toString(), x + 5, rowY + 5, { width: colWidths[0] - 10, align: 'center' })
          .text(formatCoordinate(lon, 'E'), x + colWidths[0] + 5, rowY + 5, { width: colWidths[1] - 10, align: 'center' })
          .text(formatCoordinate(lat, 'S'), x + colWidths[0] + colWidths[1] + 5, rowY + 5, { width: colWidths[2] - 10, align: 'center' });
        
        rowY += 18;
      });
    }
  } catch (error) {
    console.error('Error drawing coordinate table:', error);
  }
  
  // Inset map (small Indonesia map)
  const insetY = height - 140;
  const insetHeight = 120;
  
  doc.rect(x, insetY, width, insetHeight)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#000')
    .lineWidth(2)
    .stroke();
  
  doc.fontSize(8)
    .font('Helvetica')
    .text('Peta Orientasi Indonesia', x + 10, insetY + insetHeight - 15);
  
  // Footer
  const footerY = height - 15;
  doc.fontSize(7)
    .font('Helvetica')
    .fillColor('#666')
    .text('Created by - AMDALNET Shapefile Converter', x, footerY, { width: width, align: 'center' });
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
