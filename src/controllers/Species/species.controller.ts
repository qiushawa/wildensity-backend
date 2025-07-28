import { prisma } from '@/common/database';
import { RESPONSE_CODE } from '@/common/code';
import { errorResponse, successResponse } from '@/common/response';

import { Request, Response } from 'express';

export class SpeciesController {
    async getAllSpecies(req: Request, res: Response): Promise<void> {
        const species = await prisma.species.findMany();
        return successResponse(res, RESPONSE_CODE.SUCCESS, species);
    }

    async getSpecies(req: Request, res: Response): Promise<void> {
        const speciesId = parseInt(req.params.speciesId, 10);
        if (isNaN(speciesId)) {
            return errorResponse(res, RESPONSE_CODE.BAD_REQUEST, '無效的物種ID');
        }
        const species = await prisma.species.findUnique({
            where: { species_id: speciesId },
        });
        if (species) return successResponse(res, RESPONSE_CODE.SUCCESS, species);
        return errorResponse(res, RESPONSE_CODE.NOT_FOUND, '物種不存在');
    }
}