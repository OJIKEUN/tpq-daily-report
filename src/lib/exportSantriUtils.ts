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
  entry_date?: string;
  status?: string;
  created_by_name?: string;
  created_by_uid?: string;
}

export interface ExportSantriOptions {
  santriList: ExportSantriItem[];
  tanggalPengesahan: string; // YYYY-MM-DD
  penandaTangan: string;     // e.g. "Sugiarti"
  subtitle?: string;         // e.g. "Semua Kelas" or "Kelas 1 SD"
  namaGuru?: string;
  alamatGuru?: string;
  noHpGuru?: string;
  tahunAjaran?: string;      // e.g. "2026/2027"
  includeGrade?: boolean;
}

const formatDateIndo = (dateStr?: string) => {
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
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const GRADE_RANK: Record<string, number> = {
  'Kelas 3 SMA/SMK': 13,
  'Kelas 2 SMA/SMK': 12,
  'Kelas 1 SMA/SMK': 11,
  'Kelas 3 SMP': 10,
  'Kelas 2 SMP': 9,
  'Kelas 1 SMP': 8,
  'Kelas 6 SD': 7,
  'Kelas 5 SD': 6,
  'Kelas 4 SD': 5,
  'Kelas 3 SD': 4,
  'Kelas 2 SD': 3,
  'Kelas 1 SD': 2,
  'TK / PAUD / Belum Sekolah': 1,
};

export const getGradeRank = (grade?: string): number => {
  if (!grade) return 0;
  const g = grade.trim();
  if (GRADE_RANK[g] !== undefined) return GRADE_RANK[g];

  const lower = g.toLowerCase();
  if (lower.includes('sma') || lower.includes('smk') || lower.includes('ma')) {
    if (lower.includes('3')) return 13;
    if (lower.includes('2')) return 12;
    if (lower.includes('1')) return 11;
    return 10.5;
  }
  if (lower.includes('smp') || lower.includes('mts')) {
    if (lower.includes('3')) return 10;
    if (lower.includes('2')) return 9;
    if (lower.includes('1')) return 8;
    return 7.5;
  }
  if (lower.includes('sd') || lower.includes('mi')) {
    if (lower.includes('6')) return 7;
    if (lower.includes('5')) return 6;
    if (lower.includes('4')) return 5;
    if (lower.includes('3')) return 4;
    if (lower.includes('2')) return 3;
    if (lower.includes('1')) return 2;
    return 1.5;
  }
  if (lower.includes('tk') || lower.includes('paud')) {
    return 1;
  }
  return 0;
};

export const sortSantriByGradeDesc = (list: ExportSantriItem[]): ExportSantriItem[] => {
  return [...list].sort((a, b) => {
    const rankA = getGradeRank(a.grade);
    const rankB = getGradeRank(b.grade);
    if (rankA !== rankB) {
      return rankB - rankA; // Kelas paling besar dulu (13 -> 1)
    }
    // Jika kelas sama, urutkan nama secara alfabetis A-Z
    return (a.name || '').localeCompare(b.name || '', 'id');
  });
};

/**
 * EXPORT DATA SANTRI KE EXCEL (.xlsx)
 */
export const generateSantriExcel = async ({
  santriList,
  tanggalPengesahan,
  penandaTangan,
  subtitle = 'Semua Tingkat / Kelas',
  namaGuru = '',
  alamatGuru = '',
  noHpGuru = '',
  tahunAjaran = '2026/2027',
  includeGrade = false,
}: ExportSantriOptions) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Santri');

  const sortedSantri = sortSantriByGradeDesc(santriList);

  const endCol = includeGrade ? 'H' : 'G';
  const sigCol = includeGrade ? 'G' : 'F';

  // Atur lebar kolom (rapi dan proporsional)
  if (includeGrade) {
    worksheet.columns = [
      { width: 3 },   // A (padding)
      { width: 6 },   // B: No
      { width: 28 },  // C: Nama Santri
      { width: 18 },  // D: TTL
      { width: 18 },  // E: Kelas
      { width: 32 },  // F: Nama Orang Tua
      { width: 18 },  // G: tggl Mulai Masuk
      { width: 15 },  // H: Keterangan
      { width: 3 },   // I (padding)
    ];
  } else {
    worksheet.columns = [
      { width: 3 },   // A (padding)
      { width: 6 },   // B: No
      { width: 30 },  // C: Nama Santri
      { width: 20 },  // D: TTL
      { width: 32 },  // E: Nama Orang Tua
      { width: 20 },  // F: tggl Mulai Masuk
      { width: 16 },  // G: Keterangan
      { width: 3 },   // H (padding)
    ];
  }

  // KOP SURAT
  [2, 3, 4, 5, 6].forEach((r) => (worksheet.getRow(r).height = 22));

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

  worksheet.mergeCells(`C2:${endCol}2`);
  worksheet.getCell('C2').value = `TAMAN PENDIDIKAN AL QUR'AN`;
  worksheet.getCell('C2').font = kopFontTitle1;
  worksheet.getCell('C2').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(`C3:${endCol}3`);
  worksheet.getCell('C3').value = `DARUTTAUBAH`;
  worksheet.getCell('C3').font = kopFontTitle2;
  worksheet.getCell('C3').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(`C4:${endCol}4`);
  worksheet.getCell('C4').value = `No. Registrasi : 411227.1.09/TPQ/764/06/2012   No. Statistik : 411221710814`;
  worksheet.getCell('C4').font = kopFontNormal;
  worksheet.getCell('C4').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(`C5:${endCol}5`);
  worksheet.getCell('C5').value = `Sekretariat: Perum. Merlion Square Fasum Blok L Tg. Uncang, Batu Aji – Batam`;
  worksheet.getCell('C5').font = kopFontNormal;
  worksheet.getCell('C5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells(`C6:${endCol}6`);
  worksheet.getCell('C6').value = `Telp : 0852-8310-4789 / Email : tpq.daruttaubah@gmail.com`;
  worksheet.getCell('C6').font = kopFontNormal;
  worksheet.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };

  // Garis pemisah kop
  const sepRow = worksheet.getRow(7);
  const colCount = includeGrade ? 8 : 7;
  for (let c = 2; c <= colCount; c++) {
    sepRow.getCell(c).border = { bottom: { style: 'medium', color: { argb: 'FF006600' } } };
  }

  // JUDUL TABEL & IDENTITAS WILAYAH / TAHUN AJARAN
  let row = 9;
  worksheet.mergeCells(`B${row}:${endCol}${row}`);
  worksheet.getCell(`B${row}`).value = 'DATA SANTRIWAN DAN SANTRIWATI';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 13, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };

  row = 10;
  worksheet.mergeCells(`B${row}:${endCol}${row}`);
  worksheet.getCell(`B${row}`).value = 'KELURAHAN TANJUNG UNCANG, KECAMATAN BATU AJI, KOTA BATAM';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 11, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };

  row = 11;
  worksheet.mergeCells(`B${row}:${endCol}${row}`);
  worksheet.getCell(`B${row}`).value = `TAHUN AJARAN ${tahunAjaran.toUpperCase()}${subtitle && subtitle !== 'Semua Tingkat / Kelas' ? ` (${subtitle})` : ''}`;
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 11, bold: true };
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };

  // IDENTITAS GURU / PENGAJAR (SESUAI TEMPLATE SCREENSHOT)
  row = 13;
  worksheet.getCell(`B${row}`).value = 'NAMA GURU';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 10, bold: true };
  worksheet.getCell(`C${row}`).value = `: ${namaGuru || '-'}`;
  worksheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 10, bold: true };

  row = 14;
  worksheet.getCell(`B${row}`).value = 'ALAMAT';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 10, bold: true };
  worksheet.getCell(`C${row}`).value = `: ${alamatGuru || '-'}`;
  worksheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 10 };

  row = 15;
  worksheet.getCell(`B${row}`).value = 'NO HP';
  worksheet.getCell(`B${row}`).font = { name: 'Times New Roman', size: 10, bold: true };
  worksheet.getCell(`C${row}`).value = `: ${noHpGuru || '-'}`;
  worksheet.getCell(`C${row}`).font = { name: 'Times New Roman', size: 10 };

  // HEADER TABEL
  row = 17;
  const headerRow = worksheet.getRow(row);
  headerRow.height = 24;

  if (includeGrade) {
    headerRow.getCell(2).value = 'No';
    headerRow.getCell(3).value = 'Nama Santri';
    headerRow.getCell(4).value = 'TTL';
    headerRow.getCell(5).value = 'Kelas';
    headerRow.getCell(6).value = 'Nama Orang Tua';
    headerRow.getCell(7).value = 'tggl Mulai Masuk';
    headerRow.getCell(8).value = 'Keterangan';
  } else {
    headerRow.getCell(2).value = 'No';
    headerRow.getCell(3).value = 'Nama Santri';
    headerRow.getCell(4).value = 'TTL';
    headerRow.getCell(5).value = 'Nama Orang Tua';
    headerRow.getCell(6).value = 'tggl Mulai Masuk';
    headerRow.getCell(7).value = 'Keterangan';
  }

  for (let c = 2; c <= colCount; c++) {
    const cell = headerRow.getCell(c);
    cell.font = { name: 'Times New Roman', size: 10, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2F2F2' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' },
    };
  }

  // ISI TABEL (RAPAT & PROPORSIONAL)
  row++;
  sortedSantri.forEach((s, index) => {
    const tr = worksheet.getRow(row);
    tr.height = 22; // Tinggi baris rapat sesuai permintaan

    const parents = `Ayah: ${s.father_name || '-'}\nIbu: ${s.mother_name || '-'}`;
    const ttl = formatDateIndo(s.birth_date);
    const entryDate = formatDateIndo(s.entry_date);
    const keterangan = s.status || 'Aktif';

    if (includeGrade) {
      tr.getCell(2).value = index + 1;
      tr.getCell(3).value = s.name.toUpperCase();
      tr.getCell(4).value = ttl;
      tr.getCell(5).value = s.grade;
      tr.getCell(6).value = parents;
      tr.getCell(7).value = entryDate;
      tr.getCell(8).value = keterangan;
    } else {
      tr.getCell(2).value = index + 1;
      tr.getCell(3).value = s.name.toUpperCase();
      tr.getCell(4).value = ttl;
      tr.getCell(5).value = parents;
      tr.getCell(6).value = entryDate;
      tr.getCell(7).value = keterangan;
    }

    for (let c = 2; c <= colCount; c++) {
      const cell = tr.getCell(c);
      cell.font = { name: 'Times New Roman', size: 9.5 };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };

      const isLeft = includeGrade ? c === 3 || c === 6 : c === 3 || c === 5;
      const isWrap = includeGrade ? c === 6 : c === 5;

      cell.alignment = {
        vertical: 'middle',
        horizontal: isLeft ? 'left' : 'center',
        wrapText: isWrap,
      };
    }

    row++;
  });

  // TANDA TANGAN (SEPERTI SURAT INSENTIF & TEMPLATE SCREENSHOT)
  row += 2;
  const tglStr = formatDateIndo(tanggalPengesahan);

  worksheet.getCell(`${sigCol}${row}`).value = `Batam, ${tglStr}`;
  worksheet.getCell(`${sigCol}${row}`).font = { name: 'Times New Roman', size: 11 };
  worksheet.getCell(`${sigCol}${row}`).alignment = { horizontal: 'center' };

  row++;
  worksheet.getCell(`${sigCol}${row}`).value = `Kepala TPQ DARUTTAUBAH`;
  worksheet.getCell(`${sigCol}${row}`).font = { name: 'Times New Roman', size: 11 };
  worksheet.getCell(`${sigCol}${row}`).alignment = { horizontal: 'center' };

  row += 4;
  worksheet.getCell(`${sigCol}${row}`).value = `( ${penandaTangan.toUpperCase()} )`;
  worksheet.getCell(`${sigCol}${row}`).font = { name: 'Times New Roman', size: 11, bold: true };
  worksheet.getCell(`${sigCol}${row}`).alignment = { horizontal: 'center' };

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
  namaGuru = '',
  alamatGuru = '',
  noHpGuru = '',
  tahunAjaran = '2026/2027',
  includeGrade = false,
}: ExportSantriOptions) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // 1. KOP SURAT
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

  // 2. JUDUL DOKUMEN & SUBTITLE SESUAI TEMPLATE
  doc.setFontSize(12.5);
  doc.setFont('times', 'bold');
  doc.text('DATA SANTRIWAN DAN SANTRIWATI', 105, 50, { align: 'center' });

  doc.setFontSize(10.5);
  doc.text('KELURAHAN TANJUNG UNCANG, KECAMATAN BATU AJI, KOTA BATAM', 105, 55, { align: 'center' });
  doc.text(`TAHUN AJARAN ${tahunAjaran.toUpperCase()}${subtitle && subtitle !== 'Semua Tingkat / Kelas' ? ` (${subtitle})` : ''}`, 105, 60, { align: 'center' });

  // 3. IDENTITAS GURU
  doc.setFontSize(9.5);
  doc.setFont('times', 'bold');
  doc.text('NAMA GURU', 14, 67);
  doc.text(`:  ${namaGuru || '-'}`, 42, 67);

  doc.text('ALAMAT', 14, 71.5);
  doc.setFont('times', 'normal');
  doc.text(`:  ${alamatGuru || '-'}`, 42, 71.5);

  doc.setFont('times', 'bold');
  doc.text('NO HP', 14, 76);
  doc.setFont('times', 'normal');
  doc.text(`:  ${noHpGuru || '-'}`, 42, 76);

  // 4. TABEL DATA SANTRI (SESUAI TEMPLATE SCREENSHOT, DIURUT DARI KELAS TERBESAR KE TERKECIL)
  const sortedSantri = sortSantriByGradeDesc(santriList);
  let headCols: string[][];
  let colStyles: Record<number, any>;
  let tableData: any[][];

  if (includeGrade) {
    headCols = [['No', 'Nama Santri', 'TTL', 'Kelas', 'Nama Orang Tua', 'tggl Mulai Masuk', 'Keterangan']];
    colStyles = {
      0: { halign: 'center', cellWidth: 8 },   // No
      1: { halign: 'left', cellWidth: 38 },     // Nama Santri
      2: { halign: 'center', cellWidth: 26 },   // TTL
      3: { halign: 'center', cellWidth: 22 },   // Kelas
      4: { halign: 'left', cellWidth: 44 },     // Nama Orang Tua
      5: { halign: 'center', cellWidth: 26 },   // tggl Mulai Masuk
      6: { halign: 'center', cellWidth: 18 },   // Keterangan
    };
    tableData = sortedSantri.map((s, index) => [
      index + 1,
      s.name.toUpperCase(),
      formatDateIndo(s.birth_date),
      s.grade,
      `Ayah: ${s.father_name || '-'}\nIbu: ${s.mother_name || '-'}`,
      formatDateIndo(s.entry_date),
      s.status || 'Aktif',
    ]);
  } else {
    headCols = [['No', 'Nama Santri', 'TTL', 'Nama Orang Tua', 'tggl Mulai Masuk', 'Keterangan']];
    colStyles = {
      0: { halign: 'center', cellWidth: 9 },   // No
      1: { halign: 'left', cellWidth: 45 },     // Nama Santri
      2: { halign: 'center', cellWidth: 28 },   // TTL
      3: { halign: 'left', cellWidth: 48 },     // Nama Orang Tua
      4: { halign: 'center', cellWidth: 28 },   // tggl Mulai Masuk
      5: { halign: 'center', cellWidth: 24 },   // Keterangan
    };
    tableData = sortedSantri.map((s, index) => [
      index + 1,
      s.name.toUpperCase(),
      formatDateIndo(s.birth_date),
      `Ayah: ${s.father_name || '-'}\nIbu: ${s.mother_name || '-'}`,
      formatDateIndo(s.entry_date),
      s.status || 'Aktif',
    ]);
  }

  autoTable(doc, {
    startY: 80,
    margin: { left: 14, right: 14 },
    head: headCols,
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
    columnStyles: colStyles,
    styles: {
      font: 'times',
      fontSize: 8.5,
      textColor: 0,
      cellPadding: 1.5, // Padding baris rapat
      lineWidth: 0.1,
      lineColor: 0,
      valign: 'middle',
    },
  });

  // 5. TANDA TANGAN
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Jika posisi tanda tangan melebihi batas halaman A4, buat halaman baru
  if (finalY > 240) {
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
