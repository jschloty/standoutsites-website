import { EleventyRenderPlugin } from "@11ty/eleventy";
import eleventyNavigationPlugin from "@11ty/eleventy-navigation";
import sass from "sass";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import { transpileModule } from "typescript";

export default function(eleventyConfig) {
    eleventyConfig.addPlugin(EleventyRenderPlugin);
    eleventyConfig.addPlugin(eleventyNavigationPlugin);
    
    // Add scss template type. Does some post-processing after scss compilation.
    eleventyConfig.addExtension("scss", {
        outputFileExtension: "css",

        // `compile` is called once per .scss file in the input directory
        compile: async function (inputContent, inputPath) {
            const environment = process.env.NODE_ENV;
            
            let parsed = path.parse(inputPath);
            if (parsed.name.startsWith("_")) {
                return;
            }
            
            let compiled = sass.compileString(inputContent, {
                loadPaths: [
                    parsed.dir || ".",
                    this.config.dir.includes,
                    this.config.dir.input + "/node_modules"
                ],
                sourceMap: environment === "development"
            });

            this.addDependencies(inputPath, compiled.loadedUrls);

            let result = postcss([ autoprefixer ]).process(compiled.css);
            result.warnings().forEach(warn => {
                console.warn(warn.toString())
            });

            return async (data) => {
                return result.css;
            };
        }
    });

    eleventyConfig.addExtension(["ts","tsx"], {
        outputFileExtension: "js",

        compile: async function (inputContent) {
            let result = transpileModule(inputContent, { compilerOptions: {
                lib: ["es2024"],
                module: "node16",
                target: "es2024",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                moduleResolution: "node16"
            } });
            return async (data) => {
                return result.outputText;
            }
        }
    })

    // Setting up CSS/JS bundling and minification - use {% renderFile %}
    eleventyConfig.addBundle("css");
    eleventyConfig.addBundle("js");
}