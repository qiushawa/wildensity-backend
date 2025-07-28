import { Router } from 'express';


import { SpeciesController } from '../controllers/Species/species.controller';
const speciesRouter = Router();

const controller = new SpeciesController();

speciesRouter.get('/', controller.getAllSpecies);
speciesRouter.get('/:speciesId', controller.getSpecies);

export default speciesRouter;