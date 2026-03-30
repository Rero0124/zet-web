# zet-web

Zet(제품 트렌드) 웹 프론트엔드. Next.js 16 + React 19 + Tailwind 4.

## 요구사항

- Node.js 20.9+
- pnpm

## 설정

```bash
pnpm install
```

환경변수 (선택):
```
NEXT_PUBLIC_API_URL=http://localhost:3002/api  # 기본값
```

## 실행

```bash
pnpm dev    # http://localhost:3000
pnpm build  # 프로덕션 빌드
```

API 서버(`zet-server`)가 3002에서 실행 중이어야 합니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router (라우트)
│   ├── layout.tsx          # 루트 레이아웃 (Nav 포함)
│   ├── page.tsx            # / — 메인 피드
│   ├── login/page.tsx      # /login
│   ├── register/page.tsx   # /register
│   ├── profile/page.tsx    # /profile — 프로필 편집 + 내 게시글
│   ├── search/page.tsx     # /search
│   ├── trending/page.tsx   # /trending
│   ├── write/page.tsx      # /write — 게시글 작성 (기업 회원)
│   └── post/
│       └── [id]/
│           ├── page.tsx    # /post/:id — 게시글 상세
│           └── edit/
│               └── page.tsx # /post/:id/edit — 게시글 수정
├── components/             # UI 컴포넌트 (Client Components)
│   ├── nav.tsx             # 상단 네비게이션
│   ├── feed-page.tsx       # 피드 (카테고리 select + 정렬 탭)
│   ├── post-card.tsx       # 게시글 카드 (인터랙션 트래킹 포함)
│   ├── post-detail.tsx     # 게시글 상세 (좋아요/북마크/리뷰 CRUD)
│   ├── edit-post.tsx       # 게시글 수정 폼
│   ├── write-post.tsx      # 게시글 작성 폼
│   ├── login-form.tsx      # 로그인 폼
│   ├── register-form.tsx   # 회원가입 폼 (기업 여부 체크)
│   ├── profile-page.tsx    # 프로필 편집 + 내 게시글 목록
│   ├── search-page.tsx     # 검색
│   └── trending-page.tsx   # 트렌드 (기간/인구통계 필터 + 인기 키워드)
└── lib/
    ├── api.ts              # API 클라이언트 (fetch wrapper)
    ├── auth.ts             # 쿠키 기반 인증 (getAuthUser, setAuthCookie, clearAuthCookie)
    ├── types.ts            # 공통 타입 (Post, Reaction, KeywordTrend)
    └── tracker.ts          # 인터랙션 트래킹 (impression/dwell/click, 배치 전송)
```

## 페이지별 기능

### 피드 (`/`)
- 카테고리 필터 (select)
- 정렬: 인기순 / 최신순 / 추천순 (모두 추천 로직 기반, 가중치만 다름)
- 게시글 카드에 좋아요/북마크 버튼
- IntersectionObserver로 노출(impression), 체류(dwell), 클릭(click) 자동 트래킹

### 게시글 상세 (`/post/:id`)
- 좋아요/북마크 토글
- 별점 + 텍스트 리뷰 작성
- 본인 리뷰 수정/삭제
- 본인 게시글이면 수정/삭제 버튼

### 트렌드 (`/trending`)
- 기간: 오늘 / 이번 주 / 이번 달
- 인구통계 필터: 나이대, 성별, 카테고리
- 해당 인구통계 사용자들이 **실제 반응한** 게시글/키워드 기준

### 프로필 (`/profile`)
- 프로필 편집: 이름, 생년월일, 성별, 지역
- 내 게시글 탭: 작성한 게시글 목록 + 수정/삭제

### 회원가입 (`/register`)
- 기본 정보: 이름, 이메일, 비밀번호, 생년월일, 성별, 지역
- 기업 회원 체크 시: 기업명 + 사업자등록번호 입력

## 인증

쿠키 기반 (`zet_user`, 30일 유효):
- 로그인/회원가입 성공 시 유저 정보를 쿠키에 JSON으로 저장
- `getAuthUser()`로 현재 로그인 유저 조회
- Nav에서 로그인 상태에 따라 UI 분기 (기업 회원이면 "글쓰기" 표시)

## 인터랙션 트래킹

`src/lib/tracker.ts`:
- **impression**: 게시글이 화면에 50% 이상 보이면 기록
- **dwell**: 화면에서 벗어날 때 체류 시간 기록 (1초 미만 무시)
- **click**: 게시글 클릭 시 기록
- 3초마다 배치로 서버 전송, 페이지 이탈 시 `sendBeacon`으로 보장

## 주의사항

- Next.js 16 사용 — `params`, `searchParams`는 `Promise`이므로 `await` 필수
- `@/*` path alias는 `./src/*` 기준
- 컴포넌트/lib은 `src/` 아래, `app/` 안에 두지 말 것
