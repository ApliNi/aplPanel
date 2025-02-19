import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

await import('./uninstall.js');

const cluster_js_path = path.resolve('./dist/cluster.js');

let cluster_js_content = readFileSync(cluster_js_path, { encoding: 'utf8' });

const installData = [
	{
		find: /^/,
		to: `/* aplPanel Start */import { aplPanelListener, aplPanelServe, aplPaneReplaceAddr } from '../aplPanel/main.js';/* aplPanel End */`,
	}, {
		find: String.raw`app.get('/download/:hash(\\w+)', async (req, res, next) => {`,
		to: String.raw`/* aplPanel Start */aplPanelServe(app);/* aplPanel End */app.get('/download/:hash(\\w+)', async (req, res, next) => {`,
	}, {
		find: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);`,
		to: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);/* aplPanel Start */aplPanelListener(req, bytes, hits);/* aplPanel End */`,
	}, {
		find: `port: this.publicPort,`,
		to: `port: this.publicPort,/* aplPanel Start */...aplPaneReplaceAddr(this.host, this.publicPort),/* aplPanel End */`,
	}
];

for(const data in installData){
	cluster_js_content = cluster_js_content.replace(installData[data].find, installData[data].to);
}

writeFileSync(cluster_js_path, cluster_js_content);

console.log(`[AplPanel] 安装完毕`);
