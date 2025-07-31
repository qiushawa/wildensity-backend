import { promisify } from 'util'
import { exec as _exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import { prisma } from '../common/database'

const exec = promisify(_exec)

export async function calculateActivity(speciesId: number) {
    const now = new Date()
    const year = now.getFullYear().toString()
    const month = String(now.getMonth() + 1).padStart(2, '0')
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
    await prisma.activity_peak.create({
        data: {
            species_id: speciesId,
            activity_peak: ak,
            created_at: new Date(),
        },
    });
    return { ak, ci_lower, ci_upper }
}