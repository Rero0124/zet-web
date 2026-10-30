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
├── app/                      # 라우트 (얇은 서버 컴포넌트 — 데이터 조회/메타데이터 후 컴포넌트 렌더)
│   ├── layout.tsx            # 상단 Nav + 모바일 하단 탭바 + Toaster + 로그인 유도 시트
│   ├── page.tsx              # / — 피드 + (데스크톱) 사이드바
│   ├── post/[id]/            # 제품(광고) 상세, edit/ 수정
│   ├── user/[id]/            # 공개 프로필 (?tab=posts|reviews|qna|saved|insights)
│   ├── profile/              # 프로필 편집
│   ├── search/               # 검색 (?q=, ?category=)
│   ├── trending/             # 트렌드, [keyword]/ 키워드 상세
│   ├── qna/                  # Q&A 목록(?post= 로 제품 지정), [id]/ 상세
│   ├── write/                # 광고 만들기 (브랜드 회원)
│   ├── login/, register/     # ?next= 로 로그인 후 원래 화면 복귀
│   └── server-sitemap.xml/   # 요청 때 API 로 글·질문·브랜드 프로필 주소를 모은 사이트맵 (아래 '검색 엔진')
├── components/
│   ├── ui/                   # avatar, toast, login-prompt, menu, skeleton, stars, empty-state
│   ├── icons.tsx             # SVG 아이콘 + 브랜드 인증 배지
│   ├── nav.tsx               # 상단 바 / 모바일 하단 탭바
│   ├── feed.tsx              # 추천·팔로잉·인기·최신 탭, 카테고리 칩, 무한 스크롤, 스크롤 복원
│   ├── post-card.tsx         # 피드 카드 (브랜드·광고 표시, 가격/CTA, 좋아요·리뷰·공유·저장)
│   ├── post-detail.tsx       # 상세 (CTA, 리뷰/Q&A 탭, 같은 브랜드·비슷한 제품, 모바일 고정 바)
│   ├── insights-panel.tsx    # 작성 브랜드에게만 보이는 광고 성과
│   ├── post-form.tsx         # 광고 작성/수정 공용 폼 (가격·구매 링크·타겟팅·미리보기)
│   ├── review-section.tsx    # 별점 요약·분포, 1인 1리뷰, 정렬/사진 리뷰 필터
│   ├── product-qna.tsx       # 제품 상세 안의 Q&A
│   └── ...                   # user-profile, search-page, trending-page, qna-* 등
└── lib/
    ├── api.ts, auth.ts       # fetch 래퍼, 쿠키 인증 + useAuthUser()
    ├── post-store.ts         # 좋아요/저장 낙관적 업데이트 (화면 간 상태 공유)
    ├── follow-store.ts       # 팔로우 상태 공유
    ├── feed-cache.ts         # 피드 목록·스크롤 위치 캐시
    ├── tracker.ts            # impression/dwell/click/cta 배치 전송
    ├── format.ts, constants.ts, types.ts, hooks.ts, share.ts, hidden-posts.ts
```

## 화면별 기능

- **피드 (`/`)**: 추천/팔로잉/인기/최신 탭, 카테고리 칩, 무한 스크롤, 상세에서 돌아오면 보던 위치 복원. 카드마다 브랜드 프로필·인증 배지·`광고` 표시, 가격·평점과 CTA(구매 링크가 있으면 외부 이동), 태그는 검색으로 연결. `⋯` 메뉴에서 링크 복사·이 광고 숨기기(작성자는 성과 보기·수정·삭제). 데스크톱은 추천 브랜드/지금 뜨는 키워드 사이드바, 모바일은 피드 중간에 추천 브랜드 캐러셀.
- **제품 상세 (`/post/:id`)**: 제목/본문/미디어, 타겟팅 안내("○○ 사용자에게 우선 노출돼요"), 가격·별점 요약, 브랜드 팔로우, 리뷰/Q&A 탭, 같은 브랜드·비슷한 제품. 모바일은 하단 고정 바(좋아요·저장·CTA). 작성 브랜드에게는 광고 성과(도달·클릭률·링크 클릭·체류·14일 추이·반응 사용자 분포).
- **리뷰**: 1인 1리뷰(작성 후에는 "내 리뷰 수정"), 본인 광고에는 리뷰 불가, 별점 분포, 정렬, 사진 리뷰 필터.
- **프로필 (`/user/:id`)**: 아바타·소개·통계·팔로우/공유. 브랜드는 게시물, 일반 회원은 리뷰 탭. 본인은 저장됨, 브랜드 본인은 광고 성과(게시물별 표) 탭 추가. 연령·성별·지역은 본인에게만 보임.
- **검색 (`/search`)**: 최근 검색어, 많이 찾는 키워드, 카테고리, 추천 브랜드 → 결과는 제품/브랜드·사용자 탭 + 카테고리 필터. 부분 일치·`#태그` 검색 지원.
- **트렌드**: 기간·연령·성별 칩, 인기 제품 줄, 키워드 순위 + 스파크라인 → 키워드 상세에서 관련 제품까지 이어짐.
- **Q&A**: 제품을 검색해서 선택(게시글 ID 입력 불필요), 질문마다 제품 표시, 브랜드 답변 배지.
- **로그인이 필요한 동작**(좋아요·저장·리뷰·질문·팔로우)은 비로그인 시 로그인 시트를 띄우고, 로그인 후 원래 화면으로 돌아옴.

## 검색 엔진

- `pnpm build` 뒤 `postbuild`(next-sitemap, `next-sitemap.config.js`)가 `public/robots.txt`·`sitemap.xml`(색인)·`sitemap-0.xml` 을 다시 만든다 — 주소는 `https://zet.bz`. 정적 사이트맵에서 로그인·회원가입·글쓰기·프로필 편집·검색은 뺐고, 요청마다 렌더링해 빌드 목록에 없는 `/qna` 는 `additionalPaths` 로 넣는다.
- `/server-sitemap.xml`(`src/app/server-sitemap.xml/route.ts`): 요청 때 `/feed?sort=latest`·`/questions`·`/brands` 를 끝까지 읽어(목록마다 최대 5,000개) 글·질문·브랜드 프로필 주소를 낸다. `Cache-Control: public, max-age=3600`. API 가 실패하면 500(검색 엔진이 나중에 다시 읽음).
- demo.zet.bz 도 같은 코드로 빌드되지만 nginx 가 `X-Robots-Tag: noindex` 를 붙여 검색에서 빠진다.

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
- **cta**: 광고의 구매 링크(외부) 클릭 시 기록
- 작성자 본인의 조회는 성과 왜곡을 막기 위해 기록하지 않음
- 3초마다 배치로 서버 전송, 페이지 이탈/백그라운드 전환 시 `sendBeacon`으로 보장

## 주의사항

- Next.js 16 사용 — `params`, `searchParams`는 `Promise`이므로 `await` 필수
- `@/*` path alias는 `./src/*` 기준
- 컴포넌트/lib은 `src/` 아래, `app/` 안에 두지 말 것
