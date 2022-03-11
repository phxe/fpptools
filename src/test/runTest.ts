import * as path from 'path';

import { runTests } from '@vscode/test-electron';

//this provides path for test workspace
const myTestWorkspace = path.resolve('root')

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, '../../');

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, './suite/index');

		// Download VS Code, unzip it and run the integration test
		await runTests({ extensionDevelopmentPath, extensionTestsPath });

		launchArgs: [
			myTestWorkspace,
			// This disables other extensions except tested extension
			'--disable-extensions'
		]

		// Force win64 instead of win32 for testing windows
		 if (platform === 'win32') {
			await runTests({
				extensionDevelopmentPath,
				extensionTestsPath,
				version: '1.40.0',
				platform: 'win32-x64-archive'
			});
		}




	} catch (err) {
		console.error('Failed to run tests');
		process.exit(1);
	}
}

main();
