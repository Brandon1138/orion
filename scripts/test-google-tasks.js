/**
 * Simple test script for Google Tasks API integration
 * Run this after setting up Google Cloud credentials
 *
 * Usage: node scripts/test-google-tasks.js
 */

import { readFileSync } from 'fs';
import { TaskParser } from '../packages/task-parser/dist/index.js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function testGoogleTasksAPI() {
	console.log('🚀 Testing Google Tasks API Integration...\n');

	try {
		// Check if credentials are available
		const clientId = process.env.GOOGLE_TASKS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
		const clientSecret = process.env.GOOGLE_TASKS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

		if (!clientId || !clientSecret) {
			console.error('❌ Missing Google Tasks credentials!');
			console.log('Please set the following environment variables:');
			console.log('- GOOGLE_TASKS_CLIENT_ID (or GOOGLE_CLIENT_ID)');
			console.log('- GOOGLE_TASKS_CLIENT_SECRET (or GOOGLE_CLIENT_SECRET)');
			console.log('- GOOGLE_TASKS_REDIRECT_URI (optional, defaults to localhost)');
			return;
		}

		console.log('✅ Google Tasks credentials found');
		console.log(`   Client ID: ${clientId.substring(0, 20)}...`);

		// Create TaskParser instance
		const taskParser = new TaskParser({
			google: {
				includeCompleted: false,
				maxResults: 10,
			},
		});

		console.log('✅ TaskParser instance created');

		// Get authorization URL
		const authUrl = await taskParser.getGoogleAuthUrl();
		console.log('\n🔐 Authorization required!');
		console.log('Please visit this URL to authorize the app:');
		console.log('─────────────────────────────────────────────────');
		console.log(authUrl);
		console.log('─────────────────────────────────────────────────');
		console.log("\nAfter authorization, you'll get a code. Run this script again with:");
		console.log('GOOGLE_AUTH_CODE=your_auth_code node scripts/test-google-tasks.js');

		// Check if auth code provided
		const authCode = process.env.GOOGLE_AUTH_CODE;
		if (!authCode) {
			console.log('\n⏳ Waiting for authorization code...');
			return;
		}

		console.log('\n🔄 Exchanging authorization code for tokens...');
		const tokens = await taskParser.exchangeGoogleAuthCode(authCode);
		console.log('✅ Tokens received successfully');
		console.log(`   Access token: ${tokens.access_token.substring(0, 20)}...`);
		console.log(`   Refresh token: ${tokens.refresh_token ? 'Present' : 'Not provided'}`);

		// Set tokens and load tasks
		taskParser.setGoogleTokens(tokens);

		console.log('\n📋 Loading Google Tasks...');
		const taskContext = await taskParser.loadTasks();

		console.log('\n📊 Task Loading Results:');
		console.log(`   Total Tasks: ${taskContext.totalTasks}`);
		console.log(`   Task Lists: ${taskContext.taskLists.length}`);
		console.log(`   Last Updated: ${taskContext.lastUpdated.toISOString()}`);

		// Display task lists
		if (taskContext.taskLists.length > 0) {
			console.log('\n📝 Task Lists Found:');
			for (const list of taskContext.taskLists) {
				console.log(`   • ${list.title} (${list.id})`);
			}
		}

		// Display some tasks
		if (taskContext.tasks.length > 0) {
			console.log('\n📋 Sample Tasks:');
			const sampleTasks = taskContext.tasks.slice(0, 5);
			for (const task of sampleTasks) {
				const indent = '  '.repeat(task.level);
				const status = task.status === 'completed' ? '✅' : '⏳';
				const due = task.due ? ` (due: ${task.due.toDateString()})` : '';
				console.log(`   ${indent}${status} ${task.title}${due}`);
			}

			if (taskContext.tasks.length > 5) {
				console.log(`   ... and ${taskContext.tasks.length - 5} more tasks`);
			}
		} else {
			console.log('\n📋 No tasks found. Try creating some tasks in Google Tasks first!');
		}

		// Display task statistics
		const stats = taskParser.getTaskStats(taskContext.tasks);
		console.log('\n📈 Task Statistics:');
		console.log(`   Total: ${stats.total}`);
		console.log(`   Completed: ${stats.completed}`);
		console.log(`   Pending: ${stats.pending}`);
		console.log(`   Overdue: ${stats.overdue}`);
		console.log(`   Due Today: ${stats.dueToday}`);
		console.log(`   Due Tomorrow: ${stats.dueTomorrow}`);

		console.log('\n🎉 Google Tasks API integration test completed successfully!');
	} catch (error) {
		console.error('\n❌ Test failed:', error.message);
		if (error.stack) {
			console.error('Stack trace:', error.stack);
		}
	}
}

// Run the test
testGoogleTasksAPI();
