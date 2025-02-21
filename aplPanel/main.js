import express from 'express';
import { existsSync, mkdirSync, readFileSync, writeFile, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

const Config = {
	dataPath: './aplPanel/data',
	enableWebPanel: true,
	allowRobots: false,
	webNodeIdx: -1,
	webNodes: [],
	nodeIds: [],
};
(async () => {
	const addrFilePath = path.resolve('./aplPanelConfig.json');
	if(existsSync(addrFilePath)){
		const cfg = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));

		if(cfg.dataPath){
			Config.dataPath = cfg.dataPath;
		}

		if(cfg.nodes){
			let idx = 0;
			for(const nodeId in cfg.nodes){
				const node = cfg.nodes[nodeId];

				if(nodeId === process.env.CLUSTER_ID){
					if(node.enable === false) Config.enableWebPanel = false;
					if(node.allowRobots === true) Config.allowRobots = true;
					Config.webNodeIdx = idx;
				}

				Config.webNodes.push({
					title: node.title,
					name: node.name,
				});
				Config.nodeIds.push(nodeId);
				idx++;
			}
		}
	}
})();

const deviceList = {
	'[Unknown]': true,	// 无 UA 设备
	'[Other]': true,	// 列表之外的设备

	'BakaXL': true,
	'Bun': true,
	'Dalvik': true,
	'FCL': true,
	'FileDownloader': true,
	'Gradle': true,
	'HMCL': true,
	'HMCL-PE': true,
	'Java': true,
	'Java-http-client': true,
	'LauncherX': true,
	'MCinaBox': true,
	'MSLTeam-MSL': true,
	'MinecraftLaunch': true,
	'MinecraftLauncher': true,
	'Mozilla': true,
	'Natsurainko.FluentLauncher': true,
	'PCL2': true,
	'PZH': true,
	'Pojav': true,
	'PojavLauncher': true,
	'Python': true,
	'Python-urllib': true,
	'SharpCraftLauncher': true,
	'VQRL': true,
	'ZalithLauncher': true,
	'bmclapi-ctrl': true,
	'bmclapi-warden': true,
	'meta-externalagent': true,
	'openbmclapi-cluster': true,
	'python-requests': true,
	'voxelum': true
};

const statsDataTemp = {
	hits: 0,
	bytes: 0,
	device: {},
	network: {
		v4: 0,
		v6: 0,
		none: 0,
	},
};
for(const deviceName in deviceList){
	if(statsDataTemp.device[deviceName] === undefined){
		statsDataTemp.device[deviceName] = 0;
	}
}

let statsData;

