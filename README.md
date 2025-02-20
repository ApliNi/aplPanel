# aplPanel
Node-OpenBMCLAPI Dashboard

为 OpenBMCLAPI Node 端制作的仪表板, 使用 (注入代码?) 的方式实现功能. [查看演示](https://bmclapi-2-node.ipacel.cc/dashboard/)

## 安装
1. [下载面板](https://github.com/ApliNi/aplPanel/releases), 将 `aplPanel` 目录解压到 OpenBMCLAPI 根目录下
2. 运行 `node ./aplPanel/install.js`, 等待显示 `安装完毕`

### 面板
面板地址: http://127.0.0.1:4000/dashboard/

### 多个节点
面板支持在一个节点上切换显示多个节点的信息.
在 `./aplPanelConfig.json` 中配置每个节点的 CLUSTER_ID 和显示文本即可.

```json
{
	"dataPath": "./aplPanel/data",
	"nodes": {
		"CLUSTER_ID_1": {
			"title": "ApliNi's OpenBMCLAPI Dashboard [Node-1]",
			"name": "[Node.1]"
		},
		"CLUSTER_ID_2": {
			"title": "ApliNi's OpenBMCLAPI Dashboard [Node-2]",
			"name": "[Node.2]"
		},
		"doc": "设置显示在仪表盘上的信息"
	}
}
```

- `dataPath`: 可以将所有节点的数据路径配置同在一个位置, 填写相对或绝对地址, 默认无需修改.
- `nodes`: 在面板上显示的其他节点信息

### 动态地址
每次注册节点时读取 `./aplPanelAddress.json` 文件中的地址, 若不存在, 则保持默认值 (环境变量).
此功能主要用于与其他特殊的内网穿透工具及脚本配合工作.

注意: 可能依然需要在全局变量中设定一个公网地址和端口 (它不一定是真实的), 因为本程序没有处理更多的检查.

```json
{
	"host": "example.com",
	"port": null,
	"CLUSTER_ID__or__CLUSTER_PORT_1": {
		"host": null,
		"port": 60001
	},
	"CLUSTER_ID__or__CLUSTER_PORT_2": {
		"host": null,
		"port": 60002
	},
	"doc": "每个节点 ID 的配置 > 每个本地端口的配置 > 全局配置 > 默认值 (环境变量). 可使用 null 值跳过配置"
}
```

## 更新
通常, 直接覆盖文件即可.

## 卸载
1. 运行 `node ./aplPanel/uninstall.js`, 等待显示 `卸载完毕`
2. 删除 `aplPanel` 目录

---

项目正在开发中, 当前版本不一定稳定, 欢迎测试以及提出问题 ヾ(•ω•`)o
