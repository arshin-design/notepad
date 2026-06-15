// 태그 라우트 (인증 없음)
import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// 태그 목록 (노트 개수 포함)
router.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return res.json(tags);
});

// 태그 삭제
router.delete("/:id", async (req, res) => {
  const existing = await prisma.tag.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "태그를 찾을 수 없습니다." });
  }

  await prisma.tag.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

export default router;
