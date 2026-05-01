import { pool } from "../config/db.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function fetchImageAsBuffer(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getReviewById(id) {
  const { rows } = await pool.query(
    `SELECT review.*, 
            m.name as "member_name", m.email as "member_email",
            p.name as "project_name", p.client_email as "project_client_email", 
            p.work_system, p.subsystem, p.specialty, p.work_location,
            p.project_contract, p.area
     FROM review  
     JOIN member m ON m.id = review.created_by 
     JOIN project p ON p.id = review.project_id 
     WHERE review.id = $1`,
    [id],
  );

  const data = rows[0];
  if (!data) return null;

  const { rows: photos } = await pool.query(
    "SELECT id, filename, path, description, created_at FROM review_photos WHERE review_id = $1 ORDER BY created_at",
    [id],
  );

  return {
    id: data.id,
    docCode: data.doc_code,
    reviewDate: data.review_date,
    responsible: data.responsible,
    normativaAsmeB313: data.normativa_asme_b313,
    normativaAsmeB314: data.normativa_asme_b314,
    normativaApi650: data.normativa_api_650,
    normativaApi1104: data.normativa_api_1104,
    normativaAwsD11: data.normativa_aws_d11,
    technicalSpec: data.technical_spec,
    drawings: data.drawings,
    deviationDescription: data.deviation_description,
    correctiveActions: data.corrective_actions,
    reviewStatus: data.review_status,
    comments: data.comments,
    conclusion: data.conclusion,
    inspectorName: data.inspector_name,
    jtSupName: data.jt_sup_name,
    adcName: data.adc_name,
    clientName: data.client_name,
    member: {
      name: data.member_name,
      email: data.member_email,
    },
    project: {
      name: data.project_name,
      clientEmail: data.project_client_email,
      workSystem: data.work_system,
      subsystem: data.subsystem,
      specialty: data.specialty,
      workLocation: data.work_location,
      projectContract: data.project_contract,
      area: data.area,
    },
    photos: photos,
  };
}

export async function generateExcel(review) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DataField";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Informe de Inspección", {
    properties: { tabColor: { argb: "002053" } },
  });

  sheet.columns = [{ width: 25 }, { width: 50 }];

  const primaryColor = "002053";
  const cellStyle = {
    font: { size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "F3FAFF" } },
    alignment: { horizontal: "left", vertical: "top", wrapText: true },
    border: {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const addSection = (title, data) => {
    const row = sheet.addRow([title, ""]);
    row.getCell(1).font = {
      bold: true,
      size: 11,
      color: { argb: primaryColor },
    };
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "DBF1FE" },
    };
    sheet.mergeCells(row.getCell(1).address, row.getCell(2).address);
    row.height = 22;

    if (Array.isArray(data)) {
      data.forEach(([label, value]) => {
        const labelRow = sheet.addRow([label, value || "-"]);
        labelRow.getCell(1).style = {
          ...cellStyle,
          font: { bold: true, size: 10 },
        };
        labelRow.getCell(2).style = cellStyle;
        labelRow.height = 30;
      });
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([label, value]) => {
        const labelRow = sheet.addRow([label, value || "-"]);
        labelRow.getCell(1).style = {
          ...cellStyle,
          font: { bold: true, size: 10 },
        };
        labelRow.getCell(2).style = cellStyle;
        labelRow.height = 30;
      });
    }
    sheet.addRow([]);
  };

  sheet.addRow(["Código de Documento", review.docCode || "-"]);
  sheet.addRow([]);

  addSection("1. IDENTIFICACIÓN DEL PROYECTO", [
    ["Proyecto", review.project?.name || "-"],
    ["Contrato", review.project?.projectContract || "-"],
    ["Cliente", review.project?.clientEmail || "-"],
    [
      "Fecha",
      review.reviewDate
        ? new Date(review.reviewDate).toLocaleDateString("es-CL")
        : "-",
    ],
    ["Área", review.project?.area || "-"],
    ["Ubicación", review.project?.workLocation || "-"],
  ]);

  addSection("2. IDENTIFICACIÓN DEL ÁREA", [
    ["Sistema", review.project?.workSystem || "-"],
    ["Especialidad", review.project?.specialty || "-"],
    ["Subsistema", review.project?.subsystem || "-"],
    ["Responsable", review.responsible || "-"],
  ]);

  addSection("3. REFERENCIA NORMATIVA", [
    ["ASME B31.3", review.normativaAsmeB313 ? "Sí" : "No"],
    ["ASME B31.4", review.normativaAsmeB314 ? "Sí" : "No"],
    ["API 650", review.normativaApi650 ? "Sí" : "No"],
    ["API 1104", review.normativaApi1104 ? "Sí" : "No"],
    ["AWS D1.1", review.normativaAwsD11 ? "Sí" : "No"],
  ]);

  addSection("4. DOCUMENTACIÓN TÉCNICA", [
    ["Especificación Técnica", review.technicalSpec || "-"],
    ["Planos", review.drawings || "-"],
    ["Descripción de la Desviación", review.deviationDescription || "-"],
  ]);

  addSection("5. ACCIONES CORRECTIVAS", [
    ["Acciones Correctivas", review.correctiveActions || "-"],
  ]);

  const statusMap = { open: "Abierta", closed: "Cerrada", viewed: "Observada" };
  addSection("6. ESTADO DE LIBERACIÓN", [
    ["Estado", statusMap[review.reviewStatus] || review.reviewStatus],
  ]);

  if (review.photos && review.photos.length > 0) {
    addSection("7. REGISTRO FOTOGRÁFICO", [
      ["Cantidad de fotos", String(review.photos.length)],
      ["Ver PDF para imágenes", "-"],
    ]);
  }

  addSection("8. COMENTARIOS", [["Comentarios", review.comments || "-"]]);

  addSection("9. CONCLUSIÓN", [["Conclusión", review.conclusion || "-"]]);

  addSection("10. FIRMAS", [
    ["Inspector", review.inspectorName || "-"],
    ["JT - SUP", review.jtSupName || "-"],
    ["ADC / ITO", review.adcName || "-"],
    ["Cliente", review.clientName || "-"],
  ]);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

