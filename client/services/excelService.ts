import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

class ExcelService {

  exportData(
    data: any[],
    sheetName: string,
    fileName: string
  ) {

    const worksheet =
      XLSX.utils.json_to_sheet(data);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheetName
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

    const blob = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    saveAs(blob, `${fileName}.xlsx`);

  }

}

export default new ExcelService();