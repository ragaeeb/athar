import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const contentRoot = join(process.cwd(), 'src/content');

const placeholderMatchers = [
    {
        description: 'placeholder marker',
        pattern: /\bplaceholder\b/gi,
    },
    {
        description: 'todo marker',
        pattern: /\bTODO\b/g,
    },
    {
        description: 'tbd marker',
        pattern: /\bTBD\b/g,
    },
    {
        description: 'fixme marker',
        pattern: /\bFIXME\b/g,
    },
];

const sharedScholarMatchers = [
    {
        description: 'chapter-specific framing',
        pattern: /\bchapter\b/gi,
    },
    {
        description: 'route-specific framing',
        pattern: /\broute\b/gi,
    },
    {
        description: 'role-framing language',
        pattern: /\bused here as\b/gi,
    },
    {
        description: 'role-framing language',
        pattern: /\bopening teacher\b/gi,
    },
    {
        description: 'role-framing language',
        pattern: /\bculminating scholar\b/gi,
    },
    {
        description: 'role-framing language',
        pattern: /\bfinale teacher\b/gi,
    },
];

const walkFiles = (directoryPath) => {
    const files = [];

    for (const entry of readdirSync(directoryPath)) {
        const absolutePath = join(directoryPath, entry);
        const stats = statSync(absolutePath);

        if (stats.isDirectory()) {
            files.push(...walkFiles(absolutePath));
            continue;
        }

        if (extname(absolutePath) === '.ts') {
            files.push(absolutePath);
        }
    }

    return files;
};

const findLineNumber = (source, index) => source.slice(0, index).split('\n').length;

const collectPatternViolations = (filePath, source, matchers) => {
    const violations = [];

    for (const matcher of matchers) {
        for (const match of source.matchAll(matcher.pattern)) {
            const index = match.index ?? 0;
            violations.push({
                filePath,
                line: findLineNumber(source, index),
                message: matcher.description,
                snippet: match[0],
            });
        }
    }

    return violations;
};

export const scanContentGovernanceEntries = (entries) => {
    const violations = [];

    for (const entry of entries) {
        violations.push(...collectPatternViolations(entry.filePath, entry.source, placeholderMatchers));

        if (entry.filePath.endsWith('src/content/scholars/scholar-profiles.ts')) {
            violations.push(...collectPatternViolations(entry.filePath, entry.source, sharedScholarMatchers));
        }
    }

    return violations.sort((left, right) =>
        left.filePath.localeCompare(right.filePath) || left.line - right.line || left.message.localeCompare(right.message),
    );
};

export const scanContentGovernanceRoot = (rootPath) =>
    scanContentGovernanceEntries(
        walkFiles(rootPath).map((filePath) => ({
            filePath,
            source: readFileSync(filePath, 'utf8'),
        })),
    );

const formatViolation = (violation) =>
    `${relative(process.cwd(), violation.filePath)}:${violation.line}: ${violation.message} (${violation.snippet})`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const violations = scanContentGovernanceRoot(contentRoot);

    if (violations.length === 0) {
        console.log('content-governance: no issues found');
        process.exit(0);
    }

    console.warn('content-governance: found potential editorial/content-governance issues');
    for (const violation of violations) {
        console.warn(`- ${formatViolation(violation)}`);
    }

    process.exit(1);
}
