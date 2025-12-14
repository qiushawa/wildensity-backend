
import { exec as _exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { prisma } from './common/database';
import { CAMERA_RAD } from '@/config/config';
import { promisify } from 'node:util';
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
    
    const script = path.resolve('./calculate/activity.R');
    const cmd = `Rscript ${script} -m ${year}-${month} -s ${speciesId}`;

    const { stdout, stderr } = await exec(cmd);
    if (stderr) throw new Error(`Rscript stderr: ${stderr}`);
    console.log(`Rscript stdout: ${stdout}`);
    const [ci_lower, ci_upper, ak] = stdout
        .trim()
        .split(/\s+/)
        .map(Number);
    return { ak, ci_lower, ci_upper };
}


export async function calculateDensity(area_id: number, species_id: number): Promise<DensityResult> {
    const script = path.resolve("./calculate/density.R"); // R 腳本路徑
    const args: string[] = [
        script,
        "-a", area_id.toString(),
        "-s", species_id.toString(),
        "-t", CAMERA_RAD.toString(),
        "-y", "202511"
    ];

    const cmd = 'Rscript ' + args.map(a => `"${a}"`).join(' ');
    console.log(`執行命令: ${cmd}`);
    const { stdout, stderr } = await exec(cmd);

    if (stderr) throw new Error(`Rscript stderr: ${stderr}`);

    // 只提取 Density: 後的數值
    const match = stdout.match(/Density:\s*([0-9.]+)/);
    if (match) {
        return { value: Number(match[1]) };
    }

    // 若有三個數值（Monte Carlo），則提取
    const numbers = stdout
        .trim()
        .split(/\s+/)
        .map(Number)
        .filter(n => !isNaN(n));
    if (numbers.length === 3) {
        return { lower: numbers[0], median: numbers[1], upper: numbers[2] };
    }

    throw new Error(`Unexpected R output: ${stdout}`);
}