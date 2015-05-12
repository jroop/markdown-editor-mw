var fs = require('fs');
var path = require('path');

var serveStatic = require('serve-static');
var router = require('express').Router();
var marked = require('marked');
var hljs = require('highlight.js');
var markdown_attr = require('markdown-attr');


/*
 * TODO finish the html version, one without the jade file
 * TODO have to functions for Auth, one for read and one for read/write
 * TODO need to make sure client files are served from directories hljs, marked, markdown-attr
 * TODO have package.json to install dependencies
 * TODO make dependencies install for package, should Jade be required or just pass the markup back
 * TODO save file and do git to it
 * TODO search method and show
 * TODO if wiki what about the path [page](/wiki/page) can replace wiki? 
 */
(function(exports){
  var C = {
    'dir':null, //default is the [app_root]/[req.baseUrl]
    'readAuth':function(req,res,next){next();}, //do nothing pass a password auth middleware if needed
    'writeAuth':function(req,res,next){next();}, //do nothing pass a password auth middleware if needed
    'view':null, //view that will want to render in external Jade //include ../markdown-editor-mw/views/markdown-editor-mw.jade
  };
  /*
   * Set highlighting for code
   */
  marked.setOptions({
    highlight: function (code,lang) {
      if(lang) return hljs.highlight(lang,code).value
      else return hljs.highlightAuto(code).value
    }
  });
  
  var exist = function(o){
    if(o !== null && typeof o !== 'undefined') return true;
    else return false;
  }
  /*
   * Add properties from object a to object e
   */
  var add = function(e,a){
    for(v in a){
      if(e.hasOwnProperty(v)) e[v] = a[v];
    }
  }
  
  /*
   * Sets the directory to store the .md files creates one if it doesn't exist
   */
  var checkDir = function(req,res,next){
    if(!exist(C.dir)){ //check to see string exists
      C.dir = path.dirname(require.main.filename)+req.baseUrl;
      fs.mkdir(C.dir,function(err){ //make the directory
        if(err) console.log(err);
        console.log('Saving .md files here: '+C.dir);
        next();
      });
    }else{
      next();
    }
  }
  /*
   * Link files for the browser to be able to use
   */
  var linkFiles = function(file,sym){
    fs.lstat(sym,function(err,stats){
      if(err){
        console.log('Linking files...'+sym + ' --> ' + file);
        fs.symlinkSync(file,sym);
      }
    });
  }
  
  var init = function(opt){
    //setup the linking so the browser can use the css and js files
    linkFiles(require.resolve('marked'),__dirname+'/public/marked.min.js');
    linkFiles(require.resolve('markdown-attr'),__dirname+'/public/markdown-attr.js');
    add(C,opt);
    console.log(C);
    
    router.use(checkDir); //make sure directory exists to save .md files
    router.use(mdeLocalsInit);
    router.use(serveStatic(__dirname+'/public'));
    routes(); //set all the routes for this middleware
    //router.use(sendJSON); //last handler here to send locals json
    //router.use(HTMLhandler);
    return router; //export the router to use
  }
  
  /*
   * add variables to res.locals to use for views
   */
  var mdeLocalsInit = function(req,res,next){
    res.locals.mde = {};
    res.locals.mde.baseUrl = req.baseUrl;
    res.locals.mde.originalUrl = req.originalUrl;
    res.locals.mde.path = req.path;
    next();
  }
  
  /*
   * generic handler that if everything is passed then will return json
   */
  var sendJSON = function(req,res,next){
    if(exist(res.locals.mde)){
      res.writeHead(200, {"Content-type":"application/json"});
      res.end(JSON.stringify(res.locals.mde,null));
    }else{
      next();
    }
  }
  /*
   * Handler that will return HTML 
   */
  var HTMLhandler = function(req,res,next){
    var repl = function(match,s1){
      if(exist(res.locals.mde[s1])){
        s1 = res.locals.mde[s1];
      }else{
        console.log('Error bad variable no match for: '+match + ' ' + s1);
        s1 = '';
      }
      return s1;
    }
    
    fs.readFile(__dirname+'/views/include.html',function(err,content){
      if(err){
        console.log('Error: '+err);
        res.writeHead(200, {"Content-type":"text/html"});
        res.end(err);
      }else{
        var ret = content.toString().replace(/\{\{(.*?)\}\}/g,repl);

        res.writeHead(200, {"Content-type":"text/html"});
        res.end(ret.toString());
      }
    });
  }
  
  var routes = function(){
    
    router.get('/', C.readAuth, function(req,res,next){
      fs.readdir(C.dir, function(err,files){
        if(err) console.log('Error: '+err);
        var ret = [], l = files.length;
        for(var i = 0; i < l; i++){
          s = files[i].replace(/\.md$/,'');
          ret.push({
            name:s,
            link:req.baseUrl+'/'+s, //could be more efficient
            edit:req.baseUrl+'/'+s+'/edit'
          });
        }
        res.locals.mde.Files = ret;
        if(C.view){ 
          res.render(C.view);
        }else{
          next();
        }
      });
    });
    
    router.get('/:file', C.readAuth, function(req,res,next){
      var file = req.params.file+'.md';
      console.log(C.dir+'/'+file);
      fs.readFile(C.dir+'/'+file,function(err,content){
        if(err){ 
          console.log(err);
          res.locals.mde.HTML = 'Error: Could not find '+req.url;
          next();
        }else{
          content = content.toString();
          marked(content, function (err, content){
            if (err) throw err;
            markdown_attr.parse(content, function(e,content){
              res.locals.mde.HTML = content.toString();
              if(C.view){
                res.render(C.view);
              }else{
                next();
              }
            });       
          });
        }
      });
    });
    
    router.get('/:file/edit', C.writeAuth, function(req,res,next){
      res.locals.mde.Editor = true;
      if(C.view){
        res.render(C.view);
      }else{
        next();
      }
    });
    
    router.get('/:file/edit/json', C.writeAuth, function(req,res,next){
      //var file = req.params.file;
      var file = req.params.file+'.md';
      var j = {};
      fs.readFile(C.dir+'/'+file, 'utf8', function(err,content){
        if(err){ 
          console.log('editor Error: '+ err);
          j.message = 'Error file: ' + file + ' not found!';
          j.message_class = 'error';
        }else{
          j.content = content;
          j.message_class = 'success';
          j.message = 'Success loading file: ' + file;
        }
        res.writeHead(200, {"Content-type":"application/json"});
        res.end(JSON.stringify(j,null));
      });
    });
    
    router.post('/:file/edit/json', C.writeAuth, function(req,res,next){
      //var file = req.params.file;
      var file = req.params.file+'.md';
      var j = {};
      var b = req.body;
      if(typeof b.md !== 'undefined' && typeof file !== 'undefined'){
        fs.writeFile(C.dir+'/'+file, b.md, function(err) {
          if(err){
            console.log('editor Error: '+ err);
            j.message = 'Error saving file: ' + file;
            j.message_class = 'error';
          }else{
            //TODO save and commit with git
            j.message_class = 'success';
            j.message = 'Successfully saved: '+file;
          }
          res.writeHead(200, {"Content-type":"application/json"});
          res.end(JSON.stringify(j,null));
        });    
      }else{
        next();
      }
    });

  } //end of init
  
  exports.init = init;
  
})(typeof exports === 'undefined' ? this['mde']={}: exports);