#!/usr/bin/env node

// Simple wrapper to run the Orion CLI (use built output)
import('./packages/cli/dist/index.js')
	.then(module => {
		const cli = new module.OrionCLI();
		return cli.run();
	})
	.catch(error => {
		console.error('Failed to start Orion CLI:', error);
		process.exit(1);
	});
