import * as fs from 'fs';
import { parseString } from 'xml2js';

export async function combine (directoryPath: string) {
    // const xmlFileContent = fs.readFileSync(xmlFilePath, 'utf8');
    // let replacedXmlString = xmlFileContent;
    // const result = getCodeInMethod(csFilePath, 'Snippet');
    // console.log(`currently at ${directoryPath}`)
    const filenames = await getFilenamesInDirectory(directoryPath);

    // Compute the xml filename for storing the result
    const dirArray = directoryPath.split('/')
    const xmlFilename = `${dirArray[dirArray.length-1]}.xml`

    // Read xmlContent from the generated xmlfile
    let xmlFileContent = fs.readFileSync(`${directoryPath}/replaced.xml`, 'utf8');

    // Get code outside of block-xxx.csx file and inline-xxx.csx file
    filenames.forEach(file => {
        if((file.startsWith('inline') ||file.startsWith('block')) && file.endsWith('.csx')) {
            let codeSnippet = getCodeInMethod(`${directoryPath}/${file}`, 'Snippet')
            codeSnippet = removeSurroundingChars(codeSnippet);
            const xmlPlaceholder = file.slice(0, -4);
            xmlFileContent = replaceAll(xmlFileContent, xmlPlaceholder, codeSnippet)
        }
        // Write the combined XML to a file
        fs.writeFileSync(`${directoryPath}/${xmlFilename}`, xmlFileContent);
    });
    
}

function getFilenamesInDirectory(directoryPath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(directoryPath, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const filenames: string[] = [];
          files.forEach((file) => {
            filenames.push(file);
          });
          resolve(filenames);
        }
      });
    });
  }

function getCodeInMethod(csxFilePath: string, methodName: string): string | null {
    try {
      // Read the contents of the file at the given path
      const fileContents: string = fs.readFileSync(csxFilePath, 'utf8');
  
      // Find the starting index of the desired method
      const startRegex: RegExp = new RegExp(`(?<=\\b(?:public|private|internal)?\\s+(?:async\\s+)?(?:static\\s+)?(?:readonly\\s+)?(?:partial\\s+)?(?:unsafe\\s+)?(?:virtual\\s+)?(?:override\\s+)?\\w+\\s+${methodName}\\s*\\()`);
      const startIndex: number = fileContents.search(startRegex);
  
      if (startIndex === -1) {
        console.error(`Method '${methodName}' not found in file at path '${csxFilePath}'`);
        return null;
      }
  
      // Find the ending index of the desired method
      let openBraces: number = 0;
      let actualStartIndex: number = startIndex;
      let endIndex: number = startIndex;
      for (let i = startIndex; i < fileContents.length; i++) {
        if (fileContents[i] === '{') {
          openBraces++;
          if (openBraces === 1) {
            actualStartIndex = i;
          }
        } else if (fileContents[i] === '}') {
          openBraces--;
          if (openBraces === 0) {
            endIndex = i;
            break;
          }
        }
      }
  
      // Extract the code within the method
      const codeInMethod: string = fileContents.slice(actualStartIndex, endIndex + 1);
  
      return codeInMethod;
    } catch (error: any) {
      console.error(`Error reading file at path '${csxFilePath}': ${error.message}`);
      return null;
    }
  }
  
  function replaceAll(xml: string, toReplace: string, replacement: string): string {
    const regex = new RegExp(toReplace, 'g');
    xml = xml.replace(regex, replacement);
    return xml;
  }

  function removeSurroundingChars(str: string): string {
    if (str.startsWith('{') && str.endsWith('}')) {
        str = str.slice(1, -1);
    }
      return str.trim(); 
  }