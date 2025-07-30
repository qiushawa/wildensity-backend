import { promisify } from 'util'
import { exec as _exec } from 'child_process'
import path from 'path'

const exec = promisify(_exec)

export async function calculateActivity() {
  const now       = new Date()
  const year      = now.getFullYear().toString()
  const month     = String(now.getMonth() + 1).padStart(2, '0')
  const inCsv     = path.join('reports','records', year, `${month}.csv`)
  const outCsv    = path.join('reports','activity', `${year}.csv`)
  const script    = path.resolve('./r-scripts/calculate_activity.R')
  const cmd       = `Rscript ${script} -i ${inCsv} -o ${outCsv}`

  const { stdout, stderr } = await exec(cmd)
  if (stderr) throw new Error(`Rscript stderr: ${stderr}`)

  const [ak, ci_lower, ci_upper] = stdout
    .trim()
    .split(/\s+/)
    .map(Number)

  return { ak, ci_lower, ci_upper }
}