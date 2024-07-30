import type { Model } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    console.log("-> ", model, filePath, destination);
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;
    // const generatedJavaJavaFilePath = `${path.join(data.destination, data.name)}.java`

    const fileNode = expandToNode`
        "use strict";

        ${joinToNode(model.greetings, greeting => `console.log('Hello, ${greeting.person.ref?.name}!');`, { appendNewLineIfNotEmpty: true })}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));

    return generatedFilePath;
}

/**
 * Generate map filename to content
 * @param model
 * @returns
 *   Map<string, string> - filename to content
 */
export function generate(model: Model, fileName: string): Map<string, string> {
    const modelFileName = path.basename(fileName, path.extname(fileName));
    const files = new Map<string, string>();
    generateEnum(model, files, modelFileName);
    generateEntities(model, files);
    generateProcessors(model, files);
    return files;

}

function generateEnum(model: Model, files: Map<string, string>, modelFileName: string) {
    const enumNode = expandToNode`
        package com.example;

        public enum ${modelFileName}Greeting {
            ${joinToNode(model.persons, person => `${person.name},`, { appendNewLineIfNotEmpty: true })}
        }
    `.appendNewLineIfNotEmpty();
    files.set(`com/example/${modelFileName}Greeting.java`, toString(enumNode));
}

function generateEntities(model: Model, files: Map<string, string>) {
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
        files.set(`com/example/${person.name}.java`, toString(entityNode));
    }
}

function generateProcessors(model: Model, files: Map<string, string>) {
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
        files.set(`com/example/${className}.java`, toString(processorNode));
    });
}
