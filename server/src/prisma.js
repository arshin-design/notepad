// Prisma 클라이언트 싱글턴
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