const dataPath = path.resolve(Config.dataPath);
(async () => {

	/**
	 * 简单的深度合并对象
	 * @param {Object} target
	 * @param {Object} source
	 * @returns Object - 合并后的对象
	 */
	const deepMergeObject = (target, source = {}) => {
		const result = {};
		for(const key in target){
			if(target.hasOwnProperty(key)){
				result[key] = target[key];
			}
		}
		for(const key in source){
			if(source.hasOwnProperty(key)){
				if(source[key] !== null && source[key].constructor === Object){
					result[key] = deepMergeObject(result[key], source[key]);
				}else{
					result[key] = source[key];
				}
			}
		}
		return result;
	};

	// 获取从 1970-01-01 00:00:00 UTC 到现在的 小时, 天, 月, 年 数量
	const getNowStatsDataDate = () => {
		const date = new Date();
		date.setHours(date.getHours() + 8);
		const hour = date.getTime() / (60 * 60 * 1000);
		return {
			hour: Math.floor(hour),
			day: Math.floor(hour / 24),
			month: Math.floor(hour / (30 * 24)),
			year: Math.floor(hour / (365 * 24)),
		};
	};

	/**
	 * 相加两个对象的数值, 如果没有则创建
	 * @param {Object} obj1 - 合并到对象
	 * @param {Object} obj2 - 要合并的数据
	 * @param {Boolean} ueeObj2 - 遍历 obj2 的数据, 默认只合并 obj1 中存在的数据
	 */
	const addObjValueNumber = (obj1, obj2, ueeObj2 = false) => {
		const reference = ueeObj2 ? obj2 : obj1;
		for(const key in reference){

			// 仅当遍历 obj1 时检查 obj2 中是否存在. 因为 obj1 可以添加 key
			if(ueeObj2 === false && obj2[key] === undefined){
				continue;
			}

			const constructor = reference[key].constructor;
			if(constructor === Number){
				if(obj1[key] === undefined) obj1[key] = 0;
				obj1[key] += obj2[key];
				continue;
			}
			if(constructor === Object){
				if(obj1[key] === undefined) obj1[key] = {};
				addObjValueNumber(obj1[key], obj2[key], ueeObj2);
				continue;
			}
		}
	};

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


	// 创建数据目录
	if(!existsSync(dataPath)){
		mkdirSync(dataPath);
	}
	const statsFilePath = path.join(dataPath, `./stats_${process.env.CLUSTER_ID || 'default'}.json`);

	// 读取统计数据
	const readStatsFile = async () => {
		try{
			const data = await readFile(statsFilePath, { encoding: 'utf8' });
			statsData = JSON.parse(data);
		}catch(err){
			console.warn(`[AplPanel] 读取统计数据时出错`, err);
		}
	};
	
	// 初始化统计数据
	if(existsSync(statsFilePath)) await readStatsFile();

	statsData = deepMergeObject({
		date: 	getNowStatsDataDate(),
		hours:	Array.from({ length: 25 }, () => ({ hits: 0, bytes: 0 })),
		// days:	Array.from({ length: 31 }, () => ({ hits: 0, bytes: 0 })),
		months:	Array.from({ length: 13 }, () => ({ hits: 0, bytes: 0 })),
		years:	Array.from({ length: 7 }, () => ({ hits: 0, bytes: 0 })),
		heatmap: Array.from({ length: 365 }, () => ([ 0, 0 ])),
		all:	deepMergeObject(statsDataTemp),
		_worker: {
			mainThread: 0,
			saveTime: 0,
			syncData: {},
		},
	}, statsData);

	// 数据结构更新
	(() => {
		// v0.0.9: 移除 statsData.days, 因为它与 heatmap 重叠
		if(statsData.days){
			delete statsData.days;
		}
	})();

	// 滚动更新数据列表
	const scrollingUpdateStatsData = () => {
		const nowDate = getNowStatsDataDate();
		const yearDiff = nowDate.year - statsData.date.year;
		if(yearDiff > 0){
			statsData.years.splice(0, yearDiff);
			statsData.years.push(...Array.from({ length: Math.min(yearDiff, 7) }, () => ({ hits: 0, bytes: 0 })));
			statsData.date.year += yearDiff;
		}
		const monthDiff = nowDate.month - statsData.date.month;
		if(monthDiff > 0){
			statsData.months.splice(0, monthDiff);
			statsData.months.push(...Array.from({ length: Math.min(monthDiff, 13) }, () => ({ hits: 0, bytes: 0 })));
			statsData.date.month += yearDiff;
		}
		const dayDiff = nowDate.day - statsData.date.day;
		if(dayDiff > 0){
			// statsData.days.splice(0, dayDiff);
			// statsData.days.push(...Array.from({ length: Math.min(dayDiff, 31) }, () => ({ hits: 0, bytes: 0 })));
			statsData.heatmap.splice(0, dayDiff);
			statsData.heatmap.push(...Array.from({ length: Math.min(dayDiff, 365) }, () => ([ 0, 0 ])));
			statsData.date.day += yearDiff;
		}
		const hourDiff = nowDate.hour - statsData.date.hour;
		if(hourDiff > 0){
			statsData.hours.splice(0, hourDiff);
			statsData.hours.push(...Array.from({ length: Math.min(hourDiff, 25) }, () => ({ hits: 0, bytes: 0 })));
			statsData.date.hour += yearDiff;
		}

		statsData.date = nowDate;
	};
	scrollingUpdateStatsData();


	// 线程启动后将自己的时间戳写进 mainThread, 只有当时间戳相等才维护数据, 否则仅将新数据写入 syncData
	let ThreadModeMain = true;
	const ThreadTime = Date.now() + process.uptime() * 1000;
	statsData._worker.mainThread = ThreadTime;
	writeFileSync(statsFilePath, JSON.stringify(statsData));


	const startStatsDataSave = async () => {
		
		// 主要线程等待同步线程写入文件完毕后再运行保存
		if(ThreadModeMain) await sleep(500);

		await readStatsFile();
		
		scrollingUpdateStatsData();
		
		// 判断是否还是主线程
		if(statsData._worker.mainThread === ThreadTime){

			ThreadModeMain = true;
			// console.log(`[AplPanel] 保存统计数据`, new Date());

			// 收集同步线程的数据
			addObjValueNumber(statsDataTemp, statsData._worker.syncData);
			statsData._worker.syncData = {};

			// 保存数据到每个图表
			statsData.hours.at(-1).hits += statsDataTemp.hits;
			statsData.hours.at(-1).bytes += statsDataTemp.bytes;
	
			// statsData.days.at(-1).hits += statsDataTemp.hits;
			// statsData.days.at(-1).bytes += statsDataTemp.bytes;
	
			statsData.months.at(-1).hits += statsDataTemp.hits;
			statsData.months.at(-1).bytes += statsDataTemp.bytes;
	
			statsData.years.at(-1).hits += statsDataTemp.hits;
			statsData.years.at(-1).bytes += statsDataTemp.bytes;

			statsData.heatmap.at(-1)[0] += statsDataTemp.hits;
			statsData.heatmap.at(-1)[1] += statsDataTemp.bytes;

			addObjValueNumber(statsData.all, statsDataTemp);

		}else{

			if(ThreadModeMain) console.log(`[AplPanel] ${ThreadTime} 将作为同步线程运行`);
			ThreadModeMain = false;
			// console.log(`[AplPanel] 同步统计数据`, new Date());

			// 仅同步
			addObjValueNumber(statsData._worker.syncData, statsDataTemp, true);
		}
		
		// 清空临时数据
		statsDataTemp.hits = 0;
		statsDataTemp.bytes = 0;
		for(const key in statsDataTemp.device){
			statsDataTemp.device[key] = 0;
		}

		statsData._worker.saveTime = Date.now();
	
		writeFile(statsFilePath, JSON.stringify(statsData), (err) => {
			if(err) console.log(`[AplPanel] 保存统计数据失败`, err);
		});
		
		// [可爱的定时器] 计算到下一个每分钟过2秒的时间, 设置定时器
		const nextTime = new Date();
		nextTime.setMinutes(nextTime.getMinutes() + (nextTime.getSeconds() >= 1 ? 1 : 0));
		nextTime.setSeconds(1);
		setTimeout(async () => {
			startStatsDataSave();
		}, nextTime.getTime() - Date.now());
	};

	// 等待 30 秒后启动数据保存
	setTimeout(() => {
		startStatsDataSave();
	}, 30 * 1000);

	// 等待 4 秒后再判断是否是主线程
	setTimeout(async () => {
		await readStatsFile();
		if(statsData._worker.mainThread !== ThreadTime){
			if(ThreadModeMain) console.log(`[AplPanel] ${ThreadTime} 将作为同步线程运行`);
			ThreadModeMain = false;
		}
	}, 4 * 1000);

	console.log(`[AplPanel] ${ThreadTime} 已启动`);
})();



