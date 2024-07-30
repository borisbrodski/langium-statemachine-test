import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { StateMachineLanguageMetaData } from '../language/generated/module.js';
import { createStateMachineServices } from '../language/state-machine-module.js';
import { extractAstNode } from './cli-util.js';
import { generate, generateJavaScript } from './generator.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { URI, WorkspaceFolder } from 'langium';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = fs.readFileSync(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createStateMachineServices(NodeFileSystem).StateMachine;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedFilePath}`));
};
export const generateWorkspaceAction = async (workspaceDir: string, opts: GenerateOptions): Promise<void> => {
    const services = createStateMachineServices(NodeFileSystem).StateMachine;
    const workspaceManager = services.shared.workspace.WorkspaceManager;
    const LangiumDocuments = services.shared.workspace.LangiumDocuments;
    const DocumentBuilder = services.shared.workspace.DocumentBuilder;

    // Define the workspace folder
    const workspaceFolder: WorkspaceFolder = {
        name: 'MyDSL Workspace',
        uri: URI.file(path.resolve(workspaceDir)).toString()
    };

    const outputDir = opts.destination || "generated";
    console.log("Output directory: ", outputDir);

    // Initialize the workspace with the folder
    console.log("Generate for ", workspaceFolder.uri)
    await workspaceManager.initializeWorkspace([workspaceFolder]);

    // Access documents from LangiumDocuments
    const documents = LangiumDocuments.all.toArray();
    console.log("DSLs found: ", documents.length);
    await DocumentBuilder.build(documents);

    // Ensure there are no parser errors
    documents.forEach(doc => {
        if (doc.parseResult.parserErrors.length > 0) {
            console.log(`DSL file ${doc.uri} has errors`);
            console.log(doc.parseResult.parserErrors)
            throw new Error();
        }
        if (doc.parseResult.lexerErrors.length > 0) {
            console.log(`DSL file ${doc.uri} has errors`);
            console.log(doc.parseResult.lexerErrors)
            throw new Error();
        }
    });
    const fileCountList = documents.map(doc => {
        const model = doc.parseResult.value as Model;
        const relativeFileName = path.relative(workspaceFolder.uri, doc.uri.path);
        const fileContentMap = generate(model, relativeFileName);
        // console.log("Generated files: ", fileContentMap.keys());
        createFiles(fileContentMap, outputDir);

        return fileContentMap.size;
    });
    console.log(chalk.green(`${fileCountList.reduce((a, b) => a + b, 0)} files generated successfully info ${outputDir}`));
};

function createFiles(fileContentMap: Map<string, string>, baseDir: string) {
    fileContentMap.forEach((content, fileName) => {
        const filePath = baseDir + "/" + fileName;
        // create dir if does not exists
        const dir = filePath.substring(0, filePath.lastIndexOf("/"));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, content);
    })
}

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = StateMachineLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates JavaScript code that prints "Hello, {name}!" for each greeting in a source file')
        .action(generateAction);

    program
        .command('generate-workspace')
        .argument('<dir>', `workspace directory`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates Java code')
        .action(generateWorkspaceAction);
    program.parse(process.argv);
}
