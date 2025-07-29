import { Router } from 'express';
import { SpeciesController } from '../controllers/species.controller';
const speciesRouter = Router();

const controller = new SpeciesController();

speciesRouter.get('/', controller.getAllSpecies.bind(controller));
speciesRouter.get('/:speciesId', controller.getSpecies.bind(controller));

export default speciesRouter;