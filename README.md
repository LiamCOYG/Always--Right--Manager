# Always Right Manager / 绿茵人生

单文件、零依赖的足球经理文字模拟器。

## 运行

直接用浏览器打开 `index.html`。

## 测试

```bash
node smoke-test.js
node -e 'const fs=require("fs");const h=fs.readFileSync("index.html","utf8");eval(h.match(/<script>([\s\S]*)<\/script>/)[1])'
```

第一条验证巨星潜力、年龄曲线、金球奖、换队历史与再就业；第二条运行 25 局完整流程冒烟测试。
