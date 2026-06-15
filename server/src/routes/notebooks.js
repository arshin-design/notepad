// 노트북(폴더) 라우트
import { Router } from "express";
import prisma from "../prisma.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.use(authRequired);

// 노트북 목록 (각 노트북의 노트 개수 포함)
router.get("/", async (req, res) => {
  const notebooks = await prisma.notebook.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return res.json(notebooks);
});

// 노트북 생성
router.post("/", async (req, res) => {
  const { name } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "노트북 이름을 입력하세요." });
  }

  const notebook = await prisma.notebook.create({
    data: { name: name.trim(), userId: req.userId },
  });
  return res.status(201).json(notebook);
});

// 노트북 이름 수정
router.put("/:id", async (req, res) => {
  const { name } = req.body || {};
  const existing = await prisma.notebook.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "노트북을 찾을 수 없습니다." });
  }

  const updated = await prisma.notebook.update({
    where: { id: req.params.id },
    data: { name: (name || "").trim() || existing.name },
  });
  return res.json(updated);
});

// 노트북 삭제 (속한 노트는 삭제되지 않고 노트북 소속만 해제됨)
router.delete("/:id", async (req, res) => {
  const existing = await prisma.notebook.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "노트북을 찾을 수 없습니다." });
  }

  await prisma.notebook.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

export default router;
