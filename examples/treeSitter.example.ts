/* Example of using the WebTreeSitter API to chunk code. */

// Import Language alongside Parser
import { Parser, Language } from "web-tree-sitter";
import * as fs from "fs";
import * as path from "path";

/**
 * Recursively finds the nearest node_modules directory from a starting directory.
 * @param startDir The directory to start searching from.
 * @returns The absolute path to the node_modules directory, or null if not found.
 */
function findNearestNodeModules(startDir: string): string | null {
    let dir = startDir;
    while (true) {
        const candidate = path.join(dir, "node_modules");
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break; // Reached filesystem root
        dir = parent;
    }
    return null;
}

// Supported Languages in the tree-sitter-wasms 
const supportedLanguages = [
    "bash", 
    "c-sharp",
    "c", 
    "cpp", 
    "css", 
    "elisp",
    "elixer", 
    "elm", 
    "embedded-template", 
    "go", 
    "html", 
    "java", 
    "javascript", 
    "json", 
    "kotlin", 
    "lua", 
    "objc", 
    "ocaml", 
    "php", 
    "python", 
    "ql", 
    "rescript", 
    "ruby", 
    "rust", 
    "scala", 
    "swift", 
    "systemrdl", 
    "tlaplus", 
    "toml", 
    "tsx", 
    "typescript", 
    "vue",
    "yaml",
    "zig"
]

