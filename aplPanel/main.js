import express from 'express';
import { existsSync, mkdirSync, readFile, writeFile, writeFileSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';
import { isIPv4, isIPv6 } from 'net';

const dataPath = path.resolve('./aplPanel/data');

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
	},
};
for(const deviceName in deviceList){
	if(statsDataTemp.device[deviceName] === undefined){
		statsDataTemp.device[deviceName] = 0;
	}
}

let statsData;

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
		statsDataTemp.bytes += bytes;
		statsDataTemp.hits += hits;

		const userAgent = req.headers['user-agent'] || '[Unknown]';
		const deviceType = userAgent.slice(0, userAgent.indexOf('/'));
		if(deviceList[deviceType]){
			statsDataTemp.device[deviceType] ++;
		}else{
			statsDataTemp.device['[Other]'] ++;
		}

		const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
		if(isIPv4(ip)){
			statsDataTemp.network.v4 ++;
		}else if(isIPv6(ip)){
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
	let nodeListCache = null;

	_app.get('/dashboard/api/stats', async (req, res, next) => {
		// 检查其他节点的统计数据
		// if(nodeListCache === null){
		// 	nodeListCache = {};
		// 	const files = await readdir(dataPath);
		// }
		// 提供 statsData
		res.json({
			statsData: statsData,
			statsDataTemp: statsDataTemp,
		});
	});
};

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


	// 创建数据目录
	if(!existsSync(dataPath)){
		mkdirSync(dataPath);
	}
	const statsFilePath = path.join(dataPath, `./stats_${process.env.CLUSTER_ID || 'default'}.json`);

	// 读取统计数据
	const readStatsFile = async () => new Promise((resolve) => {
		if(existsSync(statsFilePath)){
			readFile(statsFilePath, { encoding: 'utf8' }, (err, data) => {
				if(err){
					console.warn(`[AplPanel] 读取统计数据时出错`, err);
					resolve();
					return;
				}
				try{
					statsData = JSON.parse(data);
					resolve();
				}catch(err){
					console.warn(`[AplPanel] 解析统计数据时出错`, err);
					resolve();
				}
			});
		}else{
			resolve();
		}
	});
	
	// 初始化统计数据
	await readStatsFile();
	statsData = deepMergeObject({
		date: 	getNowStatsDataDate(),
		hours:	Array.from({ length: 25 }, () => ({ hits: 0, bytes: 0 })),
		days:	Array.from({ length: 31 }, () => ({ hits: 0, bytes: 0 })),
		months:	Array.from({ length: 13 }, () => ({ hits: 0, bytes: 0 })),
		years:	Array.from({ length: 7 }, () => ({ hits: 0, bytes: 0 })),
		all:	deepMergeObject(statsDataTemp),
		_worker: {
			mainThread: 0,
			syncData: {},
		},
	}, statsData);

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
			statsData.days.splice(0, dayDiff);
			statsData.days.push(...Array.from({ length: Math.min(dayDiff, 31) }, () => ({ hits: 0, bytes: 0 })));
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
			statsData.hours.at(-1).bytes += statsDataTemp.bytes;
			statsData.hours.at(-1).hits += statsDataTemp.hits;
	
			statsData.days.at(-1).bytes += statsDataTemp.bytes;
			statsData.days.at(-1).hits += statsDataTemp.hits;
	
			statsData.months.at(-1).bytes += statsDataTemp.bytes;
			statsData.months.at(-1).hits += statsDataTemp.hits;
	
			statsData.years.at(-1).bytes += statsDataTemp.bytes;
			statsData.years.at(-1).hits += statsDataTemp.hits;

			addObjValueNumber(statsData.all, statsDataTemp);

		}else{

			if(ThreadModeMain) console.log(`[AplPanel] ${ThreadTime} 将作为同步线程运行`);
			ThreadModeMain = false;
			// console.log(`[AplPanel] 同步统计数据`, new Date());

			// 仅同步
			addObjValueNumber(statsData._worker.syncData, statsDataTemp, true);
		}
		
		// 清空临时数据
		statsDataTemp.bytes = 0;
		statsDataTemp.hits = 0;
		for(const key in statsDataTemp.device){
			statsDataTemp.device[key] = 0;
		}
	
		writeFile(statsFilePath, JSON.stringify(statsData), (err) => {
			if(err) console.log(`[AplPanel] 保存统计数据失败`, err);
		});
		
		// 计算到下一个每分钟过2秒的时间, 设置定时器
		const nextTime = new Date();
		nextTime.setMinutes(nextTime.getMinutes() + (nextTime.getSeconds() >= 2 ? 1 : 0));
		nextTime.setSeconds(2);
		setTimeout(() => {
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
