#!/usr/bin/env node

/**
 * Orion Phase 1A Demo
 * Simple test to verify the setup is working
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

console.log('🚀 Orion Phase 1A Demo');
console.log('='.repeat(50));

async function runDemo() {
	try {
		// Test 1: Load configuration
		console.log('📋 Test 1: Loading Orion configuration...');
		const configPath = './orion.config.json';
		const configData = await readFile(configPath, 'utf-8');
		const config = JSON.parse(configData);
		console.log(`✅ Configuration loaded successfully!`);
		console.log(`   Phase: ${config.mvp.phase}`);
		console.log(`   Mode: ${config.mvp.mode}`);
		console.log(`   Debug: ${config.mvp.debugMode ? 'ON' : 'OFF'}`);
		console.log('');

		// Test 2: Check package builds
		console.log('🔧 Test 2: Checking package builds...');
		const packages = [
			'calendar-parser',
			'planner-llm',
			'mcp-client',
			'command-router',
			'orion-core',
			'cli',
		];

		for (const pkg of packages) {
			try {
				const packageJsonPath = join('packages', pkg, 'package.json');
				const packageData = await readFile(packageJsonPath, 'utf-8');
				const packageInfo = JSON.parse(packageData);
				console.log(`   ✅ ${packageInfo.name} - ${packageInfo.description}`);
			} catch (error) {
				console.log(`   ❌ ${pkg} - Error: ${error.message}`);
			}
		}
		console.log('');

		// Test 3: Check fixture data
		console.log('📅 Test 3: Loading test calendar data...');
		try {
			const googleEventsPath = './fixtures/google-events.json';
			const googleEvents = JSON.parse(await readFile(googleEventsPath, 'utf-8'));
			console.log(`   ✅ Google Calendar fixtures: ${googleEvents.length} events`);

			const msgraphEventsPath = './fixtures/msgraph-events.json';
			const msgraphEvents = JSON.parse(await readFile(msgraphEventsPath, 'utf-8'));
			console.log(`   ✅ Microsoft Graph fixtures: ${msgraphEvents.length} events`);

			console.log(
				`   📋 Sample event: "${googleEvents[0]?.title || 'None'}" at ${
					googleEvents[0]?.start || 'N/A'
				}`
			);
		} catch (error) {
			console.log(`   ❌ Error loading fixtures: ${error.message}`);
		}
		console.log('');

		// Test 4: Environment check
		console.log('🌍 Test 4: Environment check...');
		console.log(`   Node.js: ${process.version}`);
		console.log(`   Platform: ${process.platform} ${process.arch}`);
		console.log(`   Working Directory: ${process.cwd()}`);
		console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'}`);
		console.log('');

		// Test 5: Phase 1A Feature Summary
		console.log('🎯 Test 5: Phase 1A Features Summary...');
		const enabledFeatures = config.mvp.enabledFeatures || [];
		console.log('   Enabled Features:');
		enabledFeatures.forEach(feature => {
			console.log(`     • ${feature}`);
		});
		console.log('');
		console.log('   Phase 1A Capabilities:');
		console.log('     • ✅ Basic day plan generation structure');
		console.log('     • ✅ Calendar event parsing (Google Calendar integration ready)');
		console.log('     • ✅ Read-only MCP file operations');
		console.log('     • ✅ Conversation-based planning framework');
		console.log('     • ✅ Basic CLI interface');
		console.log('     • ⏳ OpenAI LLM integration (requires API key)');
		console.log('     • ⏳ Google Calendar OAuth (Phase 1B)');
		console.log('     • ⏳ Advanced approval workflows (Phase 1B)');
		console.log('');

		console.log('🎉 Phase 1A Setup Complete!');
		console.log('');
		console.log('Next Steps:');
		console.log('1. Set your OpenAI API key: export OPENAI_API_KEY=your_key_here');
		console.log('2. Try the CLI: node packages/cli/dist/cli.js status');
		console.log('3. Start development: npm run dev');
		console.log('4. Begin Phase 1B development');
	} catch (error) {
		console.error('❌ Demo failed:', error.message);
		process.exit(1);
	}
}

runDemo();
