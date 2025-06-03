# aplPanel
```yaml
[AplPanel] ฅ^•ﻌ•^ฅ
  | v0.2.0 ✦ OpenBmclApi 1.14.0
  | https://github.com/ApliNi/aplPanel
```

为 OpenBMCLAPI Node 端制作的仪表板. [查看演示](https://bmclapi-2-node.ipacel.cc/dashboard/)

## 安装
1. [下载面板](https://github.com/ApliNi/aplPanel/releases), 将 `aplPanel` 目录解压到 OpenBMCLAPI 根目录下
2. 修改启动命令为 `node ./aplPanel/start.js`

### 面板
面板地址: http://127.0.0.1:4000/dashboard/

### 启动参数
- 指定节点 ID: `--id=CLUSTER_ID` - 设置节点 ID, 用于在配置文件中定位节点

### 配置文件 & 多个节点
面板支持在一个节点上切换显示多个节点的信息.
在 `./aplPanelConfig.json` 中配置每个节点的 CLUSTER_ID 和显示文本即可.

**示例配置**
```json
{
	"dataPath": "./aplPanel/data",
	"proxyMeasureRouteFactory": false,
	"persistenceSpeedTestFiles": [ 1, 10, 20, 40 ],
	"cacheSpeedTestFileUrl": true,
	"ip": "",
	"statsExcludeIp": [ "127.0.0.1" ],
	"dayStartLimiter": 24,
	"nodes": {
		"_ALL_": {
			"enablePanel": true,
			"name": "[ALL]",
			"title": "ApliNi's OpenBMCLAPI Dashboard All",
			"env": {
				"clusterPublicPort": 443
			}
		},
		"CLUSTER_ID": {
			"enablePanel": true,
			"name": "[Node.1]",
			"title": "ApliNi's OpenBMCLAPI Dashboard 1",
			"env": {
				"port": 4001,
				"clusterIp": "oba1.site.com",
				"clusterPublicPort": 4001
			}
		},
		"CLUSTER_ID_2": {
			"enablePanel": false,
			"name": "[Node.2]",
			"title": "ApliNi's OpenBMCLAPI Dashboard 2",
			"url": "https://oba2.site.com/dashboard/",
			"env": {
				"port": 4002,
				"byoc": false,
				"clusterId": "xxxxxxx",
				"clusterSecret": "xxxxxxx",
				"storageOpts": { "url":"http://127.0.0.1:5244/dav", "basePath":"pan/OpenBmclApi/download", "username":"username", "password":"password" },
				"clusterIp": "oba2.site.com",
				"clusterPublicPort": 443
			}
		}
	}
}
```

- `dataPath`: 可以将所有节点的数据路径配置在同一个位置, 支持绝对位置, 默认无需修改
- `proxyMeasureRouteFactory`: 将测速文件保存到存储目录, 并使用存储提供测速文件, 仅供 WebDav 存储使用
- `persistenceSpeedTestFiles`: 预建测速文件列表, 填写文件大小数值 (MB), 仅供 WebDav 存储使用
- `cacheSpeedTestFileUrl`: 提前缓存测速文件重定向地址, 对测速效果几乎没有提升, 仅供 WebDav 存储使用
- `ip`: 留空使用默认获取的 ip 地址, 可选择请求头中的 ip 地址 (如填写 `x-forwarded-for` 或 `cf-connecting-ip`)
- `statsExcludeIp`: 用于排除统计中的本地 ip 地址
- `dayStartLimiter`: 限制每天的启动次数, 超过次数则等待到第二天再启动
- `env`: 存放节点默认配置
- `nodes`: 在面板上显示的其他节点信息
	- `enable`: [默认 true] 允许关闭这个节点的 web 面板, 但保持数据记录继续运行 (这几乎不会节省性能)
	- `allowRobots`: [默认 false] 允许面板被搜索引擎收录
	- `title`: [必选] 面板顶栏左侧标题文字
	- `name`: [必选] 面板顶栏右侧节点名称按钮文字
	- `url`: [可选] 连接到其他远程面板, 填写其他面板的固定公网地址即可
	- `env`: 存放每个节点的配置
	- 使用 `_ALL_` 作为键名则会合并所有节点的统计信息

通过这些配置, 我们可以最小化的暴露面板到公网, 并同时查看其他节点的数据.

### env
- 面板通过节点配置的 CLUSTER_ID 或 CLUSTER_PORT 来定位节点, 推荐在启动脚本中设置端口, 其余配置全部放在配置文件中
- `clusterIp`, `clusterPublicPort`: 这两项配置会在每次上线时重新加载, 其余配置只会在启动时应用一次 (此功能用于配合其他特殊的内网穿透工具工作)
- 可以在里面添加其他配置选项, 具体查看 `./dist/config.js` 文件
```js
clusterId = env.get('CLUSTER_ID').required().asString();
clusterSecret = env.get('CLUSTER_SECRET').required().asString();
clusterIp = env.get('CLUSTER_IP').asString();
port = env.get('CLUSTER_PORT').default(4000).asPortNumber();
clusterPublicPort = env.get('CLUSTER_PUBLIC_PORT').default(this.port).asPortNumber();
byoc = env.get('CLUSTER_BYOC').asBool();
disableAccessLog = env.get('DISABLE_ACCESS_LOG').asBool();
enableNginx = env.get('ENABLE_NGINX').asBool();
enableUpnp = env.get('ENABLE_UPNP').asBool();
storage = env.get('CLUSTER_STORAGE').default('file').asString();
storageOpts = env.get('CLUSTER_STORAGE_OPTIONS').asJsonObject();
sslKey = env.get('SSL_KEY').asString();
sslCert = env.get('SSL_CERT').asString();
```

## 更新
通常, 覆盖文件然后重新运行安装即可.

## 卸载
1. 运行 `node ./aplPanel/uninstall.js`, 等待显示 `卸载完毕`
2. 重启 OpenBMCLAPI 节点
3. 删除 `aplPanel` 目录

---

项目正在开发中, 当前版本不一定稳定, 欢迎测试以及提出问题 ヾ(•ω•`)o

## 致谢
- [CloudFlare](https://www.cloudflare.com/) - 提供 CDN 加速服务
- [Apache ECharts](https://echarts.apache.org/) - 开源可视化图表库
- [Go-OpenBMCLAPI](https://github.com/LiterMC/go-openbmclapi) - Go 语言实现的 OpenBMCLAPI 节点
- [OpenBMCLAPI](https://github.com/bangbang93/openbmclapi) - OpenBMCLAPI 节点
- 前端字体: `HarmonyOS_Sans_SC_Medium`, `JetBrainsMono-Regular`, `Ubuntu-Regular`
