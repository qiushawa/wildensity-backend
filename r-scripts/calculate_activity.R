suppressMessages(library(activity))
suppressMessages(library(optparse))

# ----------- 參數設定 -----------
option_list <- list(
  make_option(c("-i", "--input"), type = "character", help = "輸入 CSV 路徑"),
  make_option(c("-o", "--output"), type = "character", help = "輸出結果 CSV 路徑")
)
opt <- parse_args(OptionParser(option_list = option_list))

# ----------- 驗證輸入檔案 -----------
if (!file.exists(opt$input)) {
  stop("輸入檔案不存在：", opt$input)
}

# ----------- 解析物種/年月 -----------
file_path <- normalizePath(opt$input, winslash = "/")
path_parts <- strsplit(file_path, "/")[[1]]
file_name <- path_parts[length(path_parts)]
year <- path_parts[length(path_parts)-1]

if (length(path_parts) >= 4 &&
  path_parts[length(path_parts) - 3] == "records" &&
  nchar(path_parts[length(path_parts) - 2]) > 0 &&
  nchar(year) == 4 && grepl("^\\d{4}$", year) &&
  grepl("^\\d{2}\\.csv$", file_name)) {
  month <- sub("\\.csv$", "", file_name)
  month_str <- paste(year, month, sep = "-")
} else {
  stop("輸入檔案路徑不符合預期格式（應為 .../records/SS/YYYY/MM.csv）")
}

# ----------- 讀取 CSV -----------
# 嘗試偵測 BOM，根據需要設定 fileEncoding
first_bytes <- readBin(opt$input, what = "raw", n = 3)
if (identical(first_bytes, charToRaw("\xef\xbb\xbf"))) {
  message("偵測到 UTF-8 BOM，將使用 fileEncoding = 'UTF-8-BOM' 讀取檔案")
  df <- read.csv(opt$input, fileEncoding = "UTF-8-BOM")
} else {
  df <- read.csv(opt$input)
}

# ----------- 驗證欄位存在 -----------
if (!all(c("appearance_time", "count") %in% colnames(df))) {
  stop("缺少必要欄位：'appearance_time' 或 'count'")
}

# ----------- 時間解析 -----------
df$timestamp <- as.POSIXct(df$appearance_time, tz = "UTC", tryFormats = c(
  "%Y-%m-%dT%H:%M:%OSZ",
  "%Y-%m-%dT%H:%M:%S%z",
  "%Y-%m-%d %H:%M:%S"
))

if (any(is.na(df$timestamp))) {
  print(df$appearance_time[is.na(df$timestamp)])
  stop("無法解析部分時間戳記，請確認格式是否為 ISO 8601（如 2025-07-09T02:33:01.850Z）")
}

if (any(is.na(df$count) | df$count <= 0)) {
  stop("無效資料：'count' 欄位需為正整數")
}

# ----------- 計算弧度 -----------
decimal_hour <- as.numeric(format(df$timestamp, "%H")) +
  as.numeric(format(df$timestamp, "%M")) / 60 +
  as.numeric(format(df$timestamp, "%S")) / 3600

positive_mod <- function(x, m) {
  (x %% m + m) %% m
}
time_rad <- positive_mod(decimal_hour / 24 * 2 * pi, 2 * pi)

if (max(time_rad) > 2 * pi || min(time_rad) < 0) {
  stop("弧度計算錯誤：值應落在 [0, 2π] 範圍")
}

# ----------- 展開重複數據 -----------
expanded <- rep(time_rad, df$count)
if (length(expanded) == 0) {
  stop("無資料可分析：請確認 'count' 欄位內容")
}

# ----------- 活動分析 -----------
fit <- fitact(expanded, sample = "model", bw = 20, reps = 100)
ak <- fit@act[1]
ci_lower <- fit@act[3]
ci_upper <- fit@act[4]

# ----------- 輸出結果 -----------
result <- data.frame(
  month = month_str,
  activity_peak = round(ak, 5),
  ci_lower = round(ci_lower, 5),
  ci_upper = round(ci_upper, 5)
)

# ----------- 合併並存檔 -----------
if (file.exists(opt$output)) {
  existing_data <- read.csv(opt$output, fileEncoding = "UTF-8", encoding = "UTF-8-BOM")
  result <- result[, colnames(existing_data), drop = FALSE]

  if (month_str %in% existing_data$month) {
    existing_data <- existing_data[existing_data$month != month_str, ]
  }

  combined_data <- rbind(existing_data, result)
} else {
  combined_data <- result
}

# ----------- 寫入 UTF-8-BOM 檔案 -----------
con <- file(opt$output, open = "wb")
write.csv(combined_data, file = con, row.names = FALSE, fileEncoding = "UTF-8", quote = FALSE)

close(con)

# ----------- 輸出至 stdout -----------
cat(round(ak, 5), "\n")
cat(round(ci_lower, 5), "\n")
cat(round(ci_upper, 5), "\n")
