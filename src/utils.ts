import { TextDocument, Position, Range } from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resourceLimits } from 'worker_threads';
import { FppDefinitionProvider } from './fpp_definition_provider';



export function getImportedFppPaths(document: TextDocument): Object {
    try {
        const fppPaths = {};
        const importRegexGlobal = /[\w_$]*[\w\d_\-$]+\s*=\s*require\s*\(\s*'.*'\s*\)|import\s+[\w_$]*[\w\d_\-$]+\s+from\s+'.*'/g;
        const importRegex = /([\w_$]*[\w\d_\-$]+)\s*=\s*require\s*\(\s*'(.*)'\s*|import\s+([\w_$]*[\w\d_\-$]+)\s+from\s+'(.*)'/;
    
        const docText = document.getText();
    
        const importedFpp = docText.match(importRegexGlobal); 
        if(Array.isArray(importedFpp)) {
            importedFpp.forEach(importText => {
                const importTextMatch = importText.match(importRegex);
                const fppName = importTextMatch[1] || importTextMatch[3];
                const fppPath = importTextMatch[2] || importTextMatch[4];

                const fppAbsolutePath = fppPath.startsWith('.')
                    ? path.join(path.dirname(document.uri.fsPath), fppPath)
                    : fppPath;
                
                if(isFppFile(fppAbsolutePath)) {
                    fppPaths[fppName] = fppAbsolutePath;
                }
            });
        }

        return fppPaths;
    } catch(e) {
        result = e.message;
        if (typeof e == "string") {
            e.toUpperCase();
        } else if (e instanceof Error) {
            e.message;
        }
    }
    return new Object FppDefinitionProvider;

}

function isFppFile (absolutePath: string): boolean {
    const absolutePathWithExtension = absolutePath.endsWith('.fpp')
        ? absolutePath
        : absolutePath + '.fpp';
    
    return fs.existsSync(absolutePathWithExtension);
}