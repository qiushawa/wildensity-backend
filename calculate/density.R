#!/usr/bin/env Rscript
suppressWarnings(suppressMessages({
  library(DBI)
  library(RMariaDB)
  library(dplyr)
  library(dotenv)
}))

# 顯示使用說明
print_usage <- function() {
  cat("使用方法:\n")
  cat(" Rscript density.R -a <area_id> -s <species_id> -t <theta_mean> (-A <A_k> | --A_ci <lower,upper>) [-m <mc_n>]\n")
  cat("\n範例:\n")
  cat(" 固定 A_k:\n")
  cat(" Rscript density.R -a 10000 -s 1 -A 0.71 -t 0.65\n")
  cat(" A_k 使用信心區間（蒙地卡羅）:\n")
  cat(" Rscript density.R -a 10000 -s 1 --A_ci 0.65,0.78 -t 0.65 -m 10000\n")
}

# 載入 .env 檔案
load_dot_env(file = ".env")

# 從環境變數讀取資料庫設定
db_name <- Sys.getenv("DB_NAME")
db_user <- Sys.getenv("DB_USER")
db_password <- Sys.getenv("DB_PASSWORD")
db_host <- Sys.getenv("DB_HOST")

# 檢查資料庫設定是否齊全
if (any(c(db_name, db_user, db_host) == "")) {
  stop("請確保 .env 檔案包含 DB_NAME、DB_USER、DB_PASSWORD、DB_HOST")
}

# 解析命令列參數（允許任意順序）
raw_args <- commandArgs(trailingOnly = TRUE)
if (length(raw_args) == 0) {
  print_usage(); quit(status = 1)
}

# 將參數轉為 key->value 對應
kwargs <- list()
i <- 1
while (i <= length(raw_args)) {
  arg <- raw_args[i]
  if (arg %in% c("-h", "--help")) {
    print_usage(); quit(status = 0)
  }
  if (grepl("^--", arg)) {
    # 長格式參數
    if (grepl("=", arg)) {
      parts <- strsplit(sub("^--", "", arg), "=")[[1]]
      key <- paste0("--", parts[1])
      val <- paste(parts[-1], collapse = "=")
      kwargs[[key]] <- val
      i <- i + 1
    } else {
      key <- arg
      if (i + 1 <= length(raw_args) && !grepl("^-", raw_args[i+1])) {
        kwargs[[key]] <- raw_args[i+1]
        i <- i + 2
      } else {
        kwargs[[key]] <- NA
        i <- i + 1
      }
    }
  } else if (grepl("^-", arg)) {
    # 短格式參數
    key <- arg
    if (i + 1 <= length(raw_args) && !grepl("^-", raw_args[i+1])) {
      kwargs[[key]] <- raw_args[i+1]
      i <- i + 2
    } else {
      kwargs[[key]] <- NA
      i <- i + 1
    }
  } else {
    i <- i + 1
  }
}

# 檢查必要參數
required <- c("-a", "-s", "-t")
missing <- setdiff(required, names(kwargs))
if (length(missing) > 0) {
  cat("缺少必要參數：", paste(missing, collapse = ", "), "\n\n")
  print_usage(); quit(status = 1)
}

# 讀取並轉換參數類型
area_id <- as.integer(kwargs[["-a"]])
species_id <- as.integer(kwargs[["-s"]])
theta_mean <- as.numeric(kwargs[["-t"]])
mc_n <- ifelse(!is.null(kwargs[["-m"]]), as.integer(kwargs[["-m"]]), 10000L)

# 處理 A_k（固定值或信心區間）
A_k <- NULL
A_ci <- NULL
if ("-A" %in% names(kwargs) && !is.na(kwargs[["-A"]])) {
  A_k <- as.numeric(kwargs[["-A"]])
}
if ("--A_ci" %in% names(kwargs) && !is.na(kwargs[["--A_ci"]])) {
  tmp <- strsplit(kwargs[["--A_ci"]], ",")[[1]]
  if (length(tmp) != 2) {
    stop("--A_ci 必須為 lower,upper 格式（以逗號分隔）")
  }
  A_ci <- as.numeric(tmp)
  if (any(is.na(A_ci))) stop("無法解析 --A_ci 內容")
}
if (is.null(A_k) && is.null(A_ci)) {
  cat("必須提供 -A <A_k> 或 --A_ci <lower,upper>\n")
  print_usage(); quit(status = 1)
}

# 連接到資料庫
con <- dbConnect(MariaDB(),
                 dbname = db_name,
                 host = db_host,
                 user = db_user,
                 password = db_password)

# 查詢與指定 area_id 關聯且狀態為 ONLINE 的相機數量 (n_cam)
n_cam_query <- "SELECT COUNT(*) as n_cam FROM camera WHERE area_id = ? AND status = 'ONLINE'"
n_cam_result <- dbGetQuery(con, n_cam_query, params = list(area_id))
n_cam <- as.integer(n_cam_result$n_cam[1])
if (n_cam == 0) stop("指定 area_id 沒有狀態為 ONLINE 的相機")

# 查詢 Y_i（事件數）、V_k 所需的資料，僅包含狀態為 ONLINE 的相機
query <- "
SELECT 
  c.camera_id,
  COUNT(de.event_id) as Y,
  COALESCE(SUM(de.movement_distance_m), 0) as total_movement,
  COALESCE(SUM(de.duration_s), 0) as total_duration
FROM camera c
LEFT JOIN detectionevents de ON c.camera_id = de.camera_id AND c.area_id = de.area_id
WHERE c.area_id = ? AND de.species_id = ? AND c.status = 'ONLINE'
GROUP BY c.camera_id
"
dat <- dbGetQuery(con, query, params = list(area_id, species_id))

# 斷開資料庫連接
dbDisconnect(con)

# 資料驗證與處理
dat <- dat %>%
  mutate(r = 0.008, T = 31) %>%  # 固定偵測半徑 0.008 公里，T_i 統一設為 31 天
  mutate(across(c(Y, T, total_movement, total_duration, r), ~ ifelse(is.na(.), 0, as.numeric(.)))) %>%
  filter(T > 0)  # 確保 T 不為零以避免除以零

if (nrow(dat) == 0) stop("無有效資料列（Y、T、r 不可皆為 NA 或零）")

# 計算 V_k: (總 movement_distance_m / 總 duration_s) * 86.4
total_movement <- sum(dat$total_movement, na.rm = TRUE)
total_duration <- sum(dat$total_duration, na.rm = TRUE)
if (total_duration == 0) stop("總 duration 為零，無法計算 V_k")
v_k <- (total_movement / total_duration) * 86.4

# 計算密度函數（theta 為固定值）
calc_once <- function(theta_vec, A_k_val) {
  sum((dat$Y / dat$T) * (pi / (dat$r * v_k * A_k_val * (2 + theta_vec)))) / n_cam
}

theta_vec <- rep(theta_mean, nrow(dat))

# 輸出結果
if (!is.null(A_ci)) {
  # 使用蒙地卡羅模擬 A_k（在信心區間內均勻分佈）
  set.seed(42)
  sims <- numeric(mc_n)
  for (j in seq_len(mc_n)) {
    A_draw <- runif(1, min = A_ci[1], max = A_ci[2])
    sims[j] <- calc_once(theta_vec, A_draw)
  }
  q <- quantile(sims, c(0.025, 0.5, 0.975), names = FALSE)
  cat(q[1], "\n")
  cat(q[2], "\n")
  cat(q[3], "\n")
} else {
  # 固定 A_k
  Dk <- calc_once(theta_vec, A_k)
  cat(Dk, "\n")
}