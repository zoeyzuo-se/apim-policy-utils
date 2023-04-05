import * as fs from "fs";
import path = require("path");


// Define RegEx patterns
const bracePattern = /@{((?:[^{}]|{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*})*)}/g;
const bracketPattern = /@\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/g;

const extract = (directoryPath: string, filename: string) => {
	// Read the policy file
	let xmlFile = fs.readFileSync(`${directoryPath}/${filename}`, "utf8");

	// Find all the C# expressions in the policy file as blocks
	const braceMatches = Array.from(xmlFile.matchAll(bracePattern), (m) => m[1] || m[2]);

	// Find all the C# expressions in the policy file as inline expressions
	const bracketMatches = xmlFile.match(bracketPattern)?.map((m) => m.slice(2, -1)) || [];

	// Read the template file
	// const template = fs.readFileSync(`${process.cwd()}/src/templates/script.csx`, "utf8");
	// const template = fs.readFileSync(`./templates/script.csx`, "utf8");
	const template = fs.readFileSync(path.resolve(__dirname, '../src/templates/script.csx'), "utf8");
	// Define the output directory name
	const outputDirectory = filename.replace(".xml", "");

	// Create the output directory
	fs.mkdirSync(`${directoryPath}/scripts/${outputDirectory}`, { recursive: true });
	
	// Copy the context class into the output directory
	fs.copyFile(path.resolve(__dirname, '../src/templates/_context.csx'), `${directoryPath}/scripts/${outputDirectory}/_context.csx`, (err) => {
		if (err) {
			console.error(err);
			return;
		}
	});

	// Write the snippets out as C# scripts
	braceMatches.forEach((match, index) => {
		let name = `block-${(index + 1).toString().padStart(3, "0")}`
		xmlFile = xmlFile.replace(match, `${name}`);
		fs.writeFile(
			`${directoryPath}/scripts/${outputDirectory}/${name}.csx`,
			template.replace("return \"{0}\";", match),
			(err) => {
				if (err) {
					console.error(err);
				}
			}
		);
	});

	// Write the snippets out as C# scripts
	bracketMatches.forEach((match, index) => {
		let name = `inline-${(index + 1).toString().padStart(3, "0")}`
		xmlFile = xmlFile.replace(match, `${name}`);
		fs.writeFile(
			`${directoryPath}/scripts/${outputDirectory}/${name}.csx`,
			template.replace("\"{0}\"", match),
			(err) => {
				if (err) {
					console.error(err);
				}
			}
		);
	});

	// Create a new xml file
	  fs.writeFile(
		`${directoryPath}/scripts/${outputDirectory}/replaced.xml`,
		xmlFile,
		(err) => {
		if (err) {
			console.error(err);
		}
    }
  );
};

export const extractFromDirectory = (directoryPath: string) => {
	let policyDir = directoryPath;
    policyDir = policyDir.endsWith('/')? policyDir.replace(/\/$/, "") : policyDir
    // Read all files in the directory
    fs.readdir(policyDir, (err, files) => {
        // Handle errors
        if (err) {
            console.log(`Error reading directory: ${err}`);
            return;
        }
        // Process each file
        files.forEach((file) => {
            if (file.endsWith(".xml") === true) {
                extract(policyDir, file);
            }
        });
    });
};