import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

if(true){
	const filePath = path.resolve('./dist/cluster.js');
	let content = readFileSync(filePath, { encoding: 'utf8' });
	content = content.replace(/\/\* aplPanel Start \*\/.*?\/\* aplPanel End \*\//gm, '');
	writeFileSync(filePath, content);
}

if(true){
	const filePath = path.resolve('./dist/config.js');
	let content = readFileSync(filePath, { encoding: 'utf8' });
	content = content.replace(/\/\* aplPanel Start \*\/.*?\/\* aplPanel End \*\//gm, '');
	writeFileSync(filePath, content);
}

console.log(`[AplPanel] 卸载完毕`);
