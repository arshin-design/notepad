// Turso(libsql)에 Prisma 스키마를 적용하는 배포용 스크립트
//
// Prisma CLI는 libsql:// 원격 연결을 직접 지원하지 않으므로,
// 1) 현재 스키마로부터 SQL을 생성하고(빈 DB 기준)
// 2) 재실행해도 안전하도록 IF NOT EXISTS 를 붙인 뒤
// 3) libsql 클라이언트로 Turso에 직접 실행한다.
import "dotenv/config";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@libsql/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

// 1) 빈 데이터베이스 기준으로 현재 스키마에 도달하는 SQL 생성
//    --from-empty 이므로 DB에 연결하지 않는다.
// execSync는 셸을 통해 실행되므로 Windows(npx.cmd)/Linux(npx) 모두 동작한다.
// 스키마 경로는 공백이 포함될 수 있어 따옴표로 감싼다.
const rawSql = execSync(
  `npx prisma migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`,
  { encoding: "utf8" }
);

// 2) 멱등성 확보: 이미 존재하는 테이블/인덱스여도 오류 없이 통과하도록 처리
const sql = rawSql
  .replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "')
  .replace(/CREATE UNIQUE INDEX "/g, 'CREATE UNIQUE INDEX IF NOT EXISTS "')
  .replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

// 3) Turso에 연결해 스키마 적용
const url = process.env.TURSO_URL;
const authToken = process.env.TURSO_TOKEN;

if (!url) {
  throw new Error("TURSO_URL 환경 변수가 필요합니다.");
}

const client = createClient({ url, authToken });
await client.executeMultiple(sql);
console.log("Turso 스키마 적용 완료");
