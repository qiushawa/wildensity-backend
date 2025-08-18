#!/usr/bin/env Rscript

suppressWarnings(suppressMessages({
  library(readr)   # 讀 CSV
  library(dplyr)   # 資料清理
}))


args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 5) {
  stop("Usage: Rscript density.R <csv_file> <v_k> <A_k> <n_cam> <theta_mean> [theta_sd] [mc=10000]
  例：Rscript density.R camera_data.csv 4.03 0.71 30 0.65 0.06 10000")
}

csv_file   <- args[1]
v_k        <- as.numeric(args[2])   # km/day
A_k        <- as.numeric(args[3])   # 活動峰值
n_cam      <- as.numeric(args[4])   # 相機台數
theta_mean <- as.numeric(args[5])   # 平均弧度
theta_sd   <- ifelse(length(args) >= 6, as.numeric(args[6]), NA_real_) # 標準差
mc_n       <- ifelse(length(args) >= 7, as.integer(args[7]), 1L) # Monte Carlo 次數

# 讀資料（允許 Y,T,r 或 Y,T,r_m；允許有或沒有 theta）
dat <- read_csv(csv_file, show_col_types = FALSE) |>
  mutate(across(everything(), ~ ifelse(. %in% c("/", "\\", "NA", ""), NA, .))) |>
  mutate(across(where(is.character), readr::parse_number))

# 欄位檢查與單位處理
has_r_km  <- "r"   %in% names(dat)
has_r_m   <- "r_m" %in% names(dat)
has_theta <- "theta" %in% names(dat)

if (!(has_r_km || has_r_m)) stop("CSV 需包含 r(公里) 或 r_m(公尺) 其中之一")
if (!all(c("Y","T") %in% names(dat))) stop("CSV 必須包含欄位：Y, T")

if (has_r_m && !has_r_km) dat <- dat |> mutate(r = r_m / 1000) # m -> km

# 去除不完整列
dat <- dat |> filter(!is.na(Y), !is.na(T), !is.na(r))

# 計算函式（單次）
calc_once <- function(theta_vec) {
  sum((dat$Y/dat$T)*(pi/(dat$r*v_k*A_k*(2+theta_vec)))) / n_cam
}

# 取得 theta 向量
if (has_theta) {
  # 直接使用檔內 theta 值（假設為弧度）
  Dk <- calc_once(dat$theta)
  cat(sprintf("Dk = %.6f (使用檔內 theta)\n", Dk))
} else if (!is.na(theta_sd) && mc_n > 1) {
  # 蒙地卡羅（theta ~ N(mean, sd)），每列各抽一個 theta_i
  set.seed(42)
  sims <- replicate(mc_n, {
    theta_draw <- rnorm(n = nrow(dat), mean = theta_mean, sd = theta_sd)
    theta_draw[theta_draw < 0] <- 0        # 弧度下限裁切
    theta_draw[theta_draw > pi] <- pi      # 上限不超過 π
    calc_once(theta_draw)
  })
  Dk_mean <- mean(sims)
  Dk_sd   <- sd(sims)
  ci <- quantile(sims, c(0.025, 0.5, 0.975))
  cat(sprintf("Dk(mean) = %.6f, SD = %.6f\n", Dk_mean, Dk_sd))
  cat(sprintf("2.5%% = %.6f, 50%%(median) = %.6f, 97.5%% = %.6f\n",
              ci[1], ci[2], ci[3]))
} else {
  # 單值：以 theta_mean 套用到所有列
  theta_vec <- rep(theta_mean, nrow(dat))
  Dk <- calc_once(theta_vec)
  cat(sprintf("Dk = %.6f (theta = %.4f 固定值)\n", Dk, theta_mean))
}
