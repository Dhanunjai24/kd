import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const isTsxRunning = Boolean(
  process.env.__TSX_BOOTSTRAPPED__ ||
  process.execArgv.some((a) => a.includes('tsx'))
);

if (!isTsxRunning) {
  // Plain Node was invoked (e.g., `node server.ts` or `npm start`)
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        __TSX_BOOTSTRAPPED__: 'true',
      },
    }
  );

  child.on('error', (err) => {
    console.error('Child spawn error:', err);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else {
  // Running with tsx TypeScript loader active
  await import('./server-app.ts');
}
