#!/usr/bin/env Rscript

suppressMessages(library(optparse))
suppressMessages(library(parsedate))

calculate_rest_density <- function(df, s, T, ak) {
    if (!all(c("appearance_time", "leave_time", "count") %in% colnames(df))) {
        stop("REST 密度計算需要 'appearance_time', 'leave_time', 'count' 欄位")
    }

    df$start <- parsedate::parse_date(df$appearance_time)
    df$end <- parsedate::parse_date(df$leave_time)

    if (any(is.na(df$start) | is.na(df$end))) {
        stop("無法解析 'appearance_time' 或 'leave_time'")
    }

    durations <- as.numeric(difftime(df$end, df$start, units = "secs")) # 計算每筆資料的停留時間
    t_total <- sum(durations * df$count)  # 每筆乘以 count，表示總停留秒數
    Y_total <- sum(df$count)

    if (s <= 0 || T <= 0 || ak <= 0) {
        stop("參數 s, T, Ak 必須為正數")
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
    cat(D, "\n")
}

if (sys.nframe() == 0) {
    main()
}
