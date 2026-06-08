// 在 https://tamamo.dev/UltraSalePack 页面控制台运行
// 自动遍历所有塔类型和价格，下载 JSON 数据（已更新为规范化 Key）

(async () => {
  const prices = [11800, 6000, 3000, 1500, 1000, 650, 160];
  const towerTypes = [
    { id: 2, name: '無窮の塔' },
    { id: 3, name: '藍の塔' },
    { id: 4, name: '紅の塔' },
    { id: 5, name: '翠の塔' },
    { id: 6, name: '黄の塔' },
    { id: 7, name: '全塔' },
  ];
  const categories = [
    { id: 0, name: 'rank' },
    { id: 1, name: 'quest' },
  ];

  const allData = {};

  // Tower packs
  for (const tower of towerTypes) {
    for (const price of prices) {
      const url = `https://api.tamamo.dev/getUltraSalePack/${tower.id}?price=${price}`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        const key = `tower_${tower.id}_${price}`;
        allData[key] = json.data || [];
        console.log(`OK: ${key} (${allData[key].length} packs)`);
      } catch (e) {
        console.log(`FAIL: ${key}`);
      }
    }
  }

  // Category packs
  for (const cat of categories) {
    for (const price of prices) {
      const url = `https://api.tamamo.dev/getUltraSalePack/${cat.id}?price=${price}`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        const key = `${cat.name}_${price}`;
        allData[key] = json.data || [];
        console.log(`OK: ${key} (${allData[key].length} packs)`);
      } catch (e) {
        console.log(`FAIL: ${key}`);
      }
    }
  }

  // Download as JSON
  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ultra-sale-packs.json';
  a.click();
  console.log('Downloaded!');
})();
