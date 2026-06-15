// 인증 라우트 - 회원가입 / 로그인 / 내 정보
import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";
import { authRequired, signToken } from "../middleware/auth.js";

const router = Router();

// 회원가입
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "비밀번호는 6자 이상이어야 합니다." });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "이미 가입된 이메일입니다." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name: name || null },
  });

  const token = signToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// 로그인
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }

  const token = signToken(user.id);
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// 내 정보
router.get("/me", authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  }
  return res.json({ user });
});

export default router;
