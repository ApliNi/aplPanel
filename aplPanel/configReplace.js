import { existsSync, readFileSync } from 'fs';
import path from 'path';

export let nodeConfig = {};
if(true){
	nodeConfig.clusterId = process.argv.find(arg => arg.startsWith('--id='))?.slice(5) || process.env.CLUSTER_ID;
	nodeConfig.clusterSecret = process.env.CLUSTER_SECRET;

	const addrFilePath = path.resolve('./aplPanelConfig.json');
	if(existsSync(addrFilePath)){
		const nowCfg = JSON.parse(readFileSync(addrFilePath, { encoding: 'utf8' }));
		const nodeEnv = nowCfg.nodes?.[nodeConfig.clusterId]?.env;
	
		nodeConfig = {
			...nowCfg.nodes?._ALL_?.env,
			...nodeConfig,
			...nodeEnv,
		};
	}

	if(nodeConfig.clusterId?.length !== 24){
		console.warn('[aplPanel] 集群 ID 错误，请检查 --id 参数或 CLUSTER_ID 环境变量');
		process.exit(1);
	}

	if(nodeConfig.clusterSecret?.length !== 32){
		console.warn('[aplPanel] 集群密钥错误，请检查配置文件或 CLUSTER_SECRET 环境变量');
		process.exit(1);
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
