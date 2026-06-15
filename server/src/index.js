// 메모장 백엔드 진입점
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import authRoutes from "./routes/auth.js";
import notebookRoutes from "./routes/notebooks.js";
import noteRoutes from "./routes/notes.js";
import tagRoutes from "./routes/tags.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" })); // 리치 텍스트 본문을 위해 한도 상향

// 헬스 체크 (Render 등에서 사용)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API 라우트
app.use("/api/auth", authRoutes);
app.use("/api/notebooks", notebookRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tags", tagRoutes);

// 프로덕션: 빌드된 React 정적 파일 제공
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA 라우팅: API 외의 모든 경로는 index.html 로
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// 공통 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "서버 오류가 발생했습니다." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
