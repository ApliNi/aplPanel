# aplPanel
Node-OpenBMCLAPI Dashboard

为 OpenBMCLAPI Node 端制作的仪表板, 使用 (注入代码?) 的方式实现功能. [查看演示](https://bmclapi-2-node.ipacel.cc/dashboard/)

## 安装
1. [下载面板](https://github.com/ApliNi/aplPanel/releases), 将 `aplPanel` 目录解压到 OpenBMCLAPI 根目录下
2. 运行 `node ./aplPanel/install.js`, 等待显示 `安装完毕`
3. 重启 OpenBMCLAPI 节点

### 面板
面板地址: http://127.0.0.1:4000/dashboard/

> 以下配置不影响面板运行 (如果遇到问题, 请提交 Issue)

### 配置文件 & 多个节点
面板支持在一个节点上切换显示多个节点的信息.
在 `./aplPanelConfig.json` 中配置每个节点的 CLUSTER_ID 和显示文本即可.

```json
{
	"dataPath": "./aplPanel/data",
	"proxyMeasureRouteFactory": false,
	"persistenceSpeedTestFiles": [ 1, 10, 20, 40 ],
	"ip": "",
	"noStatsLocalIp": true,
	"dayStartLimiter": 40,
	"nodes": {
		"CLUSTER_ID_1": {
			"enable": true,
			"title": "ApliNi's OpenBMCLAPI Dashboard",
			"name": "[Node.1]"
		},
		"CLUSTER_ID_2": {
			"enable": false,
			"title": "ApliNi's OpenBMCLAPI Dashboard",
			"name": "[Node.2]"
		},
		"CLUSTER_ID_3": {
			"title": "ApliNi's OpenBMCLAPI Dashboard",
			"name": "[Node.3]",
			"url": "https://bmclapi-2-node.ipacel.cc/dashboard/"
		},
		"_ALL_": {
			"title": "ApliNi's OpenBMCLAPI Dashboard All",
			"name": "[ALL]"
		},
		"doc": "设置显示在仪表盘上的信息"
	}
}
```

- `dataPath`: 可以将所有节点的数据路径配置在同一个位置, 支持绝对位置, 默认无需修改
- `proxyMeasureRouteFactory`: 将测速文件保存到存储目录, 并使用存储提供测速文件 (为 WebDav 存储准备)
- `persistenceSpeedTestFiles`: 预建测速文件列表, 填写文件大小数值 (MB)
- `ip`: 留空使用默认获取的 ip 地址, 可选择请求头中的 ip 地址 (如填写 `x-forwarded-for` 或 `cf-connecting-ip`)
- `noStatsLocalIp`: 在网络类型统计中过滤 `127.0.0.1` 等本地地址
- `dayStartLimiter`: 限制每天的启动次数, 超过次数则等待到第二天再启动
- `nodes`: 在面板上显示的其他节点信息
	- `enable`: [默认 true] 允许关闭这个节点的 web 面板, 但保持数据记录继续运行 (这几乎不会节省性能)
	- `allowRobots`: [默认 false] 允许面板被搜索引擎收录
	- `title`: [必选] 面板顶栏左侧标题文字
	- `name`: [必选] 面板顶栏右侧节点名称按钮文字
	- `url`: [可选] 连接到其他远程面板, 填写其他面板的固定公网地址即可
	- 使用 `_ALL_` 作为键名则会合并所有节点的统计信息

通过这些配置, 我们可以最小化的暴露面板到公网, 并同时查看其他节点的数据.

### 动态地址
每次注册节点时读取 `./aplPanelAddress.json` 文件中的地址, 若不存在, 则保持默认值 (环境变量).
此功能主要用于与其他特殊的内网穿透工具及脚本配合工作.

注意: 可能依然需要在全局变量中设定一个公网地址和端口 (它不一定是真实的), 因为本程序没有处理更多的检查.

```json
{
	"byoc": false,
	"clusterIp": null,
	"clusterPublicPort": 443,
	"CLUSTER_ID__or__CLUSTER_PORT_1": {
		"byoc": true,
		"clusterIp": "oba1.example.com",
		"clusterPublicPort": 443
	},
	"CLUSTER_ID__or__CLUSTER_PORT_2": {
		"clusterIp": "oba2.example.com",
		"clusterPublicPort": 443
	},
	"doc": "每个节点 ID 的配置 > 每个本地端口的配置 > 全局配置 > 默认值 (环境变量). 可使用 null 值跳过配置",
	"doc2": "可以包含 ./dist/config.js 中的所有配置项"
}
```

- `clusterIp`, `clusterPublicPort`: 这两项配置会在每次上线时重新加载, 其余配置只会在启动时应用一次
- 可以在里面添加其他配置选项, 具体查看 `./dist/config.js` 文件

## 特性
安装:
面板通过替换源程序中的一部分代码将自己加载进来, 因此用户安装时无需覆盖文件, 同时也能保证面板无损的卸载.

启动与运行:
面板主体完全运行在 OpenBMCLAPI 的两个或更多子线程里, 这些子线程用于文件分发, 而面板在提供网页访问的同时会收集自己所在子线程中的数据并同步到一个文件中.
因此, 子线程之间没有直接的通讯, 而此项目借助文件解决一些通讯需求. 它很少, 只会在启动阶段多几次读写, 所以完全不必担心造成负担:
在启动阶段, 两个子线程会读取同一个文件, 将自己的启动时间戳写入到同一个位置, 最后启动的线程总会覆盖之前的时间戳.
等待几秒钟直至所有线程启动完毕后再读取这个文件, 如果文件中的时间戳与自己的启动时间戳相同则自己作为负责维护数据滚动更新的 "主要线程", 否则作为用于同步数据的 "同步线程".
运行时, 所有同步线程会在每分钟的第1秒将自己的新数据添加到文件的同步区域, 而主线程会在第1.5秒处理自己与同步区域的数据并进行滚动更新和保存.
由于两个子线程都有可能处理面板的请求, 且子线程之间没有通讯, 因此面板上的实时数据总是不是准确的, 它总会缺少其他线程的实时数据, 虽然可以粗略的计算出相对准确的数据就是当前线程的数据 * 线程数量, 但由于影响不大, 没有这样做.

多个面板:
面板显示多个节点的功能会临时读取配置中其他节点的数据. 此功能会将读取的文件内容存缓存起来, 并在每分钟的第二秒清除缓存, 正好是面板完成数据保存的时间.
因此, 查看其他面板的数据总是会延迟一分钟时间才更新.

## 更新
通常, 覆盖文件然后重新运行安装即可.

## 卸载
1. 运行 `node ./aplPanel/uninstall.js`, 等待显示 `卸载完毕`
2. 重启 OpenBMCLAPI 节点
3. 删除 `aplPanel` 目录

---

项目正在开发中, 当前版本不一定稳定, 欢迎测试以及提出问题 ヾ(•ω•`)o

## 致谢
- [Apache ECharts](https://echarts.apache.org/) - 开源可视化图表库
- [Go-OpenBMCLAPI](https://github.com/LiterMC/go-openbmclapi) - Go 语言实现的 OpenBMCLAPI 节点
- [OpenBMCLAPI](https://github.com/bangbang93/openbmclapi) - OpenBMCLAPI 节点
- 前端字体: `HarmonyOS_Sans_SC_Medium`, `JetBrainsMono-Regular`, `Ubuntu-Regular`
