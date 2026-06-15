// 태그 라우트
import { Router } from "express";
import prisma from "../prisma.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.use(authRequired);

// 태그 목록 (노트 개수 포함)
router.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { notes: true } } },
  });
  return res.json(tags);
});

// 태그 삭제
router.delete("/:id", async (req, res) => {
  const existing = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    return res.status(404).json({ error: "태그를 찾을 수 없습니다." });
  }

  await prisma.tag.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

export default router;
