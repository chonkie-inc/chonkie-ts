import { downloadFile, RepoType } from '@huggingface/hub';
import * as fs from 'fs';
import * as path from 'path';
import * as jsonschema from 'jsonschema';

/**
 * Hubbie is a Huggingface hub manager for Chonkie.
 */
export class Hubbie {
    private static readonly SCHEMA_VERSION = "v1";
    private readonly getRecipeConfig: {
        repo: string;
        subfolder: string;
        repoType: RepoType;
    };
    private readonly recipeSchema: Record<string, any>;

    constructor() {
        // Define the path to the recipes
        this.getRecipeConfig = {
            repo: "chonkie-ai/recipes",
            subfolder: "recipes",
            repoType: "dataset" as RepoType,
        };

        // Fetch the current recipe schema from the hub
        this.recipeSchema = this.getRecipeSchema();
    }

    /**
     * Get the current recipe schema from the hub.
     */
    private async getRecipeSchema(): Promise<Record<string, any>> {
        const schemaBlob = await downloadFile({
            repo: {
                name: "chonkie-ai/recipes",
                type: "dataset" as RepoType,
            },
            path: `${Hubbie.SCHEMA_VERSION}.schema.json`,
        });

        if (!schemaBlob) {
            throw new Error("Failed to download schema file");
        }

        const schemaContent = await schemaBlob.text();
        return JSON.parse(schemaContent);
    }

    /**
     * Validate a recipe against the current schema.
     */
    private validateRecipe(recipe: Record<string, any>): boolean {
        try {
            jsonschema.validate(recipe, this.recipeSchema);
            return true;
        } catch (error) {
            throw new Error(`Recipe is invalid. Please check the recipe and try again. Error: ${error}`);
        }
    }

    /**
     * Get a recipe from the hub.
     * 
     * @param name - The name of the recipe to get
     * @param language - The language of the recipe to get
     * @param filePath - Optionally, provide the path to the recipe
     * @returns The recipe
     * @throws Error if the recipe is not found or invalid
     */
    public async getRecipe(
        name: string = 'default',
        language: string = 'en',
        filePath?: string
    ): Promise<Record<string, any>> {
        // Check if either (name & language) or path is provided
        if ((!name || !language) && !filePath) {
            throw new Error("Either (name & language) or path must be provided.");
        }

        let recipeContent: string;

        // If path is not provided, download the recipe from the hub
        if (!filePath && name && language) {
            try {
                const recipeBlob = await downloadFile({
                    repo: {
                        name: this.getRecipeConfig.repo,
                        type: this.getRecipeConfig.repoType,
                    },
                    path: `${this.getRecipeConfig.subfolder}/${name}_${language}.json`,
                });

                if (!recipeBlob) {
                    throw new Error(`Could not download recipe '${name}_${language}'`);
                }

                recipeContent = await recipeBlob.text();
            } catch (error) {
                throw new Error(`Could not download recipe '${name}_${language}'. Ensure name and language are correct or provide a valid path. Error: ${error}`);
            }
        } else {
            // Read from local file
            try {
                recipeContent = fs.readFileSync(filePath!, 'utf-8');
            } catch (error) {
                throw new Error(`Failed to read the file ${filePath} —— please check if the file exists and if the path is correct. Error: ${error}`);
            }
        }

        // Parse and validate the recipe
        try {
            const recipe = JSON.parse(recipeContent);
            
            // Validate the recipe
            if (!this.validateRecipe(recipe)) {
                throw new Error("Recipe is invalid. Please check the recipe and try again.");
            }

            return recipe;
        } catch (error) {
            throw new Error(`Failed to parse recipe JSON. Error: ${error}`);
        }
    }
}
