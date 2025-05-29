import cluster from 'cluster';

if(cluster.isPrimary){

	console.log(`\x1B[92m
[AplPanel] ฅ^•ﻌ•^ฅ
  | v0.1.12 ✦ OpenBmclApi 1.14.0
  | https://github.com/ApliNi/aplPanel
\x1B[0m`);
	
	// 每次启动时重新安装面板
	await import('./install.js');
}

await import('../dist/index.js');
