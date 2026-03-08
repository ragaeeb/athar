import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const simulationRoot = new URL('../src/features/gameplay/simulation', import.meta.url);
const simulationRootPath = fileURLToPath(simulationRoot);
const forbiddenSpecifierPatterns = [
    /^react(?:\/|$)/,
    /^react-dom(?:\/|$)/,
    /^three(?:\/|$)/,
    /^@react-three(?:\/|$)/,
    /^react-map-gl(?:\/|$)/,
    /^react-three-map(?:\/|$)/,
    /^maplibre-gl(?:\/|$)/,
    /^@\/features\/map(?:\/|$)/,
    /^@\/features\/gameplay\/presentation(?:\/|$)/,
];

const allowedExtensions = new Set(['.ts', '.tsx']);
const violations = [];

const collectImportSpecifiers = (source, filePath) => {
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const specifiers = [];

    const visit = (node) => {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
        ) {
            specifiers.push(node.moduleSpecifier.text);
        }

        if (
            ts.isCallExpression(node) &&
            node.arguments.length === 1 &&
            ts.isStringLiteral(node.arguments[0]) &&
            ((ts.isIdentifier(node.expression) && node.expression.text === 'require') || node.expression.kind === ts.SyntaxKind.ImportKeyword)
        ) {
            specifiers.push(node.arguments[0].text);
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return specifiers;
};

const walk = (directoryPath) => {
    for (const entry of readdirSync(directoryPath)) {
        const absolutePath = join(directoryPath, entry);
        const stats = statSync(absolutePath);

        if (stats.isDirectory()) {
            walk(absolutePath);
            continue;
        }

        if (!allowedExtensions.has(extname(absolutePath))) {
            continue;
        }

        const source = readFileSync(absolutePath, 'utf8');
        const specifiers = collectImportSpecifiers(source, absolutePath);

        for (const specifier of specifiers) {
            if (forbiddenSpecifierPatterns.some((pattern) => pattern.test(specifier))) {
                violations.push(`${absolutePath}: forbidden import "${specifier}"`);
            }
        }
    }
};

walk(simulationRootPath);

if (violations.length > 0) {
    console.error('Simulation boundary violations detected:');
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}
