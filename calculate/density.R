#!/usr/bin/env Rscript

suppressMessages(library(optparse))

calculate_rest_density <- function(df, s, T, ak) {
    if (!all(c("appearance_time", "leave_time", "count") %in% colnames(df))) {
        stop("REST 密度計算需要 'appearance_time', 'leave_time', 'count' 欄位")
    }

    df$start <- as.POSIXct(df$appearance_time, tz = "UTC", tryFormats = c(
        "%Y-%m-%dT%H:%M:%OSZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S"
    ))
    df$end <- as.POSIXct(df$leave_time, tz = "UTC", tryFormats = c(
        "%Y-%m-%dT%H:%M:%OSZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d %H:%M:%S"
    ))

    if (any(is.na(df$start) | is.na(df$end))) {
        stop("無法解析 'appearance_time' 或 'leave_time'")
    }

    durations <- as.numeric(difftime(df$end, df$start, units = "secs"))
    t_total <- sum(durations * df$count)
    Y_total <- sum(df$count)

    if (s <= 0 || T <= 0 || ak <= 0) {
        stop("參數 s, T, ak 必須為正數")
    }

    D <- (Y_total * t_total) / (s * T * ak)
    round(D, 5)
}

# ----------- 主程式 ---------------
main <- function() {
    option_list <- list(
        make_option(c("-i", "--input"), type = "character", help = "輸入 CSV 檔案路徑"),
        make_option(c("-s", "--area"), type = "double", help = "焦點區域面積 (km2)"),
        make_option(c("-t", "--duration"), type = "double", help = "相機總工作秒數"),
        make_option(c("-a", "--ak"), type = "double", help = "活動性係數 Ak")
    )
    opt <- parse_args(OptionParser(option_list = option_list))

    if (!file.exists(opt$input)) stop("找不到檔案：", opt$input)

    df <- read.csv(opt$input)
    if (!all(c("appearance_time", "leave_time", "count") %in% colnames(df))) {
        stop("資料缺少必要欄位")
    }

    D <- calculate_rest_density(df, opt$area, opt$duration, opt$ak)
    cat("REST 密度 (Density):", D, "\n")
}

if (sys.nframe() == 0) {
    main()
}
