import { promisify } from 'util'
import { exec as _exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { prisma } from '../common/database'

const exec = promisify(_exec)

export async function calculateActivity(speciesId: number) {
    const now = new Date()
    let year = now.getFullYear().toString()
    let month = String(now.getMonth() + 1).padStart(2, '0')
    if (now.getDate() === 1) {
        // 如果是每月第一天，則計算上個月的活動
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        year = lastMonth.getFullYear().toString()
        month = String(lastMonth.getMonth() + 1).padStart(2, '0')
    }

    // 構建輸入和輸出路徑
    const speciesIdStr = speciesId.toString().padStart(2, '0')
    const inCsv = path.join('reports', 'records', speciesIdStr, year, `${month}.csv`)
    const outdir = path.join('reports', 'activity', speciesIdStr)
    // if reports/activity/{speciesId} 未創建
    if (!fs.existsSync(outdir)) {
        fs.mkdirSync(outdir, { recursive: true })
    }
    const outCsv = path.join(outdir, `${year}.csv`)
    const script = path.resolve('./r-scripts/calculate_activity.R')
    const cmd = `Rscript ${script} -i ${inCsv} -o ${outCsv}`

    const { stdout, stderr } = await exec(cmd)
    if (stderr) throw new Error(`Rscript stderr: ${stderr}`)

    const [ak, ci_lower, ci_upper] = stdout
        .trim()
        .split(/\s+/)
        .map(Number)
    return { ak, ci_lower, ci_upper }
}