async function main() {
    // Print out the number of supported languages
    console.log(`Number of supported languages: ${supportedLanguages.length}`);

    // Check if the language is supported
    const language = "Typescript";
    const formatedLanguage = language.toLowerCase().replace('-', '_');
    if (!supportedLanguages.includes(formatedLanguage)) {
        throw new Error(`Language ${formatedLanguage} is not supported`);
    }

    // Initialize the Parser system.
    // Some versions/setups of web-tree-sitter might not require Parser.init()
    // or might handle it differently. If Parser.init is not found, you might remove it.
    if (Parser.init) {
        await Parser.init();
    }

    // Read the WASM file as a buffer
    const nodeModulesPath = findNearestNodeModules(path.resolve(__dirname, ".."));
    if (!nodeModulesPath) {
        throw new Error("node_modules directory not found");
    }
    // Check if the tree-sitter-wasms package is installed
    const treeSitterWasmPath = path.join(nodeModulesPath, `tree-sitter-wasms/out/tree-sitter-${formatedLanguage}.wasm`);   
    if (!fs.existsSync(treeSitterWasmPath)) {
        throw new Error("tree-sitter-wasms package not found");
    }
    const wasmBuffer = fs.readFileSync(treeSitterWasmPath);

    // Load the language from the buffer
    const RustLanguage = await Language.load(wasmBuffer);
    const parser = new Parser();
    // Set the loaded language
    parser.setLanguage(RustLanguage);

    const code = `
    interface UserProfile {
        id: number;
        username: string;
        email?: string;
        isActive: boolean;
        readonly creationDate: Date;
        logins: LoginRecord[];
        lastLogin?: LoginRecord;
    }

    type UserId = number | string;

    enum UserRole {
        ADMIN = "ADMIN",
        EDITOR = "EDITOR",
        VIEWER = "VIEWER",
    }

    interface LoginRecord {
        timestamp: Date;
        ipAddress: string;
        successful: boolean;
    }

    class UserManager<T extends UserProfile> {
        private users: Map<UserId, T>;
        private static instanceCounter: number = 0;

        constructor() {
            this.users = new Map<UserId, T>();
            UserManager.instanceCounter++;
            console.log(\\\`UserManager instance #\${UserManager.instanceCounter} created.\\\`);
        }

        public addUser(user: T): boolean {
            if (this.users.has(user.id)) {
                console.warn(\\\`User with ID \${user.id} already exists.\\\`);
                return false;
            }
            this.users.set(user.id, user);
            console.log(\\\`User \${user.username} added successfully.\\\`);
            return true;
        }

        public getUser(id: UserId): T | undefined {
            return this.users.get(id);
        }

        public removeUser(id: UserId): boolean {
            return this.users.delete(id);
        }

        public listAllUsers(): T[] {
            return Array.from(this.users.values());
        }

        public updateUserEmail(id: UserId, newEmail: string): void {
            const user = this.getUser(id);
            if (user) {
                user.email = newEmail;
                // Attempting to modify a readonly property will cause a TypeScript error at compile time
                // user.creationDate = new Date(); 
                console.log(\\\`Email updated for user \${user.username}.\\\`);
            } else {
                console.error(\\\`User with ID \${id} not found.\\\`);
            }
        }

        public recordLogin(id: UserId, ipAddress: string, successful: boolean): void {
            const user = this.getUser(id);
            if (user) {
                const login: LoginRecord = { timestamp: new Date(), ipAddress, successful };
                user.logins.push(login);
                user.lastLogin = login;
            }
        }

        public getActiveUsers(): T[] {
            return this.listAllUsers().filter(user => user.isActive);
        }

        public static getRoleDescription(role: UserRole): string {
            switch (role) {
                case UserRole.ADMIN:
                    return "Administrator with full access.";
                case UserRole.EDITOR:
                    return "Editor with content modification rights.";
                case UserRole.VIEWER:
                    return "Viewer with read-only access.";
                default:
                    // Exhaustiveness check
                    const _exhaustiveCheck: never = role;
                    return _exhaustiveCheck;
            }
        }
    }

    async function processUsers(manager: UserManager<UserProfile>): Promise<void> {
        console.log("Processing users...");
        const allUsers = manager.listAllUsers();
        for (const user of allUsers) {
            console.log(\\\`Processing user: \${user.username}, ID: \${user.id}\\\`);
            if (user.email) {
                // Simulate sending a welcome email
                await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
                console.log(\\\`Sent welcome email to \${user.email}\\\`);
            }
        }
    }

    // Example Usage:
    const userManager = new UserManager<UserProfile>();

    const adminProfile: UserProfile = {
        id: 1,
        username: "SuperAdmin",
        email: "admin@example.com",
        isActive: true,
        creationDate: new Date("2023-01-01"),
        logins: []
    };

    const editorProfile: UserProfile = {
        id: "user-002", // Example of string ID
        username: "ContentCreator",
        isActive: true,
        creationDate: new Date("2023-02-15"),
        logins: [],
        email: "editor@example.com"
    };
    
    userManager.addUser(adminProfile);
    userManager.addUser(editorProfile);
    
    userManager.recordLogin(1, "192.168.1.100", true);
    userManager.recordLogin("user-002", "10.0.0.5", true);
    
    userManager.updateUserEmail(1, "new.admin.email@example.com");
    
    console.log("All users:", userManager.listAllUsers());
    console.log("Active users:", userManager.getActiveUsers());
    
    console.log(UserManager.getRoleDescription(UserRole.ADMIN));
    
    (async () => {
        await processUsers(userManager);
        const nonExistentUser = userManager.getUser(999);
        if (!nonExistentUser) {
            console.log("User 999 does not exist, as expected.");
        }
    })();

    // Type assertion example
    let someValue: any = "this is a string";
    let strLength: number = (someValue as string).length;
    console.log(\\\`Length of someValue: \${strLength}\\\`);

    // Generic function
    function identity<T>(arg: T): T {
        return arg;
    }
    let outputString = identity<string>("myString");
    let outputNumber = identity<number>(100);
    console.log(outputString, outputNumber);

    // Nullish Coalescing
    const nullValue = null;
    const fallbackValue = "default string";
    const resultValue = nullValue ?? fallbackValue;
    console.log(\\\`Result of nullish coalescing: \${resultValue}\\\`);

    // Optional Chaining
    const userWithNoEmail: UserProfile = {
        id: 3,
        username: "NoEmailUser",
        isActive: false,
        creationDate: new Date(),
        logins: []
    };
    console.log(\\\`User's email (optional chaining): \${userWithNoEmail?.email?.toUpperCase()}\\\`);
    console.log(\\\`User's last login IP (optional chaining): \${userWithNoEmail?.lastLogin?.ipAddress}\\\`);
    
    // Decorator (conceptual - requires experimentalDecorators and emitDecoratorMetadata)
    /*
    function LogMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            console.log(\\\`Calling method \${propertyKey} with args: \${JSON.stringify(args)}\\\`);
            const result = originalMethod.apply(this, args);
            console.log(\\\`Method \${propertyKey} returned: \${JSON.stringify(result)}\\\`);
            return result;
        };
        return descriptor;
    }

    class Calculator {
        @LogMethod
        add(a: number, b: number): number {
            return a + b;
        }
    }
    const calc = new Calculator();
    calc.add(5,3);
    */
    
    // Advanced mapped types
    type ReadonlyProfile = Readonly<UserProfile>;
    type PartialProfile = Partial<UserProfile>;
    type RequiredEmailProfile = Required<Pick<UserProfile, 'email'>>;

    // Conditional types
    type IsString<T> = T extends string ? "yes" : "no";
    type CheckString = IsString<"hello">; // "yes"
    type CheckNumber = IsString<number>; // "no"

    // Template Literal Types (These are type definitions, not string values, so their backticks are fine)
    type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
    type ApiEndpoint<M extends HttpMethod, Path extends string> = \`\${M} /\${Path}\`;
    type UserApiEndpoint = ApiEndpoint<"GET", "users">; // "GET /users"

    const endpoint: UserApiEndpoint = "GET /users";
    console.log(\\\`API Endpoint: \${endpoint}\\\`);

    // This is a very long line to test horizontal parsing and ensure that the tree sitter can handle it correctly without any issues or performance degradation. This line contains multiple types of tokens including keywords, identifiers, operators, and literals, all strung together in a somewhat nonsensical but syntactically plausible (for a very loose definition of plausible) way to challenge the parser. let a: number = 1 + 2 * 3 / 4 % 5 - (6 + 7) * 8; const b: string = "hello" + " " + "world"; var c: boolean = true && false || !true; function d<T>(e: T[]): T | undefined { return e[0]; } class F { G(): void {} } interface H { I: string; } enum J { K, L, M } type N = O | P;
    `;
    // NOTE: Add error handling for the parser.parse() method

    const tree = parser.parse(code);
    if (tree) {
        const rootNode = tree.rootNode;
        const children = rootNode.children;
        
        // Print out the text of the children
        for (const child of children) {
            if (child) {
                console.log("Type: ", child.type);
                console.log(child.text);
                console.log('--------------------------------');
                console.log('\n\n')
            }
        }
    } else {
        throw new Error("Failed to parse the code, tree is null.");
    }
}

// Call main and catch any errors
main().catch(console.error);