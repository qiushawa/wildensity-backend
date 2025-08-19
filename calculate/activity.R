suppressMessages(if (!require(activity)) install.packages("activity", repos = "http://cran.us.r-project.org"))
suppressMessages(if (!require(optparse)) install.packages("optparse", repos = "http://cran.us.r-project.org"))
suppressMessages(if (!require(RMariaDB)) install.packages("RMariaDB", repos = "http://cran.us.r-project.org"))
suppressMessages(if (!require(urltools)) install.packages("urltools", repos = "http://cran.us.r-project.org"))
suppressMessages(if (!require(dotenv)) install.packages("dotenv", repos = "http://cran.us.r-project.org"))

# 載入 .env
dotenv::load_dot_env(".env")

# -------------------- 主程式 --------------------
main <- function() {
    opt <- parse_options()
    validate_input(opt$month, opt$species)

    file_info <- parse_month_info(opt$month)
    df <- read_from_database(opt$month, opt$species)
    validate_columns(df)
    df$timestamp <- parse_timestamps(df$appearance_time)
    validate_counts(df$count)

    time_rad <- compute_radians(df)
    activity_data <- prepare_activity_data(time_rad, df$count)

    result <- calculate_activity(file_info$month_str, activity_data)

    cat(result$activity_peak, "\n")
    cat(result$ci_lower, "\n")
    cat(result$ci_upper, "\n")

    # 寫入 Activity 表
    write_activity_to_db(
        month_str = file_info$month_str,
        species_id = opt$species,
        activity_peak = result$activity_peak,
        ci_lower = result$ci_lower,
        ci_upper = result$ci_upper
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

# -------------------- 讀取與驗證資料 --------------------
read_from_database <- function(month, species_id) {
    db_host <- Sys.getenv("DB_HOST", "127.0.0.1")
    db_port <- as.integer(Sys.getenv("DB_PORT", "3306"))
    db_user <- Sys.getenv("DB_USER", "root")
    db_password <- Sys.getenv("DB_PASSWORD", "")
    db_name <- Sys.getenv("DB_NAME", "")

    if (db_name == "") stop("環境變數 DB_NAME 未設定")

    con <- tryCatch(
        dbConnect(MariaDB(), 
                  host = db_host, 
                  port = db_port,
                  user = db_user,
                  password = db_password,
                  dbname = db_name),
        error = function(e) {
            stop(paste("資料庫連線失敗:", e$message))
        }
    )
    on.exit(dbDisconnect(con))

    query <- paste0(
        "SELECT start_timestamp AS appearance_time, num_individuals AS count ",
        "FROM detectionevents ",
        "WHERE DATE_FORMAT(start_timestamp, '%Y-%m') = '", month, "' ",
        "AND species_id = ", species_id
    )

    df <- dbGetQuery(con, query)
    if (nrow(df) == 0) stop("指定月份或物種無資料")

    df
}

validate_columns <- function(df) {
    if (!all(c("appearance_time", "count") %in% colnames(df))) {
        stop("缺少必要欄位：'appearance_time' 或 'count'")
    }
}

parse_timestamps <- function(times) {
    ts <- as.POSIXct(times, tz = "UTC", tryFormats = c(
        "%Y-%m-%dT%H:%M:%OSZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S"
    ))
    if (any(is.na(ts))) {
        print(times[is.na(ts)])
        stop("無法解析部分時間戳記，請確認格式是否為 ISO 8601（如 2025-07-09T02:33:01.850Z）")
    }
    ts
}

validate_counts <- function(counts) {
    if (any(is.na(counts) | counts <= 0)) {
        stop("無效資料：'count' 欄位需為正整數")
    }
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

# 不展開，直接回傳加權資料
prepare_activity_data <- function(radians, counts) {
    if (length(radians) == 0 || length(counts) == 0) {
        stop("無資料可分析：請確認 'count' 欄位內容")
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
write_activity_to_db <- function(month_str, species_id, activity_peak, ci_lower, ci_upper) {
    db_host <- Sys.getenv("DB_HOST", "127.0.0.1")
    db_port <- as.integer(Sys.getenv("DB_PORT", "3306"))
    db_user <- Sys.getenv("DB_USER", "root")
    db_password <- Sys.getenv("DB_PASSWORD", "")
    db_name <- Sys.getenv("DB_NAME", "")

    con <- dbConnect(MariaDB(),
                     host = db_host,
                     port = db_port,
                     user = db_user,
                     password = db_password,
                     dbname = db_name)
    on.exit(dbDisconnect(con))

    # month 作為主鍵，直接存 YYYYMM 字串
    month_key <- gsub("-", "", month_str)  # 202508

    query <- "
        INSERT INTO Activity (month, species_id, activity_peak, ci_lower, ci_upper)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            activity_peak = VALUES(activity_peak),
            ci_lower = VALUES(ci_lower),
            ci_upper = VALUES(ci_upper),
            species_id = VALUES(species_id)
    "
    
    dbExecute(con, query, params = list(month_key, species_id, activity_peak, ci_lower, ci_upper))

    message("已成功寫入或更新 Activity 表")
}


# -------------------- 執行 --------------------
main()
