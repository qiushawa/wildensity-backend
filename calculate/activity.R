#!/usr/bin/env Rscript
suppressMessages({
  if (!require(activity)) install.packages("activity", repos = "http://cran.us.r-project.org")
  if (!require(optparse)) install.packages("optparse", repos = "http://cran.us.r-project.org")
  if (!require(RMariaDB)) install.packages("RMariaDB", repos = "http://cran.us.r-project.org")
  if (!require(urltools)) install.packages("urltools", repos = "http://cran.us.r-project.org")
  if (!require(dotenv)) install.packages("dotenv", repos = "http://cran.us.r-project.org")
})

# 載入 .env
dotenv::load_dot_env(".env")

# -------------------- 主程式 --------------------
main <- function() {
  opt <- parse_options()
  validate_input(opt$month, opt$species)
  
  file_info <- parse_month_info(opt$month)
  
  # 建立單一資料庫連線
  con <- create_db_connection()
  on.exit(dbDisconnect(con), add = TRUE)
  
  # 讀取並驗證數據
  df <- fetch_and_validate_data(con, opt$month, opt$species)
  
  time_rad <- compute_radians(df)
  activity_data <- prepare_activity_data(time_rad, df$count)
  
  result <- calculate_activity(file_info$month_str, activity_data)
  
  # 寫入 Activity 表
  write_activity_to_db(con, file_info$month_str, opt$species, result$activity_peak, result$ci_lower, result$ci_upper)
  
  # 輸出結果供 Node.js 解析
  cat(sprintf("%f\n%f\n%f\n", result$ci_lower, result$ci_upper, result$activity_peak))
}

# -------------------- 資料庫連線 --------------------
create_db_connection <- function() {
  db_host <- Sys.getenv("DB_HOST", "127.0.0.1")
  db_port <- as.integer(Sys.getenv("DB_PORT", "3306"))
  db_user <- Sys.getenv("DB_USER", "root")
  db_password <- Sys.getenv("DB_PASSWORD", "")
  db_name <- Sys.getenv("DB_NAME", "")
  
  if (any(c(db_host, db_port, db_user, db_name) == "")) {
    stop("請確保 .env 檔案包含 DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_NAME")
  }
  
  tryCatch(
    dbConnect(MariaDB(),
              host = db_host,
              port = db_port,
              user = db_user,
              password = db_password,
              dbname = db_name),
    error = function(e) {
      stop(sprintf("資料庫連線失敗：%s", e$message))
    }
  )
}

# -------------------- 解析與驗證 --------------------
parse_options <- function() {
  option_list <- list(
    make_option(c("-m", "--month"), type = "character", help = "輸入月份 (格式: YYYY-MM)"),
    make_option(c("-s", "--species"), type = "integer", help = "物種編號 (species_id)")
  )
  parse_args(OptionParser(option_list = option_list))
}

validate_input <- function(month, species_id) {
  if (!grepl("^\\d{4}-\\d{2}$", month)) {
    stop("月份格式錯誤：應為 YYYY-MM")
  }
  if (!is.numeric(species_id) || species_id <= 0 || species_id != as.integer(species_id)) {
    stop("物種編號錯誤：需為正整數")
  }
}

parse_month_info <- function(month) {
  parts <- strsplit(month, "-")[[1]]
  year <- parts[1]
  month_num <- parts[2]
  month_str <- month
  list(year = year, month = month_num, month_str = month_str)
}

# -------------------- 資料讀取與驗證 --------------------
fetch_and_validate_data <- function(con, month, species_id) {
  # 查詢數據
  query <- sprintf(
    "SELECT start_timestamp AS appearance_time, num_individuals AS count
     FROM detectionevents
     WHERE DATE_FORMAT(start_timestamp, '%%Y-%%m') = '%s'
     AND species_id = %d",
    month, species_id
  )
  cat("Executing query:\n", month, "\n")
  df <- tryCatch(
    dbGetQuery(con, query),
    error = function(e) {
      stop(sprintf("資料庫查詢失敗：%s", e$message))
    }
  )
  
  if (nrow(df) == 0) stop("指定月份或物種無資料")
  
  # 驗證欄位
  if (!all(c("appearance_time", "count") %in% colnames(df))) {
    stop("缺少必要欄位：'appearance_time' 或 'count'")
  }
  
  # 解析時間戳記
  df$timestamp <- as.POSIXct(df$appearance_time, tz = "UTC", tryFormats = c(
    "%Y-%m-%dT%H:%M:%OSZ",
    "%Y-%m-%dT%H:%M:%S%z",
    "%Y-%m-%d %H:%M:%S"
  ))
  if (any(is.na(df$timestamp))) {
    print(df$appearance_time[is.na(df$timestamp)])
    stop("無法解析部分時間戳記，請確認格式是否為 ISO 8601（如 2025-08-01T00:00:00Z）")
  }
  
  # 驗證 count
  if (any(is.na(df$count) | df$count <= 0)) {
    stop("無效資料：'count' 欄位需為正整數")
  }
  
  df
}

