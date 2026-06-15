# 📓 내 메모장 (notepad)

에버노트 스타일의 개인 메모장 웹 앱입니다.

> 로그인 없이 접속하면 바로 사용하는 **단일 사용자 메모장**입니다.

## 주요 기능

- ✅ 로그인 없이 접속 즉시 사용
- ✅ 노트 작성 · 수정 · 삭제 (자동 저장)
- ✅ 노트북(폴더)으로 노트 분류
- ✅ 태그 지정 및 태그별 필터
- ✅ 제목 · 본문 전체 검색
- ✅ 리치 텍스트 에디터 (굵게/기울임/밑줄/목록/제목/인용)

## 기술 스택

| 구분   | 기술                         |
| ------ | ---------------------------- |
| 프론트 | React 18 + Vite              |
| 백엔드 | Node.js + Express            |
| DB     | Turso (libsql/SQLite) + Prisma ORM |
| 배포   | Render Blueprint (무료 플랜) |

## 프로젝트 구조

```
notepad/
├── render.yaml          # Render 블루프린트 (무료 플랜)
├── package.json         # 루트 빌드/실행 스크립트
├── server/              # Express + Prisma 백엔드
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.js     # 진입점 (API + 정적파일 서빙)
│       └── routes/      # notebooks, notes, tags
└── client/              # React + Vite 프론트엔드
    └── src/
        ├── pages/       # Workspace (메모장 화면)
        └── components/  # Editor (리치 텍스트)
```

## 로컬 개발

### 1. 환경 변수 설정

`.env.example` 를 복사해 `server/.env` 를 만들고 값을 채웁니다.

```bash
cp .env.example server/.env
```

```env
# Turso 연결 정보 (런타임에서 실제 사용)
TURSO_URL="libsql://your-database-name.turso.io"
TURSO_TOKEN="your-turso-auth-token"
# Prisma CLI 전용 더미 값
DATABASE_URL="file:./dev.db"
PORT=5000
```

> Turso DB와 토큰은 [Turso CLI](https://docs.turso.tech/quickstart) 로 생성합니다:
> `turso db create notepad` → `turso db show notepad --url` (TURSO_URL),
> `turso db tokens create notepad` (TURSO_TOKEN).

### 2. 의존성 설치

```bash
npm run install:all
```

### 3. DB 스키마 적용 (Turso에 테이블 생성)

```bash
npm run prisma:push --prefix server
```

### 4. 개발 서버 실행

터미널 두 개에서 각각 실행합니다.

```bash
npm run dev:server   # 백엔드 (http://localhost:5000)
npm run dev:client   # 프론트 (http://localhost:5173)
```

브라우저에서 http://localhost:5173 접속.

## 배포 (Render Blueprint)

1. 이 저장소를 GitHub 에 푸시합니다.
2. [Render 대시보드](https://dashboard.render.com) → **New** → **Blueprint** 선택.
3. 저장소를 연결하면 `render.yaml` 을 자동 인식합니다.
4. **Apply** 전에 `TURSO_URL`, `TURSO_TOKEN` 환경 변수를 대시보드에서 입력합니다.
   (blueprint에 `sync: false` 로 선언되어 있어 값은 직접 넣어야 합니다.)
5. **Apply** 클릭 → 무료 웹 서비스가 생성되고, 빌드 중 Turso에 스키마가 적용됩니다.
6. 배포가 끝나면 발급된 URL 로 접속합니다.

> 모든 리소스가 `plan: free` 로 설정되어 있습니다.
> 무료 웹 서비스는 일정 시간 미사용 시 잠자기 상태가 되어 첫 접속이 느릴 수 있습니다.
> 인증이 없으므로 공개 배포 시 URL 을 아는 사람은 누구나 접근할 수 있습니다.
