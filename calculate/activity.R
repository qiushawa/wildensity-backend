# calculate_activity.R

suppressMessages(library(activity))
suppressMessages(library(optparse))

# -------------------- 主程式 --------------------
main <- function() {
    opt <- parse_options()
    validate_input(opt$input)

    file_info <- parse_file_info(opt$input)
    df <- read_input_csv(opt$input)
    validate_columns(df)
    df$timestamp <- parse_timestamps(df$appearance_time)
    validate_counts(df$count)

    time_rad <- compute_radians(df)
    expanded <- expand_counts(time_rad, df$count)

    result <- calculate_activity(file_info$month_str, expanded)
    ak <- result$activity_peak


    write_result_csv(opt$output, result)

    cat(result$activity_peak, "\n")
    cat(result$ci_lower, "\n")
    cat(result$ci_upper, "\n")

}

# -------------------- 解析與驗證 --------------------
parse_options <- function() {
    option_list <- list(
        make_option(c("-i", "--input"), type = "character", help = "輸入 CSV 路徑"),
        make_option(c("-o", "--output"), type = "character", help = "輸出結果 CSV 路徑")
    )
    parse_args(OptionParser(option_list = option_list))
}

validate_input <- function(input_path) {
    if (!file.exists(input_path)) {
        stop("輸入檔案不存在：", input_path)
    }
}

parse_file_info <- function(input_path) {
    file_path <- normalizePath(input_path, winslash = "/")
    path_parts <- strsplit(file_path, "/")[[1]]
    file_name <- path_parts[length(path_parts)]
    year <- path_parts[length(path_parts) - 1]

    if (length(path_parts) >= 4 &&
        path_parts[length(path_parts) - 3] == "records" &&
        nchar(path_parts[length(path_parts) - 2]) > 0 &&
        nchar(year) == 4 && grepl("^\\d{4}$", year) &&
        grepl("^\\d{2}\\.csv$", file_name)) {
        month <- sub("\\.csv$", "", file_name)
        month_str <- paste(year, month, sep = "-")
        list(year = year, month = month, month_str = month_str)
    } else {
        stop("輸入檔案路徑不符合預期格式（應為 .../records/SS/YYYY/MM.csv）")
    }
}

# -------------------- 讀取與驗證資料 --------------------
read_input_csv <- function(path) {
    first_bytes <- readBin(path, what = "raw", n = 3)
    if (identical(first_bytes, charToRaw("\xef\xbb\xbf"))) {
        read.csv(path, fileEncoding = "UTF-8-BOM")
    } else {
        read.csv(path)
    }
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

expand_counts <- function(radians, counts) {
    expanded <- rep(radians, counts)
    if (length(expanded) == 0) {
        stop("無資料可分析：請確認 'count' 欄位內容")
    }
    expanded
}

calculate_activity <- function(month_str, expanded) {
    fit <- fitact(expanded, sample = "model", bw = 20, reps = 100)
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

# -------------------- 寫入結果 --------------------
write_result_csv <- function(output_path, result) {
    if (file.exists(output_path)) {
        existing_data <- read.csv(output_path, fileEncoding = "UTF-8", encoding = "UTF-8-BOM")
        result <- result[, colnames(existing_data), drop = FALSE]
        existing_data <- existing_data[existing_data$month != result$month, ]
        combined <- rbind(existing_data, result)
    } else {
        combined <- result
    }

    con <- file(output_path, open = "wb")
    write.csv(combined, file = con, row.names = FALSE, fileEncoding = "UTF-8", quote = FALSE)
    close(con)
}

# -------------------- 執行 --------------------
main()
