
const lib = {

	numberFormat: (value, retainDecimals = 0) => {
		const unit = ['', 'K', 'M', 'B', 'T', 'Q', 'Y'];
		let index = 0;
		while(value >= 1000){
			value /= 1000;
			index++;
		}
		return `${value.toFixed(retainDecimals)}${unit[index]}`;
	}
};

const loadLineChart = (el, data = {}, _data = {}) => {
	const chart_stats_rv_day = echarts.init(el);
	chart_stats_rv_day.setOption(Object.assign({
		grid: {
			top: 30,
			left: 55,
			right: 25,
			bottom: 30,
		},
		xAxis: {
			type: 'category',
			data: [],
		},
		yAxis: {
			type: 'value',
			axisLabel: {
				formatter: (value) => lib.numberFormat(value),
			},
			splitLine: {
				show: true,
				lineStyle: {
					color: '#7F7F7F80',
					type: 'solid',
					width: 1
				},
			},
		},
		series: [
			{
				data: [],
				type: 'line',
				itemStyle: {
					color: '#06b0ff',
					width: 2,
				}
			}
		],
		tooltip: { // 鼠标悬停时显示数据框
			trigger: 'axis',
			axisPointer: {
				type: 'cross', // 显示十字架指示
				label: {
					formatter: (data) => {
						if(typeof data.value === 'number'){
							return `${lib.numberFormat(data.value, 2)}`;
						}
						return data.value;
					},
				},
			},
		},
	}, data));
};

const loadPieChart = (el, data = {}, _data = {}) => {
	const chart_stats_rv_day = echarts.init(el);
	chart_stats_rv_day.setOption(Object.assign({
		series: [
			{
				name: 'Nightingale Chart',
				type: 'pie',
				radius: [20, 70],
				center: ['50%', '50%'],
				roseType: 'area',
				itemStyle: {
					borderRadius: 8
				},
				data: [],
			},
		],
		tooltip: {
			trigger: 'item',
			borderWidth: 0,
		},
	}, data));
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

const loadStatsData = async () => {
	
	const response = await fetch('./api/stats');
	const data = await response.json();

	const statsData = data.statsData;
	const statsDataTemp = data.statsDataTemp;

	// 由前端合并统计数据后显示, 逻辑与后端一致
	(() => { // ../main.js // 保存数据到每个图表

		addObjValueNumber(statsDataTemp, statsData._worker.syncData);

		statsData.hours.at(-1).bytes += statsDataTemp.bytes;
		statsData.hours.at(-1).hits += statsDataTemp.hits;

		statsData.days.at(-1).bytes += statsDataTemp.bytes;
		statsData.days.at(-1).hits += statsDataTemp.hits;

		statsData.months.at(-1).bytes += statsDataTemp.bytes;
		statsData.months.at(-1).hits += statsDataTemp.hits;

		statsData.years.at(-1).bytes += statsDataTemp.bytes;
		statsData.years.at(-1).hits += statsDataTemp.hits;

		addObjValueNumber(statsData.all, statsDataTemp, true);
	})();


	await new Promise(async (resolve, reject) => {
		// 获取现在的时间, 每次循环减去一小时
		let time = new Date();

		const xAxisData = [];
		const hitsData = [];
		const bytesData = [];

		for(const hourData of statsData.hours){
			xAxisData.unshift(`${time.getMonth() + 1}-${time.getDate()} ${time.getHours()}:00`);
			hitsData.push(hourData.hits);
			bytesData.push(hourData.bytes);
			time.setHours(time.getHours() - 1);
		}

		await loadLineChart(document.getElementById('chart_stats_rv_hour'), {
			xAxis: {
				data: xAxisData,
			},
			series: [
				{
					data: hitsData,
					type: 'line',
					name: '请求',
					itemStyle: {
						color: '#10b981',
						width: 2,
					},
					markArea: {
						itemStyle: {
							color: '#20ff021c'
						},
						data: [
							[
								{
									xAxis: xAxisData.at(-2),
								},
								{
									xAxis: xAxisData.at(-1),
								}
							]
						]
					},
				},
			],
		}, bytesData);

		resolve();
	});

	await new Promise(async (resolve, reject) => {
		// 获取现在的时间, 每次循环减去一天
		let time = new Date();

		const xAxisData = [];
		const hitsData = [];
		const bytesData = [];

		for(const dayData of statsData.days){
			xAxisData.unshift(`${time.getMonth() + 1}-${time.getDate()}`);
			hitsData.push(dayData.hits);
			bytesData.push(dayData.bytes);
			time.setDate(time.getDate() - 1);
		}

		await loadLineChart(document.getElementById('chart_stats_rv_day'), {
			xAxis: {
				data: xAxisData,
			},
			series: [
				{
					data: hitsData,
					type: 'line',
					name: '请求',
					itemStyle: {
						color: '#06b0ff',
						width: 2,
					}
				},
			],
		}, bytesData);

		resolve();
	});

	await new Promise(async (resolve, reject) => {
		// 获取现在的时间, 每次循环减去一个月
		let time = new Date();

		const xAxisData = [];
		const hitsData = [];
		const bytesData = [];

		for(const monthData of statsData.months){
			xAxisData.unshift(`${time.getFullYear()}-${time.getMonth() + 1}`);
			hitsData.push(monthData.hits);
			bytesData.push(monthData.bytes);
			time.setMonth(time.getMonth() - 1);
		}

		await loadLineChart(document.getElementById('chart_stats_rv_month'), {
			xAxis: {
				data: xAxisData,
			},
			series: [
				{
					data: hitsData,
					type: 'line',
					name: '请求',
					itemStyle: {
						color: '#f88c00',
						width: 2,
					}
				},
			],
		}, bytesData);

		resolve();
	});

	// 目前不考虑年

	await new Promise(async (resolve, reject) => {

		const pieData = [];
		
		
		for(const deviceName in statsData.all.device){
			pieData.push({
				value: statsData.all.device[deviceName],
				name: deviceName,
			});
		}

		// 取数值最大的前10个, 过滤 0 值
		const top10 = pieData.filter(i => i.value > 0).sort((a, b) => b.value - a.value).slice(0, 10);

		loadPieChart(document.getElementById('chart_stats_device'), {
			series: [
				{
					// name: '常见用户代理',
					type: 'pie',
					radius: [20, 70],
					center: ['50%', '50%'],
					roseType: 'area',
					itemStyle: {
						borderRadius: 8
					},
					data: top10,
					label: {
						color: '#7f7f7fb5'
					},
				},
			]
		})

		resolve();
	});

};

queueMicrotask(() => {
	loadStatsData();
	setInterval(() => {
		loadStatsData();
	}, 7 * 1000);
});


