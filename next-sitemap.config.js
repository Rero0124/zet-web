/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://zet.kr",
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
    ],
  },
};
