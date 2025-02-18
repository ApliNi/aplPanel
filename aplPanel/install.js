import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

await import('./uninstall.js');

const cluster_js_path = path.resolve('./dist/cluster.js');

let cluster_js_content = readFileSync(cluster_js_path, { encoding: 'utf8' });

const installData = [
	{
		find: /^/,
		replace: `/* aplPanel Start */import { aplPanelListener, aplPanelServe } from '../aplPanel/main.js';/* aplPanel End */`,
	}, {
		find: String.raw`app.get('/download/:hash(\\w+)', async (req, res, next) => {`,
		replace: String.raw`/* aplPanel Start */aplPanelServe(app);/* aplPanel End */app.get('/download/:hash(\\w+)', async (req, res, next) => {`,
	}, {
		find: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);`,
		replace: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);/* aplPanel Start */aplPanelListener(req, bytes, hits);/* aplPanel End */`,
	}
];

for(const data in installData){
	cluster_js_content = cluster_js_content.replace(installData[data].find, installData[data].replace);
}

writeFileSync(cluster_js_path, cluster_js_content);

console.log(`[AplPanel] 安装完毕`);
