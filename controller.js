import { pool } from "./config/db.js";
import { getReviewById, exportReview, getReviewsList, deleteReview } from "./services/form.service.js";
import { sendReviewEmail } from "./services/email.service.js";

const statusMapping = {
  'abierta': 'open',
  'cerrada': 'closed',
  'observada': 'viewed'
};

const statusSpanishMap = {
  'open': 'Abierta',
  'closed': 'Cerrada',
  'viewed': 'Observada'
};

export async function createReview(req, res, next) {
  try {
    const data = req.body;

    const dbReviewStatus = statusMapping[data.reviewStatus] || data.reviewStatus;

    const { rows } = await pool.query(
      `
        INSERT INTO review (
          project_id,
          created_by,
          doc_code,
          review_date,
          responsible,
          normativa_asme_b313,
          normativa_asme_b314,
          normativa_api_650,
          normativa_api_1104,
          normativa_aws_d11,
          technical_spec,
          drawings,
          deviation_description,
          corrective_actions,
          review_status,
          comments,
          conclusion,
          inspector_name,
          jt_sup_name,
          adc_name,
          client_name
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,$14,
          $15,$16,$17,$18,$19,$20,$21
        )
        RETURNING *
        `,
      [
        1, // project_id (hardcoded)
        1, // created_by (hardcoded)
        data.docCode,

        data.reviewDate,
        data.responsible,

        data.normativaAsmeB313,
        data.normativaAsmeB314,
        data.normativaApi650,
        data.normativaApi1104,
        data.normativaAwsD11,

        data.technicalSpec,
        data.drawings,

        data.deviationDescription,
        data.correctiveActions,

        dbReviewStatus,
        data.comments,
        data.conclusion,

        data.inspectorName,
        data.jtSupName,
        data.adcName,
        data.clientName,
      ],
    );

    const newReview = rows[0];
    res.status(200).json({
      message: "New review created",
      reviewId: newReview.id,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectInfo(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT * FROM project where id = 1");
    const data = rows[0];

    const response = {
      id: data.id,
      name: data.name,
      clientEmail: data.client_email,
      workSystem: data.work_system,
      subsystem: data.subsystem,
      specialty: data.specialty,
      workLocation: data.work_location,
      projectContract: data.project_contract,
      area: data.area
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getReviewInfo(req, res, next) {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json(review);
  } catch (err) {
    next(err);
  }
}

export async function exportReviewController(req, res, next) {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const result = await exportReview(id, format);

    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  } catch (err) {
    if (err.message === "Review not found") {
      return res.status(404).json({ error: "Review not found" });
    }
    if (err.message.includes("Invalid format")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function sendReviewEmailController(req, res, next) {
  try {
    const { id } = req.params;
    const format = req.body?.format || "pdf";
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const review = await getReviewById(id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const result = await exportReview(id, format);

    const reviewInfo = {
      docCode: review.docCode,
      projectName: review.project?.name || 'N/A',
      date: review.reviewDate ? new Date(review.reviewDate).toLocaleDateString('es-CL') : 'N/A',
      status: statusSpanishMap[review.reviewStatus] || review.reviewStatus,
      format: format || 'pdf'
    };

    await sendReviewEmail(email, reviewInfo, {
      filename: result.filename,
      buffer: result.buffer
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.log(err);
    if (err.message === "Review not found") {
      return res.status(404).json({ error: "Review not found" });
    }
    next(err);
  }
}

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const reviewId = req.params.id;
    const destDir = path.join(uploadDir, reviewId);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPEG, JPG, PNG o WebP"));
    }
  },
});

export async function uploadPhotoController(req, res, next) {
  try {
    const { id } = req.params;
    
    if (!fs.existsSync(path.join(uploadDir, id))) {
      fs.mkdirSync(path.join(uploadDir, id), { recursive: true });
    }

    upload.array("photos", 6)(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No se recibió ninguna imagen" });
      }

      if (req.files.length > 6) {
        return res.status(400).json({ error: "Máximo 6 fotos permitidas" });
      }

      const descriptions = req.body.descriptions || [];
      const savedPhotos = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const description = descriptions[i] || "";
        const relativePath = path.join(id, file.filename);

        const { rows } = await pool.query(
          "INSERT INTO review_photos (review_id, filename, path, description) VALUES ($1, $2, $3, $4) RETURNING *",
          [id, file.filename, relativePath, description]
        );
        savedPhotos.push(rows[0]);
      }

      res.status(200).json({ message: "Fotos guardadas", photos: savedPhotos });
    });
  } catch (err) {
    console.error("Error uploading photos:", err);
    res.status(500).json({ error: "Error al subir fotos" });
  }
}

export async function getPhotosController(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT id, filename, path, description, created_at FROM review_photos WHERE review_id = $1 ORDER BY created_at",
      [id]
    );
    res.status(200).json({ photos: rows });
  } catch (err) {
    console.error("Error getting photos:", err);
    res.status(500).json({ error: "Error al obtener fotos" });
  }
}

export async function getReviewsListController(req, res, next) {
  try {
    const reviews = await getReviewsList();
    res.status(200).json({ reviews });
  } catch (err) {
    console.error("Error getting reviews list:", err);
    res.status(500).json({ error: "Error al obtener la lista de inspecciones" });
  }
}

export async function deleteReviewController(req, res, next) {
  try {
    const { id } = req.params;
    await deleteReview(id);
    res.status(200).json({ message: "Inspección eliminada" });
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Error al eliminar inspección" });
  }
}
