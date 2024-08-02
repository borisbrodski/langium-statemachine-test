import { describe } from "vitest";

import { langiumGeneratorSuite } from "langium-tools/testing";
import { generate } from "../../src/cli/generator.js";
import { createStateMachineServices } from "../../src/language/state-machine-module.js";


describe("Langium code generator tests2", () => {

  langiumGeneratorSuite(__dirname, {
    createServices: createStateMachineServices,
    generateForModel: generate
  })

  // test('NEW TEST: simple1', async () => {
  //   await langiumGeneratorTest(path.join(__dirname, 'simple1'), {
  //     createServices: createStateMachineServices,
  //     generateForModel: generate
  //   });
  // })

});


