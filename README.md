# aplPanel
Node-OpenBMCLAPI Dashboard

为 OpenBMCLAPI Node 端制作的仪表板, 使用 (注入代码?) 的方式实现功能. [查看演示](https://bmclapi-2-node.ipacel.cc/dashboard/)

## 安装
1. [下载面板](https://github.com/ApliNi/aplPanel/releases), 将 `aplPanel` 目录解压到 OpenBMCLAPI 根目录下
2. 运行 `node ./aplPanel/install.js`, 等待显示 `安装完毕`

### 面板
面板地址: http://127.0.0.1:4000/dashboard/

### 动态地址
每次注册节点时读取 `./aplPanelAddress.json` 文件中的地址, 若不存在, 则保持默认值 (环境变量).
此功能主要用于与其他特殊的内网穿透工具及脚本配合工作.

注意: 可能依然需要在全局变量中设定一个公网地址和端口 (它不一定是真实的), 因为本程序没有处理更多的检查.

示例: `./aplPanelAddress.json`:
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
