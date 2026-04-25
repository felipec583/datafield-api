import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { PORT } from "./config/consts.js";
import routes from "./route.js";
import fs from "fs";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.use("/api", routes);

app.use((err, req, res, next) => {
  res.status(500).json({ message: "Error", reason: err });
});

app.listen(PORT, () => {
  console.log(`Running on  ${PORT}`);
});
