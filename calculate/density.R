#!/usr/bin/env Rscript

suppressWarnings(suppressMessages({
  library(readr)
  library(dplyr)
}))

print_usage <- function() {
  cat("Usage:\n")
  cat("  Rscript density.R -a <csv_file> -v <v_k> -n <n_cam> -t <theta_mean> (-A <A_k> | --A_ci <lower,upper>) [-m <mc_n>]\n")
  cat("\nExamples:\n")
  cat("  固定 A_k:\n")
  cat("    Rscript density.R -a camera_data.csv -v 4.03 -A 0.71 -n 30 -t 0.65\n")
  cat("  A_k 有 CI（蒙地卡羅）:\n")
  cat("    Rscript density.R -a camera_data.csv -v 4.03 --A_ci 0.65,0.78 -n 30 -t 0.65 -m 10000\n")
}

# 解析參數（允許任意順序），支援 -a -v -A -n -t -m 與 --A_ci
raw_args <- commandArgs(trailingOnly = TRUE)
if (length(raw_args) == 0) {
  print_usage(); quit(status = 1)
}

# 轉成 key->value map，支援形式:
#  - short flags with value: -a value
#  - long flag with =: --A_ci=0.65,0.78  OR --A_ci 0.65,0.78
kwargs <- list()
i <- 1
while (i <= length(raw_args)) {
  arg <- raw_args[i]
  if (arg %in% c("-h", "--help")) {
    print_usage(); quit(status = 0)
  }
  if (grepl("^--", arg)) {
    # long flag
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
    # short flag: -a value
    key <- arg
    if (i + 1 <= length(raw_args) && !grepl("^-", raw_args[i+1])) {
      kwargs[[key]] <- raw_args[i+1]
      i <- i + 2
    } else {
      kwargs[[key]] <- NA
      i <- i + 1
    }
  } else {
    # positional value without flag (ignore)
    i <- i + 1
  }
}

# 必要參數
required <- c("-a", "-v", "-n", "-t")
missing <- setdiff(required, names(kwargs))
if (length(missing) > 0) {
  cat("缺少必要參數：", paste(missing, collapse = ", "), "\n\n")
  print_usage(); quit(status = 1)
}

# 讀取並轉型
csv_file   <- kwargs[["-a"]]
v_k        <- as.numeric(kwargs[["-v"]])
n_cam      <- as.numeric(kwargs[["-n"]])
theta_mean <- as.numeric(kwargs[["-t"]])
mc_n       <- ifelse(!is.null(kwargs[["-m"]]), as.integer(kwargs[["-m"]]), 10000L)

# A_k 處理（固定或 CI）
A_k <- NULL
A_ci <- NULL
if ("-A" %in% names(kwargs) && !is.na(kwargs[["-A"]])) {
  A_k <- as.numeric(kwargs[["-A"]])
}
if ("--A_ci" %in% names(kwargs) && !is.na(kwargs[["--A_ci"]])) {
  tmp <- strsplit(kwargs[["--A_ci"]], ",")[[1]]
  if (length(tmp) != 2) {
    stop("--A_ci 必須為 lower,upper 形式（用逗號分隔）")
  }
  A_ci <- as.numeric(tmp)
  if (any(is.na(A_ci))) stop("--A_ci 內容解析失敗")
}
if (is.null(A_k) && is.null(A_ci)) {
  cat("必須提供 -A <A_k> 或 --A_ci <lower,upper>\n")
  print_usage(); quit(status = 1)
}

# 讀 CSV
dat <- read_csv(csv_file, show_col_types = FALSE) |>
  mutate(across(everything(), ~ ifelse(. %in% c("/", "\\", "NA", ""), NA, .))) |>
  mutate(across(where(is.character), readr::parse_number))

has_r_km  <- "r"   %in% names(dat)
has_r_m   <- "r_m" %in% names(dat)
if (!(has_r_km || has_r_m)) stop("CSV 需包含 r(公里) 或 r_m(公尺) 其中之一")
if (!all(c("Y","T") %in% names(dat))) stop("CSV 必須包含欄位：Y, T")
if (has_r_m && !has_r_km) dat <- dat |> mutate(r = r_m / 1000)
dat <- dat |> filter(!is.na(Y), !is.na(T), !is.na(r))

if (nrow(dat) == 0) stop("無有效資料列 (Y, T, r 欄位皆不可為 NA)")

# 計算函式（theta 為固定值）
calc_once <- function(theta_vec, A_k_val) {
  sum((dat$Y / dat$T) * (pi / (dat$r * v_k * A_k_val * (2 + theta_vec)))) / n_cam
}
theta_vec <- rep(theta_mean, nrow(dat))

# 輸出
if (!is.null(A_ci)) {
  # Monte Carlo for A_k (uniform in CI)
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
