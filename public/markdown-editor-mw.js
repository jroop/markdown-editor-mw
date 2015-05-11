

(function(exports){
  
  marked.setOptions({
    highlight: function (code,lang) {
      if(lang) return hljs.highlight(lang,code).value
      else return hljs.highlightAuto(code).value
    }
  });

  /*
  * Need marked to use this function
  */
  var mdeParse = function(){
    var e = document.getElementById('markdown-editor-mw-editor');
    var o = document.getElementById('markdown-editor-mw-out');

    marked(e.value, function(e,c){
      markdown_attr.parse(c,function(e,c){
        o.innerHTML = c;
      });
    });
  }

  var mdeLoad = function(){
    var o = document.getElementById('markdown-editor-mw-editor');
    var m = document.getElementById('markdown-editor-mw-message');
    var url = window.location + '/json';
    
    
    //parse out the query string
    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        var j = JSON.parse(xhr.responseText);
        if(typeof j.content !== 'undefined') o.value = j.content;
        if(typeof j.message !== 'undefined') m.innerHTML = j.message;
        if(typeof j.message_class !== 'undefined') m.className = j.message_class;
        clearClass(m);
        mdeParse();
      }
    }
    xhr.open("GET",url,true);
    xhr.send();
  }

  var mdeSave = function(){
    var o = document.getElementById('markdown-editor-mw-editor');
    var m = document.getElementById('markdown-editor-mw-message');
    var url = window.location + '/json';
    
    var xhr = new XMLHttpRequest();
    
    xhr.onreadystatechange = function(){
      if(xhr.readyState == 4 && xhr.status == 200){
        var j = JSON.parse(xhr.responseText);
        if(typeof j.content !== 'undefined') o.value = j.content;
        if(typeof j.message !== 'undefined') m.innerHTML = j.message;
        if(typeof j.message_class !== 'undefined') m.className = j.message_class;
        clearClass(m);
      }
    }
    xhr.open("POST",url);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({file:false,md:o.value}));
  }
  
  var mdeLinks = function(){
    var l = window.location.href;
    var url = l.replace(/\/edit$/,''); //get the page location
    var e = document.getElementById('markdown-editor-mw-view');
    e.href = url;
    
    var e = document.getElementById('markdown-editor-mw-index');
    url = url.replace(/\/\w*$/,''); //get the index
    e.href = url;    
  }

  var clearClass = function(e){
    setTimeout(function(){
      e.className = "";
    },750);
  }

  //console.log(hljs.listLanguages());
  window.onload = function(){
    var e = document.getElementById('markdown-editor-mw-editor');
    if(e !== null){ //run only if in editor mode
      mdeLoad();
      mdeParse();
      mdeLinks();
    }
  }
  exports.mdeLoad = mdeLoad;
  exports.mdeSave = mdeSave;
  exports.mdeParse = mdeParse;

})(typeof exports === 'undefined' ? this['editor']={}: exports);