export async function generatePdf(review) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const primaryColor = "#002053";
      const lightBg = "#F3FAFF";
      const darkBg = "#002053";
      const textColor = "#071E27";

      doc
        .fontSize(18)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text("DataField", 30, 30);
      doc
        .fontSize(14)
        .fillColor(textColor)
        .font("Helvetica")
        .text("Informe de Inspección", 30, 50);
      doc
        .fontSize(10)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text(`Código: ${review.docCode || "-"}`, 30, 68);

      let y = 90;

      const addSection = (title, data) => {
        if (y > 720) {
          doc.addPage();
          y = 30;
        }

        doc.rect(30, y, 535, 20).fill(darkBg);
        doc
          .fontSize(10)
          .fillColor("#FFFFFF")
          .font("Helvetica-Bold")
          .text(title, 35, y + 5);
        y += 25;

        if (Array.isArray(data)) {
          data.forEach(([label, value]) => {
            if (y > 740) {
              doc.addPage();
              y = 30;
            }
            doc.rect(30, y, 535, 18).fill(lightBg);
            doc
              .fontSize(9)
              .fillColor(textColor)
              .font("Helvetica-Bold")
              .text(label, 35, y + 4, { width: 120 });
            doc
              .font("Helvetica")
              .text(value || "-", 160, y + 4, { width: 400 });
            y += 18;
          });
        }
        y += 10;
      };

      const addPhotoSection = async (photos) => {
        if (!photos || photos.length === 0) return;

        if (y > 650) {
          doc.addPage();
          y = 30;
        }

        doc.rect(30, y, 535, 20).fill(darkBg);
        doc
          .fontSize(10)
          .fillColor("#FFFFFF")
          .font("Helvetica-Bold")
          .text("7. REGISTRO FOTOGRÁFICO", 35, y + 5);
        y += 25;

        for (const photo of photos) {
          if (y > 580) {
            doc.addPage();
            y = 30;
          }

          const photoPath = photo.path;

          doc
            .fontSize(9)
            .fillColor(textColor)
            .font("Helvetica-Bold")
            .text(`Foto:`, 35, y + 4);
          y += 18;

          if (photo.description) {
            doc
              .fontSize(8)
              .fillColor(textColor)
              .font("Helvetica")
              .text(photo.description, 35, y, { width: 500 });
            y += 14;
          }

          const isUrl = photoPath.startsWith("http");

          if (isUrl) {
            try {
              const imgBuffer = await fetchImageAsBuffer(photoPath);
              doc.image(imgBuffer, 35, y, { fit: [200, 150], align: "center" });
              y += 155;
            } catch (imgErr) {
              doc
                .fontSize(8)
                .fillColor("#73777E")
                .text("[Imagen no disponible]", 35, y);
              y += 20;
            }
          } else if (fs.existsSync(photoPath)) {
            try {
              doc.image(photoPath, 35, y, { fit: [200, 150], align: "center" });
              y += 155;
            } catch (imgErr) {
              doc
                .fontSize(8)
                .fillColor("#73777E")
                .text("[Imagen no disponible]", 35, y);
              y += 20;
            }
          } else {
            doc
              .fontSize(8)
              .fillColor("#73777E")
              .text("[Imagen no encontrada]", 35, y);
            y += 20;
          }

          y += 10;
        }

        y += 5;
      };

      const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString("es-CL") : "-";
      const yesNo = (val) => (val ? "Sí" : "No");

      addSection("1. IDENTIFICACIÓN DEL PROYECTO", [
        ["Proyecto", review.project?.name || "-"],
        ["Contrato", review.project?.projectContract || "-"],
        ["Cliente", review.project?.clientEmail || "-"],
        ["Fecha", formatDate(review.reviewDate)],
        ["Área", review.project?.area || "-"],
        ["Ubicación", review.project?.workLocation || "-"],
      ]);

      addSection("2. IDENTIFICACIÓN DEL ÁREA", [
        ["Sistema", review.project?.workSystem || "-"],
        ["Especialidad", review.project?.specialty || "-"],
        ["Subsistema", review.project?.subsystem || "-"],
        ["Responsable", review.responsible || "-"],
      ]);

      addSection("3. REFERENCIA NORMATIVA", [
        ["ASME B31.3", yesNo(review.normativaAsmeB313)],
        ["ASME B31.4", yesNo(review.normativaAsmeB314)],
        ["API 650", yesNo(review.normativaApi650)],
        ["API 1104", yesNo(review.normativaApi1104)],
        ["AWS D1.1", yesNo(review.normativaAwsD11)],
      ]);

      addSection("4. DOCUMENTACIÓN TÉCNICA", [
        ["Especificación Técnica", review.technicalSpec || "-"],
        ["Planos", review.drawings || "-"],
        ["Descripción de la Desviación", review.deviationDescription || "-"],
      ]);

      addSection("5. ACCIONES CORRECTIVAS", [
        ["Acciones Correctivas", review.correctiveActions || "-"],
      ]);

      const statusMap = {
        open: "Abierta",
        closed: "Cerrada",
        viewed: "Observada",
      };
      addSection("6. ESTADO DE LIBERACIÓN", [
        ["Estado", statusMap[review.reviewStatus] || review.reviewStatus],
      ]);

    await addPhotoSection(review.photos);

      addSection("8. COMENTARIOS", [["Comentarios", review.comments || "-"]]);

      addSection("9. CONCLUSIÓN", [["Conclusión", review.conclusion || "-"]]);

      addSection("10. FIRMAS", [
        ["Inspector", review.inspectorName || "-"],
        ["JT - SUP", review.jtSupName || "-"],
        ["ADC / ITO", review.adcName || "-"],
        ["Cliente", review.clientName || "-"],
      ]);

      doc
        .fontSize(8)
        .fillColor("#73777E")
        .text(`ID: ${review.id}`, 30, doc.page.height - 30);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function exportReview(id, format) {
  const review = await getReviewById(id);
  if (!review) {
    throw new Error("Review not found");
  }

  if (format === "excel") {
    const buffer = await generateExcel(review);
    return {
      buffer,
      filename: `informe-${review.docCode || id}.xlsx`,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  } else if (format === "pdf") {
    const buffer = await generatePdf(review);
    return {
      buffer,
      filename: `informe-${review.docCode || id}.pdf`,
      contentType: "application/pdf",
    };
  } else {
    throw new Error("Invalid format. Use 'pdf' or 'excel'.");
  }
}

export async function getReviewPhotos(reviewId) {
  const { rows } = await pool.query(
    "SELECT id, filename, path, description, created_at FROM review_photos WHERE review_id = $1 ORDER BY created_at",
    [reviewId],
  );
  return rows;
}

export async function saveReviewPhoto(reviewId, filename, description) {
  const reviewDir = path.join(__dirname, "..", "uploads", String(reviewId));
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }
  const relativePath = path.join(String(reviewId), filename);
  const fullPath = path.join(__dirname, "..", "uploads", relativePath);

  const { rows } = await pool.query(
    "INSERT INTO review_photos (review_id, filename, path, description) VALUES ($1, $2, $3, $4) RETURNING *",
    [reviewId, filename, relativePath, description],
  );
  return rows[0];
}

export async function ensureUploadDir(reviewId) {
  const reviewDir = path.join(__dirname, "..", "uploads", String(reviewId));
  if (!fs.existsSync(reviewDir)) {
    fs.mkdirSync(reviewDir, { recursive: true });
  }
  return reviewDir;
}

export function getUploadPath() {
  return path.join(__dirname, "..", "uploads");
}

export async function getReviewsList() {
  const { rows } = await pool.query(`
    SELECT r.id, r.doc_code, r.review_date, r.responsible, r.review_status,
           p.name as project_name
    FROM review r
    JOIN project p ON p.id = r.project_id
    ORDER BY r.created_at DESC
  `);

  return rows.map((r) => ({
    id: r.id,
    docCode: r.doc_code,
    reviewDate: r.review_date,
    responsible: r.responsible,
    reviewStatus: r.review_status,
    projectName: r.project_name,
  }));
}

export async function deleteReview(id) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const uploadsDir = path.join(__dirname, "..", "uploads", String(id));
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }

    await client.query("DELETE FROM review_photos WHERE review_id = $1", [id]);
    await client.query("DELETE FROM review WHERE id = $1", [id]);

    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
