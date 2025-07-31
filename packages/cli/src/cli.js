#!/usr/bin/env node
/**
 * CLI Entry Point for Orion
 */
import OrionCLI from './index.js';
const cli = new OrionCLI();
cli.run().catch(console.error);
