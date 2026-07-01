import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface IncentiveTeacher {
  name: string;
  no_sk: string;
  no_ktp: string;
  no_rek: string;
}

export interface IncentiveLetterData {
  id?: string;
  nomor: string;
  lampiran: string;
  perihal: string;
  kepada: string;
  periode_start_month: number; // 0-11
  periode_end_month: number;   // 0-11
  periode_year: number;
  teachers: IncentiveTeacher[];
  tanggal_pengesahan: string;
  penanda_tangan: string;
}

export const generateIncentiveExcel = async (data: IncentiveLetterData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surat Insentif');

  worksheet.columns = [
    { width: 3 },   // A (padding)
    { width: 5 },   // B: NO
    { width: 25 },  // C: NAMA
    { width: 30 },  // D: NO SK
    { width: 25 },  // E: NO KTP
    { width: 20 },  // F: NO REK
    { width: 3 },   // G (padding)
  ];

  [2, 3, 4, 5, 6].forEach(r => worksheet.getRow(r).height = 24);

  // LOGO
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer();
      const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0.2, row: 1.2 }, ext: { width: 95, height: 95 } });
    }
  } catch (e) { console.warn('Failed to load logo', e); }

  const kopFontTitle1 = { name: 'Times New Roman', size: 18, bold: true, color: { argb: 'FF00B050' } };
  const kopFontTitle2 = { name: 'Stencil', size: 20, bold: true, color: { argb: 'FF00B050' } };
  const kopFontNormal = { name: 'Times New Roman', size: 12 };

  worksheet.mergeCells('C2:F2');
  worksheet.getCell('C2').value = `TAMAN PENDIDIKAN AL QUR'AN`;
  worksheet.getCell('C2').font = kopFontTitle1;
  worksheet.getCell('C2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C3:F3');
  worksheet.getCell('C3').value = `DARUTTAUBAH`;
  worksheet.getCell('C3').font = kopFontTitle2;
  worksheet.getCell('C3').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C4:F4');
  worksheet.getCell('C4').value = `No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`;
  worksheet.getCell('C4').font = kopFontNormal;
  worksheet.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C5:F5');
  worksheet.getCell('C5').value = `Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`;
  worksheet.getCell('C5').font = kopFontNormal;
  worksheet.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C6:F6');
  worksheet.getCell('C6').value = `Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`;
  worksheet.getCell('C6').font = kopFontNormal;
  worksheet.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

  const sepRow = worksheet.getRow(7);
  [2, 3, 4, 5, 6].forEach((col) => {
    sepRow.getCell(col).border = { bottom: { style: 'medium', color: { argb: 'FF006600' } } }; // Dark Green
  });

  // METADATA
  const metaFont = { name: 'Times New Roman', size: 11 };
  const metaFontBold = { name: 'Times New Roman', size: 11, bold: true };
  let row = 9;
  
  worksheet.getCell(`B${row}`).value = 'Nomor';
  worksheet.getCell(`B${row}`).font = metaFontBold;
  worksheet.getCell(`C${row}`).value = `: ${data.nomor}`;
  worksheet.getCell(`C${row}`).font = metaFontBold;
  
  row++;
  worksheet.getCell(`B${row}`).value = 'Lampiran';
  worksheet.getCell(`B${row}`).font = metaFontBold;
  worksheet.getCell(`C${row}`).value = `: ${data.lampiran}`;
  worksheet.getCell(`C${row}`).font = metaFontBold;
  
  row++;
  worksheet.getCell(`B${row}`).value = 'Hal';
  worksheet.getCell(`B${row}`).font = metaFontBold;
  worksheet.getCell(`C${row}`).value = `: ${data.perihal}`;
  worksheet.getCell(`C${row}`).font = metaFontBold;

  row += 2;
  worksheet.getCell(`B${row}`).value = 'Kepada Yth.';
  worksheet.getCell(`B${row}`).font = metaFont;
  row++;
  worksheet.mergeCells(`B${row}:D${row}`);
  worksheet.getCell(`B${row}`).value = data.kepada;
  worksheet.getCell(`B${row}`).font = { ...metaFont, bold: true };
  row++;
  worksheet.getCell(`B${row}`).value = 'Di Batam';
  worksheet.getCell(`B${row}`).font = metaFont;

  row += 2;
  worksheet.getCell(`B${row}`).value = 'Dengan Hormat,';
  worksheet.getCell(`B${row}`).font = metaFont;

  row += 2;
  worksheet.mergeCells(`B${row}:F${row}`);
  const startMonthStr = MONTHS[data.periode_start_month];
  const endMonthStr = MONTHS[data.periode_end_month];
  worksheet.getCell(`B${row}`).value = `Dengan ini kami Kepala TPQ DARUTTAUBAH menyampaikan Surat Permohonan Pencairan Insentif guru, untuk periode ${startMonthStr} s/d ${endMonthStr} ${data.periode_year} atas nama sebagai berikut:`;
  worksheet.getCell(`B${row}`).font = metaFont;
  worksheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };
  worksheet.getRow(row).height = 30; // Double height for wrap

  // TABLE HEADER
  row += 2;
  const headerRow = worksheet.getRow(row);
  headerRow.getCell(2).value = 'NO';
  headerRow.getCell(3).value = 'NAMA';
  headerRow.getCell(4).value = 'NO SK';
  headerRow.getCell(5).value = 'NO KTP';
  headerRow.getCell(6).value = 'NO. REK';

  [2, 3, 4, 5, 6].forEach((col) => {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Times New Roman', size: 9, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  // TABLE DATA
  row++;
  data.teachers.forEach((t, index) => {
    const tr = worksheet.getRow(row);
    tr.getCell(2).value = index + 1;
    tr.getCell(3).value = t.name.toUpperCase();
    tr.getCell(4).value = t.no_sk;
    tr.getCell(5).value = t.no_ktp;
    tr.getCell(6).value = t.no_rek;

    [2, 3, 4, 5, 6].forEach((col) => {
      const cell = tr.getCell(col);
      cell.font = { name: 'Times New Roman', size: 9 };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { vertical: 'middle', horizontal: (col === 2) ? 'center' : 'left' };
    });
    row++;
  });

  // CLOSING
  row += 1;
  worksheet.mergeCells(`B${row}:F${row}`);
  worksheet.getCell(`B${row}`).value = `Demikianlah permohonan ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatiannya kami ucapkan terima kasih.`;
  worksheet.getCell(`B${row}`).font = metaFont;
  worksheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };
  worksheet.getRow(row).height = 30;

  // SIGNATURE
  row += 3;
  
  // Format Tanggal Pengesahan
  const tglObj = new Date(data.tanggal_pengesahan);
  const tglStr = `${tglObj.getDate()} ${MONTHS[tglObj.getMonth()]} ${tglObj.getFullYear()}`;

  worksheet.getCell(`C${row}`).value = `Batam, ${tglStr}`;
  worksheet.getCell(`C${row}`).font = metaFont;
  row++;
  worksheet.getCell(`C${row}`).value = `Kepala TPQ DARUTTAUBAH`;
  worksheet.getCell(`C${row}`).font = metaFont;
  
  row += 5;
  worksheet.getCell(`C${row}`).value = `( ${data.penanda_tangan.toUpperCase()} )`;
  worksheet.getCell(`C${row}`).font = { ...metaFont, bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Surat_Insentif_${MONTHS[data.periode_start_month]}-${MONTHS[data.periode_end_month]}_${data.periode_year}.xlsx`);
};

export const generateIncentivePDF = async (data: IncentiveLetterData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // LOGO
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBlob = await logoResp.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 14, 12, 28, 28);
    }
  } catch (e) { console.warn('Failed to load logo for PDF', e); }

  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 176, 80); 
  doc.text(`TAMAN PENDIDIKAN AL QUR'AN`, 115, 18, { align: 'center' });
  
  doc.setFontSize(20);
  doc.text(`DARUTTAUBAH`, 115, 26, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`, 115, 33, { align: 'center' });
  doc.text(`Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`, 115, 38, { align: 'center' });
  doc.text(`Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`, 115, 43, { align: 'center' });
  
  doc.setDrawColor(0, 102, 0); // Dark Green
  doc.setLineWidth(1);
  doc.line(15, 48, 195, 48);

  // METADATA
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  
  doc.text('Nomor', 20, 58); 
  doc.text(`: ${data.nomor}`, 45, 58);
  
  doc.text('Lampiran', 20, 64); 
  doc.text(`: ${data.lampiran}`, 45, 64);
  
  doc.text('Hal', 20, 70); 
  doc.text(`: ${data.perihal}`, 45, 70);

  doc.setFont('times', 'normal');
  doc.text('Kepada Yth.', 20, 85);
  doc.setFont('times', 'bold');
  doc.text(data.kepada, 20, 91);
  doc.setFont('times', 'normal');
  doc.text('Di Batam', 20, 97);

  doc.text('Dengan Hormat,', 20, 112);

  const startMonthStr = MONTHS[data.periode_start_month];
  const endMonthStr = MONTHS[data.periode_end_month];
  const textBody = `Dengan ini kami Kepala TPQ DARUTTAUBAH menyampaikan Surat Permohonan Pencairan Insentif guru, untuk periode ${startMonthStr} s/d ${endMonthStr} ${data.periode_year} atas nama sebagai berikut:`;
  const splitText = doc.splitTextToSize(textBody, 170);
  doc.text(splitText, 20, 122);

  const startY = 122 + (splitText.length * 5) + 3; // Closer to text

  const tableData = data.teachers.map((t, index) => [
    index + 1,
    t.name.toUpperCase(),
    t.no_sk,
    t.no_ktp,
    t.no_rek
  ]);

  autoTable(doc, {
    startY: startY,
    margin: { left: 20, right: 20 },
    head: [['NO', 'NAMA', 'NO SK', 'NO KTP', 'NO. REK']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, halign: 'center', font: 'times', fontSize: 9, lineWidth: 0.1, lineColor: 0 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 40 },
      2: { halign: 'left', cellWidth: 45 },
      3: { halign: 'left', cellWidth: 40 },
      4: { halign: 'left', cellWidth: 35 }
    },
    styles: { font: 'times', fontSize: 9, textColor: 0, cellPadding: 1.5, lineWidth: 0.1, lineColor: 0, valign: 'middle' }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  const closingText = `Demikianlah permohonan ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya. Atas perhatiannya kami ucapkan terima kasih.`;
  const splitClosing = doc.splitTextToSize(closingText, 170);
  doc.text(splitClosing, 20, finalY);

  const sigY = finalY + (splitClosing.length * 6) + 10;
  
  const tglObj = new Date(data.tanggal_pengesahan);
  const tglStr = `${tglObj.getDate()} ${MONTHS[tglObj.getMonth()]} ${tglObj.getFullYear()}`;

  doc.text(`Batam, ${tglStr}`, 45, sigY, { align: 'center' }); // Align center around X=45 (left side)
  doc.text('Kepala TPQ DARUTTAUBAH', 45, sigY + 6, { align: 'center' });
  
  doc.setFont('times', 'bold');
  doc.text(`( ${data.penanda_tangan.toUpperCase()} )`, 45, sigY + 30, { align: 'center' });

  doc.save(`Surat_Insentif_${MONTHS[data.periode_start_month]}-${MONTHS[data.periode_end_month]}_${data.periode_year}.pdf`);
};
