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
const outputFile = path.join(reportDir, "oo-metrics.json");

const targetSuffixes = ["-controller.js", "-service.js"];
const routeSuffix = "-routes.js";
const routerMethods = new Set(["get", "post", "put", "delete", "patch", "use"]);

let anonymousCounter = 0;

function isTarget(filePath) {
  return targetSuffixes.some((suffix) => filePath.endsWith(suffix));
}

function isRouteFile(filePath) {
  return filePath.endsWith(routeSuffix);
}

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile() && isTarget(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
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

function safeRelativeImportPaths(imports) {
  return new Set(
    Array.from(imports).filter(
      (source) => source.startsWith("./") || source.startsWith("../")
    )
  );
}

function getDomainFromPath(filePath) {
  const relative = path.relative(targetDir, filePath);
  const parts = relative.split(path.sep);
  return parts.length > 0 && parts[0] ? parts[0] : "unknown";
}

function getSuperName(superClassNode) {
  if (!superClassNode) {
    return null;
  }

  if (superClassNode.type === "Identifier") {
    return superClassNode.name;
  }

  if (superClassNode.type === "MemberExpression") {
    const objectName = getSuperName(superClassNode.object);
    const propertyName =
      superClassNode.property && superClassNode.property.type === "Identifier"
        ? superClassNode.property.name
        : null;
    if (!objectName || !propertyName) {
      return null;
    }
    return `${objectName}.${propertyName}`;
  }

  return null;
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
    case "TemplateLiteral":
      if (node.expressions.length === 0) {
        return `'${node.quasis.map((q) => q.value.cooked).join("")}'`;
      }
      return "`<dynamic>`";
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

function formatMemberName(node) {
  if (!node) {
    return null;
  }

  switch (node.type) {
    case "Identifier":
      return node.name;
    case "ThisExpression":
      return "this";
    case "Super":
      return "super";
    case "MemberExpression": {
      const objectName = formatMemberName(node.object);
      const propertyName =
        node.property && node.property.type === "Identifier"
          ? node.property.name
          : null;
      if (!objectName || !propertyName) {
        return null;
      }
      return `${objectName}.${propertyName}`;
    }
    default:
      return null;
  }
}

function getCalleeName(callee) {
  if (!callee) {
    return null;
  }

  if (callee.type === "Identifier") {
    return callee.name;
  }

  if (callee.type === "MemberExpression") {
    const objectName = formatMemberName(callee.object);
    const propertyName =
      callee.property && callee.property.type === "Identifier"
        ? callee.property.name
        : null;

    if (!objectName || !propertyName) {
      return null;
    }

    return `${objectName}.${propertyName}`;
  }

  return null;
}

function analyzeMethod(methodPath) {
  let complexity = 1;
  const callSet = new Set();

  methodPath.traverse({
    IfStatement() {
      complexity += 1;
    },
    ForStatement() {
      complexity += 1;
    },
    ForInStatement() {
      complexity += 1;
    },
    ForOfStatement() {
      complexity += 1;
    },
    WhileStatement() {
      complexity += 1;
    },
    DoWhileStatement() {
      complexity += 1;
    },
    CatchClause() {
      complexity += 1;
    },
    ConditionalExpression() {
      complexity += 1;
    },
    LogicalExpression(innerPath) {
      if (innerPath.node.operator === "&&" || innerPath.node.operator === "||") {
        complexity += 1;
      }
    },
    SwitchCase(innerPath) {
      if (innerPath.node.test) {
        complexity += 1;
      }
    },
    CallExpression(innerPath) {
      const calleeName = getCalleeName(innerPath.node.callee);
      if (calleeName) {
        callSet.add(calleeName);
      }
    },
  });

  const loc = methodPath.node.loc
    ? methodPath.node.loc.end.line - methodPath.node.loc.start.line + 1
    : null;

  return {
    name:
      methodPath.node.key && methodPath.node.key.type === "Identifier"
        ? methodPath.node.key.name
        : `<anonymous-${++anonymousCounter}>`,
    complexity,
    calls: Array.from(callSet).sort(),
    loc,
  };
}

function analyzeClass(classPath, { filePath, imports }) {
  const bodyPaths = classPath.get("body").get("body");
  const methods = [];
  const callSet = new Set();

  for (const bodyPath of bodyPaths) {
    if (!bodyPath.isClassMethod()) {
      continue;
    }
    if (bodyPath.node.kind === "constructor") {
      continue;
    }

    const methodMetrics = analyzeMethod(bodyPath);
    methods.push(methodMetrics);
    methodMetrics.calls.forEach((call) => callSet.add(call));
  }

  const methodCount = methods.length;
  const wmc = methods.reduce((sum, method) => sum + method.complexity, 0);
  const avgComplexity =
    methodCount === 0 ? 0 : Number((wmc / methodCount).toFixed(2));

  const className =
    classPath.node.id && classPath.node.id.name
      ? classPath.node.id.name
      : `${path.basename(filePath)}#anonymous-${++anonymousCounter}`;

  const classLoc = classPath.node.loc
    ? classPath.node.loc.end.line - classPath.node.loc.start.line + 1
    : null;

  return {
    className,
    filePath: path.relative(projectRoot, filePath),
    domain: getDomainFromPath(filePath),
    methods,
    methodCount,
    wmc,
    avgComplexity,
    rfc: methodCount + callSet.size,
    cbo: imports.size,
    loc: classLoc,
    extendsName: getSuperName(classPath.node.superClass),
  };
}

function computeDit(target, extendsLookup) {
  let depth = 1;
  const seen = new Set();
  let current = extendsLookup.get(target);

  while (current && !seen.has(current)) {
    depth += 1;
    seen.add(current);
    current = extendsLookup.get(current);
  }

  return depth;
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

function normalizeRoutePath(node) {
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

function extractHandlerLabels(arg) {
  if (!arg) {
    return [];
  }

  if (arg.type === "ArrayExpression") {
    return arg.elements.flatMap((element) => extractHandlerLabels(element));
  }

  const label = describeNode(arg);
  return label ? [label] : [];
}

function resolveImportPath(routeFile, source) {
  if (!source) {
    return null;
  }

  if (!source.startsWith(".") && !source.startsWith("/")) {
    return null;
  }

  let resolved = path.resolve(path.dirname(routeFile), source);
  if (!path.extname(resolved)) {
    resolved += ".js";
  }
  return path.relative(projectRoot, resolved);
}

function findControllerRefs(node, importMap, controllerLookup) {
  const results = [];

  function visit(current) {
    if (!current || typeof current !== "object") {
      return;
    }

    if (
      current.type === "MemberExpression" &&
      !current.computed &&
      current.object &&
      current.object.type === "Identifier" &&
      current.property &&
      current.property.type === "Identifier"
    ) {
      const importPath = importMap.get(current.object.name);
      if (importPath) {
        const controller = controllerLookup.get(importPath);
        if (controller) {
          const method = controller.methods.find(
            (item) => item.name === current.property.name
          );
          results.push({
            className: controller.className,
            methodName: current.property.name,
            complexity: method ? method.complexity : null,
          });
        }
      }
    }

    for (const key of Object.keys(current)) {
      const value = current[key];
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        visit(value);
      }
    }
  }

  visit(node);
  return results;
}

async function analyzeEndpoints(classSummaries) {
  const controllerLookup = new Map();
  classSummaries.forEach((summary) => {
    controllerLookup.set(summary.filePath, summary);
  });

  const routeFiles = await collectRouteFiles(targetDir);
  routeFiles.sort();

  const endpoints = [];

  for (const filePath of routeFiles) {
    const relativeFile = path.relative(projectRoot, filePath);
    const domain = getDomainFromPath(filePath);
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
      console.error(`Gagal mem-parsing route ${relativeFile}: ${error.message}`);
      continue;
    }

    const importMap = new Map();
    traverse(ast, {
      ImportDeclaration(path) {
        const importSource = path.node.source.value;
        const resolved = resolveImportPath(filePath, importSource);
        if (!resolved) {
          return;
        }
        path.node.specifiers.forEach((specifier) => {
          importMap.set(specifier.local.name, resolved);
        });
      },
    });

    traverse(ast, {
      CallExpression(callPath) {
        const { node } = callPath;
        if (!node || node.callee.type !== "MemberExpression") {
          return;
        }

        if (
          !node.callee.property ||
          node.callee.property.type !== "Identifier" ||
          !routerMethods.has(node.callee.property.name)
        ) {
          return;
        }

        if (!isRouterObject(node.callee.object)) {
          return;
        }

        const method = node.callee.property.name.toUpperCase();
        const routePath = normalizeRoutePath(node.arguments[0]);
        const handlerNodes = node.arguments.slice(1);
        const handlerLabels = handlerNodes.flatMap(extractHandlerLabels);

        const controllerRefs = handlerNodes.flatMap((arg) =>
          findControllerRefs(arg, importMap, controllerLookup)
        );

        const cyclomaticComplexity = controllerRefs.reduce(
          (sum, ref) => sum + (ref.complexity ?? 0),
          0
        );

        endpoints.push({
          domain,
          filePath: relativeFile,
          method,
          path: routePath,
          handlers: handlerLabels,
          controllerMethods: controllerRefs,
          cyclomaticComplexity,
        });
      },
    });
  }

  return endpoints.sort(
    (a, b) =>
      a.domain.localeCompare(b.domain) ||
      a.filePath.localeCompare(b.filePath) ||
      a.path.localeCompare(b.path) ||
      a.method.localeCompare(b.method)
  );
}

async function generateMetrics() {
  const files = await collectFiles(targetDir);
  files.sort();

  const classSummaries = [];

  for (const filePath of files) {
    const relativeFile = path.relative(projectRoot, filePath);
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
      console.error(`Gagal mem-parsing ${relativeFile}: ${error.message}`);
      continue;
    }

    const importSources = new Set();
    traverse(ast, {
      ImportDeclaration(path) {
        importSources.add(path.node.source.value);
      },
    });

    const relativeImports = safeRelativeImportPaths(importSources);

    traverse(ast, {
      ClassDeclaration(classPath) {
        classSummaries.push(
          analyzeClass(classPath, {
            filePath,
            imports: relativeImports,
          })
        );
      },
    });
  }

  const extendsLookup = new Map(
    classSummaries
      .filter((item) => item.extendsName)
      .map((item) => [item.className, item.extendsName])
  );

  const nocLookup = new Map();
  classSummaries.forEach((item) => {
    if (item.extendsName) {
      nocLookup.set(
        item.extendsName,
        (nocLookup.get(item.extendsName) ?? 0) + 1
      );
    }
  });

  classSummaries.forEach((item) => {
    item.dit = computeDit(item.className, extendsLookup);
    item.noc = nocLookup.get(item.className) ?? 0;
  });

  const domainAggregates = {};
  const totals = {
    classes: 0,
    methods: 0,
    wmc: 0,
    rfc: 0,
    cbo: 0,
  };

  for (const summary of classSummaries) {
    totals.classes += 1;
    totals.methods += summary.methodCount;
    totals.wmc += summary.wmc;
    totals.rfc += summary.rfc;
    totals.cbo += summary.cbo;

    if (!domainAggregates[summary.domain]) {
      domainAggregates[summary.domain] = {
        domain: summary.domain,
        classes: 0,
        methods: 0,
        wmc: 0,
        avgComplexity: 0,
        rfc: 0,
        cbo: 0,
      };
    }

    const aggregate = domainAggregates[summary.domain];
    aggregate.classes += 1;
    aggregate.methods += summary.methodCount;
    aggregate.wmc += summary.wmc;
    aggregate.rfc += summary.rfc;
    aggregate.cbo += summary.cbo;
    aggregate.avgComplexity = Number(
      (aggregate.wmc / Math.max(aggregate.methods, 1)).toFixed(2)
    );
  }

  const endpoints = await analyzeEndpoints(classSummaries);

  const report = {
    generatedAt: new Date().toISOString(),
    targetDir: path.relative(projectRoot, targetDir),
    totals,
    domainSummary: Object.values(domainAggregates),
    classes: classSummaries.sort((a, b) =>
      a.domain.localeCompare(b.domain) ||
      a.className.localeCompare(b.className)
    ),
    endpoints,
  };

  await mkdir(reportDir, { recursive: true });
  await writeFile(outputFile, JSON.stringify(report, null, 2));

  console.log(`OO metrics berhasil dibuat di ${path.relative(projectRoot, outputFile)}`);
  console.log("\nRingkasan kelas:");
  console.table(
    report.classes.map((cls) => ({
      Domain: cls.domain,
      Class: cls.className,
      Methods: cls.methodCount,
      WMC: cls.wmc,
      RFC: cls.rfc,
      CBO: cls.cbo,
      DIT: cls.dit,
      NOC: cls.noc,
      "Avg CC": cls.avgComplexity,
    }))
  );

  console.log("\nRingkasan per domain:");
  console.table(
    report.domainSummary.map((summary) => ({
      Domain: summary.domain,
      Classes: summary.classes,
      Methods: summary.methods,
      WMC: summary.wmc,
      RFC: summary.rfc,
      CBO: summary.cbo,
      "Avg CC": summary.avgComplexity,
    }))
  );

  if (report.endpoints.length) {
    console.log("\nKompleksitas per endpoint:");
    console.table(
      report.endpoints.map((endpoint) => ({
        Domain: endpoint.domain,
        Method: endpoint.method,
        Path: endpoint.path,
        "Route File": endpoint.filePath,
        CC: endpoint.cyclomaticComplexity,
      }))
    );
  }
}

generateMetrics().catch((error) => {
  console.error("Gagal menghitung OO metrics:", error);
  process.exit(1);
});
