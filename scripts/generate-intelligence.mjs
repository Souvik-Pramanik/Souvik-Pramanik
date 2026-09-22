import fs from "node:fs";

const USERNAME = "Souvik-Pramanik";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Souvik-Pramanik-GitHub-Profile",
};

async function github(endpoint) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error ${response.status}: ${endpoint}`
    );
  }

  return response.json();
}

/* -------------------------------------------------------
   USER
------------------------------------------------------- */

const user = await github(`/users/${USERNAME}`);

/* -------------------------------------------------------
   REPOSITORIES
------------------------------------------------------- */

const repositories = await github(
  `/users/${USERNAME}/repos?per_page=100&sort=updated`
);

const publicRepositories = repositories.filter(
  (repo) => !repo.fork
);

/* -------------------------------------------------------
   REPOSITORY SIGNALS
------------------------------------------------------- */

const totalStars = publicRepositories.reduce(
  (total, repo) => total + repo.stargazers_count,
  0
);

const totalForks = publicRepositories.reduce(
  (total, repo) => total + repo.forks_count,
  0
);

const openIssues = publicRepositories.reduce(
  (total, repo) => total + repo.open_issues_count,
  0
);

const recentlyUpdated = [...publicRepositories]
  .sort(
    (a, b) =>
      new Date(b.updated_at) -
      new Date(a.updated_at)
  )
  .slice(0, 4);

/* -------------------------------------------------------
   LANGUAGE DISTRIBUTION
------------------------------------------------------- */

const languageCounts = {};

for (const repo of publicRepositories) {
  if (!repo.language) continue;

  languageCounts[repo.language] =
    (languageCounts[repo.language] || 0) + 1;
}

const languages = Object.entries(languageCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6);

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value, length) {
  const text = String(value || "");

  if (text.length <= length) {
    return text;
  }

  return `${text.slice(0, length - 1)}…`;
}

/* -------------------------------------------------------
   SVG
------------------------------------------------------- */

const WIDTH = 1200;
const HEIGHT = 760;

const languageRows = languages
  .map(([language, count], index) => {
    const y = 590 + index * 25;

    return `
      <text
        x="655"
        y="${y}"
        font-family="monospace"
        font-size="13"
        fill="#8B949E">
        ${escapeXml(language)}
      </text>

      <text
        x="910"
        y="${y}"
        font-family="monospace"
        font-size="13"
        fill="#58A6FF">
        ${count} repositories
      </text>
    `;
  })
  .join("");

const repositoryRows = recentlyUpdated
  .map((repo, index) => {
    const y = 405 + index * 38;

    const language = repo.language || "Unknown";

    return `
      <text
        x="70"
        y="${y}"
        font-family="monospace"
        font-size="14"
        fill="#F0F6FC">
        ${escapeXml(truncate(repo.name, 34))}
      </text>

      <text
        x="500"
        y="${y}"
        font-family="monospace"
        font-size="12"
        fill="#8B949E">
        ${escapeXml(language)}
      </text>

      <text
        x="700"
        y="${y}"
        font-family="monospace"
        font-size="12"
        fill="#D29922">
        ★ ${repo.stargazers_count}
      </text>

      <text
        x="810"
        y="${y}"
        font-family="monospace"
        font-size="12"
        fill="#A371F7">
        ⑂ ${repo.forks_count}
      </text>
    `;
  })
  .join("");

const generatedAt = new Date().toISOString();

const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${WIDTH}"
  height="${HEIGHT}"
  viewBox="0 0 ${WIDTH} ${HEIGHT}">

  <defs>

    <linearGradient
      id="background"
      x1="0"
      y1="0"
      x2="1"
      y2="1">

      <stop
        offset="0%"
        stop-color="#05070A"/>

      <stop
        offset="100%"
        stop-color="#0D1117"/>

    </linearGradient>

    <linearGradient
      id="accent"
      x1="0"
      x2="1">

      <stop
        offset="0%"
        stop-color="#58A6FF"/>

      <stop
        offset="50%"
        stop-color="#A371F7"/>

      <stop
        offset="100%"
        stop-color="#3FB950"/>

    </linearGradient>

  </defs>

  <rect
    width="${WIDTH}"
    height="${HEIGHT}"
    rx="20"
    fill="url(#background)"
    stroke="#30363D"/>

  <!-- HEADER -->

  <text
    x="60"
    y="55"
    font-family="monospace"
    font-size="24"
    font-weight="bold"
    fill="#F0F6FC">

    ENGINEERING INTELLIGENCE

  </text>

  <text
    x="60"
    y="82"
    font-family="monospace"
    font-size="12"
    fill="#8B949E">

    LIVE PUBLIC GITHUB ANALYSIS

  </text>

  <line
    x1="60"
    y1="105"
    x2="1140"
    y2="105"
    stroke="#30363D"/>

  <!-- SIGNAL CARDS -->

  <rect
    x="60"
    y="130"
    width="240"
    height="105"
    rx="12"
    fill="#010409"
    stroke="#30363D"/>

  <text
    x="80"
    y="160"
    font-family="monospace"
    font-size="12"
    fill="#8B949E">

    PUBLIC REPOSITORIES

  </text>

  <text
    x="80"
    y="205"
    font-family="monospace"
    font-size="32"
    font-weight="bold"
    fill="#58A6FF">

    ${publicRepositories.length}

  </text>

  <rect
    x="325"
    y="130"
    width="240"
    height="105"
    rx="12"
    fill="#010409"
    stroke="#30363D"/>

  <text
    x="345"
    y="160"
    font-family="monospace"
    font-size="12"
    fill="#8B949E">

    FOLLOWERS

  </text>

  <text
    x="345"
    y="205"
    font-family="monospace"
    font-size="32"
    font-weight="bold"
    fill="#A371F7">

    ${user.followers}

  </text>

  <rect
    x="590"
    y="130"
    width="240"
    height="105"
    rx="12"
    fill="#010409"
    stroke="#30363D"/>

  <text
    x="610"
    y="160"
    font-family="monospace"
    font-size="12"
    fill="#8B949E">

    STARS

  </text>

  <text
    x="610"
    y="205"
    font-family="monospace"
    font-size="32"
    font-weight="bold"
    fill="#3FB950">

    ${totalStars}

  </text>

  <rect
    x="855"
    y="130"
    width="285"
    height="105"
    rx="12"
    fill="#010409"
    stroke="#30363D"/>

  <text
    x="875"
    y="160"
    font-family="monospace"
    font-size="12"
    fill="#8B949E">

    FORKS / OPEN ISSUES

  </text>

  <text
    x="875"
    y="205"
    font-family="monospace"
    font-size="26"
    font-weight="bold"
    fill="#F0883E">

    ${totalForks} / ${openIssues}

  </text>

  <!-- RECENTLY UPDATED -->

  <text
    x="60"
    y="290"
    font-family="monospace"
    font-size="18"
    font-weight="bold"
    fill="#F0F6FC">

    RECENTLY UPDATED

  </text>

  <line
    x1="60"
    y1="310"
    x2="1140"
    y2="310"
    stroke="#30363D"/>

  ${repositoryRows}

  <!-- LANGUAGES -->

  <text
    x="655"
    y="565"
    font-family="monospace"
    font-size="18"
    font-weight="bold"
    fill="#F0F6FC">

    TECHNOLOGY SIGNALS

  </text>

  ${languageRows}

  <!-- FOOTER -->

  <line
    x1="60"
    y1="725"
    x2="1140"
    y2="725"
    stroke="#30363D"/>

  <text
    x="60"
    y="747"
    font-family="monospace"
    font-size="10"
    fill="#484F58">

    SOURCE: GITHUB PUBLIC API

  </text>

  <text
    x="1140"
    y="747"
    text-anchor="end"
    font-family="monospace"
    font-size="10"
    fill="#3FB950">

    ● AUTOMATED · ${generatedAt}

  </text>

</svg>
`;

fs.mkdirSync("assets", { recursive: true });

fs.writeFileSync(
  "assets/engineering-intelligence.svg",
  svg.trim()
);

console.log("Engineering intelligence generated.");