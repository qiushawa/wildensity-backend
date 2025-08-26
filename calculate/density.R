#!/usr/bin/env Rscript
suppressWarnings(suppressMessages({
  library(DBI)
  library(RMariaDB)
  library(dplyr)
  library(dotenv)
}))

# -------------------- 使用說明 --------------------
print_usage <- function() {
  cat("使用方法:\n")
  cat(" Rscript density.R -a <area_id> -s <species_id> -t <theta_mean> [-tsd <theta_sd>] [-y <YYYYMM>]\n")
  cat("\n範例:\n")
  cat(" Rscript density.R -a 10000 -s 1 -t 1.047 -y 202508\n")
}

# -------------------- 環境變數與資料庫連線 --------------------
load_env <- function() {
  load_dot_env(file = ".env")
  list(
    db_name = Sys.getenv("DB_NAME"),
    db_user = Sys.getenv("DB_USER"),
    db_password = Sys.getenv("DB_PASSWORD"),
    db_host = Sys.getenv("DB_HOST")
  )
}

connect_db <- function(env) {
  con <- dbConnect(
    MariaDB(),
    dbname = env$db_name,
    host = env$db_host,
    user = env$db_user,
    password = env$db_password
  )
  return(con)
}

# -------------------- 解析命令列參數 --------------------
parse_args <- function() {
  raw_args <- commandArgs(trailingOnly = TRUE)
  if (length(raw_args) == 0) {
    print_usage()
    quit(status = 1)
  }
  kwargs <- list()
  i <- 1
  while (i <= length(raw_args)) {
    arg <- raw_args[i]
    if (arg %in% c("-h", "--help")) {
      print_usage()
      quit(status = 0)
    }
    if (grepl("^-", arg)) {
      key <- arg
      if (i + 1 <= length(raw_args) && !grepl("^-", raw_args[i + 1])) {
        kwargs[[key]] <- raw_args[i + 1]
        i <- i + 2
      } else {
        kwargs[[key]] <- NA
        i <- i + 1
      }
    } else {
      i <- i + 1
    }
  }

  required <- c("-a", "-s", "-t")
  missing <- setdiff(required, names(kwargs))
  if (length(missing) > 0) {
    cat("缺少必要參數：", paste(missing, collapse = ","), "\n")
    print_usage()
    quit(status = 1)
  }

  list(
    area_id = as.integer(kwargs[["-a"]]),
    species_id = as.integer(kwargs[["-s"]]),
    theta_val = as.numeric(kwargs[["-t"]]),
    month_str = ifelse(!is.null(kwargs[["-y"]]), kwargs[["-y"]], format(Sys.Date(), "%Y%m"))
  )
}

# -------------------- 資料查詢函式 --------------------
get_Ak <- function(con, species_id, month_str) {
  query <- "SELECT activity_peak FROM Activity WHERE species_id = ? AND month = ?"
  res <- dbGetQuery(con, query, params = list(species_id, month_str))
  if (nrow(res) == 0) stop("Activity 表找不到對應 species_id 與 month 的資料")
  as.numeric(res$activity_peak[1]) # 取活動峰值作為固定 Ak
}

get_n_cam <- function(con, area_id) {
  query <- "SELECT COUNT(*) as n_cam FROM camera WHERE area_id = ? AND status = 'ONLINE'"
  res <- dbGetQuery(con, query, params = list(area_id))
  n_cam <- as.integer(res$n_cam[1])
  if (n_cam == 0) stop("指定 area_id 沒有狀態為 ONLINE 的相機")
  n_cam
}

get_detection_data <- function(con, area_id, species_id) {
  query <- "
    SELECT
      cse.camera_id,
      COUNT(de.event_id) AS Y,
      COALESCE(SUM(de.movement_distance_m), 0) AS total_movement,
      COALESCE(SUM(de.duration_s), 0) AS total_duration,
      COALESCE(SUM(
        TIMESTAMPDIFF(
          SECOND,
          cse.last_update_time,
          cse.last_confirmed_time
        )
      ), 0) / 86400.0 AS T
    FROM CameraStatusEvent cse
    LEFT JOIN detectionevents de
      ON cse.camera_id = de.camera_id
      AND cse.area_id = de.area_id
      AND de.species_id = ?
    WHERE cse.area_id = ? AND cse.status = 'ONLINE'
    GROUP BY cse.camera_id
  "
  dat <- dbGetQuery(con, query, params = list(species_id, area_id))
  dat <- dat %>%
    mutate(r = 0.008) %>%
    mutate(across(c(Y, T, total_movement, total_duration, r), 
                  ~ ifelse(is.na(.), 0, as.numeric(.)))) %>%
    filter(T > 0)
  if (nrow(dat) == 0) stop("無有效資料列（Y、T、r 不可皆為 NA 或零）")
  dat
}

# -------------------- 計算函式 --------------------
calc_v_k <- function(dat) {
  total_movement <- sum(dat$total_movement, na.rm = TRUE)
  total_duration <- sum(dat$total_duration, na.rm = TRUE)
  if (total_duration == 0) stop("總 duration 為零，無法計算 V_k")
  (total_movement / total_duration) * 86.4  # 單位換算
}

calc_density_fixed <- function(dat, n_cam, theta_val, A_k_val, v_k) {
  
  theta_vec <- rep(theta_val, nrow(dat))
  cat("vk:", v_k, "\n")
  cat("Ak:", A_k_val, "\n")
  cat("theta:", theta_val, "\n")
  cat("n_cam:", n_cam, "\n")
  cat("sum:", sum((dat$Y / dat$T) * (pi / (dat$r * v_k * A_k_val * (2 + theta_vec)))) / n_cam, "\n")
  sum((dat$Y / dat$T) * (pi / (dat$r * v_k * A_k_val * (2 + theta_vec)))) / n_cam
}

# -------------------- 主程式 --------------------
main <- function() {
  args <- parse_args()
  env <- load_env()
  con <- connect_db(env)
  on.exit(dbDisconnect(con))
  
  A_k_val <- get_Ak(con, args$species_id, args$month_str)
  n_cam <- get_n_cam(con, args$area_id)
  dat <- get_detection_data(con, args$area_id, args$species_id)
  v_k <- calc_v_k(dat)
  
  density <- calc_density_fixed(dat, n_cam, args$theta_val, A_k_val, v_k)
  
  cat("Density:", density, "\n")
}

# -------------------- 執行 --------------------
main()
