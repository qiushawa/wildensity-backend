import { promisify } from 'util';
import { exec as _exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from '../common/database';
import { CAMERA_RAD } from '@/config/config';
interface DensityResult {
    value?: number; // 固定 A_k
    lower?: number; // Monte Carlo 2.5%
    median?: number; // Monte Carlo 50%
    upper?: number; // Monte Carlo 97.5%
}

const exec = promisify(_exec);

export async function calculateActivity(speciesId: number) {
    const now = new Date();
    let year = now.getFullYear().toString();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    if (now.getDate() === 1) {
        // 如果是每月第一天，則計算上個月的活動
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        year = lastMonth.getFullYear().toString();
        month = String(lastMonth.getMonth() + 1).padStart(2, '0');
    }

    // 構建輸入和輸出路徑
    const speciesIdStr = speciesId.toString().padStart(2, '0');
    const inCsv = path.join('reports', 'records', speciesIdStr, year, `${month}.csv`);
    const outdir = path.join('reports', 'activity', speciesIdStr);
    // if reports/activity/{speciesId} 未創建
    if (!fs.existsSync(outdir)) {
        fs.mkdirSync(outdir, { recursive: true });
    }
    const outCsv = path.join(outdir, `${year}.csv`);
    const script = path.resolve('./calculate/activity.R');
    const cmd = `Rscript ${script} -i ${inCsv} -o ${outCsv}`;

    const { stdout, stderr } = await exec(cmd);
    if (stderr) throw new Error(`Rscript stderr: ${stderr}`);

    const [ak, ci_lower, ci_upper] = stdout
        .trim()
        .split(/\s+/)
        .map(Number);
    return { ak, ci_lower, ci_upper };
}


export async function calculateDensity(
    csvFile: string,
    v_k: number,
    n_cam: number,
    A_ci: { lower: number; upper: number },
): Promise<DensityResult> {
    const script = path.resolve("./calculate/density.R"); // R 腳本路徑
    const args: string[] = [
        script,
        "-a", csvFile,
        "-v", v_k.toString(),
        "-n", n_cam.toString(),
        "-t", CAMERA_RAD.toString(),
        "--A_ci", `${A_ci.lower},${A_ci.upper}`
    ];

    const cmd = `Rscript ${args.map(a => `"${a}"`).join(" ")}`;
    const { stdout, stderr } = await exec(cmd);

    if (stderr) throw new Error(`Rscript stderr: ${stderr}`);

    const numbers = stdout
        .trim()
        .split(/\s+/)
        .map(Number);
    if (numbers.length === 1) {
        return { value: numbers[0] };
    } else if (numbers.length === 3) {
        return { lower: numbers[0], median: numbers[1], upper: numbers[2] };
    } else {
        throw new Error(`Unexpected R output: ${stdout}`);
    }
}