// 添加导入 `import { aplPanelListener, aplPanelServe } from '../aplPanel/main.js';`

/**
 * 添加到代码之后 cluster.js, `const { bytes, hits } = await this.storage.express(hashPath, req, res, next);`
 *   - `aplPanelListener(req, bytes, hits);`
 * @param {import('express').Request} req
 * @param {number} bytes - 这个文件的大小
 * @param {number} hits - 命中次数 / 是否命中
 */
export const aplPanelListener = async (req, bytes, hits) => {
	try{
		statsDataTemp.hits += hits;
		statsDataTemp.bytes += bytes;

		const userAgent = req.headers['user-agent'] || '[Unknown]';
		const deviceType = userAgent.slice(0, userAgent.indexOf('/'));
		if(deviceList[deviceType]){
			statsDataTemp.device[deviceType] ++;
		}else{
			statsDataTemp.device['[Other]'] ++;
		}

		const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
		if(!ip){
			statsDataTemp.network.none ++;
		}else if(`${ip}`.startsWith('::ffff:')){
			statsDataTemp.network.v4 ++;
		}else{
			statsDataTemp.network.v6 ++;
		}
		
	}catch(err){
		console.warn(`[AplPanel]`, err);
	}
};

/**
 * 添加到代码之前 cluster.js, `app.get('/download/:hash(\\w+)', async (req, res, next) => {`
 *   - `aplPanelServe(app);`
 * @param {import('express').Application} _app
 */
