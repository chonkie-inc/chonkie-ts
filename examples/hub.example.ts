/*
 * This example shows how to use the Hubbie class to get a recipe from the hub.
 */

import { Hubbie } from "../src/chonkie/utils/hub";


async function main() {
    const hubbie = new Hubbie();

    const recipe = await hubbie.getRecipe("default", "en");

    console.log(recipe);
    console.log(recipe.recipe.recursive_rules);
}

main().catch(console.error);