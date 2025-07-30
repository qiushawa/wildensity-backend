import { exec } from 'child_process';
import path from 'path';
export const calculateActivity = async () => {
    return new Promise((resolve, reject) => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1; // 月份從0
        const inputFilePath = path.join('reports', 'records', year.toString(), `${month.toString().padStart(2, '0')}.csv`);
        const outputFilePath = path.join('reports', 'activity', `${year.toString()}.csv`);
        const scriptPath = './r-scripts/calculate_activity.R';
        const command = `Rscript ${path.resolve(scriptPath)} -i ${inputFilePath} -o ${outputFilePath}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`執行錯誤: ${error.message}`);
                reject(error);
                return;
            }

            if (stderr) {
                console.error(`標準錯誤輸出: ${stderr}`);
                reject(new Error(stderr));
                return;
            }

            // stdout 會包含 R script 的輸出內容，通常是字串，例如:
            // "0.44065 \n0.39801\n0.47504\n"
            const output = stdout.trim().split(/\s+/); // 根據空白或換行符切割

            const ak = parseFloat(output[0]);
            const ci_lower = parseFloat(output[1]);
            const ci_upper = parseFloat(output[2]);

            console.log('ak:', ak);
            console.log('ci_lower:', ci_lower);
            console.log('ci_upper:', ci_upper);

            resolve({ ak, ci_lower, ci_upper });
        });
    });
}