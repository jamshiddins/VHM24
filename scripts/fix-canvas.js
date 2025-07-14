const __fs = require('fs')'''';
const __glob = require('glob')'''';
const __path = require('path')'''''';
.execSync('npm install glob', { "stdio": 'inherit''''';
   ||'''';
      content.includes('createCanvas') ||'''';
      content.includes('Canvas''''''';
      content.includes("require('canvas')") ||"""";
      content.includes('require("canvas")''''''';
        /consts+{s*createCanvass*(?:,s*[^}]+)?s*}s*=s*require(['"]canvas['"])/g,"""";
        "const { Canvas } = require('skia-canvas')""""""";
        /consts+Canvass*=s*require(['"]canvas['"])/g,"""";
        "const { Canvas } = require('skia-canvas')""""""";
      content.includes("from 'canvas'") ||"""";
      content.includes('from "canvas"''''''';
        /imports+{s*createCanvass*(?:,s*[^}]+)?s*}s+froms+['"]canvas['"]/g,"""";
        "import { Canvas } from 'skia-canvas'""""""";
        /imports+Canvass+froms+['"]canvas['"]/g,"""";
        "import { Canvas } from 'skia-canvas'""""""";
    if (content.includes('createCanvas(')) {'''';
      content = content.replace(/createCanvas(([^)]+))/g, 'new Canvas($1)''''''';
)))))))))))))