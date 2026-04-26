import { pool } from "./config/db.js";
import {
  getReviewById,
  exportReview,
  getReviewsList,
  deleteReview,
} from "./services/form.service.js";
import { sendReviewEmail } from "./services/email.service.js";
import { CLOUDINARY_CONFIG } from "./config/consts.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const statusMapping = {
  abierta: "open",
  cerrada: "closed",
  observada: "viewed",
};

const statusSpanishMap = {
  open: "Abierta",
  closed: "Cerrada",
  viewed: "Observada",
};

cloudinary.config(CLOUDINARY_CONFIG);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mime = allowedTypes.test(file.mimetype);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes JPEG, JPG, PNG o WebP"));
    }
  },
});

export async function createReview(req, res, next) {
  try {
    const data = req.body;

    const dbReviewStatus =
      statusMapping[data.reviewStatus] || data.reviewStatus;

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
        1,
        1,
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
      area: data.area,
    };

    res.status(200).json(response);
  } catch (err) {
    console.log(`error project info ${err}`);
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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );
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
      projectName: review.project?.name || "N/A",
      date: review.reviewDate
        ? new Date(review.reviewDate).toLocaleDateString("es-CL")
        : "N/A",
      status: statusSpanishMap[review.reviewStatus] || review.reviewStatus,
      format: format || "pdf",
    };

    await sendReviewEmail(email, reviewInfo, {
      filename: result.filename,
      buffer: result.buffer,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    if (err.message === "Review not found") {
      return res.status(404).json({ error: "Review not found" });
    }
    next(err);
  }
}

function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `datafield`,
        resource_type: "image",
        public_id: filename.replace(path.extname(filename), ""),
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );
    uploadStream.end(buffer);
  });
}

export async function uploadPhotoController(req, res, next) {
  try {
    const { id } = req.params;

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
        const filename = file.originalname;

        const result = await uploadToCloudinary(file.buffer, filename);
        const secureUrl = result.secure_url;

        const { rows } = await pool.query(
          "INSERT INTO review_photos (review_id, filename, path, description) VALUES ($1, $2, $3, $4) RETURNING *",
          [id, filename, secureUrl, description],
        );
        savedPhotos.push(rows[0]);
      }

      res.status(200).json({ message: "Fotos guardadas", photos: savedPhotos });
    });
  } catch (err) {
    console.error(`[Upload photos] Error:${error}`);

    res.status(500).json({ error: "Error al subir fotos" });
  }
}

export async function getPhotosController(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT id, filename, path, description, created_at FROM review_photos WHERE review_id = $1 ORDER BY created_at",
      [id],
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
    console.error(`[ReviewList] Error:${error}`);
    res
      .status(500)
      .json({ error: "Error al obtener la lista de inspecciones" });
  }
}

export async function deleteReviewController(req, res, next) {
  try {
    const { id } = req.params;
    await deleteReview(id);
    res.status(200).json({ message: "Inspección eliminada" });
  } catch (err) {
    console.error(`[ReviewDelete] Error:${error}`);
    res.status(500).json({ error: "Error al eliminar inspección" });
  }
}
