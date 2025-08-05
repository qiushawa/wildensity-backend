# 野生動物密度偵測

## 專案概述

本專案是一個基於 Node.js 和 TypeScript 開發的野生動物監測後端系統，主要功能包括動物出現紀錄管理、物種管理、設備管理、活動峰值計算等。系統使用 Prisma 作為 ORM，支援 CSV 檔案匯出和 R 語言統計分析。

## 技術架構

- **後端框架**: Express.js + TypeScript
- **資料庫 ORM**: Prisma
- **統計分析**: R 語言 (activity, optparse 等套件)
- **任務排程**: node-cron
- **跨域支援**: CORS

## 專案結構

```
WildlifeBackend/
├── src/                    # 主要原始碼
│   ├── app.ts             # 應用程式入口點
│   ├── common/            # 共用模組
│   │   ├── code.ts        # 回應狀態碼定義
│   │   ├── database.ts    # 資料庫連線
│   │   └── response.ts    # 統一回應格式
│   ├── config/            # 設定檔
│   │   └── config.ts      # 系統設定
│   ├── controllers/       # 控制器
│   │   ├── area.controller.ts
│   │   ├── coordinates.controller.ts
│   │   ├── device.controller.ts
│   │   ├── download.controller.ts
│   │   ├── record.controller.ts
│   │   └── species.controller.ts
│   ├── routes/            # 路由定義
│   ├── scheduler/         # 定時任務
│   ├── storage/           # 檔案儲存
│   └── util/              # 工具函式
├── calculate/             # R 語言計算腳本
│   ├── activity.R         # 活動峰值計算
│   └── density.R          # 密度計算
├── prisma/               # Prisma 設定
│   ├── schema.prisma     # 資料庫結構定義
│   └── seed.ts           # 種子資料
└── reports/              # 報告檔案
    ├── records/          # 物種出現紀錄 CSV
    └── activity/         # 活動峰值計算結果
```



###  統計分析計算
#### 活動峰值計算 ([activity.R](calculate/activity.R))
- 使用 R 語言的 `activity` 套件進行分析
- 計算動物活動峰值 (Ak) 及信賴區間
- 輸出格式：`activity/{物種編號}/{年份}.csv`

#### 密度計算 ([density.R](calculate/density.R))
- 基於 REST 方法計算動物密度
- 公式：`D = (Y_total * t_total) / (s * T * ak)`

