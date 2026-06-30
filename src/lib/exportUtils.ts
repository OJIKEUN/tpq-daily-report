import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type definitions based on our Firestore structure
export interface ReportData {
  report_date: string;
  activity: string;
  description: string;
}

export interface UserProfile {
  name: string;
  address: string;
  phone: string;
  headmaster_name: string;
  supervisor_name: string;
}

const MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export const generateExcel = async (
  month: number, 
  year: number, 
  userProfile: UserProfile, 
  reports: ReportData[]
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan');

  // Set column widths based on the TSV format
  worksheet.columns = [
    { width: 3 },   // A
    { width: 5 },   // B: NO
    { width: 10 },  // C: HARI
    { width: 18 },  // D: TANGGAL
    { width: 45 },  // E: KEGIATAN
    { width: 30 },  // F: KETERANGAN
    { width: 3 },   // G: Padding
  ];

  // Increase row heights to accommodate larger logo
  [2, 3, 4, 5, 6].forEach(r => worksheet.getRow(r).height = 24);

  // ================= LOGO =================
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer();
      const imageId = workbook.addImage({
        buffer: logoBuffer,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.2, row: 1.2 }, 
        ext: { width: 95, height: 95 } // Shrink logo to add spacing
      });
    }
  } catch (e) {
    console.warn('Failed to load logo for Excel', e);
  }

  // ================= KOP SURAT =================
  const kopFontTitle1 = { name: 'Times New Roman', size: 18, bold: true, color: { argb: 'FF00B050' } }; // Green
  const kopFontTitle2 = { name: 'Stencil', size: 20, bold: true, color: { argb: 'FF00B050' } }; // Green Stencil
  const kopFontNormal = { name: 'Times New Roman', size: 12 };

  worksheet.mergeCells('C2:F2');
  const kop1 = worksheet.getCell('C2');
  kop1.value = `TAMAN PENDIDIKAN AL QUR'AN`;
  kop1.font = kopFontTitle1;
  kop1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C3:F3');
  const kop2 = worksheet.getCell('C3');
  kop2.value = `DARUTTAUBAH`;
  kop2.font = kopFontTitle2;
  kop2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C4:F4');
  const kop3 = worksheet.getCell('C4');
  kop3.value = `No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`;
  kop3.font = kopFontNormal;
  kop3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C5:F5');
  const kop4 = worksheet.getCell('C5');
  kop4.value = `Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`;
  kop4.font = kopFontNormal;
  kop4.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C6:F6');
  const kop5 = worksheet.getCell('C6');
  kop5.value = `Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`;
  kop5.font = kopFontNormal;
  kop5.alignment = { horizontal: 'center', vertical: 'middle' };

  // Thick Orange Line Separator
  // We apply bottom border to row 7
  const sepRow = worksheet.getRow(7);
  [2, 3, 4, 5, 6].forEach((col) => {
    sepRow.getCell(col).border = {
      bottom: { style: 'medium', color: { argb: 'FFE26B0A' } } // Orange
    };
  });

  // ================= JUDUL LAPORAN =================
  const titleFont = { name: 'Times New Roman', size: 12, bold: true };
  
  worksheet.mergeCells('B9:F9');
  const t1 = worksheet.getCell('B9');
  t1.value = `LAPORAN KEGIATAN GURU AL-QUR'AN`;
  t1.font = titleFont;
  t1.alignment = { horizontal: 'center' };

  worksheet.mergeCells('B10:F10');
  const t2 = worksheet.getCell('B10');
  t2.value = `TPQ DARUTTAUBAH KECAMATAN BATU AJI`;
  t2.font = titleFont;
  t2.alignment = { horizontal: 'center' };

  worksheet.mergeCells('B11:F11');
  const t3 = worksheet.getCell('B11');
  t3.value = `BULAN ${MONTHS[month - 1]} ${year}`;
  t3.font = titleFont;
  t3.alignment = { horizontal: 'center' };

  // ================= DATA DIRI =================
  const dataDiriFont = { name: 'Times New Roman', size: 11, bold: true };
  
  worksheet.getCell('B14').value = 'NAMA';
  worksheet.getCell('B14').font = dataDiriFont;
  worksheet.getCell('D14').value = `: ${userProfile.name.toUpperCase()}`;
  worksheet.getCell('D14').font = dataDiriFont;
  
  worksheet.getCell('B15').value = 'ALAMAT';
  worksheet.getCell('B15').font = dataDiriFont;
  worksheet.getCell('D15').value = `: ${userProfile.address.toUpperCase()}`;
  worksheet.getCell('D15').font = dataDiriFont;
  
  worksheet.getCell('B16').value = 'NO. HP';
  worksheet.getCell('B16').font = dataDiriFont;
  worksheet.getCell('D16').value = `: ${userProfile.phone}`;
  worksheet.getCell('D16').font = dataDiriFont;

  // Table Headers (Row 18)
  const headerRow = worksheet.getRow(18);
  worksheet.mergeCells('C18:D18'); // Merge Day and Date for header
  
  headerRow.getCell(2).value = 'NO';
  headerRow.getCell(3).value = 'HARI / TANGGAL';
  headerRow.getCell(5).value = 'KEGIATAN';
  headerRow.getCell(6).value = 'KETERANGAN';

  // Style headers
  [2, 3, 4, 5, 6].forEach((col) => {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Times New Roman', size: 11, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Table Data
  let currentRow = 19;
  reports.forEach((report, index) => {
    const row = worksheet.getRow(currentRow);
    const dateObj = new Date(report.report_date);
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long' });
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')} ${monthName} ${dateObj.getFullYear()}`;
    
    row.getCell(2).value = index + 1;
    row.getCell(3).value = dayName;
    row.getCell(4).value = formattedDate;
    row.getCell(5).value = report.activity;
    row.getCell(6).value = report.description || '';

    // Style data cells
    [2, 3, 4, 5, 6].forEach((col) => {
      const cell = row.getCell(col);
      cell.font = { name: 'Times New Roman', size: 10 };
      
      // Default borders
      let cellBorder: any = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Remove inner border between HARI and TANGGAL to make it look like one column
      if (col === 3) {
        cellBorder.right = undefined;
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (col === 4) {
        cellBorder.left = undefined;
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', wrapText: true, horizontal: 'center' };
      }

      cell.border = cellBorder;
      
      if (col === 5 || col === 6) {
        cell.alignment = { ...cell.alignment, horizontal: 'center', wrapText: true };
      }
    });

    // Make row tight
    row.height = 16;

    currentRow++;
  });

  // Footer / Tanda Tangan
  currentRow += 3; // Add some spacing after table
  const currentDateObj = new Date();
  const currentMonthName = currentDateObj.toLocaleDateString('id-ID', { month: 'long' });
  const currentDateStr = `${currentDateObj.getDate()} ${currentMonthName} ${currentDateObj.getFullYear()}`;
  
  const footerFont = { name: 'Times New Roman', size: 11 };
  const footerFontBold = { name: 'Times New Roman', size: 11, bold: true };

  // Mengetahui (Left)
  worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
  const f1 = worksheet.getCell(`B${currentRow}`);
  f1.value = 'Mengetahui,';
  f1.font = footerFont;
  f1.alignment = { horizontal: 'left' };

  // Batam (Right)
  worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
  const f2 = worksheet.getCell(`E${currentRow}`);
  f2.value = `Batam, ${currentDateStr}`;
  f2.font = footerFont;
  f2.alignment = { horizontal: 'left' };
  
  currentRow += 1;
  // Kepala TPQ (Left)
  worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
  const f3 = worksheet.getCell(`B${currentRow}`);
  f3.value = 'Kepala TPQ';
  f3.font = footerFont;
  f3.alignment = { horizontal: 'left' };

  // Guru (Right)
  worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
  const f4 = worksheet.getCell(`E${currentRow}`);
  f4.value = 'Guru TPQ Pembimbing';
  f4.font = footerFont;
  f4.alignment = { horizontal: 'left' };

  currentRow += 6; // Space for signature (increased spacing)
  
  // Name Kepala TPQ (Left)
  worksheet.mergeCells(`B${currentRow}:D${currentRow}`);
  const headmasterCell = worksheet.getCell(`B${currentRow}`);
  headmasterCell.value = userProfile.headmaster_name.toUpperCase();
  headmasterCell.font = footerFontBold;
  headmasterCell.alignment = { horizontal: 'left' };
  
  // Name Guru (Right)
  worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
  const supervisorCell = worksheet.getCell(`E${currentRow}`);
  supervisorCell.value = userProfile.supervisor_name.toUpperCase();
  supervisorCell.font = footerFontBold;
  supervisorCell.alignment = { horizontal: 'left' };

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_${userProfile.name}_${MONTHS[month-1]}_${year}.xlsx`);
};

export const generatePDF = async (
  month: number, 
  year: number, 
  userProfile: UserProfile, 
  reports: ReportData[]
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // ================= LOGO =================
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBlob = await logoResp.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 14, 12, 28, 28); // Shrink logo to prevent overlap and shift left
    }
  } catch (e) { console.warn('Failed to load logo for PDF', e); }

  // ================= KOP SURAT =================
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 176, 80); // Green
  doc.text(`TAMAN PENDIDIKAN AL QUR'AN`, 115, 18, { align: 'center' });
  
  doc.setFontSize(20);
  doc.text(`DARUTTAUBAH`, 115, 26, { align: 'center' }); // Using times bold for PDF as fallback for Stencil
  
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0); // Black
  doc.text(`No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`, 115, 33, { align: 'center' });
  doc.text(`Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`, 115, 38, { align: 'center' });
  
  doc.text(`Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`, 115, 43, { align: 'center' });
  
  // Orange Line
  doc.setDrawColor(226, 107, 10); // #E26B0A
  doc.setLineWidth(1);
  doc.line(15, 48, 195, 48);
  
  // ================= JUDUL LAPORAN =================
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  const title = `LAPORAN KEGIATAN GURU AL-QUR'AN`;
  const subTitle = `TPQ DARUTTAUBAH KECAMATAN BATU AJI`;
  const monthYear = `BULAN ${MONTHS[month - 1]} ${year}`;
  
  doc.text(title, 105, 58, { align: 'center' });
  doc.text(subTitle, 105, 64, { align: 'center' });
  doc.text(monthYear, 105, 70, { align: 'center' });
  
  // ================= DATA DIRI =================
  doc.setFontSize(11);
  doc.setFont('times', 'bold');
  doc.text('NAMA', 20, 80);
  doc.text(`: ${userProfile.name.toUpperCase()}`, 50, 80);
  
  doc.text('ALAMAT', 20, 86);
  doc.text(`: ${userProfile.address.toUpperCase()}`, 50, 86);
  
  doc.text('NO. HP', 20, 92);
  doc.text(`: ${userProfile.phone}`, 50, 92);

  // Table Data Preparation
  const tableData = reports.map((report, index) => {
    const dateObj = new Date(report.report_date);
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long' });
    const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')} ${monthName} ${dateObj.getFullYear()}`;
    
    return [
      index + 1,
      `${dayName}  ${formattedDate}`, // Single line, tight spacing
      report.activity,
      report.description || ''
    ];
  });

  // Generate Table
  autoTable(doc, {
    startY: 100,
    head: [['NO', 'HARI / TANGGAL', 'KEGIATAN', 'KETERANGAN']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, halign: 'center', font: 'times', fontSize: 11, lineWidth: 0.1, lineColor: 0 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 85 },
      3: { halign: 'center', cellWidth: 50 }
    },
    styles: { font: 'times', fontSize: 10, cellPadding: { top: 0.5, bottom: 0.5, left: 1, right: 1 }, overflow: 'linebreak', lineWidth: 0.1, lineColor: 0, valign: 'middle' }
  });

  // Footer / Tanda Tangan
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const currentDateObj = new Date();
  const currentMonthName = currentDateObj.toLocaleDateString('id-ID', { month: 'long' });
  const currentDateStr = `${currentDateObj.getDate()} ${currentMonthName} ${currentDateObj.getFullYear()}`;
  
  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  
  // Mengetahui, & Batam, 
  doc.text('Mengetahui,', 20, finalY, { align: 'left' });
  doc.text(`Batam, ${currentDateStr}`, 130, finalY, { align: 'left' });
  
  // Kepala TPQ & Guru Pembimbing
  doc.text('Kepala TPQ', 20, finalY + 5, { align: 'left' });
  doc.text('Guru TPQ Pembimbing', 130, finalY + 5, { align: 'left' });
  
  doc.setFont('times', 'bold');
  
  // Name signatures (increased spacing)
  doc.text(userProfile.headmaster_name.toUpperCase(), 20, finalY + 30, { align: 'left' });
  doc.text(userProfile.supervisor_name.toUpperCase(), 130, finalY + 30, { align: 'left' });

  doc.save(`Laporan_${userProfile.name}_${MONTHS[month-1]}_${year}.pdf`);
};
