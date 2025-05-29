import { existsSync, readFileSync } from 'fs';
import path from 'path';

// 获取启动参数 -p=1234
const ClusterPort = Number(process.argv.find(arg => arg.startsWith('-p='))?.slice(3)) || process.env.CLUSTER_PORT;

export const aplPanelConfigReplace = (instance) => {

	instance.port = ClusterPort;

	const addrFilePath = path.resolve('./aplPanelConfig.json');
	if(!existsSync(addrFilePath)) return instance;

	const nowCfg = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
	const nodeEnv = nowCfg.nodes?.[ClusterPort]?.env ?? nowCfg.nodes?.[process.env.CLUSTER_ID]?.env;

	if(nodeEnv === undefined && nowCfg.nodes?._ALL_?.env === undefined) return instance;

	// 获取所有可用的配置
	const keyMap = Object.keys(instance).filter(key => ![
		'instance',
		'constructor',
		'getInstance',
		'flavor'
	].includes(key));

	let idx = 0;
	for(const key of keyMap){
		const newCfg = nodeEnv?.[key] ?? nowCfg.nodes?._ALL_?.env?.[key];
		if(newCfg === undefined) continue;
		idx++;
		instance[key] = newCfg;
	}

	console.log(`[aplPanel] 替换 ${idx} 项配置`);

	return instance;
};
