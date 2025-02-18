import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const cluster_js_path = path.resolve('./dist/cluster.js');

let cluster_js_content = readFileSync(cluster_js_path, { encoding: 'utf8' });

cluster_js_content = cluster_js_content.replace(/\/\* aplPanel Start \*\/.*?\/\* aplPanel End \*\//gm, '');

writeFileSync(cluster_js_path, cluster_js_content);

console.log(`[AplPanel] 卸载完毕`);
