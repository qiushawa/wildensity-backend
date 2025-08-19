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
  cat(" Rscript density.R -a <area_id> -s <species_id> -t <theta_mean> [-m <mc_n>] [-y <YYYYMM>]\n")
  cat("\n範例:\n")
  cat(" Rscript density.R -a 10000 -s 1 -t 0.65 -m 10000 -y 202508\n")
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
  if (length(raw_args) == 0) { print_usage(); quit(status = 1) }

  kwargs <- list()
  i <- 1
  while (i <= length(raw_args)) {
    arg <- raw_args[i]
    if (arg %in% c("-h","--help")) { print_usage(); quit(status = 0) }
    if (grepl("^-", arg)) {
      key <- arg
      if (i+1 <= length(raw_args) && !grepl("^-", raw_args[i+1])) {
        kwargs[[key]] <- raw_args[i+1]; i <- i+2
      } else { kwargs[[key]] <- NA; i <- i+1 }
    } else { i <- i+1 }
  }

  required <- c("-a","-s","-t")
  missing <- setdiff(required, names(kwargs))
  if (length(missing) > 0) { cat("缺少必要參數：", paste(missing, collapse=","), "\n"); print_usage(); quit(status=1) }

  list(
    area_id = as.integer(kwargs[["-a"]]),
    species_id = as.integer(kwargs[["-s"]]),
    theta_mean = as.numeric(kwargs[["-t"]]),
    mc_n = ifelse(!is.null(kwargs[["-m"]]), as.integer(kwargs[["-m"]]), 10000L),
    month_str = ifelse(!is.null(kwargs[["-y"]]), kwargs[["-y"]], format(Sys.Date(), "%Y%m"))
  )
}

# -------------------- 資料查詢函式 --------------------
get_Ak_ci <- function(con, species_id, month_str) {
  query <- "SELECT ci_lower, ci_upper FROM Activity WHERE species_id=? AND month=?"
  res <- dbGetQuery(con, query, params=list(species_id, month_str))
  if (nrow(res) == 0) stop("Activity 表找不到對應 species_id 與 month 的資料")
  as.numeric(res[1,])
}

get_n_cam <- function(con, area_id) {
  query <- "SELECT COUNT(*) as n_cam FROM camera WHERE area_id=? AND status='ONLINE'"
  res <- dbGetQuery(con, query, params=list(area_id))
  n_cam <- as.integer(res$n_cam[1])
  if (n_cam == 0) stop("指定 area_id 沒有狀態為 ONLINE 的相機")
  n_cam
}

get_detection_data <- function(con, area_id, species_id) {
  query <- "
    SELECT 
      c.camera_id,
      COUNT(de.event_id) as Y,
      COALESCE(SUM(de.movement_distance_m),0) as total_movement,
      COALESCE(SUM(de.duration_s),0) as total_duration
    FROM camera c
    LEFT JOIN detectionevents de 
      ON c.camera_id = de.camera_id AND c.area_id = de.area_id AND de.species_id = ?
    WHERE c.area_id=? AND c.status='ONLINE'
    GROUP BY c.camera_id
  "
  dat <- dbGetQuery(con, query, params=list(species_id, area_id))
  dat <- dat %>% mutate(r=0.008, T=31) %>% 
    mutate(across(c(Y,T,total_movement,total_duration,r), ~ ifelse(is.na(.),0,as.numeric(.)))) %>% 
    filter(T>0)
  if (nrow(dat)==0) stop("無有效資料列（Y、T、r 不可皆為 NA 或零）")
  dat
}

# -------------------- 計算函式 --------------------
calc_v_k <- function(dat) {
  total_movement <- sum(dat$total_movement, na.rm=TRUE)
  total_duration <- sum(dat$total_duration, na.rm=TRUE)
  if (total_duration==0) stop("總 duration 為零，無法計算 V_k")
  (total_movement/total_duration)*86.4
}

calc_density <- function(dat, n_cam, theta_vec, A_k_val, v_k) {
  sum((dat$Y/dat$T)*(pi/(dat$r*v_k*A_k_val*(2+theta_vec)))) / n_cam
}

monte_carlo_density <- function(dat, n_cam, theta_mean, A_ci, mc_n, v_k) {
  theta_vec <- rep(theta_mean, nrow(dat))
  set.seed(42)
  sims <- numeric(mc_n)
  for (j in seq_len(mc_n)) {
    A_draw <- runif(1, min=A_ci[1], max=A_ci[2])
    sims[j] <- calc_density(dat, n_cam, theta_vec, A_draw, v_k)
  }
  quantile(sims, c(0.025,0.5,0.975), names=FALSE)
}

# -------------------- 主程式 --------------------
main <- function() {
  args <- parse_args()
  env <- load_env()
  con <- connect_db(env)
  on.exit(dbDisconnect(con))

  A_ci <- get_Ak_ci(con, args$species_id, args$month_str)
  n_cam <- get_n_cam(con, args$area_id)
  dat <- get_detection_data(con, args$area_id, args$species_id)
  v_k <- calc_v_k(dat)

  q <- monte_carlo_density(dat, n_cam, args$theta_mean, A_ci, args$mc_n, v_k)
  
  cat(q[1], "\n")  # 2.5%
  cat(q[2], "\n")  # 50%
  cat(q[3], "\n")  # 97.5%
}

# -------------------- 執行 --------------------
main()
