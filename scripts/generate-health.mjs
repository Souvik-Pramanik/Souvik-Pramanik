import { writeFileSync } from "node:fs";

const USERNAME = "Souvik-Pramanik";
const OUTPUT = "assets/repository-health.svg";

const API = "https://api.github.com";

const TOKEN = process.env.GITHUB_TOKEN || "";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Souvik-Pramanik-GitHub-Profile",
  "X-GitHub-Api-Version": "2022-11-28"
};

if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

async function github(path) {
  const response = await fetch(`${API}${path}`, {
    headers
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");

    let message = `GitHub API request failed: ${response.status} ${response.statusText}`;

    if (response.status === 403) {
      message += `\nRate limit remaining: ${remaining ?? "unknown"}`;

      if (reset) {
        const resetTime = new Date(Number(reset) * 1000);
        message += `\nRate limit resets: ${resetTime.toLocaleString()}`;
      }

      if (!TOKEN) {
        message +=
          "\n\nNo GITHUB_TOKEN was provided. Set GITHUB_TOKEN for authenticated API access.";
      }
    }

    throw new Error(message);
  }

  return response.json();
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function truncate(value, length = 34) {
  const text = String(value || "");

  return text.length <= length
    ? text
    : `${text.slice(0, length - 1)}…`;
}

function hasPath(tree, patterns) {
  return patterns.some((pattern) =>
    tree.some((item) => {
      const path = item.path.toLowerCase();

      if (pattern.type === "exact") {
        return path === pattern.value;
      }

      if (pattern.type === "contains") {
        return path.includes(pattern.value);
      }

      if (pattern.type === "prefix") {
        return path.startsWith(pattern.value);
      }

      return false;
    })
  );
}

async function getRepositoryTree(repo) {
  const branch = repo.default_branch || "main";

  try {
    return await github(
      `/repos/${USERNAME}/${repo.name}/git/trees/${encodeURIComponent(
        branch
      )}?recursive=1`
    );
  } catch (error) {
    console.warn(`  Tree lookup failed for ${repo.name}`);

    return {
      tree: []
    };
  }
}

function analyzeRepository(repo, tree) {
  const paths = tree
    .filter((item) => item.type === "blob")
    .map((item) => ({
      path: item.path.toLowerCase()
    }));

  const exists = (...names) =>
    names.some((name) =>
      paths.some((item) => item.path === name.toLowerCase())
    );

  const contains = (...names) =>
    names.some((name) =>
      paths.some((item) => item.path.includes(name.toLowerCase()))
    );

  const hasReadme = exists(
    "readme.md",
    "readme",
    "readme.txt"
  );

  const hasLicense =
    exists(
      "license",
      "license.md",
      "license.txt"
    ) ||
    contains("license");

  const hasGitignore = exists(".gitignore");

  const hasDocker =
    exists(
      "dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml"
    ) ||
    contains("dockerfile");

  const hasCICD =
    paths.some((item) =>
      item.path.startsWith(".github/workflows/")
    ) ||
    contains(
      ".gitlab-ci",
      "jenkinsfile",
      "azure-pipelines",
      "bitbucket-pipelines"
    );

  const hasTests =
    contains(
      "__tests__",
      "test/",
      "tests/",
      "spec/",
      "specs/"
    ) ||
    exists(
      "jest.config.js",
      "jest.config.cjs",
      "jest.config.mjs",
      "vitest.config.js",
      "vitest.config.ts",
      "pytest.ini",
      "tox.ini"
    ) ||
    paths.some((item) =>
      /(^|\/)(test|tests|spec|specs)[^/]*\.(js|jsx|ts|tsx|py|java|go|rb|php|cs)$/.test(
        item.path
      )
    );

  const hasPackageManagement =
    exists(
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "requirements.txt",
      "pyproject.toml",
      "pipfile",
      "pipfile.lock",
      "poetry.lock",
      "go.mod",
      "go.sum",
      "pom.xml",
      "build.gradle",
      "build.gradle.kts",
      "cargo.toml",
      "composer.json",
      "gemfile"
    );

  return {
    name: repo.name,
    url: repo.html_url,
    updatedAt: repo.updated_at,
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    language: repo.language || "Other",
    readme: hasReadme,
    license: hasLicense,
    gitignore: hasGitignore,
    docker: hasDocker,
    cicd: hasCICD,
    tests: hasTests,
    packageManagement: hasPackageManagement
  };
}

function statusSymbol(value) {
  return value ? "✓" : "—";
}

function statusColor(value) {
  return value ? "#00ff9d" : "#555b66";
}

function generateSvg(repositories) {
  const width = 1200;

  const rowHeight = 52;
  const headerHeight = 130;
  const footerHeight = 70;

  const visible = repositories.slice(0, 10);

  const height =
    headerHeight +
    visible.length * rowHeight +
    footerHeight;

  const columns = {
    repo: 36,
    readme: 500,
    cicd: 610,
    docker: 720,
    tests: 830,
    package: 960,
    license: 1080
  };

  const rows = visible
    .map((repo, index) => {
      const y = headerHeight + index * rowHeight;

      return `
        <line
          x1="36"
          y1="${y + rowHeight}"
          x2="${width - 36}"
          y2="${y + rowHeight}"
          stroke="#21262d"
        />

        <text
          x="${columns.repo}"
          y="${y + 32}"
          fill="#e6edf3"
          font-size="14"
          font-family="monospace"
        >${escapeXml(truncate(repo.name))}</text>

        <text
          x="${columns.readme}"
          y="${y + 32}"
          fill="${statusColor(repo.readme)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.readme)}</text>

        <text
          x="${columns.cicd}"
          y="${y + 32}"
          fill="${statusColor(repo.cicd)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.cicd)}</text>

        <text
          x="${columns.docker}"
          y="${y + 32}"
          fill="${statusColor(repo.docker)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.docker)}</text>

        <text
          x="${columns.tests}"
          y="${y + 32}"
          fill="${statusColor(repo.tests)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.tests)}</text>

        <text
          x="${columns.package}"
          y="${y + 32}"
          fill="${statusColor(repo.packageManagement)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.packageManagement)}</text>

        <text
          x="${columns.license}"
          y="${y + 32}"
          fill="${statusColor(repo.license)}"
          font-size="18"
          text-anchor="middle"
          font-family="monospace"
        >${statusSymbol(repo.license)}</text>
      `;
    })
    .join("");

  const total = repositories.length;

  const count = (key) =>
    repositories.filter((repo) => repo[key]).length;

  const generated = new Date()
    .toISOString()
    .slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 ${width} ${height}"
>

  <rect
    width="100%"
    height="100%"
    rx="18"
    fill="#0d1117"
    stroke="#30363d"
  />

  <text
    x="36"
    y="38"
    fill="#00ff9d"
    font-size="13"
    font-family="monospace"
    letter-spacing="2"
  >
    REPOSITORY HEALTH MATRIX
  </text>

  <text
    x="36"
    y="70"
    fill="#8b949e"
    font-size="14"
    font-family="monospace"
  >
    Automated repository engineering signals
  </text>

  <text
    x="${width - 36}"
    y="40"
    fill="#8b949e"
    font-size="11"
    text-anchor="end"
    font-family="monospace"
  >
    GITHUB PUBLIC API
  </text>

  <text
    x="${width - 36}"
    y="67"
    fill="#00ff9d"
    font-size="13"
    text-anchor="end"
    font-family="monospace"
  >
    ${total} ACTIVE REPOSITORIES
  </text>

  <rect
    x="24"
    y="88"
    width="${width - 48}"
    height="42"
    rx="8"
    fill="#161b22"
  />

  <text
    x="36"
    y="115"
    fill="#8b949e"
    font-size="12"
    font-family="monospace"
  >
    REPOSITORY
  </text>

  <text
    x="${columns.readme}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    README
  </text>

  <text
    x="${columns.cicd}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    CI/CD
  </text>

  <text
    x="${columns.docker}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    DOCKER
  </text>

  <text
    x="${columns.tests}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    TESTS
  </text>

  <text
    x="${columns.package}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    PACKAGE
  </text>

  <text
    x="${columns.license}"
    y="115"
    fill="#8b949e"
    font-size="12"
    text-anchor="middle"
    font-family="monospace"
  >
    LICENSE
  </text>

  ${rows}

  <line
    x1="36"
    y1="${height - footerHeight + 4}"
    x2="${width - 36}"
    y2="${height - footerHeight + 4}"
    stroke="#30363d"
  />

  <text
    x="36"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    README ${count("readme")}/${total}
  </text>

  <text
    x="170"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    CI/CD ${count("cicd")}/${total}
  </text>

  <text
    x="310"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    DOCKER ${count("docker")}/${total}
  </text>

  <text
    x="465"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    TESTS ${count("tests")}/${total}
  </text>

  <text
    x="600"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    PACKAGE ${count("packageManagement")}/${total}
  </text>

  <text
    x="750"
    y="${height - 30}"
    fill="#8b949e"
    font-size="11"
    font-family="monospace"
  >
    LICENSE ${count("license")}/${total}
  </text>

  <text
    x="${width - 36}"
    y="${height - 30}"
    fill="#555b66"
    font-size="10"
    text-anchor="end"
    font-family="monospace"
  >
    UPDATED ${generated}
  </text>

</svg>`;
}

async function main() {
  console.log("Fetching public GitHub repositories...");

  const repositories = await github(
    `/users/${USERNAME}/repos?per_page=100&sort=updated`
  );

  const activeRepositories = repositories.filter(
    (repo) => !repo.fork && !repo.archived
  );

  console.log(
    `Found ${activeRepositories.length} active public repositories.`
  );

  const results = [];

  for (const repo of activeRepositories) {
    console.log(`Analyzing ${repo.name}...`);

    const treeResponse = await getRepositoryTree(repo);

    const health = analyzeRepository(
      repo,
      treeResponse.tree || []
    );

    results.push(health);
  }

  results.sort(
    (a, b) =>
      new Date(b.updatedAt) -
      new Date(a.updatedAt)
  );

  const svg = generateSvg(results);

  writeFileSync(
    OUTPUT,
    svg,
    "utf8"
  );

  console.log(
    `Repository health generated successfully: ${OUTPUT}`
  );
}

main().catch((error) => {
  console.error("\nRepository health generation failed.");
  console.error(error.message);
  process.exit(1);
});