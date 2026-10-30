/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://zet.bz",
  generateRobotsTxt: true,
  // 로그인·작성·편집 화면은 검색에 낼 것이 없다. 글·질문·브랜드 같은 동적 페이지는 server-sitemap.xml 이 맡는다
  exclude: ["/login", "/register", "/write", "/profile", "/search", "/server-sitemap.xml"],
  // 요청마다 렌더링하는 페이지라 빌드 목록에 없는 공개 목록
  additionalPaths: async (config) => [await config.transform(config, "/qna")],
  robotsTxtOptions: {
    additionalSitemaps: ["https://zet.bz/server-sitemap.xml"],
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
    ],
  },
};
