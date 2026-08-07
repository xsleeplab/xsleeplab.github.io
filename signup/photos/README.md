# 实验室照片 / Lab Photos

把 4 张实验室照片放进这个目录，文件名必须与下表**完全一致**（全小写、ASCII）：

| 文件名 | 内容 | 出现位置 |
|---|---|---|
| `room1.jpg` | 睡眠监测室 A | 报名页 + participate.html |
| `room2.jpg` | 睡眠监测室 B | 报名页 + participate.html |
| `control-room.jpg` | 实验控制室 | 报名页 + participate.html |
| `washroom.jpg` | 洗漱更衣室 | 报名页 + participate.html |

## 规格建议

- **比例 3:4 竖版**（如 600×800 或 900×1200）——`participate.html` 的
  `.env-gallery-img` 写死了 `aspect-ratio: 3/4`，非此比例会被 `object-fit: cover` 裁切。
- 单张控制在 300 KB 以内，避免拖慢页面。
- 格式用 `.jpg`（若改用其他格式，需同步修改 `signup/index.html` 与
  `participate.html` 中的 `src`）。

## 注意

照片里请勿出现被试面部、姓名标签、屏幕上的原始数据或任何可识别个人信息。
