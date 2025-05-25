import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const aplPanelConfigReplace = (instance) => {

	const addrFilePath = path.resolve('./aplPanelAddress.json');
	if(!existsSync(addrFilePath)) return;

	const file = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
	const cfg = file[process.env.CLUSTER_ID] ?? file[process.env.CLUSTER_PORT];
	if(!cfg) return;

	// 获取所有可用的配置
	const keyMap = Object.keys(instance).filter(key => ![
		'instance',
		'constructor',
		'getInstance',
		'flavor'
	].includes(key));

	let idx = 0;
	for(const key of keyMap){
		const newCfg = cfg[key] ?? file[key];
		if(newCfg === undefined || newCfg === null) continue;
		idx++;
		instance[key] = newCfg;
	}

	console.log(`[aplPanel] 替换 ${idx} 项配置`);
};
