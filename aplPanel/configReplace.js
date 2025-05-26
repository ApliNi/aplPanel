import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const aplPanelConfigReplace = (instance) => {

	const addrFilePath = path.resolve('./aplPanelConfig.json');
	if(!existsSync(addrFilePath)) return;

	const nowCfg = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
	const nodeEnv = nowCfg.nodes?.[process.env.CLUSTER_ID]?.env ?? nowCfg.nodes?.[process.env.CLUSTER_PORT]?.env;

	// 获取所有可用的配置
	const keyMap = Object.keys(instance).filter(key => ![
		'instance',
		'constructor',
		'getInstance',
		'flavor'
	].includes(key));

	let idx = 0;
	for(const key of keyMap){
		const newCfg = nodeEnv[key] ?? nowCfg.nodes?._ALL_?.env?.[key];
		if(newCfg === undefined) continue;
		idx++;
		instance[key] = newCfg;
	}

	console.log(`[aplPanel] 替换 ${idx} 项配置`);
};
