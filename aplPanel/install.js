import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

// /* aplPanel Start */ ___ // /* aplPanel End */___

await import('./uninstall.js');

if(true){
	const filePath = path.resolve('./dist/cluster.js');
	let content = readFileSync(filePath, { encoding: 'utf8' });
	
	const installData = [
		{ find: /^/g, to: `/* aplPanel Start */import { aplPanelListener, aplPanelServe, aplPaneReplaceAddr, aplPaneInvokeGCFiles, aplPaneSyncFileFinish, dayStartLimiter } from '../aplPanel/main.js';/* aplPanel End */` },
		// 提供面板服务
		{ find: String.raw`app.get('/download/:hash(\\w+)', async (req, res, next) => {`, to: String.raw`/* aplPanel Start */aplPanelServe(app, this.storage);/* aplPanel End */app.get('/download/:hash(\\w+)', async (req, res, next) => {` },
		// 请求监听器
		{ find: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);`, to: `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);/* aplPanel Start */aplPanelListener(req, bytes, hits);/* aplPanel End */` },
		// 替换地址
		{ find: `flavor: config.flavor,`, to: `flavor: config.flavor,/* aplPanel Start */ ...aplPaneReplaceAddr(this.host, this.publicPort), /* aplPanel End */` },
		// 替换回收文件时使用的文件列表
		{ find: `.gc(files.files)`, to: `/* aplPanel Start */.gc(aplPaneInvokeGCFiles(files.files)) // /* aplPanel End */.gc(files.files)` },
		// 预建测速文件
		{ find: `logger.info('同步完成');`, to: `logger.info('同步完成');/* aplPanel Start */ await aplPaneSyncFileFinish(this.storage); /* aplPanel End */` },
		// 限制每日启动次数
		{ find: `await this.storage.init?.();`, to: `/* aplPanel Start */ await dayStartLimiter(); /* aplPanel End */await this.storage.init?.();` },
	];
	
	for(const data in installData){
		content = content.replaceAll(installData[data].find, installData[data].to);
	}
	writeFileSync(filePath, content);
}

if(true){
	const filePath = path.resolve('./dist/config.js');
	let content = readFileSync(filePath, { encoding: 'utf8' });
	
	const installData = [
		{ find: /^/g, to: `/* aplPanel Start */import { aplPanelConfigReplace } from '../aplPanel/configReplace.js';/* aplPanel End */` },
		// 替换配置
		{ find: `return Config.instance;`, to: `/* aplPanel Start */return aplPanelConfigReplace(Config.instance); // /* aplPanel End */return Config.instance;` },
		// 移除 env 必须配置要求
		{ find: `.required().asString();`, to: `/* aplPanel Start */.asString(); // /* aplPanel End */.required().asString();` },
	];
	
	for(const data in installData){
		content = content.replaceAll(installData[data].find, installData[data].to);
	}
	writeFileSync(filePath, content);
}