# -------------------- 計算分析 --------------------
compute_radians <- function(df) {
  decimal_hour <- as.numeric(format(df$timestamp, "%H")) +
    as.numeric(format(df$timestamp, "%M")) / 60 +
    as.numeric(format(df$timestamp, "%S")) / 3600
  
  positive_mod <- function(x, m) {
    (x %% m + m) %% m
  }
  
  radians <- positive_mod(decimal_hour / 24 * 2 * pi, 2 * pi)
  
  if (max(radians) > 2 * pi || min(radians) < 0) {
    stop("弧度計算錯誤：值應落在 [0, 2π] 範圍")
  }
  
  radians
}

prepare_activity_data <- function(radians, counts) {
  if (is.null(radians) || is.null(counts) ||
      length(radians) == 0 || length(counts) == 0 ||
      any(is.na(radians)) || any(is.na(counts))) {
    stop("無資料可分析：請確認 'radians' 與 'count' 欄位內容，並確保無 NA 或 NULL 值")
  }
  list(radians = radians, weights = counts)
}

calculate_activity <- function(month_str, data) {
  fit <- suppressWarnings(
    fitact(
      data$radians,
      wt = data$weights,
      sample = "model",
      bw = 20,
      reps = 100
    )
  )
  ak <- round(fit@act[1], 5)
  ci_lower <- round(fit@act[3], 5)
  ci_upper <- round(fit@act[4], 5)
  
  data.frame(
    month = month_str,
    activity_peak = ak,
    ci_lower = ci_lower,
    ci_upper = ci_upper
  )
}

# -------------------- 寫入資料庫 --------------------
write_activity_to_db <- function(con, month_str, species_id, activity_peak, ci_lower, ci_upper) {
  # 格式化 month_str 為 YYYYMM
  month_key <- gsub("-", "", month_str)
  if (!grepl("^[0-9]{6}$", month_key)) {
    stop("month_str 格式無效，應為 YYYY-MM 或 YYYYMM（例如 2025-08 或 202508）")
  }
  
  # 檢查 species_id 是否存在於 species 表
  species_check_query <- "SELECT COUNT(*) AS count FROM species WHERE species_id = ?"
  species_check <- dbGetQuery(con, species_check_query, params = list(as.integer(species_id)))
  if (species_check$count == 0) {
    stop(sprintf("species_id %d 在 species 表中不存在", species_id))
  }
  
  # 檢查現有記錄並比較值
  check_query <- "SELECT activity_peak, ci_lower, ci_upper FROM Activity WHERE month = ? AND species_id = ?"
  check_result <- dbGetQuery(con, check_query, params = list(month_key, as.integer(species_id)))
  existing_record <- nrow(check_result) > 0
  
  # 準備 SQL 查詢
  query <- "
    INSERT INTO Activity (month, species_id, activity_peak, ci_lower, ci_upper)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      activity_peak = VALUES(activity_peak),
      ci_lower = VALUES(ci_lower),
      ci_upper = VALUES(ci_upper)
  "
  
  # 執行查詢並檢查影響的行數
  tryCatch({
    affected_rows <- dbExecute(con, query, params = list(
      month_key,
      as.integer(species_id),
      as.numeric(activity_peak),
      as.numeric(ci_lower),
      as.numeric(ci_upper)
    ))
  }, error = function(e) {
    stop(sprintf("資料庫操作失敗：%s", e$message))
  })
}

# -------------------- 執行 --------------------
main()