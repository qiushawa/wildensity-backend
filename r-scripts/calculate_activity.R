suppressMessages(library(activity))
suppressMessages(library(optparse))

option_list <- list(
  make_option(c("-i", "--input"), type = "character", help = "輸入 CSV 路徑"),
  make_option(c("-o", "--output"), type = "character", help = "輸出結果 CSV 路徑")
)

opt <- parse_args(OptionParser(option_list = option_list))

# 驗證檔案存在
if (!file.exists(opt$input)) {
  stop("輸入檔案不存在：", opt$input)
}

# 提取月份從輸入檔案路徑
file_path <- normalizePath(opt$input, winslash = "/")
path_parts <- strsplit(file_path, "/")[[1]]
file_name <- path_parts[length(path_parts)]  # e.g., "07.csv"
year <- path_parts[length(path_parts)-1]     # e.g., "2025"
# 檢查路徑包含 "records" 且末尾為 YYYY/MM.csv
if (length(path_parts) >= 3 && "records" %in% path_parts && nchar(year) == 4 && grepl("^\\d{2}\\.csv$", file_name)) {
  month <- sub("\\.csv$", "", file_name)
  month_str <- paste(year, month, sep = "-")
} else {
  stop("輸入檔案路徑不符合預期格式：records/YYYY/MM.csv")
}

# 讀檔
df <- read.csv(opt$input)

# 驗證欄位
if (!all(c("出現時間", "數量") %in% colnames(df))) {
  stop("缺少必要欄位：'出現時間' 或 '數量'")
}

# 驗證資料
df$timestamp <- as.POSIXct(df$出現時間, tz = "UTC", tryFormats = c("%Y-%m-%dT%H:%M:%S.%OSZ", "%Y-%m-%dT%H:%M:%SZ"))
if (any(is.na(df$timestamp))) {
  stop("無法解析部分時間戳記，請檢查 '出現時間' 欄位格式")
}
if (any(is.na(df$數量) | df$數量 <= 0)) {
  stop("輸入資料無效：'數量' 欄位需為正整數")
}

# 計算弧度
decimal_hour <- as.numeric(format(df$timestamp, "%H")) + as.numeric(format(df$timestamp, "%M")) / 60 + as.numeric(format(df$timestamp, "%S")) / 3600
time_rad <- decimal_hour / 24 * 2 * pi
# 添加正模函數以確保弧度值在 [0, 2π]
positive_mod <- function(x, m) {
  (x %% m + m) %% m
}
time_rad <- positive_mod(time_rad, 2 * pi)
if (max(time_rad) > 2 * pi || min(time_rad) < 0) {
  stop("time_rad 計算錯誤：弧度值應在 0 到 2π 之間")
}

expanded <- rep(time_rad, df$數量)
if (length(expanded) == 0) {
  stop("expanded 資料為空，請檢查 '數量' 欄位")
}


# 活動分析
fit <- fitact(expanded, sample = "model", bw = 20, reps = 100)
ak <- fit@act[1]  # 確保僅取第一個值
ci_lower <- fit@act[3]  # 信賴區間下限
ci_upper <- fit@act[4]  # 信賴區間上限

# 輸出結果
result <- data.frame(
  月份 = month_str,
  活動峰值 = round(ak, 5),
  信賴區間下限 = round(ci_lower, 5),
  信賴區間上限 = round(ci_upper, 5)
)

# 檢查是否已存在 output.csv
if (file.exists(opt$output)) {
  existing_data <- read.csv(opt$output, fileEncoding = "UTF-8", encoding = "UTF-8-BOM")
  # 確保新數據的欄位順序與現有數據一致
  result <- result[, colnames(existing_data)]
  # 檢查是否已存在該月份，若存在則覆蓋
  if (month_str %in% existing_data$月份) {
    existing_data <- existing_data[existing_data$月份 != month_str, ]
  }
  combined_data <- rbind(existing_data, result)
} else {
  combined_data <- result
}

# 以 UTF-8 BOM 存檔
con <- file(opt$output, open = "wb")
write.csv(combined_data, file = con, row.names = FALSE, fileEncoding = "UTF-8")
# 輸出ak
cat(round(ak, 5), "\n")
# ci_lower
cat(round(ci_lower, 5), "\n")
# ci_upper
cat(round(ci_upper, 5), "\n")
close(con)