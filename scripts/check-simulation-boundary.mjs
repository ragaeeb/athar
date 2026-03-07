import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const simulationRoot = new URL('../src/features/gameplay/simulation', import.meta.url);
const forbiddenPatterns = [
    "@react-three/fiber",
    "react-map-gl",
    "react-three-map",
    "react-dom",
    "three",
    "react",
];

const allowedExtensions = new Set(['.ts', '.tsx']);
const violations = [];

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
        for (const pattern of forbiddenPatterns) {
            if (source.includes(`'${pattern}'`) || source.includes(`"${pattern}"`)) {
                violations.push(`${absolutePath}: forbidden import "${pattern}"`);
            }
        }
    }
};

walk(simulationRoot.pathname);

if (violations.length > 0) {
    console.error('Simulation boundary violations detected:');
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}
