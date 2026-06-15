// 노트 라우트 - CRUD + 검색 + 노트북/태그 필터 (인증 없음)
import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();

// 태그 이름 배열을 받아 (없으면 생성하여) 태그 id 배열로 변환한다
async function resolveTagIds(tagNames) {
  if (!Array.isArray(tagNames) || tagNames.length === 0) {
    return [];
  }

  // 중복 제거 및 공백 정리
  const names = [...new Set(tagNames.map((t) => String(t).trim()).filter(Boolean))];

  const ids = [];
  for (const name of names) {
    // 태그는 name 으로 유일하므로 upsert 사용
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    ids.push(tag.id);
  }
  return ids;
}

// 노트 목록 - 검색(q), 노트북(notebookId), 태그(tagId) 필터 지원
router.get("/", async (req, res) => {
  const { q, notebookId, tagId } = req.query;

  const where = {};

  if (notebookId) {
    where.notebookId = notebookId;
  }
  if (tagId) {
    where.tags = { some: { id: tagId } };
  }
  if (q && q.trim()) {
    const keyword = q.trim();
    // 제목 또는 본문에서 대소문자 구분 없이 검색
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ];
  }

  const notes = await prisma.note.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { tags: true, notebook: { select: { id: true, name: true } } },
  });
  return res.json(notes);
});

// 단일 노트 조회
router.get("/:id", async (req, res) => {
  const note = await prisma.note.findUnique({
    where: { id: req.params.id },
    include: { tags: true, notebook: { select: { id: true, name: true } } },
  });
  if (!note) {
    return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
  }
  return res.json(note);
});

// 노트 생성
router.post("/", async (req, res) => {
  const { title, content, notebookId, tags } = req.body || {};

  const tagIds = await resolveTagIds(tags);

  const note = await prisma.note.create({
    data: {
      title: (title || "").trim() || "제목 없음",
      content: content || "",
      notebookId: notebookId || null,
      tags: { connect: tagIds.map((id) => ({ id })) },
    },
    include: { tags: true, notebook: { select: { id: true, name: true } } },
  });
  return res.status(201).json(note);
});

// 노트 수정
router.put("/:id", async (req, res) => {
  const existing = await prisma.note.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
  }

  const { title, content, notebookId, tags } = req.body || {};

  const data = {};
  if (title !== undefined) {
    data.title = (title || "").trim() || "제목 없음";
  }
  if (content !== undefined) {
    data.content = content;
  }
  if (notebookId !== undefined) {
    data.notebookId = notebookId || null;
  }
  // tags 가 제공되면 태그를 전부 새 목록으로 교체한다
  if (tags !== undefined) {
    const tagIds = await resolveTagIds(tags);
    data.tags = { set: tagIds.map((id) => ({ id })) };
  }

  const note = await prisma.note.update({
    where: { id: req.params.id },
    data,
    include: { tags: true, notebook: { select: { id: true, name: true } } },
  });
  return res.json(note);
});

// 노트 삭제
router.delete("/:id", async (req, res) => {
  const existing = await prisma.note.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
  }

  await prisma.note.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

export default router;
