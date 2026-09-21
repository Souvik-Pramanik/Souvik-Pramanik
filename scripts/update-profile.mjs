import fs from "node:fs";

const username = "Souvik-Pramanik";

const response = await fetch(
  `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
  {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Souvik-Pramanik-Profile"
    }
  }
);

if (!response.ok) {
  throw new Error(`GitHub API returned ${response.status}`);
}

const repos = await response.json();

const userResponse = await fetch(
  `https://api.github.com/users/${username}`,
  {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Souvik-Pramanik-Profile"
    }
  }
);

if (!userResponse.ok) {
  throw new Error(`GitHub user API returned ${userResponse.status}`);
}

const user = await userResponse.json();

const publicRepos = repos.filter(repo => !repo.fork);

const totalStars = publicRepos.reduce(
  (sum, repo) => sum + repo.stargazers_count,
  0
);

const totalForks = publicRepos.reduce(
  (sum, repo) => sum + repo.forks_count,
  0
);

const recentlyUpdated = publicRepos
  .sort(
    (a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
  )
  .slice(0, 5);

const generatedAt = new Date().toISOString();

const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="1200"
     height="280"
     viewBox="0 0 1200 280">

<defs>
  <linearGradient id="g" x1="0" x2="1">
    <stop offset="0%" stop-color="#58A6FF"/>
    <stop offset="50%" stop-color="#A371F7"/>
    <stop offset="100%" stop-color="#3FB950"/>
  </linearGradient>
</defs>

<rect width="1200" height="280"
      rx="18"
      fill="#0D1117"
      stroke="#30363D"/>

<text x="55" y="55"
      font-family="monospace"
      font-size="20"
      font-weight="bold"
      fill="#F0F6FC">
  GITHUB TELEMETRY
</text>

<text x="55" y="82"
      font-family="monospace"
      font-size="12"
      fill="#8B949E">
  LIVE PUBLIC PROFILE SIGNALS
</text>

<line x1="55" y1="105"
      x2="1145" y2="105"
      stroke="#30363D"/>

<g font-family="monospace">

<text x="70" y="145" font-size="13" fill="#8B949E">
REPOSITORIES
</text>

<text x="70" y="178" font-size="28"
      font-weight="bold"
      fill="#58A6FF">
${publicRepos.length}
</text>

<text x="320" y="145" font-size="13" fill="#8B949E">
FOLLOWERS
</text>

<text x="320" y="178" font-size="28"
      font-weight="bold"
      fill="#A371F7">
${user.followers}
</text>

<text x="570" y="145" font-size="13" fill="#8B949E">
STARS
</text>

<text x="570" y="178" font-size="28"
      font-weight="bold"
      fill="#3FB950">
${totalStars}
</text>

<text x="820" y="145" font-size="13" fill="#8B949E">
FORKS
</text>

<text x="820" y="178" font-size="28"
      font-weight="bold"
      fill="#F0883E">
${totalForks}
</text>

</g>

<line x1="55" y1="205"
      x2="1145" y2="205"
      stroke="#30363D"/>

<text x="55" y="235"
      font-family="monospace"
      font-size="11"
      fill="#8B949E">
LAST PROFILE SYNC
</text>

<text x="220" y="235"
      font-family="monospace"
      font-size="11"
      fill="url(#g)">
${generatedAt}
</text>

<text x="1140" y="235"
      text-anchor="end"
      font-family="monospace"
      font-size="11"
      fill="#3FB950">
● AUTOMATED
</text>

</svg>
`;

fs.mkdirSync("assets", { recursive: true });

fs.writeFileSync(
  "assets/github-metrics.svg",
  svg.trim()
);

console.log("GitHub telemetry updated.");