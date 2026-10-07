import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "../..");

export default function createLoader(stubs = {}) {
  const cache = new Map();

  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);

    const filename = path.join(root, relative);
    const loaded = new Module(filename);
    loaded.filename = filename;
    loaded.paths = Module._nodeModulePaths(path.dirname(filename));
    const originalRequire = loaded.require.bind(loaded);
    loaded.require = (id) => {
      if (Object.hasOwn(stubs, id)) return stubs[id];
      return id.startsWith("@/")
        ? load(`src/${id.slice(2)}.ts`)
        : originalRequire(id);
    };
    cache.set(relative, loaded.exports);
    loaded._compile(
      ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText,
      filename,
    );
    cache.set(relative, loaded.exports);
    return loaded.exports;
  }

  return load;
}
