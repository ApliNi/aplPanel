import { existsSync, readFileSync } from 'fs';
import path from 'path';

export let nodeConfig = {};
if(true){
	nodeConfig.port = Number(process.argv.find(arg => arg.startsWith('-p='))?.slice(3)) || process.env.CLUSTER_PORT;
	nodeConfig.clusterId = process.env.CLUSTER_ID;
	nodeConfig.clusterSecret = process.env.CLUSTER_SECRET;

	const addrFilePath = path.resolve('./aplPanelConfig.json');
	if(existsSync(addrFilePath)){
		const nowCfg = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
		const nodeEnv = nowCfg.nodes?.[nodeConfig.port]?.env ?? nowCfg.nodes?.[nodeConfig.clusterId]?.env;
	
		nodeConfig = {
			...nowCfg.nodes?._ALL_?.env,
			...nodeConfig,
			...nodeEnv,
		};
	}
}

export const aplPanelConfigReplace = (instance) => {

	// 获取所有可用的配置
	const keyMap = Object.keys(instance).filter(key => ![
		'instance',
		'constructor',
		'getInstance',
		'flavor'
	].includes(key));

	let idx = 0;
	for(const key of keyMap){
		const newCfg = nodeConfig[key];
		if(newCfg === undefined) continue;
		idx++;
		instance[key] = newCfg;
	}

	console.log(`[aplPanel] 替换 ${idx} 项配置`);

	return instance;
};
