const router = require('express').Router();
const controller = require('./controller.js');

router.post('/recipes/delete/', controller.recipes.deleteOne);
router.get('/recipes', controller.recipes.getList)
router.get('/recipes/:recipeId', controller.recipes.getOne)
router.post('/recipes', controller.recipes.post)

router.get('/ingredients', controller.ingredients.getDbByName)
router.get('/ingredients/usda', controller.ingredients.getUsdaByName)
router.get('/ingredients/usda/:ndbno', controller.ingredients.getUsdaIngredientInfo)
router.post('/ingredients', controller.ingredients.post)

router.post('/changeUsername', controller.auth.changeUsername)
router.post('/changePassword', controller.auth.changePassword)
router.post('/deleteAccount', controller.auth.deleteAccount);

module.exports = router;