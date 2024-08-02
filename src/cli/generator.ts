import 'langium-tools/base';
import { GeneratorOutput } from 'langium-tools/generator';
import type { Model } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as path from 'node:path';

// import { extractDestinationAndName } from './cli-util.js';
// export function generateJavaScript(model: Model, output: GeneratorOutput): string {
//     console.log("-> ", model, output.getDslWorkspacePath());
//     const data = extractDestinationAndName(filePath, destination);
//     const generatedFilePath = `${path.join(data.destination, data.name)}.js`;
//     // const generatedJavaJavaFilePath = `${path.join(data.destination, data.name)}.java`
//
//     const fileNode = expandToNode`
//         "use strict";
//
//         ${joinToNode(model.greetings, greeting => `console.log('Hello, ${greeting.person.ref?.name}!');`, { appendNewLineIfNotEmpty: true })}
//     `.appendNewLineIfNotEmpty();
//
//     if (!fs.existsSync(data.destination)) {
//         fs.mkdirSync(data.destination, { recursive: true });
//     }
//     fs.writeFileSync(generatedFilePath, toString(fileNode));
//
//     return generatedFilePath;
// }

/**
 * Generate map filename to content
 * @param model
 * @returns
 *   Map<string, string> - filename to content
 */
export async function generate(model: Model, output: GeneratorOutput): Promise<void> {
    const modelFileName = path.basename(output.getDslWorkspacePath(), '.state').toFirstUpper();

    generateEnum(model, output, modelFileName);
    generateEntities(model, output);
    generateProcessors(model, output);

}

function generateEnum(model: Model, output: GeneratorOutput, modelFileName: string) {
    const enumNode = expandToNode`
        package com.example;

        public enum ${modelFileName}Greeting {
            ${joinToNode(model.persons, person => `${person.name},`, { appendNewLineIfNotEmpty: true })}
        }
    `.appendNewLineIfNotEmpty();
    output.createFile(`com/example/${modelFileName}Greeting.java`, toString(enumNode));
}

function generateEntities(model: Model, output: GeneratorOutput) {
    for (const person of model.persons) {
        const entityNode = expandToNode`
            package com.example;

            import javax.persistence.Entity;
            
            @Entity
            public class ${person.name} {
                private String name;

                public String getName() {
                    return name;
                }

                public void setName(String name) {
                    this.name = name;
                }
            }
        `.appendNewLineIfNotEmpty();
        output.createFile(`com/example/${person.name}.java`, toString(entityNode));
    }
}

function generateProcessors(model: Model, output: GeneratorOutput) {
    model.greetings.forEach(greeting => {
        const className = `ProcessorTo${greeting.person.ref?.name}`
        const processorNode = expandToNode`
            package com.example;

            public class ${className} {
                public void process() {
                    System.out.println("Greeting from ${greeting.person.ref?.name}...");
                    ${joinToNode(model.persons, person =>
            `System.out.println("  to ${person.name}...");`, { appendNewLineIfNotEmpty: true }
        )}
                }
            }
        `.appendNewLineIfNotEmpty();
        output.createFile(`com/example/${className}.java`, toString(processorNode));
    });
}
