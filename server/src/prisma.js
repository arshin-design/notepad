// Prisma 클라이언트 싱글턴 (Turso/libsql 어댑터 사용)
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url) {
  throw new Error("TURSO_URL 환경 변수가 설정되어 있지 않습니다.");
}

// Turso(libsql) 연결 클라이언트
const libsql = createClient({ url, authToken });

// Prisma 드라이버 어댑터를 통해 libsql 연결을 사용
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

export default prisma;
