import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface ExportSantriItem {
  id?: string;
  name: string;
  gender: 'L' | 'P';
  birth_date: string;
  father_name: string;
  mother_name: string;
  grade: string;
}

export interface ExportSantriOptions {
  santriList: ExportSantriItem[];
  tanggalPengesahan: string; // YYYY-MM-DD
  penandaTangan: string;     // e.g. "Sugiarti"
  subtitle?: string;         // e.g. "Semua Kelas" or "Kelas 1 SD"
}

const formatDateIndo = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
        return `${day} ${MONTHS[monthIdx]} ${year}`;
      }
    }
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

/**
 * EXPORT DATA SANTRI KE EXCEL (.xlsx)
 */
export const generateSantriExcel = async ({
  santriList,
  tanggalPengesahan,
  penandaTangan,
  subtitle = 'Semua Tingkat / Kelas',
}: ExportSantriOptions) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Santri');

  // Atur lebar kolom (rapi dan proporsional)
  worksheet.columns = [
    { width: 3 },   // A (padding)
    { width: 6 },   // B: NO
    { width: 28 },  // C: NAMA SANTRI
    { width: 16 },  // D: JENIS KELAMIN
    { width: 20 },  // E: TANGGAL LAHIR
    { width: 32 },  // F: NAMA ORANG TUA
    { width: 20 },  // G: KELAS
    { width: 3 },   // H (padding)
  ];

  // KOP SURAT
  [2, 3, 4, 5, 6].forEach(r => worksheet.getRow(r).height = 22);

  // Logo TPQ
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBuffer = await logoResp.arrayBuffer();
      const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
      worksheet.addImage(imageId, { tl: { col: 0.2, row: 1.2 }, ext: { width: 90, height: 90 } });
    }
  } catch (e) {
    console.warn('Gagal memuat logo untuk Excel', e);
  }

  const kopFontTitle1 = { name: 'Times New Roman', size: 17, bold: true, color: { argb: 'FF00B050' } };
  const kopFontTitle2 = { name: 'Stencil', size: 19, bold: true, color: { argb: 'FF00B050' } };
  const kopFontNormal = { name: 'Times New Roman', size: 11 };

  worksheet.mergeCells('C2:G2');
  worksheet.getCell('C2').value = `TAMAN PENDIDIKAN AL QUR'AN`;
  worksheet.getCell('C2').font = kopFontTitle1;
  worksheet.getCell('C2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C3:G3');
  worksheet.getCell('C3').value = `DARUTTAUBAH`;
  worksheet.getCell('C3').font = kopFontTitle2;
  worksheet.getCell('C3').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C4:G4');
  worksheet.getCell('C4').value = `No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`;
  worksheet.getCell('C4').font = kopFontNormal;
  worksheet.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C5:G5');
  worksheet.getCell('C5').value = `Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`;
  worksheet.getCell('C5').font = kopFontNormal;
  worksheet.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('C6:G6');
  worksheet.getCell('C6').value = `Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`;
  worksheet.getCell('C6').font = kopFontNormal;
  worksheet.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

  // Garis pemisah kop
  const sepRow = worksheet.getRow(7);
  [2, 3, 4, 5, 6, 7].forEach((col) => {
    sepRow.getCell(col).border = { bottom: { style: 'medium', color: { argb: 'FF006600' } } };
  });

  // JUDUL TABEL
  let row = 9;
  worksheet.mergeCells(`B${row}:G${row}`);
  worksheet.getCell(`B${row}`).value = 'DATA SANTRIWAN DAN SANTRIWATI';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 13, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };

  row = 10;
  worksheet.mergeCells(`B${row}:G${row}`);
  worksheet.getCell(`B${row}`).value = `TPQ DARUTTAUBAH BATAM (${subtitle})`;
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 10.5, italic: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };

  // HEADER TABEL
  row = 12;
  const headerRow = worksheet.getRow(row);
  headerRow.height = 22;
  headerRow.getCell(2).value = 'NO';
  headerRow.getCell(3).value = 'NAMA SANTRI';
  headerRow.getCell(4).value = 'JENIS KELAMIN';
  headerRow.getCell(5).value = 'TANGGAL LAHIR';
  headerRow.getCell(6).value = 'NAMA ORANG TUA';
  headerRow.getCell(7).value = 'KELAS';

  [2, 3, 4, 5, 6, 7].forEach((col) => {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Times New Roman', size: 10, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // ISI TABEL (DIBUAT RAPAT / COMPACT)
  row++;
  santriList.forEach((s, index) => {
    const tr = worksheet.getRow(row);
    tr.height = 20; // Tinggi baris rapat sesuai permintaan

    const parents = `Ayah: ${s.father_name || '-'}\nIbu: ${s.mother_name || '-'}`;
    tr.getCell(2).value = index + 1;
    tr.getCell(3).value = s.name.toUpperCase();
    tr.getCell(4).value = s.gender === 'L' ? 'Laki-laki' : 'Perempuan';
    tr.getCell(5).value = formatDateIndo(s.birth_date);
    tr.getCell(6).value = parents;
    tr.getCell(7).value = s.grade;

    [2, 3, 4, 5, 6, 7].forEach((col) => {
      const cell = tr.getCell(col);
      cell.font = { name: 'Times New Roman', size: 9.5 };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: col === 2 || col === 4 || col === 7 ? 'center' : 'left',
        wrapText: col === 6,
      };
    });

    row++;
  });

  // TANDA TANGAN (SEPERTI SURAT INSENTIF)
  row += 2;
  const tglStr = formatDateIndo(tanggalPengesahan);

  worksheet.getCell(`F${row}`).value = `Batam, ${tglStr}`;
  worksheet.getCell(`F${row}`).font = { name: 'Times New Roman', size: 11 };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

  row++;
  worksheet.getCell(`F${row}`).value = `Kepala TPQ DARUTTAUBAH`;
  worksheet.getCell(`F${row}`).font = { name: 'Times New Roman', size: 11 };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

  row += 4;
  worksheet.getCell(`F${row}`).value = `( ${penandaTangan.toUpperCase()} )`;
  worksheet.getCell(`F${row}`).font = { name: 'Times New Roman', size: 11, bold: true };
  worksheet.getCell(`F${row}`).alignment = { horizontal: 'center' };

  // Simpan File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `Data_Santri_TPQ_Daruttaubah_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * EXPORT DATA SANTRI KE PDF (.pdf)
 */
export const generateSantriPDF = async ({
  santriList,
  tanggalPengesahan,
  penandaTangan,
  subtitle = 'Semua Tingkat / Kelas',
}: ExportSantriOptions) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // 1. KOP SURAT (DARI DOKUMEN SURAT INSENTIF)
  try {
    const logoResp = await fetch('/logo.png');
    if (logoResp.ok) {
      const logoBlob = await logoResp.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoBase64, 'PNG', 14, 10, 26, 26);
    }
  } catch (e) {
    console.warn('Gagal memuat logo untuk PDF', e);
  }

  doc.setFontSize(17);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 176, 80);
  doc.text(`TAMAN PENDIDIKAN AL QUR'AN`, 115, 16, { align: 'center' });

  doc.setFontSize(19);
  doc.text(`DARUTTAUBAH`, 115, 23, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`, 115, 29.5, { align: 'center' });
  doc.text(`Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`, 115, 34.5, { align: 'center' });
  doc.text(`Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`, 115, 39.5, { align: 'center' });

  doc.setDrawColor(0, 102, 0); // Garis hijau pemisah
  doc.setLineWidth(0.8);
  doc.line(14, 43, 196, 43);

  // 2. JUDUL DOKUMEN
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.text('DATA SANTRIWAN DAN SANTRIWATI', 105, 52, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setFont('times', 'italic');
  doc.text(`TPQ DARUTTAUBAH BATAM (${subtitle})`, 105, 57, { align: 'center' });

  // 3. TABEL DATA SANTRI (DIBUAT RAPAT / TIDAK TERLALU BANYAK JARAK)
  const tableData = santriList.map((s, index) => [
    index + 1,
    s.name.toUpperCase(),
    s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    formatDateIndo(s.birth_date),
    `Ayah: ${s.father_name || '-'}\nIbu: ${s.mother_name || '-'}`,
    s.grade,
  ]);

  autoTable(doc, {
    startY: 61,
    margin: { left: 14, right: 14 },
    head: [['NO', 'NAMA SANTRI', 'JENIS KELAMIN', 'TANGGAL LAHIR', 'NAMA ORANG TUA', 'KELAS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: 0,
      halign: 'center',
      valign: 'middle',
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8.5,
      lineWidth: 0.1,
      lineColor: 0,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },   // NO
      1: { halign: 'left', cellWidth: 42 },     // NAMA SANTRI
      2: { halign: 'center', cellWidth: 24 },   // JENIS KELAMIN
      3: { halign: 'center', cellWidth: 28 },   // TANGGAL LAHIR
      4: { halign: 'left', cellWidth: 51 },     // NAMA ORANG TUA
      5: { halign: 'center', cellWidth: 28 },   // KELAS
    },
    styles: {
      font: 'times',
      fontSize: 8.5,
      textColor: 0,
      cellPadding: 1.5, // Padding baris sangat rapat sesuai instruksi
      lineWidth: 0.1,
      lineColor: 0,
      valign: 'middle',
    },
  });

  // 4. TANDA TANGAN (SEPERTI SURAT INSENTIF)
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Jika posisi tanda tangan melebihi batas halaman A4, buat halaman baru
  if (finalY > 235) {
    doc.addPage();
    finalY = 25;
  }

  const tglStr = formatDateIndo(tanggalPengesahan);

  doc.setFontSize(11);
  doc.setFont('times', 'normal');
  doc.text(`Batam, ${tglStr}`, 155, finalY, { align: 'center' });
  doc.text('Kepala TPQ DARUTTAUBAH', 155, finalY + 5.5, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.text(`( ${penandaTangan.toUpperCase()} )`, 155, finalY + 25, { align: 'center' });

  doc.save(`Data_Santri_TPQ_Daruttaubah_${new Date().toISOString().split('T')[0]}.pdf`);
};
