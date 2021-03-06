const env = require("../db_config.js").environment;
const options = require("../knexfile")[env];
const parse = require("../helpers/parsers.js");
const knex = require("knex")(options);
const bcrypt = require("bcrypt");

// EXAMPLE DATABASE ACCESS FUNCTION:
//
//module.exports.checkAccess = function(id) {
//  return knex
//     .select()
//     .from('sample')
//    // .where({id})
//};
module.exports.deleteOneById = recipeId => {
  const id = recipeId;
  let recipeIngredient = knex("recipe_ingredients")
    .where({ recipe_id: id })
    .del();
  let recipes = knex("recipes")
    .where({ id })
    .del();
  return Promise.all([recipeIngredient, recipes]).then(data => data);
};
module.exports.fetchRecipeList = function() {
  //return a list of short recipe descriptions
  return knex.select().from("recipes");
};

module.exports.fetchRecipeById = function(recipeId) {
  //return the recipe and all relevant accompanying information

  const queriesNeeded = [
    knex.select('*').from('recipes').where({id: recipeId}),
  ]; 
  return Promise
    .all(queriesNeeded)
    .then(data => {
      if(data) {
        return (data);
      } else {
        return {status: 'No Such Recipe'};
      }
    });
};

module.exports.searchIngredientsByName = function(searchString) {
  const strings = searchString
    .trim()
    .split(" ")
    .map(string => (string ? "%" + string + "%" : ""));
  let allSearch = knex
    .select("*")
    .from("ingredients")
    .where("name", "ilike", strings[0]);
  for (let i = 1; i < strings.length; i++) {
    if (strings[i]) {
      allSearch = allSearch.andWhere("name", "ilike", strings[i]);
    }
  }
  let anySearch = knex
    .select("*")
    .from("ingredients")
    .where("name", "ilike", strings[0]);
  for (let i = 1; i < strings.length; i++) {
    if (strings[i]) {
      anySearch = anySearch.orWhere("name", "ilike", strings[i]);
    }
  }
  return Promise.all([allSearch, anySearch]).then(([allSearch, anySearch]) => {
    anySearch = anySearch.filter(anyIng => {
      let isUniqueIngredient = true;
      allSearch.forEach(allIng => {
        if (anyIng.ndbno === allIng.ndbno) {
          isUniqueIngredient = false;
        }
      });
      return isUniqueIngredient;
    });
    return allSearch.concat(anySearch);
  });
};

module.exports.addIngredient = function(usdaIngredient) {
  //takes an ingredient object and stores it to the ingredients table
  //Assuming object is the usda return object's report.foods[0]
  let dbIngredient = parse.usdaIngredientToDatabase(usdaIngredient);
  return knex("ingredients")
    .insert(dbIngredient)
    .catch(err => {
      if (err.code === "23505") {
        //duplicate item, not actually a problem
        return;
      } else {
        throw err;
      }
    });
};

module.exports.addRecipeIngredient = function(recipeIngredient) {
  //takes an ingredient entry on a recipe and adds it to the recipe_ingredient junction table
  //might be useful for future recipe editing, not used as of right now
};

module.exports.addRecipe = function(clientRecipe) {
  //takes a recipe object, adds the basic data to the db, then adds recipe ingredients
  let outerRecipeId = '';
  return knex.transaction(trx => {
    const dbRecipe = {
      name: clientRecipe.title,
      description: clientRecipe.description,
      top_ingredients: clientRecipe.topIngredients,
      ingredients: JSON.stringify(clientRecipe.ingredients),
      instructions: JSON.stringify(clientRecipe.instructions),
      user_id: clientRecipe.userId,
    };
    const dbIngredientJunction = clientRecipe.ingredients.map((ing, index) => {
      return {
        food_no: parseInt(ing.ndbno),
        quantity: parseFloat(ing.quantity),
        quantity_measure: "g",
        list_position: index
      };
    });

    return trx
      .insert(dbRecipe)
      .into('recipes')
  })
}

module.exports.findUser = (username, cb) => {
  knex
    .select("*")
    .from("users")
    .where({ username })
    .then(user => {
      cb(null, user);
    })
    .catch(err => {
      cb(err, null);
    });
};

module.exports.findUserJWT = (username, password, cb) => {
  knex
    .select("*")
    .from("users")
    .where({ username })
    .then(user => {
      cb(null, user);
    })
    .catch(err => {
      cb(err, null);
    });
};
module.exports.changeUsername = (username, newUsername, cb) => {
  knex("users")
    .where({ username })
    .update({ username: newUsername })
    .then(res => {
      cb(null, res);
    })
    .catch(err => {
      cb(err, null);
    });
};
module.exports.changePassword = (username, newPassword, cb) => {
  bcrypt.hash(newPassword, 10, (err, hash) => {
    knex("users")
      .where({ username })
      .update({ password: hash })
      .then(res => {
        cb(null, res);
      })
      .catch(err => {
        cb(err, null);
      });
  });
};
module.exports.deleteAccount = (username, cb) => {
  knex("users")
  .where({username})
  .del()
  .then(res => {cb(null, res)})
  .catch(err => {cb(err, null)})
}
