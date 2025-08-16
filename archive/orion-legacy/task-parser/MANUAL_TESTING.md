# Manual Testing Guide for TaskParser

## Prerequisites

1. **Google Cloud Project**: You should have set up a Google Cloud Project with Google Tasks API enabled (completed in Chunk 1.1)
2. **OAuth2 Credentials**: Download your OAuth2 credentials JSON file
3. **Environment Variables**: Set up the following environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

## Manual Testing Steps

### 1. Create Test Script

```javascript
// manual-test.js
import { TaskParser } from './dist/index.js';

async function manualTest() {
	console.log('🧪 Manual TaskParser Test\n');

	// Create TaskParser instance
	const taskParser = new TaskParser({
		google: {
			includeCompleted: true,
			maxResults: 50,
		},
		privacy: {
			maskPrivateTasks: true,
			privateKeywords: ['private', 'personal', 'confidential'],
		},
	});

	try {
		// Step 1: Get authorization URL
		console.log('Step 1: Getting authorization URL...');
		const authUrl = await taskParser.getGoogleAuthUrl();
		console.log('Visit this URL to authorize:', authUrl);

		// You would need to implement a way to capture the auth code
		// For now, this is where manual intervention is required
		console.log('\n⚠️  Manual step required:');
		console.log('1. Visit the URL above');
		console.log('2. Grant permissions');
		console.log('3. Copy the authorization code from the callback URL');
		console.log('4. Update this script with the code and run again');

		// Step 2: Exchange code for tokens (uncomment and add your code)
		// const authCode = 'YOUR_AUTH_CODE_HERE';
		// const tokens = await taskParser.exchangeGoogleAuthCode(authCode);
		// console.log('Tokens received:', tokens);

		// Step 3: Load tasks (uncomment after getting tokens)
		// taskParser.setGoogleTokens(tokens);
		// const context = await taskParser.loadTasks();
		// console.log('Tasks loaded:', context);
	} catch (error) {
		console.error('Test failed:', error);
	}
}

manualTest();
```

### 2. Run the Test

```bash
npm run build
node manual-test.js
```

### 3. Expected Results

When properly authenticated, you should see:

- Task lists from your Google Tasks account
- Tasks with proper hierarchy (parent-child relationships)
- Privacy masking applied to tasks containing configured keywords
- Proper date parsing and status normalization

### 4. Test Scenarios

**Test Case 1: Basic Loading**

- Verify all task lists are loaded
- Check task count matches Google Tasks web interface

**Test Case 2: Privacy Masking**

- Create tasks with titles containing "Private:" or "Confidential:"
- Verify they appear as "🔒 Private Task" in the output

**Test Case 3: Task Hierarchy**

- Create parent tasks with subtasks in Google Tasks
- Verify hierarchy is preserved with correct `level` and `children` properties

**Test Case 4: Error Handling**

- Test with invalid credentials
- Test with network connectivity issues
- Verify graceful error handling

### 5. Validation Checklist

- [ ] Authentication flow works end-to-end
- [ ] Task data is properly normalized from Google API format
- [ ] Privacy masking functions correctly
- [ ] Task hierarchy is built correctly
- [ ] Error handling is graceful
- [ ] Task statistics are calculated accurately

## Notes

- This manual testing requires real Google Tasks data
- Make sure to test with various task configurations (completed, pending, with/without due dates)
- Test with empty task lists to verify edge case handling
- Consider testing with large numbers of tasks to verify performance