export const aplPanelServe = (_app) => {

	if(!Config.enableWebPanel) return;

	if(Config.allowRobots){
		_app.get('/robots.txt', (req, res) => {
			res.type('text/plain');
			res.send('User-agent: *\nAllow: /dashboard');
		});
	}

	_app.use('/dashboard', express.static(path.resolve('./aplPanel/public'), {
		setHeaders: (res, urlPath) => {
			// 指示浏览器缓存静态文件
			if(urlPath.endsWith('.html')){
				res.setHeader('Cache-Control', 'no-cache');
			}else{
				res.setHeader('Cache-Control', 'public, max-age=31536000');
			}
		}
	}));

	// 将涉及磁盘操作的数据缓存几秒
	let nodeDataCache = {};

	// 自动清理缓存
	const clearNodeDataCache = () => {
		const nextTime = new Date();
		nextTime.setMinutes(nextTime.getMinutes() + (nextTime.getSeconds() >= 2 ? 1 : 0));
		nextTime.setSeconds(2);
		setTimeout(() => {
			nodeDataCache = {};
			clearNodeDataCache();
		}, nextTime.getTime() - Date.now());
	};
	clearNodeDataCache();

	_app.get('/dashboard/api/stats', async (req, res, next) => {

		// ./api/stats?idx=
		const inp = {
			idx: Number(req.query?.idx ?? Config.webNodeIdx),
		};

		if(inp.idx !== Config.webNodeIdx && Config.nodeIds[inp.idx]){
			// 提供其他节点的数据
			try{
				if(!nodeDataCache[inp.idx]){
					nodeDataCache[inp.idx] = JSON.parse(await readFile(path.join(dataPath, `./stats_${Config.nodeIds[inp.idx]}.json`), { encoding: 'utf8' }));
				}
				res.json({
					statsData: nodeDataCache[inp.idx],
					webNodes: Config.webNodes,
					webNodeIdx: inp.idx,
				});
			}catch(err){
				console.warn(`[AplPanel] 读取其他节点统计数据时出错`, err);
				res.status(500);
			}
		}else{
			// 提供当前节点的数据
			res.json({
				statsData: statsData,
				statsDataTemp: statsDataTemp,
				webNodes: Config.webNodes,
				webNodeIdx: Config.webNodeIdx,
			});
		}
	});
};

/**
 * 这用于支持每次请求上线时都使用单独的最新地址信息, 配合其他特殊内网穿透工具使用
 * @param {String} host - 默认域名
 * @param {Number} port - 默认端口
 */
export const aplPaneReplaceAddr = (host, port) => {
	const address = { host: host, port: port };
	try{
		// 从根目录读取动态地址文件
		const addrFilePath = path.resolve('./aplPanelAddress.json');
		if(existsSync(addrFilePath)){
			const addr = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
			address.host = addr[process.env.CLUSTER_ID]?.host ?? addr[process.env.CLUSTER_PORT]?.host ?? addr.host ?? host;
			address.port = addr[process.env.CLUSTER_ID]?.port ?? addr[process.env.CLUSTER_PORT]?.port ?? addr.port ?? port;
			console.log(`[AplPanel] 注册节点: ${address.host}:${address.port}`);
		}
	}catch(err){
		console.warn(`[AplPanel] 读取动态地址文件时出错`, err);
	}
	return address;
};
