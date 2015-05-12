# markdown-editor-mw
Lightweight middleware Markdown editor. Can be used as a very lightweight wiki tool. Has an editor and an index of all the pages. Currently assumes usage of express with jade for views. You can also pass in options of middleware functions to protect routes such as read or write. All `.md` files will be written to the path that the express uses for the route, in this case `/wiki`. 

##Install
```bash
npm install markdown-editor-mw
```

##Setup with Node.js
Module is used as a middleware with express routing.
```javascript
var editor = require('markdown-editor-mw');

app.use('/wiki',editor.init({
  'view':'index'
});

```

Example `index.jade` Jade file:
```
h2 markdow-editor-mw
div
  include ../node_modules/markdown-editor-mw/views/markdown-editor-mw.jade
```

Current options to the `init` function are:
* `dir`, the location to store the `.md` files
* `readAuth` middleware function to use to allow read of files, default is everyone reads
* `writeAuth` middleware function to use to allow write/edit files, default is everyone 
reads
* `view` pass the name of the view that includes the `markdown-editor-mw.jade` file

##How To
* To create a new file use the `/wiki/[FILE]/edit`
* To edit a file `/wiki/[FILE]/edit`





