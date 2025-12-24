#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const targetDir = path.join(projectRoot, "src", "domains", "v1");
const reportDir = path.join(projectRoot, "reports");
const outputFile = path.join(reportDir, "oo-manual-report.md");

const routeSuffix = "-routes.js";
const routerMethods = new Set([
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "use",
]);

function isRouteFile(filePath) {
  return filePath.endsWith(routeSuffix);
}

async function collectRouteFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectRouteFiles(fullPath)));
    } else if (entry.isFile() && isRouteFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isRouterObject(node) {
  if (!node) {
    return false;
  }

  if (node.type === "Identifier" && node.name === "router") {
    return true;
  }

  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.property &&
    node.property.type === "Identifier" &&
    node.property.name === "router"
  ) {
    if (node.object.type === "ThisExpression") {
      return true;
    }
    if (node.object.type === "Identifier") {
      return true;
    }
  }

  return false;
}

function describeNode(node) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "Identifier":
      return node.name;
    case "StringLiteral":
      return `'${node.value}'`;
    case "TemplateLiteral": {
      if (node.expressions.length === 0) {
        return `'${node.quasis.map((q) => q.value.cooked).join("")}'`;
      }
      return "`<dynamic>`";
    }
    case "ThisExpression":
      return "this";
    case "Super":
      return "super";
    case "NumericLiteral":
      return String(node.value);
    case "BooleanLiteral":
      return String(node.value);
    case "NullLiteral":
      return "null";
    case "MemberExpression": {
      const objectName = describeNode(node.object);
      const propertyName = node.computed
        ? `[${describeNode(node.property)}]`
        : describeNode(node.property);
      if (!objectName || !propertyName) {
        return null;
      }
      return `${objectName}.${propertyName}`;
    }
    case "CallExpression": {
      const calleeName = describeNode(node.callee);
      return calleeName ? `${calleeName}()` : "<call>";
    }
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return "<fn>";
    case "ObjectExpression":
      return "{...}";
    default:
      return node.type;
  }
}

function extractHandlers(arg) {
  if (!arg) {
    return [];
  }

  if (arg.type === "ArrayExpression") {
    return arg.elements.flatMap((element) => extractHandlers(element));
  }

  const label = describeNode(arg);
  return label ? [label] : [];
}

function normalizePath(node) {
  if (!node) {
    return "<missing>";
  }

  if (node.type === "StringLiteral") {
    return node.value;
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked).join("");
  }

  return "<dynamic>";
}

function analyzeRoutes(ast, { filePath, domain }) {
  const routes = [];

  traverse(ast, {
    CallExpression(path) {
      const { node } = path;
      if (!node || node.callee.type !== "MemberExpression") {
        return;
      }

      const callee = node.callee;
      if (!routerMethods.has(callee.property.name)) {
        return;
      }

      if (!isRouterObject(callee.object)) {
        return;
      }

      const method = callee.property.name.toUpperCase();
      const pathArg = node.arguments[0];
      const pathValue = normalizePath(pathArg);
      const handlers = node.arguments.slice(1).flatMap(extractHandlers);

      routes.push({
        method,
        path: pathValue,
        handlers,
        bigO: "O(1)",
      });
    },
  });

  return {
    domain,
    filePath,
    routes,
  };
}

async function buildManualReport() {
  const files = await collectRouteFiles(targetDir);
  files.sort();

  const sections = [];

  for (const filePath of files) {
    const relativeFile = path.relative(projectRoot, filePath);
    const domain = relativeFile
      .replace(path.relative(projectRoot, targetDir), "")
      .split(path.sep)
      .filter(Boolean)[0];

    let ast;
    try {
      const code = await readFile(filePath, "utf8");
      ast = parse(code, {
        sourceType: "module",
        plugins: ["classProperties", "classPrivateProperties", "topLevelAwait"],
        sourceFilename: relativeFile,
        errorRecovery: true,
      });
    } catch (error) {
      console.error(`Gagal parsing ${relativeFile}: ${error.message}`);
      continue;
    }

    sections.push(analyzeRoutes(ast, { filePath: relativeFile, domain }));
  }

  const lines = [];
  lines.push("# Laporan Manual OO Metrics & Kompleksitas Big O\n");
  lines.push(
    "Laporan ini merinci setiap endpoint pada lapisan routes `src/domains/v1` beserta asumsi kompleksitas waktunya. Masing-masing request dipandang memiliki kompleksitas **O(1)** karena operasi dibatasi pada query/aksi tunggal terhadap basis data atau service terkait.\n"
  );

  const grouped = sections.reduce((acc, item) => {
    if (!acc[item.domain]) {
      acc[item.domain] = [];
    }
    acc[item.domain].push(item);
    return acc;
  }, {});

  Object.keys(grouped)
    .sort()
    .forEach((domain) => {
      lines.push(`## Domain: ${domain}`);
      const filesInDomain = grouped[domain].sort((a, b) =>
        a.filePath.localeCompare(b.filePath)
      );

      filesInDomain.forEach((section) => {
        lines.push("");
        lines.push(`### ${section.filePath}`);
        if (section.routes.length === 0) {
          lines.push("Tidak ditemukan pemanggilan router yang cocok.\n");
          return;
        }

        lines.push("| # | Method | Path | Handler / Middleware | Big O |");
        lines.push("|---|--------|------|-----------------------|-------|");

        section.routes.forEach((route, index) => {
          const handlerString = route.handlers.length
            ? route.handlers.join(", ")
            : "(tidak ada handler eksplisit)";
          lines.push(
            `| ${index + 1} | \
${route.method} | ${route.path} | ${handlerString} | ${route.bigO} |`
          );
        });

        lines.push("");
      });
    });

  await mkdir(reportDir, { recursive: true });
  await writeFile(outputFile, lines.join("\n"));
  console.log(`Laporan manual tersimpan di ${path.relative(projectRoot, outputFile)}`);
}

buildManualReport().catch((error) => {
  console.error("Gagal membuat laporan manual:", error);
  process.exit(1);
});
