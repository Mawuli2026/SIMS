import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfColumn {
  header: string;
  dataKey: string;
}

class PdfService {

  exportTable(
    title: string,
    columns: PdfColumn[],
    rows: any[],
    fileName: string
  ) {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 18);

    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 34,
      columns,
      body: rows,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
      },
      styles: {
        fontSize: 9,
      },
    });

    doc.save(`${fileName}.pdf`);

  }

}

export default new PdfService();