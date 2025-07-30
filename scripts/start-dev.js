#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Starting Orion development environment...');
console.log('📁 Project root:', projectRoot);

// Start TypeScript watch mode for all packages
console.log('🔧 Starting TypeScript compilation in watch mode...');

const packages = [
	'orion-core',
	'planner-llm',
	'calendar-parser',
	'mcp-client',
	'command-router',
	'cli',
];

const watchers = packages.map(pkg => {
	console.log(`   Starting ${pkg}...`);
	const child = spawn('npm', ['run', 'dev'], {
		cwd: join(projectRoot, 'packages', pkg),
		stdio: 'pipe',
		shell: true,
	});

	child.stdout.on('data', data => {
		console.log(`[${pkg}] ${data.toString()}`);
	});

	child.stderr.on('data', data => {
		console.error(`[${pkg}] ${data.toString()}`);
	});

	return child;
});

// Handle graceful shutdown
process.on('SIGINT', () => {
	console.log('\n🛑 Shutting down development environment...');
	watchers.forEach(child => child.kill());
	process.exit(0);
});

console.log('✅ Development environment started!');
console.log('📝 Use Ctrl+C to stop all watchers');
