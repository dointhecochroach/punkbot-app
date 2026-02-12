import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const IGNORE_DIRS = new Set(['node_modules', '.git', '.cache', '.local', '.config', '.npm', '.upm', 'attached_assets', '.replit']);
const IGNORE_FILES = new Set(['replit.nix', '.replit']);

function getAllFiles(dir: string, baseDir: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        files.push(...getAllFiles(fullPath, baseDir));
      }
    } else if (entry.isFile()) {
      if (!IGNORE_FILES.has(entry.name)) {
        try {
          const content = fs.readFileSync(fullPath);
          const isText = !content.some(byte => byte === 0);
          if (isText) {
            files.push({ path: relativePath, content: content.toString('base64') });
          }
        } catch {}
      }
    }
  }

  return files;
}

async function main() {
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Logged in as: ${user.login}`);

  const repoName = 'punkbot-app';

  let repoExists = false;
  try {
    await octokit.repos.get({ owner: user.login, repo: repoName });
    repoExists = true;
    console.log(`Repository ${repoName} already exists`);
  } catch {
    repoExists = false;
  }

  if (!repoExists) {
    await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: 'PunkBot - Cyberpunk Crypto Trading Analysis App',
      private: false,
      auto_init: true,
    });
    console.log(`Created repository: ${repoName}`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  const projectDir = '/home/runner/workspace';
  console.log('Collecting files...');
  const files = getAllFiles(projectDir, projectDir);
  console.log(`Found ${files.length} files to push`);

  let treeSha: string;
  try {
    const { data: ref } = await octokit.git.getRef({ owner: user.login, repo: repoName, ref: 'heads/main' });
    const latestCommitSha = ref.object.sha;

    const treeItems = files.map(f => ({
      path: f.path,
      mode: '100644' as const,
      type: 'blob' as const,
      content: Buffer.from(f.content, 'base64').toString('utf-8'),
    }));

    const batchSize = 100;
    let currentTree = latestCommitSha;

    for (let i = 0; i < treeItems.length; i += batchSize) {
      const batch = treeItems.slice(i, i + batchSize);
      console.log(`Pushing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(treeItems.length / batchSize)}...`);

      const { data: tree } = await octokit.git.createTree({
        owner: user.login,
        repo: repoName,
        base_tree: currentTree,
        tree: batch,
      });
      currentTree = tree.sha;
    }

    treeSha = currentTree;

    const { data: commit } = await octokit.git.createCommit({
      owner: user.login,
      repo: repoName,
      message: 'PunkBot - Full project push from Replit',
      tree: treeSha,
      parents: [latestCommitSha],
    });

    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
    });

    console.log(`\nSuccess! Your code is now on GitHub:`);
    console.log(`https://github.com/${user.login}/${repoName}`);
    console.log(`\nTo clone on your computer, run:`);
    console.log(`git clone https://github.com/${user.login}/${repoName}.git`);

  } catch (error: any) {
    console.error('Error pushing to GitHub:', error.message);
    throw error;
  }
}

main().catch(console.error);
